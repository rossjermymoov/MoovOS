/**
 * Moov OS — Queries & Claims Inbox
 *
 * Handles the full lifecycle of customer queries and claims:
 * inbound email processing, AI draft approval, courier communication,
 * email sender mapping, and real-time dashboard statistics.
 */

import express from 'express';
import { query } from '../db/index.js';

const router = express.Router();

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/queries
// Inbox list — supports filtering, sorting, pagination
// ─────────────────────────────────────────────────────────────────────────────

router.get('/', async (req, res, next) => {
  try {
    const {
      status, courier_code, customer_id, query_type, trigger,
      requires_attention, attention,      // attention is alias for requires_attention
      sender_matched,
      assigned_to, priority, group_name,  // new panel filters
      pending_draft,                      // filter to tickets with AI drafts awaiting approval
      search,
      date_from, date_to,
      sort = 'updated_at', order = 'desc',
      limit = 50, offset = 0,
    } = req.query;

    const conditions = [];
    const values = [];
    let idx = 1;

    if (status) {
      const statuses = status.split(',').map(s => s.trim());
      conditions.push(`status = ANY($${idx++}::query_status[])`);
      values.push(statuses);
    }
    if (courier_code) {
      conditions.push(`courier_code = $${idx++}`);
      values.push(courier_code);
    }
    if (customer_id) {
      conditions.push(`customer_id = $${idx++}`);
      values.push(customer_id);
    }
    if (query_type) {
      conditions.push(`query_type = $${idx++}::query_type`);
      values.push(query_type);
    }
    if (trigger) {
      conditions.push(`trigger = $${idx++}::query_trigger`);
      values.push(trigger);
    }
    if (requires_attention === 'true' || attention === 'true') {
      conditions.push(`requires_attention = true`);
    }
    if (assigned_to) {
      conditions.push(`assigned_to = $${idx++}::uuid`);
      values.push(assigned_to);
    }
    if (priority) {
      conditions.push(`priority = $${idx++}::ticket_priority`);
      values.push(priority);
    }
    if (group_name) {
      conditions.push(`group_name = $${idx++}`);
      values.push(group_name);
    }
    if (pending_draft === 'true') {
      conditions.push(`pending_drafts > 0`);
    }
    if (sender_matched === 'false') {
      conditions.push(`sender_matched = false`);
    }
    if (date_from) {
      conditions.push(`created_at >= $${idx++}`);
      values.push(date_from);
    }
    if (date_to) {
      conditions.push(`created_at <= $${idx++}`);
      values.push(date_to);
    }
    if (search) {
      conditions.push(`(
        consignment_number ILIKE $${idx}  OR
        customer_name      ILIKE $${idx}  OR
        subject            ILIKE $${idx}  OR
        claim_number       ILIKE $${idx}  OR
        sender_email       ILIKE $${idx}
      )`);
      values.push(`%${search}%`);
      idx++;
    }

    const validSorts = ['created_at', 'updated_at', 'latest_email_at', 'claim_days_remaining', 'age_days'];
    const sortCol = validSorts.includes(sort) ? sort : 'updated_at';
    const sortDir = order === 'asc' ? 'ASC' : 'DESC';

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    // Attention-required rows always float to the top
    const [dataRes, countRes] = await Promise.all([
      query(`
        SELECT *,
          LEFT(latest_email_preview, 120) AS latest_email_preview
        FROM queries_inbox_view
        ${where}
        ORDER BY requires_attention DESC, ${sortCol} ${sortDir} NULLS LAST
        LIMIT $${idx} OFFSET $${idx + 1}
      `, [...values, parseInt(limit), parseInt(offset)]),
      query(`SELECT COUNT(*)::int AS total FROM queries_inbox_view ${where}`, values),
    ]);

    res.set('Cache-Control', 'no-store');
    res.json({
      queries: dataRes.rows,
      total:   countRes.rows[0].total,
      limit:   parseInt(limit),
      offset:  parseInt(offset),
    });
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/queries/debug  — diagnostic
// POST /api/queries/seed-now — force-seed 10 practice queries right now
// ─────────────────────────────────────────────────────────────────────────────

router.get('/debug', async (req, res, next) => {
  try {
    const [queryCount, customerCount, migrations, enumValues, viewTest, columns, sampleParcels] = await Promise.all([
      query(`SELECT COUNT(*)::int AS n FROM queries`),
      query(`SELECT COUNT(*)::int AS n FROM customers WHERE primary_email IS NOT NULL`),
      query(`SELECT filename, run_at FROM _migrations WHERE filename LIKE '07%' ORDER BY filename`),
      query(`SELECT unnest(enum_range(NULL::query_status))::text AS v`),
      query(`SELECT COUNT(*)::int AS n FROM queries_inbox_view`),
      query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'queries' ORDER BY ordinal_position`),
      query(`SELECT DISTINCT ON (p.customer_id)
               p.consignment_number, p.courier_code, p.courier_name, p.service_name,
               p.status AS parcel_status, p.last_event_at,
               c.id AS customer_id, c.business_name, c.primary_email
             FROM parcels p
             JOIN customers c ON p.customer_id = c.id
             WHERE c.primary_email IS NOT NULL AND p.consignment_number IS NOT NULL
             ORDER BY p.customer_id, p.last_event_at DESC NULLS LAST
             LIMIT 12`),
    ]);
    res.json({
      queries_count:        queryCount.rows[0].n,
      customers_with_email: customerCount.rows[0].n,
      migrations_run:       migrations.rows,
      query_status_values:  enumValues.rows.map(r => r.v),
      inbox_view_count:     viewTest.rows[0].n,
      queries_columns:      columns.rows.map(r => r.column_name),
      sample_parcels:       sampleParcels.rows,
    });
  } catch (err) { next(err); }
});

router.get('/seed-now', async (req, res, next) => seedNowHandler(req, res, next));
router.post('/seed-now', async (req, res, next) => seedNowHandler(req, res, next));
async function seedNowHandler(req, res, next) {
  try {
    // 5 targeted claims-testing scenarios — one per major carrier + one DPD expired window
    // daysAgo = how long ago the parcel entered the network (= ticket raised date)
    // claimWindowDays = carrier's claims deadline from network entry
    // → claim_deadline_at = createdAt + claimWindowDays
    const SEEDS = [
      {
        // DPD — lost in network, 11 days old, 3 days left on 14-day window (AMBER)
        consignment_number: '1760776790',
        customer_id: '006249c4-a38f-4ad4-aa19-7447cf3cce4a',
        business_name: 'Westcare Ltd',
        primary_email: 'lee@westcare.co.uk',
        courier_code: 'dpd', courier_name: 'DPD',
        service_code: 'dpd-nd', service_name: 'DPD Next Day',
        type: 'not_delivered', status: 'awaiting_courier', attention: true,
        daysAgo: 11, claimWindowDays: 14,
        subject: 'DPD tracking shows delivered — 1760776790 — we have NOT received this',
        body: `Hi Moov,\n\nDPD are claiming consignment 1760776790 was delivered on Tuesday at 11:54. Nobody here received it — we've checked with every member of staff and reviewed our reception log.\n\nWe have CCTV covering the main entrance and there is no footage of a DPD driver or vehicle at any point that morning.\n\nThe shipment contained care equipment valued at over £800. Please investigate as a matter of urgency. If DPD cannot provide GPS delivery confirmation or a signature image, I'll be expecting a full claim.\n\nPlease come back to me by end of day.\n\nLee\nWestcare Ltd`,
      },
      {
        // DPD — delivered damaged, 16 days ago, claim window EXPIRED 2 days ago (RED)
        consignment_number: '2313194575',
        customer_id: '4211d418-561a-4b86-94ab-4825c9f3a80d',
        business_name: 'Crytec Limited',
        primary_email: 'sales@crytec-power.co.uk',
        courier_code: 'dpd', courier_name: 'DPD',
        service_code: 'dpd-nd', service_name: 'DPD Next Day',
        type: 'damaged', status: 'claim_raised', attention: true,
        daysAgo: 16, claimWindowDays: 14,
        subject: '2313194575 — arrived damaged, formal claim — please advise urgently',
        body: `Hi,\n\nConsignment 2313194575 was delivered 16 days ago and arrived with significant crush damage to one corner. We reported it immediately but the investigation has stalled.\n\nI'm aware that DPD's 14-day claims window may now have passed — can you confirm whether we're still within the window and what the status of the claim is?\n\nThe goods were power supply units valued at £340 + VAT. We have photographic evidence of the damage and original packaging.\n\nPlease treat this as urgent.\n\nCrytec Limited`,
      },
      {
        // DHL — not delivered / lost, 9 days ago, 5 days left on 14-day window (GREEN → AMBER soon)
        consignment_number: '60120241549129',
        customer_id: '0d9db960-ecee-4815-a687-c2d5105a4013',
        business_name: 'Perex Group Ltd',
        primary_email: 'info@perex.co.uk',
        courier_code: 'dhlparcelukcloud', courier_name: 'DHL',
        service_code: 'dhl-parcel', service_name: 'DHL Parcel UK',
        type: 'not_delivered', status: 'courier_investigating', attention: false,
        daysAgo: 9, claimWindowDays: 14,
        subject: '60120241549129 — DHL investigation ongoing — 9 days and still no parcel',
        body: `Hello,\n\nConsignment 60120241549129 was booked with DHL nine days ago and has never moved past the initial booking scan. No collection event, no depot scan, nothing.\n\nWe contacted you last week and were told DHL were investigating. We've had no further update.\n\nI understand DHL's claims window runs from the expected delivery date. Can you let me know:\n1. What the expected delivery date was for this shipment\n2. How many days we have left to raise a formal claim if the investigation fails\n\nThis is holding up a client project. Please give us a realistic timeline.\n\nPerex Group Ltd`,
      },
      {
        // Yodel — damaged parcel, 6 days ago, 1 day left on 7-day AGL window (RED / CRITICAL)
        consignment_number: 'JJD00009123456',
        customer_id: '246eb53e-53f2-472c-b659-9bdd4c3bbc1e',
        business_name: 'EZZTECH',
        primary_email: 'info@ezztech.co.uk',
        courier_code: 'yodel', courier_name: 'Yodel',
        service_code: 'yodel-c2c', service_name: 'Yodel C2C',
        type: 'damaged', status: 'awaiting_customer_info', attention: true,
        daysAgo: 6, claimWindowDays: 7,
        subject: 'JJD00009123456 — delivered damaged — need to raise AGL claim TODAY',
        body: `Hi Moov,\n\nConsignment JJD00009123456 (Yodel) was delivered six days ago and arrived with a cracked outer casing — the contents are a networking switch worth £280 and it appears the damage is to the unit itself, not just packaging.\n\nI've just been reminded that Yodel's claim window through AGL is only 7 days from label generation. That means we have TODAY to raise this.\n\nCan you help us get this submitted to AGL urgently? We have photographs of the damage.\n\nEZZTECH`,
      },
      {
        // UPS — missing items, 6 days ago, 8 days left on 14-day window (GREEN)
        consignment_number: '1Z12345E0291980793',
        customer_id: '12760b23-fddd-45be-ab14-9031b6241ed3',
        business_name: 'E-Health Pharmacy Ltd',
        primary_email: 'hello@thehealthpharmacy.co.uk',
        courier_code: 'ups', courier_name: 'UPS',
        service_code: 'ups-express', service_name: 'UPS Express',
        type: 'missing_items', status: 'open', attention: false,
        daysAgo: 6, claimWindowDays: 14,
        subject: '1Z12345E0291980793 — UPS delivered but 2 items missing from box',
        body: `Dear Moov Parcel team,\n\nConsignment 1Z12345E0291980793 (UPS Express) was delivered on Monday. On opening we found two items missing from the shipment:\n\n- 1x Omron blood pressure monitor (HBP-1320)\n- 1x pulse oximeter (CMS-60D)\n\nTotal missing value: approximately £195 inc. VAT.\n\nThe box appeared intact and sealed with no visible signs of tampering, which makes this unusual. We have photographed the contents and the packaging.\n\nCan you advise on the UPS claims process and how long we have to submit? We want to make sure we don't miss any deadlines.\n\nKind regards\nE-Health Pharmacy Ltd`,
      },
    ];

    const log = [];

    // Step 1: clear everything
    try {
      await query(`TRUNCATE queries CASCADE`);
      log.push({ step: 'truncate', ok: true });
    } catch (e) {
      // TRUNCATE failed — try row-by-row delete instead
      log.push({ step: 'truncate', ok: false, error: e.message });
      try {
        await query(`DELETE FROM query_emails`);
        await query(`DELETE FROM query_notifications`);
        await query(`DELETE FROM query_evidence`);
        await query(`DELETE FROM queries`);
        log.push({ step: 'manual_delete', ok: true });
      } catch (e2) {
        return res.status(500).json({ step: 'clear', error: e2.message, log });
      }
    }

    // Step 2: check what enum values are actually in the DB
    const [qtEnums, qsEnums, edEnums] = await Promise.all([
      query(`SELECT unnest(enum_range(NULL::query_type))::text AS v`),
      query(`SELECT unnest(enum_range(NULL::query_status))::text AS v`),
      query(`SELECT unnest(enum_range(NULL::email_direction))::text AS v`),
    ]);
    const validTypes    = new Set(qtEnums.rows.map(r => r.v));
    const validStatuses = new Set(qsEnums.rows.map(r => r.v));
    log.push({ step: 'enums', query_types: [...validTypes], query_statuses: [...validStatuses] });

    // Step 3: look up customer IDs live (don't rely on hardcoded UUIDs)
    const emailToCustomer = {};
    const emails = SEEDS.map(s => s.primary_email);
    const custRes = await query(
      `SELECT id, primary_email FROM customers WHERE primary_email = ANY($1::varchar[])`,
      [emails]
    );
    for (const r of custRes.rows) emailToCustomer[r.primary_email] = r.id;
    log.push({ step: 'lookup_customers', found: custRes.rows.length, emails: Object.keys(emailToCustomer) });

    // Check if claim_deadline_at column exists
    const colCheck = await query(
      `SELECT column_name FROM information_schema.columns
       WHERE table_name = 'queries' AND column_name = 'claim_deadline_at'`
    );
    const hasClaimDeadline = colCheck.rows.length > 0;
    log.push({ step: 'claim_deadline_col_exists', hasClaimDeadline });

    const inserted = [];
    for (const s of SEEDS) {
      const createdAt     = new Date(Date.now() - s.daysAgo * 86400000).toISOString();
      const claimDeadline = new Date(Date.now() - s.daysAgo * 86400000 + s.claimWindowDays * 86400000).toISOString();
      const consNum       = s.consignment_number;
      const customerId    = emailToCustomer[s.primary_email] || s.customer_id;

      if (!validTypes.has(s.type)) {
        inserted.push({ consignment: consNum, error: `query_type '${s.type}' not in enum` });
        continue;
      }
      if (!validStatuses.has(s.status)) {
        inserted.push({ consignment: consNum, error: `query_status '${s.status}' not in enum` });
        continue;
      }

      let qid;
      try {
        if (hasClaimDeadline) {
          const qRes = await query(`
            INSERT INTO queries (
              consignment_number, customer_id, customer_name,
              courier_code, courier_name, service_code, service_name,
              trigger, query_type, status,
              subject, description,
              sender_email, sender_matched, requires_attention,
              claim_deadline_at,
              created_at, updated_at
            ) VALUES (
              $1::varchar, $2::uuid, $3::varchar,
              $4::varchar, $5::varchar, $6::varchar, $7::varchar,
              'customer_email'::query_trigger, $8::query_type, $9::query_status,
              $10::varchar, $11::text,
              $12::varchar, true, $13::boolean,
              $14::timestamptz,
              $15::timestamptz, $15::timestamptz
            )
            RETURNING id
          `, [consNum, customerId, s.business_name,
              s.courier_code, s.courier_name, s.service_code, s.service_name,
              s.type, s.status,
              s.subject, s.body,
              s.primary_email, s.attention,
              claimDeadline,
              createdAt]);
          qid = qRes.rows[0]?.id;
        } else {
          // Fallback if column doesn't exist yet
          const qRes = await query(`
            INSERT INTO queries (
              consignment_number, customer_id, customer_name,
              courier_code, courier_name, service_code, service_name,
              trigger, query_type, status,
              subject, description,
              sender_email, sender_matched, requires_attention,
              created_at, updated_at
            ) VALUES (
              $1::varchar, $2::uuid, $3::varchar,
              $4::varchar, $5::varchar, $6::varchar, $7::varchar,
              'customer_email'::query_trigger, $8::query_type, $9::query_status,
              $10::varchar, $11::text,
              $12::varchar, true, $13::boolean,
              $14::timestamptz, $14::timestamptz
            )
            RETURNING id
          `, [consNum, customerId, s.business_name,
              s.courier_code, s.courier_name, s.service_code, s.service_name,
              s.type, s.status,
              s.subject, s.body,
              s.primary_email, s.attention, createdAt]);
          qid = qRes.rows[0]?.id;
        }
      } catch (e) {
        inserted.push({ consignment: consNum, error: e.message });
        continue;
      }

      if (!qid) { inserted.push({ skipped: true, consignment: consNum }); continue; }

      await query(`
        INSERT INTO query_emails (
          query_id, direction, subject, body_text,
          from_address, to_address, is_ai_draft, received_at, created_at
        ) VALUES (
          $1::uuid, 'inbound_customer'::email_direction, $2::varchar, $3::text,
          $4::varchar, 'queries@moovparcel.co.uk', false, $5::timestamptz, $5::timestamptz
        )
      `, [qid, s.subject, s.body, s.primary_email, createdAt]);

      const daysLeft = s.claimWindowDays - s.daysAgo;
      inserted.push({
        id: qid, consignment: consNum, customer: s.business_name,
        courier: s.courier_name, status: s.status,
        claimWindow: `${s.claimWindowDays} days`,
        claimDeadline, daysLeft,
      });
    }

    const seededCount = inserted.filter(i => i.id).length;

    // Auto-triage seeded tickets if Anthropic key is available
    let triageResult = null;
    if (process.env.ANTHROPIC_API_KEY && seededCount > 0) {
      try {
        const triageRes = await fetch(
          `http://localhost:${process.env.PORT || 3000}/api/queries/triage-all?force=true`,
          { method: 'POST', headers: { 'Content-Type': 'application/json' } }
        );
        if (triageRes.ok) triageResult = await triageRes.json();
      } catch { /* non-fatal — triage can be run manually */ }
    }

    res.json({ seeded: seededCount, log, queries: inserted, triage: triageResult });
  } catch (err) {
    res.status(500).json({ error: err.message, detail: err.detail || null });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/queries/stats
// Dashboard statistics for the queries module
// ─────────────────────────────────────────────────────────────────────────────

router.get('/stats', async (req, res, next) => {
  try {
    const RESOLVED = `('resolved','resolved_claim_approved','resolved_claim_rejected')`;

    const [overview, byStatus, byType, claimDeadlines, unmatched] = await Promise.all([

      // All key counts in one pass over the inbox view
      query(`
        SELECT
          COUNT(*) FILTER (WHERE status NOT IN ${RESOLVED})                         AS total_open,
          COUNT(*) FILTER (WHERE requires_attention = true
                             AND status NOT IN ${RESOLVED})                          AS requires_attention,
          COUNT(*) FILTER (WHERE sla_breached = true)                              AS sla_breached,
          COUNT(*) FILTER (WHERE pending_drafts > 0
                             AND status NOT IN ${RESOLVED})                          AS tickets_to_verify,
          COUNT(*) FILTER (
            WHERE claim_deadline_at IS NOT NULL
              AND claim_deadline_at BETWEEN NOW() AND NOW() + INTERVAL '7 days'
              AND status NOT IN ${RESOLVED}
          )                                                                          AS claim_deadlines_7d,
          COUNT(*)                                                                   AS total_queries
        FROM queries_inbox_view
      `),

      // By status (open only)
      query(`
        SELECT status, COUNT(*)::int AS count
        FROM queries
        WHERE status NOT IN ${RESOLVED}
        GROUP BY status ORDER BY count DESC
      `),

      // By query type (open only)
      query(`
        SELECT query_type, COUNT(*)::int AS count
        FROM queries
        WHERE status NOT IN ${RESOLVED}
        GROUP BY query_type ORDER BY count DESC
      `),

      // Upcoming claim deadlines (next 14 days)
      query(`
        SELECT id, consignment_number, customer_name,
               claim_deadline_at,
               CEIL(EXTRACT(EPOCH FROM (claim_deadline_at - NOW())) / 86400)::int AS days_remaining
        FROM queries
        WHERE claim_deadline_at IS NOT NULL
          AND claim_deadline_at > NOW()
          AND claim_deadline_at < NOW() + INTERVAL '14 days'
          AND status NOT IN ${RESOLVED}
        ORDER BY claim_deadline_at ASC
        LIMIT 10
      `),

      // Unmatched emails
      query(`SELECT COUNT(*)::int AS count FROM unmatched_emails WHERE resolved = false`),
    ]);

    const o = overview.rows[0];
    res.json({
      total_open:               parseInt(o.total_open)            || 0,
      requires_attention:       parseInt(o.requires_attention)    || 0,
      sla_breached:             parseInt(o.sla_breached)          || 0,
      tickets_to_verify:        parseInt(o.tickets_to_verify)     || 0,
      claim_deadlines_7d:       parseInt(o.claim_deadlines_7d)    || 0,
      autopilot_sent:           0,                                        // future
      total_queries:            parseInt(o.total_queries)         || 0,
      unmatched_emails:         parseInt(unmatched.rows[0].count) || 0,
      upcoming_claim_deadlines: claimDeadlines.rows,
      by_status:                byStatus.rows,
      by_type:                  byType.rows,
    });
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/queries/unmatched
// Emails that couldn't be matched to a customer — for the mapping tool
// ─────────────────────────────────────────────────────────────────────────────

router.get('/unmatched', async (req, res, next) => {
  try {
    const { limit = 20, offset = 0 } = req.query;
    const [dataRes, countRes] = await Promise.all([
      query(`
        SELECT * FROM unmatched_emails
        WHERE resolved = false
        ORDER BY received_at DESC
        LIMIT $1 OFFSET $2
      `, [parseInt(limit), parseInt(offset)]),
      query(`SELECT COUNT(*)::int AS total FROM unmatched_emails WHERE resolved = false`),
    ]);
    res.json({ emails: dataRes.rows, total: countRes.rows[0].total });
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/queries/sender-suggestions
// Suggest customer matches for an unknown email address
// IMPORTANT: must be defined BEFORE /:id to avoid being swallowed by the param route
// ─────────────────────────────────────────────────────────────────────────────

router.get('/sender-suggestions', async (req, res, next) => {
  try {
    const { email, domain } = req.query;
    if (!email && !domain) return res.status(400).json({ error: 'email or domain required' });

    const emailDomain = domain || email?.split('@')[1];

    const result = await query(`
      SELECT c.id, c.business_name, c.account_number, c.primary_email,
             CASE
               WHEN c.primary_email = $1 THEN 3
               WHEN c.primary_email ILIKE '%' || $2 || '%' THEN 2
               WHEN EXISTS (
                 SELECT 1 FROM customer_contacts cc
                 WHERE cc.customer_id = c.id AND cc.email ILIKE '%' || $2 || '%'
               ) THEN 1
               ELSE 0
             END AS match_score
      FROM customers c
      WHERE c.account_status = 'active'
        AND (
          c.primary_email = $1
          OR c.primary_email ILIKE '%' || $2 || '%'
          OR EXISTS (
            SELECT 1 FROM customer_contacts cc
            WHERE cc.customer_id = c.id AND cc.email ILIKE '%' || $2 || '%'
          )
        )
      ORDER BY match_score DESC, c.business_name ASC
      LIMIT 10
    `, [email || '', emailDomain || '']);

    res.json({ suggestions: result.rows });
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/queries/:id
// Single query with full email thread, evidence, and notifications
// ─────────────────────────────────────────────────────────────────────────────

router.get('/:id', async (req, res, next) => {
  try {
    const [queryRes, emailsRes, evidenceRes, notificationsRes] = await Promise.all([
      query(`SELECT * FROM queries_inbox_view WHERE id = $1`, [req.params.id]),
      query(`
        SELECT id, direction, subject, body_text, body_html,
               from_address, to_address, cc_address,
               is_ai_draft, ai_draft_approved_by, ai_draft_approved_at, ai_draft_edited,
               sent_at, received_at, read_at, created_at
        FROM query_emails
        WHERE query_id = $1
        ORDER BY created_at DESC
      `, [req.params.id]),
      query(`
        SELECT id, evidence_type, value_text, value_numeric, value_unit,
               file_name, file_format, file_url, provided_by_name, provided_by_email,
               is_courier_approved, created_at
        FROM query_evidence
        WHERE query_id = $1
        ORDER BY created_at ASC
      `, [req.params.id]),
      query(`
        SELECT id, notification_type, message, read_at, created_at
        FROM query_notifications
        WHERE query_id = $1
        ORDER BY created_at DESC
        LIMIT 20
      `, [req.params.id]),
    ]);

    if (!queryRes.rows.length) return res.status(404).json({ error: 'Query not found' });

    res.json({
      ...queryRes.rows[0],
      emails:        emailsRes.rows,
      evidence:      evidenceRes.rows,
      notifications: notificationsRes.rows,
    });
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/queries
// Create a query (manual or automated trigger)
// ─────────────────────────────────────────────────────────────────────────────

router.post('/', async (req, res, next) => {
  try {
    const {
      parcel_id, consignment_number, customer_id, customer_name,
      courier_code, courier_name, service_code, service_name,
      trigger, query_type, subject, description,
      sender_email, freshdesk_ticket_id, freshdesk_ticket_number,
      created_by,
    } = req.body;

    // Look up courier contact config for email addresses
    const courierConfig = await query(
      `SELECT query_email, claims_email FROM courier_query_config WHERE courier_code = $1`,
      [courier_code]
    );
    const courierEmail = courierConfig.rows[0]?.query_email || null;

    // Look up SLA
    const slaRes = await query(
      `SELECT sla_hours FROM service_slas WHERE service_code = $1 AND courier_code = $2`,
      [service_code, courier_code]
    );
    const slaHours = slaRes.rows[0]?.sla_hours || null;

    const result = await query(`
      INSERT INTO queries (
        parcel_id, consignment_number, customer_id, customer_name,
        courier_code, courier_name, service_code, service_name,
        trigger, query_type, subject, description,
        courier_email, sla_hours,
        sender_email, sender_matched,
        freshdesk_ticket_id, freshdesk_ticket_number,
        created_by
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
      RETURNING *
    `, [
      parcel_id, consignment_number, customer_id, customer_name,
      courier_code, courier_name, service_code, service_name,
      trigger, query_type || 'other', subject, description,
      courierEmail, slaHours,
      sender_email, !!customer_id,
      freshdesk_ticket_id, freshdesk_ticket_number,
      created_by || null,
    ]);

    const newQuery = result.rows[0];

    // ── Auto-assign SLA policy ──────────────────────────────────────────────
    // Match most specific policy: courier+type > type-only > catch-all
    try {
      const policyRes = await query(`
        SELECT id, name, duration_hours
        FROM sla_policies
        WHERE is_active = true
          AND (courier_code = $1 OR courier_code IS NULL)
          AND (query_type  = $2::query_type OR query_type IS NULL)
        ORDER BY
          (CASE WHEN courier_code IS NOT NULL THEN 2 ELSE 0 END) +
          (CASE WHEN query_type  IS NOT NULL THEN 1 ELSE 0 END) DESC,
          priority DESC
        LIMIT 1
      `, [courier_code, query_type || 'other']);

      if (policyRes.rows.length) {
        const p = policyRes.rows[0];
        await query(`
          INSERT INTO query_sla_assignments
            (query_id, policy_id, policy_name, duration_hours, due_at, triggered_by)
          VALUES ($1, $2, $3, $4, NOW() + ($4 || ' hours')::INTERVAL, 'auto_policy')
        `, [newQuery.id, p.id, p.name, p.duration_hours]);
      }
    } catch (_) { /* SLA table may not exist on older DBs — non-fatal */ }

    res.status(201).json(newQuery);
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/queries/:id
// Update query — status change, assign, resolve, flag for attention
// ─────────────────────────────────────────────────────────────────────────────

router.patch('/:id', async (req, res, next) => {
  try {
    const allowed = [
      'status', 'query_type', 'subject', 'assigned_to',
      'priority', 'group_name',
      'requires_attention', 'attention_reason',
      'courier_reference', 'claim_number', 'claim_deadline_at',
      'claim_amount', 'approved_amount', 'resolution_notes',
      'autopilot_enabled', 'freshdesk_ticket_number',
    ];

    const updates = [];
    const values  = [];
    let   idx     = 1;

    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        updates.push(`${key} = $${idx++}`);
        values.push(req.body[key]);
      }
    }

    if (!updates.length) return res.status(400).json({ error: 'No valid fields to update' });

    // Auto-set resolved_at when status flips to resolved
    if (req.body.status && ['resolved','resolved_claim_approved','resolved_claim_rejected'].includes(req.body.status)) {
      updates.push(`resolved_at = NOW()`);
      if (req.body.resolved_by) {
        updates.push(`resolved_by = $${idx++}`);
        values.push(req.body.resolved_by);
      }
    }

    // Auto-clear attention flag if manually resolved
    if (req.body.requires_attention === false) {
      updates.push(`attention_raised_at = NULL`);
    }
    if (req.body.requires_attention === true) {
      updates.push(`attention_raised_at = NOW()`);
    }

    updates.push(`updated_at = NOW()`);
    values.push(req.params.id);

    const result = await query(
      `UPDATE queries SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );

    if (!result.rows.length) return res.status(404).json({ error: 'Query not found' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/queries/:id/emails
// Approve an AI draft and mark as sent, OR log an inbound/manual email
// ─────────────────────────────────────────────────────────────────────────────

router.post('/:id/emails', async (req, res, next) => {
  try {
    const {
      direction, subject, body_text, body_html,
      from_address, to_address, cc_address,
      is_ai_draft = false,
      approved_by,       // staff UUID — set when approving a draft
      edited = false,
      gmail_message_id, gmail_thread_id, in_reply_to,
      received_at,
    } = req.body;

    const sent_at = direction?.startsWith('outbound') ? new Date().toISOString() : null;

    const result = await query(`
      INSERT INTO query_emails (
        query_id, direction, subject, body_text, body_html,
        from_address, to_address, cc_address,
        is_ai_draft, ai_draft_approved_by, ai_draft_approved_at, ai_draft_edited,
        sent_at, received_at,
        gmail_message_id, gmail_thread_id, in_reply_to
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
      RETURNING *
    `, [
      req.params.id, direction, subject, body_text, body_html,
      from_address, to_address, cc_address,
      is_ai_draft,
      approved_by || null,
      approved_by ? new Date().toISOString() : null,
      edited,
      sent_at, received_at || null,
      gmail_message_id || null, gmail_thread_id || null, in_reply_to || null,
    ]);

    // Record first response time if this is the first outbound email
    if (sent_at) {
      await query(`
        UPDATE queries
        SET
          first_response_at = COALESCE(first_response_at, NOW()),
          first_response_mins = COALESCE(first_response_mins,
            CEIL(EXTRACT(EPOCH FROM (NOW() - created_at)) / 60)::int
          ),
          updated_at = NOW()
        WHERE id = $1
      `, [req.params.id]);
    }

    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/queries/:id/mark-read
// Mark all unread inbound emails on this query as read.
// Called automatically when staff open a query in the UI.
// ─────────────────────────────────────────────────────────────────────────────

router.patch('/:id/mark-read', async (req, res, next) => {
  try {
    await query(`
      UPDATE query_emails
      SET read_at = NOW()
      WHERE query_id = $1
        AND read_at IS NULL
        AND direction IN ('inbound_customer', 'inbound_courier')
        AND is_ai_draft = false
    `, [req.params.id]);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/queries/:id/emails/:emailId/approve
// Mark an existing AI draft as approved (and optionally update body text).
// This avoids re-inserting a new row — we simply mark the draft sent.
// ─────────────────────────────────────────────────────────────────────────────

router.patch('/:id/emails/:emailId/approve', async (req, res, next) => {
  try {
    const { body_text } = req.body;
    const { id: queryId, emailId } = req.params;

    // Fetch the existing draft so we know the original body (to detect edits)
    const existing = await query(
      `SELECT * FROM query_emails WHERE id = $1 AND query_id = $2`,
      [emailId, queryId]
    );
    if (!existing.rows.length) {
      return res.status(404).json({ error: 'Draft email not found' });
    }

    const draft = existing.rows[0];
    const wasEdited = body_text && body_text.trim() !== (draft.body_text || '').trim();
    const finalBody = body_text || draft.body_text;

    const result = await query(`
      UPDATE query_emails SET
        body_text              = $1,
        ai_draft_approved_by   = NULL,
        ai_draft_approved_at   = NOW(),
        ai_draft_edited        = $2,
        sent_at                = NOW()
      WHERE id = $3 AND query_id = $4
      RETURNING *
    `, [finalBody, wasEdited, emailId, queryId]);

    // Record first response time if not already set
    if (draft.direction && draft.direction.startsWith('outbound')) {
      await query(`
        UPDATE queries
        SET
          first_response_at   = COALESCE(first_response_at, NOW()),
          first_response_mins = COALESCE(first_response_mins,
            CEIL(EXTRACT(EPOCH FROM (NOW() - created_at)) / 60)::int
          ),
          updated_at = NOW()
        WHERE id = $1
      `, [queryId]);
    }

    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/queries/triage-all
// AI urgency triage — reads every open, un-triaged ticket and asks Claude Haiku
// to assess priority (urgent/high/medium/low) and whether it needs attention.
// Also auto-flags any ticket whose claim window expires within 2 days.
// Safe to call repeatedly — skips tickets that already have a priority set
// unless ?force=true is passed.
// ─────────────────────────────────────────────────────────────────────────────

router.post('/triage-all', async (req, res, next) => {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' });
    }

    const force = req.query.force === 'true';
    const RESOLVED = `('resolved','resolved_claim_approved','resolved_claim_rejected')`;

    // Find open tickets — skip already-triaged ones unless ?force=true
    const eligible = await query(`
      SELECT id, consignment_number, customer_name, courier_name, courier_code,
             query_type, status, subject, sender_email,
             claim_deadline_at, requires_attention, priority
      FROM queries_inbox_view
      WHERE status NOT IN ${RESOLVED}
        ${force ? '' : "AND (priority IS NULL OR priority = 'medium')"}
      ORDER BY created_at ASC
      LIMIT 30
    `);

    const results = [];
    let triaged = 0;

    for (const ticket of eligible.rows) {

      // ── 1. Auto-flag expiring claim windows (no AI call needed) ──────────
      if (ticket.claim_deadline_at) {
        const daysLeft = Math.ceil(
          (new Date(ticket.claim_deadline_at) - Date.now()) / 86400000
        );
        if (daysLeft <= 2 && daysLeft >= 0 && !ticket.requires_attention) {
          const reason = daysLeft === 0
            ? 'Claim window expires TODAY'
            : `Claim window expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`;
          await query(`
            UPDATE queries
            SET requires_attention    = true,
                attention_reason      = $2,
                attention_raised_at   = NOW(),
                priority              = 'urgent',
                updated_at            = NOW()
            WHERE id = $1
          `, [ticket.id, reason]);
          results.push({ id: ticket.id, source: 'claim_deadline', priority: 'urgent', attention: true, reason });
          triaged++;
          continue;
        }
      }

      // ── 2. AI triage — read email thread ─────────────────────────────────
      try {
        const emailsRes = await query(
          `SELECT direction, body_text FROM query_emails
           WHERE query_id = $1 ORDER BY created_at ASC LIMIT 5`,
          [ticket.id]
        );

        const emailSummary = emailsRes.rows
          .map(e => `[${e.direction.replace(/_/g, ' ')}]\n${(e.body_text || '').slice(0, 600)}`)
          .join('\n\n---\n\n');

        const prompt = `You are triaging a customer support ticket for Moov Parcel, a UK parcel reseller.

Ticket details:
- Customer: ${ticket.customer_name || 'Unknown'}
- Courier: ${ticket.courier_name || 'Unknown'}
- Issue type: ${(ticket.query_type || 'other').replace(/_/g, ' ')}
- Current status: ${(ticket.status || '').replace(/_/g, ' ')}
- Subject: ${ticket.subject || '(no subject)'}

Email content:
${emailSummary || '(no emails)'}

Assess this ticket and respond with ONLY valid JSON in this exact format:
{
  "priority": "urgent|high|medium|low",
  "requires_attention": true|false,
  "attention_reason": "brief reason string, or null"
}

Priority rules:
- urgent: explicit legal threats (solicitor, small claims, trading standards), safety issue, perishable goods lost/damaged, claim window expiring, extremely high value loss (>£500) with aggressive tone, repeat escalation after failed resolution
- high: significant financial loss (£150-£500), aggressive/distressed tone, time-critical delivery failure, damaged goods with clear evidence, missing high-value items
- medium: standard complaint, delayed parcel, WISMO with some frustration, missing low-value items, failed delivery
- low: routine tracking query, mild frustration, no financial loss mentioned

requires_attention should be true for urgent and high priority only.
Keep attention_reason under 10 words. Return null if requires_attention is false.`;

        const aiResp = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 150,
            messages: [{ role: 'user', content: prompt }],
          }),
        });

        if (!aiResp.ok) {
          results.push({ id: ticket.id, source: 'ai', error: `API ${aiResp.status}` });
          continue;
        }

        const aiJson  = await aiResp.json();
        const rawText = (aiJson.content?.[0]?.text || '').trim();

        let parsed;
        try {
          // Strip markdown code fences if present
          const clean = rawText.replace(/^```json?\s*/i, '').replace(/```\s*$/, '').trim();
          parsed = JSON.parse(clean);
        } catch {
          results.push({ id: ticket.id, source: 'ai', error: 'JSON parse failed', raw: rawText });
          continue;
        }

        const validPriorities = new Set(['urgent', 'high', 'medium', 'low']);
        const priority         = validPriorities.has(parsed.priority) ? parsed.priority : 'medium';
        const needsAttention   = parsed.requires_attention === true;
        const reason           = needsAttention ? (parsed.attention_reason || null) : null;

        await query(`
          UPDATE queries
          SET priority            = $2::ticket_priority,
              requires_attention  = $3,
              attention_reason    = CASE WHEN $3 THEN $4 ELSE attention_reason END,
              attention_raised_at = CASE WHEN $3 AND attention_raised_at IS NULL THEN NOW() ELSE attention_raised_at END,
              updated_at          = NOW()
          WHERE id = $1
        `, [ticket.id, priority, needsAttention, reason]);

        results.push({ id: ticket.id, source: 'ai', priority, attention: needsAttention, reason });
        triaged++;

      } catch (err) {
        results.push({ id: ticket.id, source: 'ai', error: err.message });
      }
    }

    res.json({
      eligible: eligible.rows.length,
      triaged,
      results,
    });
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/queries/auto-draft-all
// Auto-generate customer AI drafts for every open ticket that doesn't
// already have a pending draft. Runs synchronously (up to 20 tickets) so
// the caller can show a progress count. Only targets non-resolved tickets.
// ─────────────────────────────────────────────────────────────────────────────

router.post('/auto-draft-all', async (req, res, next) => {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' });
    }

    const RESOLVED = `('resolved','resolved_claim_approved','resolved_claim_rejected')`;

    // Find open tickets without a pending AI draft, oldest first, cap at 20
    const eligible = await query(`
      SELECT id, consignment_number, customer_name, courier_name, query_type,
             status, subject, sender_email
      FROM queries_inbox_view
      WHERE status NOT IN ${RESOLVED}
        AND pending_drafts = 0
      ORDER BY created_at ASC
      LIMIT 20
    `);

    const results = [];
    let drafted = 0;

    for (const ticket of eligible.rows) {
      try {
        // Fetch email thread
        const emailsRes = await query(
          `SELECT direction, subject, body_text, from_address, created_at
           FROM query_emails WHERE query_id = $1 ORDER BY created_at ASC`,
          [ticket.id]
        );
        const emails = emailsRes.rows;

        const emailThread = emails
          .map(e => `[${e.direction.replace(/_/g, ' ')}]\nFrom: ${e.from_address}\n\n${e.body_text}`)
          .join('\n\n---\n\n');

        const queryTypeLabel = ticket.query_type?.replace(/_/g, ' ') || 'query';
        const statusLabel    = ticket.status?.replace(/_/g, ' ') || '';

        const systemPrompt = `You are a customer service agent for Moov Parcel, a UK parcel reseller. Write professional, empathetic emails in British English. Sign off as "Moov Parcel Support Team".`;

        const userPrompt = `Write a customer acknowledgement email for this ${queryTypeLabel} query.

Customer: ${ticket.customer_name}
Consignment: ${ticket.consignment_number}
Courier: ${ticket.courier_name}
Current status: ${statusLabel}

Email thread:
${emailThread || '(no emails yet)'}

Instructions:
- Acknowledge receipt of their message warmly
- Confirm you are investigating with ${ticket.courier_name || 'the courier'}
- Give a realistic timeframe (1-2 working days unless urgent)
- Keep it under 200 words

Then on a new line, output ONLY this JSON: {"phone_call_recommended":true/false,"urgency_reason":"brief reason or null"}

IMPORTANT — phone_call_recommended must be TRUE only if the customer's message contains CLEAR evidence of:
- Explicit threatening or abusive language directed at staff
- Explicit mention of legal action, a solicitor, trading standards, small claims court, or formal complaint
- Extremely high-value loss (over £500) combined with an aggressive/distressed tone
- Repeated escalation after previous resolution attempts

For ALL other cases — standard queries, delayed parcels, missing items, general frustration, mild upset, routine WISMO — set phone_call_recommended to FALSE. Most tickets do NOT warrant a phone call.`;

        const aiResp = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 700,
            system: systemPrompt,
            messages: [{ role: 'user', content: userPrompt }],
          }),
        });

        if (!aiResp.ok) {
          results.push({ id: ticket.id, status: 'error', error: `AI API ${aiResp.status}` });
          continue;
        }

        const aiJson   = await aiResp.json();
        let draftText  = (aiJson.content?.[0]?.text || '').trim();
        let phoneCall  = false;

        const jsonMatch = draftText.match(/\{"phone_call_recommended"\s*:\s*(true|false)[^}]*\}/);
        if (jsonMatch) {
          try {
            phoneCall = JSON.parse(jsonMatch[0]).phone_call_recommended === true;
            draftText = draftText.slice(0, draftText.lastIndexOf(jsonMatch[0])).trim();
          } catch { /* ignore */ }
        }

        const subject   = `Re: ${ticket.subject}`;
        const toAddress = ticket.sender_email || null;

        await query(`
          INSERT INTO query_emails
            (query_id, direction, subject, body_text, from_address, to_address, is_ai_draft, created_at)
          VALUES ($1, 'outbound_customer'::email_direction, $2, $3,
                  'queries@moovparcel.co.uk', $4, true, NOW())
        `, [ticket.id, subject, draftText, toAddress]);

        if (phoneCall) {
          await query(`
            UPDATE queries SET requires_attention = true,
              attention_reason = 'Phone call recommended by AI',
              attention_raised_at = NOW(), updated_at = NOW()
            WHERE id = $1
          `, [ticket.id]);
        }

        drafted++;
        results.push({ id: ticket.id, status: 'drafted' });
      } catch (err) {
        results.push({ id: ticket.id, status: 'error', error: err.message });
      }
    }

    res.json({
      eligible: eligible.rows.length,
      drafted,
      skipped: eligible.rows.length - drafted,
      results,
    });
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/queries/:id/generate-draft
// Generate an AI draft reply — either to the customer or to the courier
// ─────────────────────────────────────────────────────────────────────────────

router.post('/:id/generate-draft', async (req, res, next) => {
  try {
    const { target } = req.body; // 'customer' | 'courier'
    if (!['customer', 'courier'].includes(target)) {
      return res.status(400).json({ error: "target must be 'customer' or 'courier'" });
    }

    const [queryRes, emailsRes] = await Promise.all([
      query(`SELECT * FROM queries_inbox_view WHERE id = $1`, [req.params.id]),
      query(`SELECT direction, subject, body_text, from_address, to_address, created_at
             FROM query_emails WHERE query_id = $1 ORDER BY created_at ASC`, [req.params.id]),
    ]);

    if (!queryRes.rows.length) return res.status(404).json({ error: 'Query not found' });
    const q = queryRes.rows[0];
    const emails = emailsRes.rows;

    const emailThread = emails
      .map(e => `[${e.direction.replace(/_/g, ' ')}]\nFrom: ${e.from_address}\nSubject: ${e.subject}\n\n${e.body_text}`)
      .join('\n\n---\n\n');

    const isCustomer = target === 'customer';

    const systemPrompt = isCustomer
      ? `You are a customer service agent for Moov Parcel, a UK parcel reseller using couriers like DPD and DHL. Write professional, empathetic emails in British English. Be solution-focused. Sign off as "Moov Parcel Support Team". Do not use American spellings.`
      : `You are a customer service agent writing to a courier company on behalf of Moov Parcel, a UK parcel reseller. Write professional, firm but polite emails in British English requesting investigation or action. Be concise and specific.`;

    const queryTypeLabel = q.query_type?.replace(/_/g, ' ') || 'query';
    const statusLabel    = q.status?.replace(/_/g, ' ') || '';

    const userPrompt = isCustomer
      ? `Write a customer acknowledgement email for this ${queryTypeLabel} query.

Customer: ${q.customer_name}
Consignment: ${q.consignment_number}
Courier: ${q.courier_name}
Current status: ${statusLabel}

Email thread:
${emailThread}

Instructions:
- Acknowledge receipt of their message warmly
- Confirm you are investigating with ${q.courier_name}
- Give a realistic timeframe (1-2 working days unless urgent)
- Do not make promises you cannot keep
- Keep it concise — under 200 words
- Then on a new line, output ONLY this JSON (no markdown, no code block): {"phone_call_recommended":true/false,"urgency_reason":"brief reason or null"}`
      : `Write an email to ${q.courier_name} to chase/raise this ${queryTypeLabel} issue.

Consignment: ${q.consignment_number}
Our customer: ${q.customer_name}
Issue type: ${queryTypeLabel}
Current status: ${statusLabel}

Customer's email thread:
${emailThread}

Instructions:
- State the consignment number prominently
- Explain the issue clearly and professionally
- Request specific action (investigation / GPS proof / redelivery etc)
- Ask for a response within 24 hours
- Keep it under 200 words
- Then on a new line, output ONLY this JSON (no markdown, no code block): {"phone_call_recommended":true/false,"urgency_reason":"brief reason or null"}`;

    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' });
    }

    const aiResp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 900,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });

    if (!aiResp.ok) {
      const err = await aiResp.text();
      return res.status(502).json({ error: 'Anthropic API error', detail: err });
    }

    const aiJson    = await aiResp.json();
    const fullText  = aiJson.content?.[0]?.text || '';

    // Split draft text from trailing JSON block
    let draftText = fullText.trim();
    let phoneCallRecommended = false;
    let urgencyReason = null;

    const jsonMatch = draftText.match(/\{"phone_call_recommended"\s*:\s*(true|false)[^}]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        phoneCallRecommended = parsed.phone_call_recommended === true;
        urgencyReason = parsed.urgency_reason || null;
        draftText = draftText.slice(0, draftText.lastIndexOf(jsonMatch[0])).trim();
      } catch { /* ignore parse errors */ }
    }

    // Save as AI draft in query_emails
    const direction  = isCustomer ? 'outbound_customer' : 'outbound_courier';
    const subject    = isCustomer ? `Re: ${q.subject}` : `Query — Consignment ${q.consignment_number} [${q.courier_name}]`;
    const toAddress  = isCustomer ? (q.sender_email || null) : null;

    const savedEmail = await query(`
      INSERT INTO query_emails (query_id, direction, subject, body_text, from_address, to_address, is_ai_draft, created_at)
      VALUES ($1, $2::email_direction, $3::varchar, $4::text, 'queries@moovparcel.co.uk'::varchar, $5, true, NOW())
      RETURNING id
    `, [req.params.id, direction, subject, draftText, toAddress]);

    // If phone call recommended: raise attention and save notification
    if (phoneCallRecommended) {
      const msg = `📞 PHONE CALL RECOMMENDED${urgencyReason ? ': ' + urgencyReason : ''}`;
      await query(`
        UPDATE queries SET requires_attention = true, attention_reason = $1,
          attention_raised_at = NOW(), updated_at = NOW() WHERE id = $2
      `, [msg, req.params.id]);
      await query(`
        INSERT INTO query_notifications (query_id, notification_type, message)
        VALUES ($1, 'attention_required'::notification_type, $2)
      `, [req.params.id, msg]);
    }

    res.json({
      draft_id:              savedEmail.rows[0]?.id,
      draft_text:            draftText,
      subject,
      phone_call_recommended: phoneCallRecommended,
      urgency_reason:         urgencyReason,
    });
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/queries/:id/revise-draft
// Revise an existing Katana draft based on human feedback
// ─────────────────────────────────────────────────────────────────────────────

router.post('/:id/revise-draft', async (req, res, next) => {
  try {
    const { email_id, feedback } = req.body;
    if (!email_id || !feedback?.trim()) {
      return res.status(400).json({ error: 'email_id and feedback are required' });
    }

    // Fetch the draft email + ticket context
    const [queryRes, emailRes, threadRes] = await Promise.all([
      query(`SELECT * FROM queries_inbox_view WHERE id = $1`, [req.params.id]),
      query(`SELECT * FROM query_emails WHERE id = $1 AND query_id = $2`, [email_id, req.params.id]),
      query(`SELECT direction, body_text, from_address, created_at FROM query_emails
             WHERE query_id = $1 ORDER BY created_at ASC`, [req.params.id]),
    ]);

    if (!queryRes.rows.length)  return res.status(404).json({ error: 'Query not found' });
    if (!emailRes.rows.length)  return res.status(404).json({ error: 'Draft email not found' });

    const q          = queryRes.rows[0];
    const draft      = emailRes.rows[0];
    const isCustomer = draft.direction === 'outbound_customer';

    const emailThread = threadRes.rows
      .filter(e => e.id !== email_id)
      .map(e => `[${e.direction.replace(/_/g, ' ')}]\nFrom: ${e.from_address}\n\n${e.body_text}`)
      .join('\n\n---\n\n');

    const systemPrompt = isCustomer
      ? `You are a customer service agent for Moov Parcel, a UK parcel reseller. Write professional, empathetic emails in British English. Sign off as "Moov Parcel Support Team".`
      : `You are a customer service agent writing to a courier on behalf of Moov Parcel. Write professional, firm but polite emails in British English.`;

    const userPrompt = `Here is a Katana draft email that needs to be revised based on feedback from the team.

ORIGINAL DRAFT:
${draft.body_text}

HUMAN FEEDBACK:
${feedback.trim()}

TICKET CONTEXT:
Customer: ${q.customer_name}
Consignment: ${q.consignment_number}
Query type: ${q.query_type?.replace(/_/g, ' ')}
Courier: ${q.courier_name}

EMAIL THREAD (for context):
${emailThread || '(no prior thread)'}

Please rewrite the draft email incorporating the feedback. Output ONLY the revised email text — no preamble, no explanation, no JSON.`;

    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' });
    }

    const aiResp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 900,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });

    if (!aiResp.ok) {
      const err = await aiResp.text();
      return res.status(502).json({ error: 'Anthropic API error', detail: err });
    }

    const aiJson    = await aiResp.json();
    const newText   = (aiJson.content?.[0]?.text || '').trim();

    // Update the draft body in-place (query_emails has no updated_at column)
    const updated = await query(
      `UPDATE query_emails SET body_text = $1 WHERE id = $2 RETURNING *`,
      [newText, email_id]
    );

    res.json({ email: updated.rows[0], revised_text: newText });
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/queries/:id/attention
// Flag a query for human attention (called by AI or automation)
// ─────────────────────────────────────────────────────────────────────────────

router.post('/:id/attention', async (req, res, next) => {
  try {
    const { reason, notification_type = 'attention_required' } = req.body;

    await query(`
      UPDATE queries
      SET requires_attention = true,
          attention_reason   = $1,
          attention_raised_at = NOW(),
          updated_at         = NOW()
      WHERE id = $2
    `, [reason, req.params.id]);

    // Log notification
    await query(`
      INSERT INTO query_notifications (query_id, notification_type, message)
      VALUES ($1, $2::notification_type, $3)
    `, [req.params.id, notification_type, reason]);

    res.json({ ok: true });
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/queries/map-sender
// Map an unknown email sender to a customer record
// ─────────────────────────────────────────────────────────────────────────────

router.post('/map-sender', async (req, res, next) => {
  try {
    const { email_address, customer_id, matched_by, notes, unmatched_email_id } = req.body;

    if (!email_address || !customer_id) {
      return res.status(400).json({ error: 'email_address and customer_id are required' });
    }

    const domain = email_address.split('@')[1] || null;

    // Save the mapping
    await query(`
      INSERT INTO email_sender_mappings
        (email_address, email_domain, customer_id, match_type, matched_by, is_verified, notes)
      VALUES ($1, $2, $3, 'manual', $4, true, $5)
      ON CONFLICT (email_address, customer_id) DO UPDATE SET
        is_verified = true,
        matched_by  = EXCLUDED.matched_by,
        matched_at  = NOW(),
        notes       = COALESCE(EXCLUDED.notes, email_sender_mappings.notes)
    `, [email_address, domain, customer_id, matched_by || null, notes || null]);

    // If this resolves an unmatched email, mark it done
    if (unmatched_email_id) {
      await query(`
        UPDATE unmatched_emails
        SET resolved = true, resolved_at = NOW(), resolved_by = $1
        WHERE id = $2
      `, [matched_by || null, unmatched_email_id]);
    }

    // Update any open queries from this sender that have no customer
    await query(`
      UPDATE queries
      SET customer_id = $1, sender_matched = true, updated_at = NOW()
      WHERE sender_email = $2 AND (customer_id IS NULL OR sender_matched = false)
    `, [customer_id, email_address]);

    res.json({ ok: true, domain });
  } catch (err) { next(err); }
});

export default router;
