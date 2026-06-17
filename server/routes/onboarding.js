/**
 * Moov OS — Onboarding Engine API
 *
 * Replaces the manual ClickUp / spreadsheet onboarding workflow with a
 * Kanban pipeline. Mounted at /api/v1/onboarding (see index.js).
 *
 * Routes
 * ──────
 *   GET  /board                                  — grouped Kanban payload (+ live SLA fields)
 *   GET  /:id                                     — single record (profile, addresses, contacts, log)
 *   POST /create-customer                         — ingest inbound form webhook → new Moov-XX record
 *   POST /courier-communication/webhook           — inbound mail parser → append to interaction log
 *   PATCH /:id/status                             — move card between Kanban columns (resets SLA)
 */

import express from 'express';
import EmailReplyParser from 'email-reply-parser';
import { query, getClient } from '../db/index.js';
import { sendEmail } from '../services/emailService.js';

const router = express.Router();

// Shared secret for inbound webhooks — mirrors routes/webhooks.js convention.
const WEBHOOK_TOKEN = process.env.ONBOARDING_WEBHOOK_TOKEN || 'M00VH00K5';

const PIPELINE = [
  'verification',
  'carrier_provisioning',
  'tech_integration',
  'hardware_checklist',
  'go_live_ready',
];

const _erp = new EmailReplyParser();

// ─── Helpers ────────────────────────────────────────────────────────

function authMiddleware(req, res, next) {
  const auth  = req.headers['authorization'] || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (token !== WEBHOOK_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

/** Reduce a raw email body to just the newly-typed reply (strip quoted history). */
function extractLatestReply(rawBody = '') {
  try {
    const parsed = _erp.read(rawBody || '');
    const visible = parsed.getVisibleText();
    return (visible || '').trim() || (rawBody || '').trim();
  } catch {
    return (rawBody || '').trim();
  }
}

/** Find a bracketed Moov ID token, e.g. "[Moov-42]" or "(Moov-7)" — case-insensitive. */
function findMoovIdToken(...candidates) {
  const re = /[\[\(]\s*(moov-\d+)\s*[\]\)]/i;     // bracketed form (preferred)
  const bare = /\b(moov-\d+)\b/i;                  // fallback: bare token
  for (const text of candidates) {
    if (!text) continue;
    const m = text.match(re) || text.match(bare);
    if (m) return `Moov-${m[1].split('-')[1]}`;    // normalise prefix casing
  }
  return null;
}

/** Compute SLA deadline for a status from onboarding_sla_targets. */
async function slaDueFor(status, fromTs = new Date()) {
  const r = await query(
    `SELECT duration_hours FROM onboarding_sla_targets WHERE status = $1`, [status]
  );
  const hours = r.rows[0]?.duration_hours;
  if (!hours) return null;
  return new Date(fromTs.getTime() + hours * 3600 * 1000);
}

// ─── GET /board — Kanban payload ────────────────────────────────────
router.get('/board', async (_req, res, next) => {
  try {
    const { rows } = await query(`
      SELECT
        oc.id, oc.moov_id, oc.status, oc.legal_name, oc.trading_name,
        oc.active_action_item, oc.status_entered_at, oc.sla_due_at,
        oc.last_reply_at, oc.last_reply_by, oc.carrier_choices,
        oc.rate_file_status, oc.dd_choice,
        owner.full_name AS owner_name,
        (SELECT COUNT(*) FROM onboarding_interactions i WHERE i.onboarding_id = oc.id)::int AS interaction_count
      FROM onboarding_customers oc
      LEFT JOIN staff owner ON owner.id = oc.owner_id
      WHERE oc.is_archived = FALSE
      ORDER BY oc.sla_due_at ASC NULLS LAST, oc.created_at ASC
    `);

    // Group into columns in pipeline order so the frontend can render directly.
    const columns = PIPELINE.map(status => ({
      status,
      cards: rows.filter(r => r.status === status),
    }));

    res.json({ columns, total: rows.length, server_time: new Date().toISOString() });
  } catch (err) { next(err); }
});

// ─── GET /:id — full record ─────────────────────────────────────────
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const cust = await query(`SELECT * FROM onboarding_customers WHERE id = $1`, [id]);
    if (!cust.rows[0]) return res.status(404).json({ error: 'Not found' });

    const [addresses, contacts, interactions] = await Promise.all([
      query(`SELECT * FROM onboarding_addresses    WHERE onboarding_id = $1`, [id]),
      query(`SELECT * FROM onboarding_contacts     WHERE onboarding_id = $1 ORDER BY role`, [id]),
      query(`SELECT * FROM onboarding_interactions WHERE onboarding_id = $1 ORDER BY occurred_at DESC LIMIT 200`, [id]),
    ]);

    res.json({
      ...cust.rows[0],
      addresses:    addresses.rows,
      contacts:     contacts.rows,
      interactions: interactions.rows,
    });
  } catch (err) { next(err); }
});

