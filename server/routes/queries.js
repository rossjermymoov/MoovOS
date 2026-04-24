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
      requires_attention, sender_matched,
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
    if (requires_attention === 'true') {
      conditions.push(`requires_attention = true`);
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
    const [queryCount, customerCount, migrations, enumValues, viewTest, columns] = await Promise.all([
      query(`SELECT COUNT(*)::int AS n FROM queries`),
      query(`SELECT COUNT(*)::int AS n FROM customers WHERE primary_email IS NOT NULL`),
      query(`SELECT filename, run_at FROM _migrations WHERE filename LIKE '07%' ORDER BY filename`),
      query(`SELECT unnest(enum_range(NULL::query_status))::text AS v`),
      query(`SELECT COUNT(*)::int AS n FROM queries_inbox_view`),
      query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'queries' ORDER BY ordinal_position`),
    ]);
    res.json({
      queries_count:        queryCount.rows[0].n,
      customers_with_email: customerCount.rows[0].n,
      migrations_run:       migrations.rows,
      query_status_values:  enumValues.rows.map(r => r.v),
      inbox_view_count:     viewTest.rows[0].n,
      queries_columns:      columns.rows.map(r => r.column_name),
    });
  } catch (err) { next(err); }
});

router.get('/seed-now', async (req, res, next) => seedNowHandler(req, res, next));
router.post('/seed-now', async (req, res, next) => seedNowHandler(req, res, next));
async function seedNowHandler(req, res, next) {
  try {
    // Get first 10 customers with email
    const customers = await query(
      `SELECT id, business_name, primary_email FROM customers
       WHERE primary_email IS NOT NULL
       ORDER BY account_number LIMIT 10`
    );

    if (customers.rows.length === 0) {
      return res.status(400).json({ error: 'No customers found in database' });
    }

    const scenarios = [
      { type: 'whereabouts',    status: 'open',                   subject: 'Where is my parcel?',                  attention: false, daysAgo: 10 },
      { type: 'not_delivered',  status: 'awaiting_courier',       subject: 'Parcel shows delivered but not received', attention: true, daysAgo: 9 },
      { type: 'damaged',        status: 'awaiting_customer_info', subject: 'Parcel arrived damaged',               attention: false, daysAgo: 8 },
      { type: 'missing_items',  status: 'awaiting_customer_info', subject: 'Items missing from my delivery',       attention: false, daysAgo: 7 },
      { type: 'other',          status: 'awaiting_courier',       subject: 'Parcel missing for 2 weeks — urgent',  attention: true,  daysAgo: 6 },
      { type: 'wrong_address',  status: 'awaiting_courier',       subject: 'Parcel delivered to wrong address',    attention: false, daysAgo: 5 },
      { type: 'delay',          status: 'courier_investigating',  subject: 'Parcel is 3 days late',                attention: false, daysAgo: 4 },
      { type: 'failed_delivery',status: 'open',                   subject: 'Delivery attempted — no card left',   attention: false, daysAgo: 3 },
      { type: 'returned',       status: 'awaiting_courier',       subject: 'Parcel returned — I never refused it', attention: false, daysAgo: 2 },
      { type: 'other',          status: 'claim_submitted',        subject: 'Lost parcel — formal claim required',  attention: false, daysAgo: 1 },
    ];

    const inserted = [];
    for (let i = 0; i < Math.min(customers.rows.length, scenarios.length); i++) {
      const c = customers.rows[i];
      const s = scenarios[i];
      const consNum = `15000000${String(i + 1).padStart(3, '0')}`;
      const createdAt = new Date(Date.now() - s.daysAgo * 86400000).toISOString();

      const qRes = await query(`
        INSERT INTO queries (
          consignment_number, customer_id, customer_name,
          courier_code, courier_name, service_code, service_name,
          trigger, query_type, status,
          subject, description,
          sender_email, sender_matched, requires_attention,
          created_at, updated_at
        ) VALUES ($1,$2,$3,'dpd','DPD','DPD-12','DPD Next Day',
          'customer_email'::query_trigger, $4::query_type, $5::query_status,
          $6, $6::text, $7, true, $8, $9, $9)
        RETURNING id
      `, [consNum, c.id, c.business_name, s.type, s.status, s.subject,
          c.primary_email, s.attention, createdAt]);

      const qid = qRes.rows[0].id;

      await query(`
        INSERT INTO query_emails (
          query_id, direction, subject, body_text,
          from_address, to_address, is_ai_draft, received_at, created_at
        ) VALUES ($1, 'inbound_customer'::email_direction, $2,
          'Practice query ' || $3 || ' — ' || $2,
          $4, 'queries@moovparcel.co.uk', false, $5, $5)
      `, [qid, s.subject, consNum, c.primary_email, createdAt]);

      inserted.push({ id: qid, consignment: consNum, customer: c.business_name, status: s.status });
    }

    res.json({ seeded: inserted.length, queries: inserted });
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
          COALESCE(SUM(pending_drafts) FILTER (WHERE status NOT IN ${RESOLVED}), 0) AS pending_drafts,
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
      pending_drafts:           parseInt(o.pending_drafts)        || 0,
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
               sent_at, received_at, created_at
        FROM query_emails
        WHERE query_id = $1
        ORDER BY created_at ASC
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

    res.status(201).json(result.rows[0]);
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