// ─── POST /create-customer — ingest inbound form webhook ────────────
//
// Accepts a flexible payload from the sign-up form / webhook. Generates the
// next Moov-XX id (DB trigger), defaults status to 'verification', records the
// SLA deadline, persists addresses + contacts, then kicks off the welcome email.
router.post('/create-customer', async (req, res, next) => {
  const client = await getClient();
  try {
    const p = req.body || {};

    // Tolerate both flat and nested payload shapes.
    const company   = p.company   || p;
    const trading   = p.trading_address || p.trading || {};
    const billing   = p.billing_address || p.billing || {};
    const contacts  = p.contacts  || {};      // { primary_onboarding, billing, operational }
    const sales     = p.sales     || p;

    if (!company.legal_name && !p.legal_name) {
      return res.status(400).json({ error: 'legal_name is required' });
    }

    const slaDue = await slaDueFor('verification');

    await client.query('BEGIN');

    // ── Core record ──
    const custRes = await client.query(`
      INSERT INTO onboarding_customers (
        status, status_entered_at, sla_due_at,
        legal_name, trading_name, vat_number, company_reg_number, website,
        primary_email, primary_phone,
        carrier_choices, dd_choice, rate_file_status,
        salesperson_id, owner_id, active_action_item, source_payload
      ) VALUES (
        'verification', NOW(), $1,
        $2, $3, $4, $5, $6,
        $7, $8,
        $9::jsonb, COALESCE($10, 'none')::onboarding_dd_choice, 'not_received',
        $11, $12, $13, $14::jsonb
      )
      RETURNING *
    `, [
      slaDue,
      company.legal_name || p.legal_name,
      company.trading_name || p.trading_name || null,
      company.vat_number || p.vat_number || null,
      company.company_reg_number || p.company_reg_number || null,
      company.website || p.website || null,
      company.primary_email || p.email || null,
      company.primary_phone || p.phone || null,
      JSON.stringify(sales.carrier_choices || p.carrier_choices || []),
      sales.dd_choice || p.dd_choice || null,
      sales.salesperson_id || null,
      p.owner_id || null,
      'Verify company details & documents',
      JSON.stringify(p),
    ]);

    const record = custRes.rows[0];

    // ── Addresses ──
    for (const [type, addr] of [['trading', trading], ['billing', billing]]) {
      if (addr && Object.keys(addr).length) {
        await client.query(`
          INSERT INTO onboarding_addresses
            (onboarding_id, address_type, line1, line2, city, county, postcode, country)
          VALUES ($1, $2, $3, $4, $5, $6, $7, COALESCE($8, 'United Kingdom'))
          ON CONFLICT (onboarding_id, address_type) DO NOTHING
        `, [record.id, type, addr.line1 || null, addr.line2 || null, addr.city || null,
            addr.county || null, addr.postcode || null, addr.country || null]);
      }
    }

    // ── Contacts ──
    for (const role of ['primary_onboarding', 'billing', 'operational']) {
      const c = contacts[role];
      if (c && (c.full_name || c.email)) {
        await client.query(`
          INSERT INTO onboarding_contacts
            (onboarding_id, role, full_name, job_title, email, phone, is_primary)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (onboarding_id, role) DO NOTHING
        `, [record.id, role, c.full_name || null, c.job_title || null,
            c.email || null, c.phone || null, role === 'primary_onboarding']);
      }
    }

    await client.query('COMMIT');

    // ── Kick off welcome email workflow (non-blocking; never fails the request) ──
    const welcomeTo = contacts.primary_onboarding?.email || record.primary_email;
    if (welcomeTo) {
      fireWelcomeEmail(record, welcomeTo).catch(e =>
        console.warn(`[onboarding] welcome email skipped for ${record.moov_id}:`, e.message));
    }

    res.status(201).json({ id: record.id, moov_id: record.moov_id, status: record.status });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    next(err);
  } finally {
    client.release();
  }
});

/** Compose + send the welcome email, then log it as a 'team' interaction. */
async function fireWelcomeEmail(record, to) {
  const name = record.trading_name || record.legal_name;
  const subject = `Welcome to Moov — onboarding ${record.moov_id} [${record.moov_id}]`;
  const html = `
    <p>Hi ${name},</p>
    <p>Welcome aboard! Your onboarding reference is <strong>${record.moov_id}</strong>.</p>
    <p>Our team is now verifying your company details. Please keep the reference
       <strong>[${record.moov_id}]</strong> in the subject line of any replies so we
       can route them straight to your file.</p>
    <p>— The Moov Onboarding Team</p>`;

  await sendEmail(to, subject, html);

  await query(`
    INSERT INTO onboarding_interactions (onboarding_id, sender, channel, subject, body)
    VALUES ($1, 'team', 'email', $2, $3)
  `, [record.id, subject, 'Automated welcome email sent.']);

  await query(`
    UPDATE onboarding_customers
    SET last_reply_at = NOW(), last_reply_by = 'team'
    WHERE id = $1
  `, [record.id]);
}

// ─── POST /courier-communication/webhook — inbound mail parser ──────
//
// Looks for a bracketed Moov ID token in the subject/body, appends the message
// and any media assets to that record's interaction log, and refreshes the
// "Last Reply" dashboard metric.
router.post('/courier-communication/webhook', authMiddleware, async (req, res, next) => {
  try {
    const p = req.body || {};
    const subject   = p.subject || p.Subject || '';
    const rawBody   = p.body || p.text || p['body-plain'] || p.html || '';
    const fromAddr  = (p.from || p.sender || p.From || '').toLowerCase();
    const externalId = p.message_id || p['Message-Id'] || p.id || null;

    // 1. Resolve the target onboarding record from a bracketed token.
    const moovId = findMoovIdToken(subject, rawBody, p.references, p.in_reply_to);
    if (!moovId) {
      return res.status(202).json({ matched: false, reason: 'no_moov_id_token' });
    }

    const rec = await query(`SELECT id FROM onboarding_customers WHERE moov_id = $1`, [moovId]);
    const onboardingId = rec.rows[0]?.id;
    if (!onboardingId) {
      return res.status(202).json({ matched: false, reason: 'unknown_moov_id', moov_id: moovId });
    }

    // 2. Idempotency — skip if we've already logged this provider message.
    if (externalId) {
      const dup = await query(
        `SELECT 1 FROM onboarding_interactions WHERE onboarding_id = $1 AND external_id = $2`,
        [onboardingId, externalId]
      );
      if (dup.rows[0]) {
        return res.status(200).json({ matched: true, duplicate: true, moov_id: moovId });
      }
    }

    // 3. Classify sender → client / team / carrier.
    const sender = classifySender(fromAddr);

    // 4. Normalise media assets: [{ filename, url, content_type, size }]
    const media = Array.isArray(p.attachments)
      ? p.attachments.map(a => ({
          filename:     a.filename || a.name || null,
          url:          a.url || a.content_url || null,
          content_type: a.content_type || a.type || null,
          size:         a.size || null,
        }))
      : [];

    const cleanBody = extractLatestReply(rawBody);

    // 5. Append to interaction log + toggle Last Reply metric (single tx).
    const client = await getClient();
    try {
      await client.query('BEGIN');
      await client.query(`
        INSERT INTO onboarding_interactions
          (onboarding_id, sender, channel, subject, body, media_assets, external_id)
        VALUES ($1, $2, 'email', $3, $4, $5::jsonb, $6)
      `, [onboardingId, sender, subject, cleanBody, JSON.stringify(media), externalId]);

      await client.query(`
        UPDATE onboarding_customers
        SET last_reply_at = NOW(), last_reply_by = $2
        WHERE id = $1
      `, [onboardingId, sender]);
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK').catch(() => {});
      throw e;
    } finally {
      client.release();
    }

    res.status(200).json({ matched: true, moov_id: moovId, sender, media_count: media.length });
  } catch (err) { next(err); }
});

/** Best-effort sender classification from the From address. */
function classifySender(fromAddr = '') {
  if (!fromAddr) return 'client';
  if (fromAddr.includes('@moov')) return 'team';
  const carriers = ['dpd', 'royalmail', 'royal-mail', 'dhl', 'yodel', 'evri', 'ups', 'fedex', 'parcelforce'];
  if (carriers.some(c => fromAddr.includes(c))) return 'carrier';
  return 'client';
}

// ─── PATCH /:id/status — move card between columns ──────────────────
router.patch('/:id/status', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body || {};
    if (!PIPELINE.includes(status)) {
      return res.status(400).json({ error: `status must be one of: ${PIPELINE.join(', ')}` });
    }
    const now = new Date();
    const slaDue = await slaDueFor(status, now);

    const { rows } = await query(`
      UPDATE onboarding_customers
      SET status = $2::onboarding_status, status_entered_at = $3, sla_due_at = $4
      WHERE id = $1
      RETURNING id, moov_id, status, sla_due_at
    `, [id, status, now, slaDue]);

    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

export default router;
