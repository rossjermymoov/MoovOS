/**
 * Moov OS — Customer Management API
 * Covers: Section 1.1 – 1.11 of the Parcel Reseller OS Specification
 */

import express from 'express';
import multer from 'multer';
import pdfParse from 'pdf-parse/lib/pdf-parse.js';
import { query } from '../db/index.js';

const router = express.Router();

// ─── Helpers ────────────────────────────────────────────────

const ALLOWED_SORT_COLS = ['business_name', 'account_number', 'tier', 'account_status',
  'health_score', 'date_onboarded', 'outstanding_balance', 'credit_limit'];

function buildCustomerListQuery(filters = {}) {
  const {
    search, status, tier, health_score, account_manager_id,
    is_on_stop, has_bond, sort = 'business_name', order = 'asc', limit = 50, offset = 0
  } = filters;

  const col = ALLOWED_SORT_COLS.includes(sort) ? sort : 'business_name';
  const dir = order === 'desc' ? 'DESC' : 'ASC';

  let conditions = [];
  let values = [];
  let idx = 1;

  if (search) {
    conditions.push(`(
      c.business_name ILIKE $${idx} OR
      c.account_number ILIKE $${idx} OR
      c.primary_email ILIKE $${idx} OR
      c.postcode ILIKE $${idx} OR
      c.city ILIKE $${idx} OR
      EXISTS (
        SELECT 1 FROM customer_contacts cc2
        WHERE cc2.customer_id = c.id AND cc2.full_name ILIKE $${idx}
      )
    )`);
    values.push(`%${search}%`);
    idx++;
  }
  if (status)             { conditions.push(`c.account_status = $${idx++}`); values.push(status); }
  if (tier)               { conditions.push(`c.tier = $${idx++}`); values.push(tier); }
  if (health_score)       { conditions.push(`c.health_score = $${idx++}`); values.push(health_score); }
  if (account_manager_id) { conditions.push(`c.account_manager_id = $${idx++}`); values.push(account_manager_id); }
  if (is_on_stop !== undefined) {
    conditions.push(`c.is_on_stop = $${idx++}`);
    values.push(is_on_stop === 'true');
  }
  if (has_bond === 'true') {
    conditions.push(`c.bond_amount_held > 0`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const sql = `
    SELECT
      c.id, c.account_number, c.business_name, c.primary_email, c.phone_number,
      c.postcode, c.city, c.county, c.country,
      c.tier, c.account_status, c.health_score, c.is_on_stop,
      c.outstanding_balance, c.credit_limit, c.bond_amount_held, c.date_onboarded,
      c.billing_cycle, c.payment_terms_days, c.company_type,
      am.full_name AS account_manager_name,
      sp.full_name AS salesperson_name,
      (SELECT full_name FROM customer_contacts cc WHERE cc.customer_id = c.id AND cc.is_main_contact = true LIMIT 1) AS main_contact_name,
      (SELECT COUNT(*) FROM customer_communications cc WHERE cc.customer_id = c.id)::int AS comm_count,
      (
        COALESCE((
          SELECT SUM(ch.price)
          FROM charges ch
          WHERE ch.customer_id = c.id
            AND ch.verified = TRUE
            AND ch.billed = FALSE
            AND ch.cancelled = FALSE
            AND ch.price IS NOT NULL
        ), 0) / NULLIF(c.credit_limit, 0) * 100
      )::numeric(5,1) AS credit_utilisation_pct
    FROM customers c
    LEFT JOIN staff am ON am.id = c.account_manager_id
    LEFT JOIN staff sp ON sp.id = c.salesperson_id
    ${where}
    ORDER BY c.${col} ${dir}
    LIMIT $${idx++} OFFSET $${idx++}
  `;

  const countSql = `SELECT COUNT(*) FROM customers c ${where}`;

  return { sql, countSql, values, limitOffset: [limit, offset] };
}

// ─────────────────────────────────────────────────────────────
// GET /api/customers  — paginated list with filters
// ─────────────────────────────────────────────────────────────
router.get('/', async (req, res, next) => {
  try {
    const { sql, countSql, values, limitOffset } = buildCustomerListQuery(req.query);
    const [rows, countResult] = await Promise.all([
      query(sql, [...values, ...limitOffset]),
      query(countSql, values),
    ]);
    res.json({
      data: rows.rows,
      total: parseInt(countResult.rows[0].count, 10),
      limit: parseInt(req.query.limit || 50),
      offset: parseInt(req.query.offset || 0),
    });
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────
// GET /api/customers/:id  — full customer record
// ─────────────────────────────────────────────────────────────
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const [customerRes, contactsRes, commSummaryRes, volumeRes, alertRes] = await Promise.all([
      query(`
        SELECT
          c.*,
          am.full_name AS account_manager_name,
          sp.full_name AS salesperson_name,
          ob.full_name AS onboarding_person_name,
          (
        COALESCE((
          SELECT SUM(ch.price)
          FROM charges ch
          WHERE ch.customer_id = c.id
            AND ch.verified = TRUE
            AND ch.billed = FALSE
            AND ch.cancelled = FALSE
            AND ch.price IS NOT NULL
        ), 0) / NULLIF(c.credit_limit, 0) * 100
      )::numeric(5,1) AS credit_utilisation_pct
        FROM customers c
        LEFT JOIN staff am ON am.id = c.account_manager_id
        LEFT JOIN staff sp ON sp.id = c.salesperson_id
        LEFT JOIN staff ob ON ob.id = c.onboarding_person_id
        WHERE c.id = $1
      `, [id]),

      query(`
        SELECT * FROM customer_contacts WHERE customer_id = $1 ORDER BY is_main_contact DESC, full_name
      `, [id]),

      query(`
        SELECT * FROM customer_comm_summaries WHERE customer_id = $1
      `, [id]),

      // Last 90 days of volume snapshots for trend calculation
      query(`
        SELECT snapshot_date, parcel_count, revenue
        FROM customer_volume_snapshots
        WHERE customer_id = $1 AND snapshot_date >= NOW() - INTERVAL '90 days'
        ORDER BY snapshot_date DESC
      `, [id]),

      // Active volume drop alerts
      query(`
        SELECT * FROM customer_volume_alerts
        WHERE customer_id = $1 AND is_dismissed = false
        ORDER BY created_at DESC LIMIT 1
      `, [id]),
    ]);

    if (!customerRes.rows.length) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json({
      customer: customerRes.rows[0],
      contacts: contactsRes.rows,
      comm_summary: commSummaryRes.rows[0] || null,
      volume_snapshots: volumeRes.rows,
      active_volume_alert: alertRes.rows[0] || null,
    });
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────
// GET /api/customers/lookup/:accountNumber  — raw lookup by account number
// Returns the customer regardless of status — used for diagnostics.
// ─────────────────────────────────────────────────────────────
router.get('/lookup/:accountNumber', async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT id, business_name, account_number, account_status, dc_id, dc_customer_id, date_onboarded
       FROM customers WHERE UPPER(account_number) = UPPER($1)`,
      [req.params.accountNumber]
    );
    res.json({ count: rows.length, customers: rows });
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────
// POST /api/customers  — create customer
// ─────────────────────────────────────────────────────────────
router.post('/', async (req, res, next) => {
  try {
    const {
      business_name, address_line_1, address_line_2, city, county, postcode, country,
      phone_number, primary_email,
      company_type, company_reg_number, vat_number,
      tier, payment_terms_days = 7, billing_cycle = 'monthly', credit_limit = 0,
      accounts_email, eori_number, ioss_number,
      salesperson_id, account_manager_id, onboarding_person_id,
      account_number,   // optional — if supplied, overrides the auto-generated MOOV-XXXX
    } = req.body;

    if (!business_name || !postcode || !phone_number || !primary_email) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // If account_number is explicitly supplied, include it in the INSERT so the
    // DB trigger (which only fires when account_number IS NULL) leaves it alone.
    const accountNumberClause = account_number
      ? ', account_number'
      : '';
    const accountNumberParam = account_number
      ? ', $23'
      : '';

    const result = await query(`
      INSERT INTO customers (
        business_name, address_line_1, address_line_2, city, county, postcode, country,
        phone_number, primary_email,
        company_type, company_reg_number, vat_number,
        tier, payment_terms_days, billing_cycle, credit_limit,
        accounts_email, eori_number, ioss_number,
        salesperson_id, account_manager_id, onboarding_person_id${accountNumberClause}
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22${accountNumberParam})
      RETURNING *
    `, [
      business_name, address_line_1 || null, address_line_2 || null, city || null, county || null,
      postcode, country || 'United Kingdom', phone_number, primary_email,
      company_type || null, company_reg_number || null, vat_number || null,
      tier || 'bronze', payment_terms_days, billing_cycle, credit_limit,
      accounts_email || null, eori_number || null, ioss_number || null,
      salesperson_id || null, account_manager_id || null, onboarding_person_id || null,
      ...(account_number ? [account_number.trim().toUpperCase()] : []),
    ]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      if (err.constraint?.includes('account_number')) return res.status(409).json({ error: `Account number ${req.body.account_number} is already in use by another customer` });
      if (err.constraint?.includes('dc_id'))          return res.status(409).json({ error: `DC account number '${req.body.dc_id}' is already assigned to another customer` });
      return res.status(409).json({ error: `A customer with these details already exists (${err.constraint || 'unique constraint'})` });
    }
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────
// PATCH /api/customers/:id  — update customer
// ─────────────────────────────────────────────────────────────
router.patch('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const allowed = [
      'business_name', 'address_line_1', 'address_line_2', 'city', 'county', 'postcode', 'country',
      'phone_number', 'primary_email',
      'company_type', 'company_reg_number', 'vat_number',
      'tier', 'account_status', 'payment_terms_days', 'billing_cycle', 'credit_limit', 'bond_amount_held',
      'accounts_email', 'eori_number', 'ioss_number',
      'salesperson_id', 'account_manager_id', 'onboarding_person_id',
    ];
    const updates = Object.entries(req.body).filter(([k]) => allowed.includes(k));
    if (!updates.length) return res.status(400).json({ error: 'No valid fields to update' });

    const setClauses = updates.map(([k], i) => `${k} = $${i + 2}`).join(', ');
    const values = [id, ...updates.map(([, v]) => v)];

    const result = await query(
      `UPDATE customers SET ${setClauses}, updated_at = NOW() WHERE id = $1 RETURNING *`,
      values
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Customer not found' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────
// DELETE /api/customers/:id  — permanently delete a customer
// ─────────────────────────────────────────────────────────────
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await query(
      `DELETE FROM customers WHERE id = $1 RETURNING id, account_number, business_name`,
      [id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Customer not found' });
    res.json({ deleted: true, ...result.rows[0] });
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────
// POST /api/customers/:id/on-stop  — apply On Stop (Section 1.11)
// ─────────────────────────────────────────────────────────────
router.post('/:id/on-stop', async (req, res, next) => {
  const client = await (await import('../db/index.js')).getClient();
  try {
    const { id } = req.params;
    const { reason, staff_id } = req.body;

    if (!reason) {
      return res.status(400).json({ error: 'reason is required' });
    }

    await client.query('BEGIN');

    // Update customer
    const updated = await client.query(`
      UPDATE customers
      SET is_on_stop = true, account_status = 'on_stop',
          on_stop_reason = $2, on_stop_applied_at = NOW(),
          updated_at = NOW()
      WHERE id = $1 AND is_on_stop = false
      RETURNING *
    `, [id, reason]);

    if (!updated.rows.length) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Customer is already on stop or not found' });
    }

    // Audit log — only if a valid staff_id was supplied
    if (staff_id && staff_id !== 'CURRENT_USER_ID') {
      await client.query(`
        INSERT INTO customer_on_stop_log (customer_id, action, reason, actioned_by)
        VALUES ($1, 'applied', $2, $3)
      `, [id, reason, staff_id]);
    }

    await client.query('COMMIT');

    // TODO: trigger MoveNinja API call to block shipment access
    // moveninja.blockCustomer(updated.rows[0].account_number)

    res.json({ success: true, customer: updated.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
});

// ─────────────────────────────────────────────────────────────
// DELETE /api/customers/:id/on-stop  — remove On Stop
// Restricted: only Director, Manager, Finance Manager, CS Manager
// ─────────────────────────────────────────────────────────────
router.delete('/:id/on-stop', async (req, res, next) => {
  const client = await (await import('../db/index.js')).getClient();
  try {
    const { id } = req.params;
    const { note, staff_id } = req.body;

    if (!note) {
      return res.status(400).json({ error: 'note is required' });
    }

    await client.query('BEGIN');

    const updated = await client.query(`
      UPDATE customers
      SET is_on_stop = false, account_status = 'active',
          on_stop_reason = NULL, on_stop_applied_at = NULL,
          updated_at = NOW()
      WHERE id = $1 AND is_on_stop = true
      RETURNING *
    `, [id]);

    if (!updated.rows.length) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Customer is not on stop or not found' });
    }

    // Audit log — only if a valid staff_id was supplied
    if (staff_id && staff_id !== 'CURRENT_USER_ID') {
      await client.query(`
        INSERT INTO customer_on_stop_log (customer_id, action, reason, actioned_by)
        VALUES ($1, 'removed', $2, $3)
      `, [id, note, staff_id]);
    }

    await client.query('COMMIT');
    res.json({ success: true, customer: updated.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/customers/:id/on-stop/log
// ─────────────────────────────────────────────────────────────
router.get('/:id/on-stop/log', async (req, res, next) => {
  try {
    const result = await query(`
      SELECT l.*, s.full_name AS actioned_by_name
      FROM customer_on_stop_log l
      JOIN staff s ON s.id = l.actioned_by
      WHERE l.customer_id = $1
      ORDER BY l.actioned_at DESC
    `, [req.params.id]);
    res.json(result.rows);
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────
// GET /api/customers/:id/contacts
// ─────────────────────────────────────────────────────────────
router.get('/:id/contacts', async (req, res, next) => {
  try {
    const result = await query(
      'SELECT * FROM customer_contacts WHERE customer_id = $1 ORDER BY is_main_contact DESC, full_name',
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────
// POST /api/customers/:id/contacts
// ─────────────────────────────────────────────────────────────
router.post('/:id/contacts', async (req, res, next) => {
  const client = await (await import('../db/index.js')).getClient();
  try {
    const { id } = req.params;
    const { full_name, job_title, phone_number, email_address, is_main_contact, is_finance_contact } = req.body;

    if (!full_name || !email_address) {
      return res.status(400).json({ error: 'full_name and email_address are required' });
    }

    await client.query('BEGIN');

    // Clear existing flags if this contact will hold them (spec: only one per customer)
    if (is_main_contact) {
      await client.query(
        'UPDATE customer_contacts SET is_main_contact = false WHERE customer_id = $1',
        [id]
      );
    }
    if (is_finance_contact) {
      await client.query(
        'UPDATE customer_contacts SET is_finance_contact = false WHERE customer_id = $1',
        [id]
      );
    }

    const result = await client.query(`
      INSERT INTO customer_contacts
        (customer_id, full_name, job_title, phone_number, email_address, is_main_contact, is_finance_contact)
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      RETURNING *
    `, [id, full_name, job_title || null, phone_number || null, email_address,
        is_main_contact || false, is_finance_contact || false]);

    await client.query('COMMIT');
    res.status(201).json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
});

// ─────────────────────────────────────────────────────────────
// PATCH /api/customers/:id/contacts/:contactId
// ─────────────────────────────────────────────────────────────
router.patch('/:id/contacts/:contactId', async (req, res, next) => {
  const client = await (await import('../db/index.js')).getClient();
  try {
    const { id, contactId } = req.params;
    const allowed = ['full_name', 'job_title', 'phone_number', 'email_address', 'is_main_contact', 'is_finance_contact'];
    const sets = []; const vals = [];
    for (const k of allowed) {
      if (req.body[k] !== undefined) { vals.push(req.body[k]); sets.push(`${k}=$${vals.length}`); }
    }
    if (!sets.length) return res.json({});

    await client.query('BEGIN');
    // Enforce single-main and single-finance flags
    if (req.body.is_main_contact)    await client.query('UPDATE customer_contacts SET is_main_contact=false    WHERE customer_id=$1 AND id!=$2', [id, contactId]);
    if (req.body.is_finance_contact) await client.query('UPDATE customer_contacts SET is_finance_contact=false WHERE customer_id=$1 AND id!=$2', [id, contactId]);

    vals.push(contactId);
    const { rows } = await client.query(
      `UPDATE customer_contacts SET ${sets.join(',')} WHERE id=$${vals.length} AND customer_id=$${vals.length + 1} RETURNING *`,
      [...vals, id]
    );
    await client.query('COMMIT');
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) { await client.query('ROLLBACK'); next(err); }
  finally { client.release(); }
});

// ─────────────────────────────────────────────────────────────
// DELETE /api/customers/:id/contacts/:contactId
// ─────────────────────────────────────────────────────────────
router.delete('/:id/contacts/:contactId', async (req, res, next) => {
  try {
    await query('DELETE FROM customer_contacts WHERE id=$1 AND customer_id=$2', [req.params.contactId, req.params.id]);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────
// GET /api/customers/:id/communications
// ─────────────────────────────────────────────────────────────
router.get('/:id/communications', async (req, res, next) => {
  try {
    const { limit = 50, offset = 0, channel } = req.query;
    let sql = `
      SELECT cc.*, s.full_name AS staff_name
      FROM customer_communications cc
      LEFT JOIN staff s ON s.id = cc.staff_id
      WHERE cc.customer_id = $1
    `;
    const values = [req.params.id];
    if (channel) { sql += ` AND cc.channel = $2`; values.push(channel); }
    sql += ` ORDER BY cc.created_at DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`;
    values.push(limit, offset);

    const result = await query(sql, values);
    res.json(result.rows);
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────
// GET /api/customers/:id/correspondence
// Unified correspondence: query emails + customer_communications
// Most recent first, suitable for the Communications tab on the customer record.
// ─────────────────────────────────────────────────────────────

router.get('/:id/correspondence', async (req, res, next) => {
  try {
    const { limit = 100, offset = 0 } = req.query;
    const { id } = req.params;

    const result = await query(`
      SELECT
        'query_email'                  AS source,
        qe.id,
        qe.direction::text             AS direction,
        qe.subject,
        qe.body_text,
        qe.from_address,
        qe.to_address,
        q.id                           AS query_id,
        q.consignment_number,
        q.query_type::text             AS query_type,
        q.status::text                 AS query_status,
        q.courier_name,
        q.courier_code,
        NULL::text                     AS channel,
        qe.created_at
      FROM query_emails qe
      JOIN queries q ON q.id = qe.query_id
      WHERE q.customer_id = $1
        AND (qe.is_ai_draft = false OR qe.sent_at IS NOT NULL)

      UNION ALL

      SELECT
        'communication'                AS source,
        cc.id,
        cc.direction::text             AS direction,
        cc.subject,
        cc.body                        AS body_text,
        cc.from_address,
        NULL::text                     AS to_address,
        NULL::uuid                     AS query_id,
        NULL::text                     AS consignment_number,
        NULL::text                     AS query_type,
        NULL::text                     AS query_status,
        NULL::text                     AS courier_name,
        NULL::text                     AS courier_code,
        cc.channel::text               AS channel,
        cc.created_at
      FROM customer_communications cc
      WHERE cc.customer_id = $1

      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `, [id, parseInt(limit), parseInt(offset)]);

    res.json(result.rows);
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────
// GET /api/customers/:id/volume  — Section 1.5 period totals
// ─────────────────────────────────────────────────────────────
router.get('/:id/volume', async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await query(`
      SELECT
        -- Today
        COALESCE(SUM(CASE WHEN snapshot_date = CURRENT_DATE THEN parcel_count END), 0)                        AS today_parcels,
        COALESCE(SUM(CASE WHEN snapshot_date >= CURRENT_DATE - 6 THEN parcel_count END), 0)                   AS last_7_days_parcels,
        COALESCE(SUM(CASE WHEN snapshot_date >= CURRENT_DATE - 29 THEN parcel_count END), 0)                  AS last_30_days_parcels,
        -- 13-week rolling average (daily avg over 91 days)
        ROUND(
          COALESCE(SUM(CASE WHEN snapshot_date >= CURRENT_DATE - 90 THEN parcel_count END), 0)::numeric / 91,
          1
        )                                                                                                       AS rolling_13wk_daily_avg,
        -- YTD
        COALESCE(SUM(CASE WHEN EXTRACT(YEAR FROM snapshot_date) = EXTRACT(YEAR FROM CURRENT_DATE)
                          THEN parcel_count END), 0)                                                           AS ytd_parcels,
        -- All time
        COALESCE(SUM(parcel_count), 0)                                                                         AS all_time_parcels,
        -- Revenue mirrors
        COALESCE(SUM(CASE WHEN snapshot_date = CURRENT_DATE THEN revenue END), 0)                             AS today_revenue,
        COALESCE(SUM(CASE WHEN snapshot_date >= CURRENT_DATE - 29 THEN revenue END), 0)                       AS last_30_days_revenue
      FROM customer_volume_snapshots
      WHERE customer_id = $1
    `, [id]);

    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────
// POST /api/customers/:id/volume-alerts/:alertId/dismiss
// ─────────────────────────────────────────────────────────────
router.post('/:id/volume-alerts/:alertId/dismiss', async (req, res, next) => {
  try {
    const { alertId } = req.params;
    const { note, staff_id } = req.body;
    if (!note || !staff_id) return res.status(400).json({ error: 'note and staff_id are required' });

    const result = await query(`
      UPDATE customer_volume_alerts
      SET is_dismissed = true, dismissed_by = $2, dismissed_at = NOW(), dismissal_note = $3
      WHERE id = $1 AND is_dismissed = false
      RETURNING *
    `, [alertId, staff_id, note]);

    if (!result.rows.length) return res.status(404).json({ error: 'Alert not found or already dismissed' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────
// Customer service selections (which carrier services are visible)
// ─────────────────────────────────────────────────────────────

// GET /api/customers/:id/services  — returns selected courier_service_ids
router.get('/:id/services', async (req, res, next) => {
  try {
    const result = await query(
      `SELECT cs.courier_service_id,
              csvc.name          AS service_name,
              csvc.service_code  AS service_code,
              c.name             AS courier_name,
              c.id               AS courier_id
       FROM customer_services cs
       JOIN courier_services csvc ON csvc.id = cs.courier_service_id
       JOIN couriers c ON c.id = csvc.courier_id
       WHERE cs.customer_id = $1
       ORDER BY c.name, csvc.sort_order NULLS LAST, csvc.name`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) { next(err); }
});

// POST /api/customers/:id/services  — add a service selection
router.post('/:id/services', async (req, res, next) => {
  try {
    const { courier_service_id } = req.body;
    if (!courier_service_id) return res.status(400).json({ error: 'courier_service_id is required' });
    const result = await query(
      `INSERT INTO customer_services (customer_id, courier_service_id)
       VALUES ($1, $2)
       ON CONFLICT (customer_id, courier_service_id) DO NOTHING
       RETURNING *`,
      [req.params.id, courier_service_id]
    );
    res.status(201).json(result.rows[0] || { already_exists: true });
  } catch (err) { next(err); }
});

// DELETE /api/customers/:id/services/:serviceId  — remove a service selection
router.delete('/:id/services/:serviceId', async (req, res, next) => {
  try {
    await query(
      `DELETE FROM customer_services
       WHERE customer_id = $1 AND courier_service_id = $2`,
      [req.params.id, req.params.serviceId]
    );
    res.json({ deleted: true });
  } catch (err) { next(err); }
});

// ─── PDF Text Extraction ─────────────────────────────────────────────────────

// Memory-only upload — no files written to disk
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB max
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Only PDF files are accepted'));
  },
});

// POST /api/customers/parse-pdf
// Accepts a multipart PDF upload, returns { text } with extracted content.
router.post('/parse-pdf', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No PDF file uploaded' });
    // pdf-parse v1: function-based API
    const data = await pdfParse(req.file.buffer);
    res.json({ text: data.text || '', pages: data.numpages });
  } catch (err) { next(err); }
});

// ─── AI-Assisted Onboarding ──────────────────────────────────────────────────

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const AI_MODEL = 'claude-haiku-4-5-20251001';

async function callAI(systemPrompt, userContent) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: AI_MODEL,
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: userContent }],
    }),
  });
  if (!response.ok) throw new Error(`Anthropic API error: ${response.status}`);
  const data = await response.json();
  const text = data.content?.[0]?.text ?? '';
  // Extract JSON from response (may be wrapped in markdown code block)
  const match = text.match(/```json\s*([\s\S]*?)```/i) || text.match(/(\{[\s\S]*\})/);
  if (!match) throw new Error('AI returned no parseable JSON');
  return JSON.parse(match[1]);
}

// POST /api/customers/ai-extract
// Takes application_form_text, returns structured customer + contact data
router.post('/ai-extract', async (req, res, next) => {
  try {
    const { application_form_text } = req.body;
    if (!application_form_text) return res.status(400).json({ error: 'application_form_text required' });

    const system = `You are a data extraction assistant for a UK parcel courier reseller.
Extract structured business information from a customer application form.
Respond with ONLY valid JSON in this exact structure:
{
  "customer": {
    "business_name": "",
    "company_type": "limited_company|partnership|sole_trader",
    "company_reg_number": "",
    "vat_number": "",
    "address_line_1": "",
    "address_line_2": "",
    "city": "",
    "county": "",
    "postcode": "",
    "country": "United Kingdom",
    "phone_number": "",
    "primary_email": "",
    "accounts_email": "",
    "eori_number": "",
    "ioss_number": "",
    "credit_limit": 0,
    "billing_cycle": "weekly|fortnightly|monthly",
    "payment_terms_days": 30,
    "tier": "bronze|silver|gold|enterprise"
  },
  "contact": {
    "full_name": "",
    "job_title": "",
    "email_address": "",
    "phone_number": "",
    "is_main_contact": true,
    "is_finance_contact": false
  }
}
Rules:
- Use empty string "" for any field not found in the form
- For credit_limit: extract numeric value in £, default 0 if not found
- For billing_cycle: infer from payment terms text (weekly/fortnightly/monthly), default "monthly"
- For payment_terms_days: extract numeric days (7, 14, 28, 30), default 30
- For tier: infer from volume/spend level if mentioned (bronze=low, silver=mid, gold=high, enterprise=very high), default "bronze"
- For company_type: infer from "Ltd"→limited_company, "LLP"/"Partnership"→partnership, "Sole Trader"→sole_trader, default "limited_company"
- Postcodes must be uppercase UK format
- Phone numbers in UK format starting with 0 or +44`;

    const result = await callAI(system, `Extract data from this application form:\n\n${application_form_text}`);
    res.json(result);
  } catch (err) { next(err); }
});

// POST /api/customers/ai-extract-rates
// Takes rate_card_text, returns array of rate rows
router.post('/ai-extract-rates', async (req, res, next) => {
  try {
    const { rate_card_text } = req.body;
    if (!rate_card_text) return res.status(400).json({ error: 'rate_card_text required' });

    // Fetch existing service codes from DB to help the AI match
    const servicesRes = await query(`
      SELECT DISTINCT cs.service_code, cs.name AS service_name, c.name AS courier_name
      FROM courier_services cs
      JOIN couriers c ON c.id = cs.courier_id
      ORDER BY cs.service_code
      LIMIT 200
    `);
    const existingServices = servicesRes.rows.map(r =>
      `${r.service_code} (${r.service_name}) — ${r.courier_name}`
    ).join('\n');

    // Fetch carrier zones per service so AI uses exact zone names
    const zonesRes = await query(`
      SELECT cs.service_code, z.name AS zone_name
      FROM zones z
      JOIN courier_services cs ON cs.id = z.courier_service_id
      ORDER BY cs.service_code, z.name
    `);
    const zonesByService = {};
    for (const row of zonesRes.rows) {
      if (!zonesByService[row.service_code]) zonesByService[row.service_code] = [];
      zonesByService[row.service_code].push(row.zone_name);
    }
    const zonesBlock = Object.entries(zonesByService)
      .map(([code, zones]) => `${code}: ${zones.join(', ')}`)
      .join('\n');

    const system = `You are a data extraction assistant for a UK parcel courier reseller.
Extract pricing data from a rate card document.

KNOWN SERVICE CODES IN OUR SYSTEM:
${existingServices || '(none yet — use your best guess based on carrier and service name)'}

AVAILABLE ZONES PER SERVICE (you MUST use these exact zone names — map the rate card zone to the closest match):
${zonesBlock || '(none defined yet)'}

Respond with ONLY valid JSON:
{
  "rates": [
    {
      "service_code": "e.g. DPD-NX",
      "service_name": "e.g. DPD Next Day",
      "courier_name": "e.g. DPD",
      "zone_name": "e.g. UK Mainland",
      "weight_class_name": "e.g. 0-5kg",
      "min_weight_kg": 0,
      "max_weight_kg": 5,
      "price": 6.50,
      "price_sub": null
    }
  ]
}
Rules:
- Extract EVERY pricing row from the rate card as a separate entry
- service_code: match to KNOWN SERVICE CODES above; otherwise construct as CARRIER-ABBREV (e.g. DPD Next Day → DPD-NX)
- zone_name: MUST exactly match one of the zone names from AVAILABLE ZONES for that service. Map intelligently (e.g. "Republic of Ireland" → "Ireland"). If a service has no zones defined, use the zone name from the rate card.

CRITICAL — weight bands vs flat rate:
- A "Max Weight" column (e.g. "Max Weight: 30kg") is a SERVICE LIMIT only. It is NOT a pricing tier. Do NOT create weight bands from it.
- Only create multiple weight-band rows (different min/max values) if the rate card shows EXPLICITLY DIFFERENT PRICES for different weight ranges for the same service and zone (e.g. separate rows for 0-5kg at £X and 5-10kg at £Y).
- If there is ONE price per service/zone (with or without a max weight limit), use weight_class_name="Parcel", min_weight_kg=null, max_weight_kg=null. "FlatRate" does NOT exist — always use "Parcel" for single-price zones.
- NEVER use 999, 30, or any other number as max_weight_kg just because a "Max Weight" column exists. That value is a service limit, not a band boundary.
- Most standard courier rate cards have one price per service per zone. Use weight_class_name="Parcel" with null min/max for all of them unless you see explicitly different prices for different weight ranges.

- price: the sell price in £ as a decimal number (do NOT include £ symbol)
- price_sub: price per additional parcel in same consignment (the "Sub" or "Sub Boxes" column), or null if not specified
- All prices as numeric values, not strings`;

    const result = await callAI(system, `Extract rate card pricing from this document:\n\n${rate_card_text}`);
    res.json(result);
  } catch (err) { next(err); }
});

// POST /api/customers/ai-onboard
// Creates customer + contact + rates in one transaction
router.post('/ai-onboard', async (req, res, next) => {
  try {
    const { customer: cd, contact: co, rates = [] } = req.body;

    if (!cd?.business_name) return res.status(400).json({ error: 'business_name required' });

    // ─── 1. Create customer record ────────────────────────────────
    // account_number: if cd.account_number is supplied, include it explicitly so
    // the DB trigger (which only fires when account_number IS NULL) leaves it alone.
    const acctCol   = cd.account_number ? ', account_number' : '';
    const acctParam = cd.account_number ? ', $20' : '';

    const custRes = await query(`
      INSERT INTO customers (
        business_name, company_type, company_reg_number, vat_number,
        address_line_1, address_line_2, city, county, postcode, country,
        phone_number, primary_email, accounts_email, eori_number, ioss_number,
        tier, credit_limit, billing_cycle, payment_terms_days,
        account_status, vat_enabled${acctCol}
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,
        $16,$17,$18,$19,'active',true${acctParam}
      ) RETURNING *
    `, [
      cd.business_name,
      cd.company_type || 'limited_company',
      cd.company_reg_number || null,
      cd.vat_number || null,
      cd.address_line_1 || null,
      cd.address_line_2 || null,
      cd.city || null,
      cd.county || null,
      cd.postcode || null,
      cd.country || 'United Kingdom',
      cd.phone_number || null,
      cd.primary_email || null,
      cd.accounts_email || null,
      cd.eori_number || null,
      cd.ioss_number || null,
      cd.tier || 'bronze',
      parseFloat(cd.credit_limit) || 0,
      cd.billing_cycle || 'monthly',
      parseInt(cd.payment_terms_days) || 30,
      // dc_customer_id is kept in sync with account_number automatically by the
      // trg_customer_dc_id_sync DB trigger (migration 203) — no need to pass it here.
      ...(cd.account_number ? [cd.account_number.trim().toUpperCase()] : []),
    ]);
    const customer = custRes.rows[0];

    // ─── 2. Create primary contact ─────────────────────────────────
    if (co?.full_name) {
      await query(`
        INSERT INTO customer_contacts
          (customer_id, full_name, job_title, email_address, phone_number,
           is_main_contact, is_finance_contact)
        VALUES ($1,$2,$3,$4,$5,$6,$7)
      `, [
        customer.id,
        co.full_name,
        co.job_title || null,
        co.email_address || null,
        co.phone_number || null,
        co.is_main_contact !== false,
        co.is_finance_contact === true,
      ]);
    }

    // ─── 3. Insert customer rates ──────────────────────────────────
    const rateResults = { inserted: 0, skipped: [] };

    for (const rate of rates) {
      const { service_code, service_name, courier_name, zone_name,
              weight_class_name, min_weight_kg, max_weight_kg, price, price_sub } = rate;

      if (!service_code || !zone_name || price == null) {
        rateResults.skipped.push({ rate, reason: 'missing service_code, zone_name, or price' });
        continue;
      }

      // Resolve service and courier IDs from DB
      const svcRes = await query(`
        SELECT cs.id AS service_id, cs.courier_id, cs.service_code, cs.name AS service_name,
               c.code AS courier_code, c.name AS courier_name_db
        FROM courier_services cs
        JOIN couriers c ON c.id = cs.courier_id
        WHERE cs.service_code ILIKE $1
        LIMIT 1
      `, [service_code]);

      if (!svcRes.rows.length) {
        rateResults.skipped.push({ rate, reason: `service_code '${service_code}' not found in DB` });
        continue;
      }

      const svc = svcRes.rows[0];

      // Validate zone_name against actual carrier zones for this service.
      // If the AI used a name from the rate card (e.g. "Republic of Ireland") that
      // doesn't match a carrier zone (e.g. "Ireland"), resolve it to the correct name.
      let resolvedZoneName = zone_name;
      const carrierZonesRes = await query(
        `SELECT name FROM zones WHERE courier_service_id = $1 ORDER BY name`,
        [svc.service_id]
      );
      if (carrierZonesRes.rows.length) {
        const carrierZones = carrierZonesRes.rows.map(r => r.name);
        // Exact match (case-insensitive)
        const exactMatch = carrierZones.find(z => z.toLowerCase() === zone_name.toLowerCase());
        if (exactMatch) {
          resolvedZoneName = exactMatch;
        } else {
          // Fuzzy: carrier zone name is contained in the AI zone name, or vice versa
          const fuzzyMatch = carrierZones.find(z =>
            zone_name.toLowerCase().includes(z.toLowerCase()) ||
            z.toLowerCase().includes(zone_name.toLowerCase())
          );
          if (fuzzyMatch) {
            resolvedZoneName = fuzzyMatch;
            console.log(`[ai-onboard] zone fuzzy-matched: "${zone_name}" → "${fuzzyMatch}" for ${svc.service_code}`);
          } else {
            rateResults.skipped.push({ rate, reason: `zone "${zone_name}" not found for service ${svc.service_code} — available: ${carrierZones.join(', ')}` });
            continue;
          }
        }
      }
      // (If no carrier zones are defined for this service, allow any zone name through)

      // Resolve weight_class_name: if the AI defaulted to 'Parcel' but this
      // customer already has rates for this service with a different weight class
      // (e.g. 'Packet' from a manual import), use that existing name instead.
      // This prevents creating duplicate Parcel rows alongside real weight classes.
      let resolvedWeightClass = weight_class_name || 'Parcel';
      if (resolvedWeightClass.toLowerCase() === 'parcel') {
        const existingWcRes = await query(`
          SELECT DISTINCT weight_class_name FROM customer_rates
          WHERE customer_id = $1 AND service_id = $2 AND zone_name = $3
            AND weight_class_name NOT ILIKE 'Parcel'
          LIMIT 1
        `, [customer.id, svc.service_id, resolvedZoneName]);
        if (existingWcRes.rows.length) {
          resolvedWeightClass = existingWcRes.rows[0].weight_class_name;
          console.log(`[ai-onboard] weight class resolved: Parcel → "${resolvedWeightClass}" for ${svc.service_code} / ${resolvedZoneName}`);
        }
      }

      try {
        await query(`
          INSERT INTO customer_rates
            (customer_id, courier_id, courier_code, courier_name,
             service_id, service_code, service_name,
             zone_name, weight_class_name,
             min_weight_kg, max_weight_kg,
             price, price_sub)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
          ON CONFLICT (customer_id, service_id, zone_name)
          DO UPDATE SET
            price              = EXCLUDED.price,
            price_sub          = EXCLUDED.price_sub,
            weight_class_name  = EXCLUDED.weight_class_name
        `, [
          customer.id,
          svc.courier_id,
          svc.courier_code,
          svc.courier_name_db,
          svc.service_id,
          svc.service_code,
          service_name || svc.service_name,
          resolvedZoneName,
          resolvedWeightClass,
          min_weight_kg ?? null,
          max_weight_kg ?? null,
          parseFloat(price),
          price_sub != null ? parseFloat(price_sub) : null,
        ]);
        rateResults.inserted++;
      } catch (rateErr) {
        rateResults.skipped.push({ rate, reason: rateErr.message });
      }
    }

    // ─── Auto-fill missing carrier zones ──────────────────────────────────────
    // The AI typically extracts only the zones listed on the rate card (often
    // just Zone A). For services where the carrier has more zones defined,
    // replicate the extracted rate to every missing zone using the same price.
    // This ensures the customer's rate card always mirrors the carrier's full
    // zone structure. We copy price from the first existing zone rate found for
    // that customer+service.
    try {
      const servicesWithRates = await query(`
        SELECT DISTINCT service_id FROM customer_rates WHERE customer_id = $1
      `, [customer.id]);

      for (const { service_id } of servicesWithRates.rows) {
        // Get all carrier zones for this service
        const carrierZones = await query(`
          SELECT name FROM zones WHERE courier_service_id = $1 ORDER BY name
        `, [service_id]);
        if (!carrierZones.rows.length) continue;

        // Get existing rate rows for this customer+service (use first as price template)
        const existingRates = await query(`
          SELECT * FROM customer_rates
          WHERE customer_id = $1 AND service_id = $2
          ORDER BY zone_name LIMIT 1
        `, [customer.id, service_id]);
        if (!existingRates.rows.length) continue;

        const template = existingRates.rows[0];

        // Get zones already covered
        const coveredZones = await query(`
          SELECT zone_name FROM customer_rates WHERE customer_id = $1 AND service_id = $2
        `, [customer.id, service_id]);
        const covered = new Set(coveredZones.rows.map(r => r.zone_name.toLowerCase()));

        for (const { name: zoneName } of carrierZones.rows) {
          if (covered.has(zoneName.toLowerCase())) continue;
          // Insert missing zone using template pricing
          await query(`
            INSERT INTO customer_rates
              (customer_id, courier_id, courier_code, courier_name,
               service_id, service_code, service_name,
               zone_name, weight_class_name,
               min_weight_kg, max_weight_kg,
               price, price_sub)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
            ON CONFLICT (customer_id, service_id, zone_name) DO NOTHING
          `, [
            customer.id,
            template.courier_id,
            template.courier_code,
            template.courier_name,
            template.service_id,
            template.service_code,
            template.service_name,
            zoneName,
            template.weight_class_name,
            template.min_weight_kg,
            template.max_weight_kg,
            template.price,
            template.price_sub,
          ]);
          rateResults.inserted++;
        }
      }
    } catch (zoneErr) {
      console.warn('[ai-onboard] zone fill-out error (non-fatal):', zoneErr.message);
    }

    res.status(201).json({ customer, rates: rateResults });
  } catch (err) {
    if (err.code === '23505') {
      const { dc_id, customer: cd } = req.body;
      // Return full diagnostic detail so we can see exactly which constraint fired
      return res.status(409).json({
        error: `Duplicate value — ${err.detail || err.message}`,
        constraint: err.constraint || null,
        detail: err.detail || null,
        account_number_attempted: cd?.account_number || null,
        dc_id_attempted: dc_id || null,
      });
    }
    next(err);
  }
});

// ─── DDP Mode & Service Code Overrides ───────────────────────────────────────
//
// Customers who ship exclusively DDP (duty-paid) have their standard air invoice
// codes (e.g. "Air Express") redirected to DDP rate-card variants (e.g. DPD-10DDP)
// by the reconciliation engine. The overrides are stored as per-customer entries in
// courier_service_code_mappings. The ddp_mode flag on the customer signals that these
// entries were created via the DDP toggle rather than added manually.
//
// GET    /api/customers/:id/service-code-overrides
//   Returns all active per-customer service code mappings for this customer,
//   joined with the courier service details so the UI can display them.
//
// POST   /api/customers/:id/service-code-overrides
//   Upsert a single mapping: { carrier_id, courier_code, service_id }.
//
// DELETE /api/customers/:id/service-code-overrides/:mappingId
//   Deactivate a per-customer mapping (is_active = false).
//
// PUT    /api/customers/:id/companion-parcel-billing
//   Enable or disable companion parcel billing for a customer.
//   When enabled, the reconciliation engine finds companion charges that share
//   the same customer reference and booking date as a master parcel and
//   reconciles them automatically as companion_parcel lines.
//   Body: { enabled: bool }

router.put('/:id/companion-parcel-billing', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { enabled } = req.body;
    if (typeof enabled !== 'boolean') {
      return res.status(400).json({ error: 'enabled (boolean) is required' });
    }
    await query(
      `UPDATE customers SET reconciliation_flexible_parcel_count = $1 WHERE id = $2`,
      [enabled, id]
    );
    return res.json({ reconciliation_flexible_parcel_count: enabled });
  } catch (err) {
    next(err);
  }
});

// PUT    /api/customers/:id/ddp-mode
//   Enable or disable DDP mode for a customer.
//   When enabling: auto-creates Air Express → DPD-10DDP and Air Classic → DPD-60DDP
//   mappings for each carrier that has both the standard and DDP service defined.
//   When disabling: deactivates all DDP mappings created via this toggle.
//   Body: { enabled: bool }

router.get('/:id/service-code-overrides', async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await query(`
      SELECT
        m.id,
        m.carrier_id,
        co.name                   AS carrier_name,
        m.courier_code,
        m.service_id,
        cs.service_code,
        cs.name                   AS service_name,
        m.notes,
        m.is_active,
        m.created_at
      FROM   courier_service_code_mappings m
      JOIN   couriers        co ON co.id = m.carrier_id
      LEFT JOIN courier_services cs ON cs.id = m.service_id
      WHERE  m.customer_id = $1
        AND  m.is_active   = true
      ORDER  BY co.name, m.courier_code
    `, [id]);
    res.json({ overrides: result.rows });
  } catch (err) { next(err); }
});

router.post('/:id/service-code-overrides', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { carrier_id, courier_code, service_id, notes } = req.body;
    if (!carrier_id || !courier_code || !service_id) {
      return res.status(400).json({ error: 'carrier_id, courier_code and service_id are required' });
    }

    // Manual upsert on partial index (customer_id IS NOT NULL unique constraint)
    const existing = await query(`
      SELECT id FROM courier_service_code_mappings
      WHERE  carrier_id   = $1
        AND  courier_code = $2
        AND  customer_id  = $3
    `, [carrier_id, courier_code.trim(), id]);

    let mapping;
    if (existing.rows.length > 0) {
      const upd = await query(`
        UPDATE courier_service_code_mappings
        SET    service_id = $1, is_active = true, notes = $2
        WHERE  id = $3
        RETURNING *
      `, [service_id, notes || null, existing.rows[0].id]);
      mapping = upd.rows[0];
    } else {
      const ins = await query(`
        INSERT INTO courier_service_code_mappings
          (carrier_id, courier_code, service_id, customer_id, notes, is_active)
        VALUES ($1, $2, $3, $4, $5, true)
        RETURNING *
      `, [carrier_id, courier_code.trim(), service_id, id, notes || null]);
      mapping = ins.rows[0];
    }

    res.status(201).json({ mapping });
  } catch (err) { next(err); }
});

router.delete('/:id/service-code-overrides/:mappingId', async (req, res, next) => {
  try {
    const { id, mappingId } = req.params;
    await query(`
      UPDATE courier_service_code_mappings
      SET    is_active = false
      WHERE  id = $1 AND customer_id = $2
    `, [mappingId, id]);
    res.json({ success: true });
  } catch (err) { next(err); }
});

// DDP convenience toggle — sets ddp_mode and auto-creates/deactivates the standard
// DDP override pairs (Air Express → DPD-10DDP, Air Classic → DPD-60DDP).
router.put('/:id/ddp-mode', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { enabled } = req.body;
    if (typeof enabled !== 'boolean') {
      return res.status(400).json({ error: 'enabled (boolean) is required' });
    }

    if (!enabled) {
      // Disable: deactivate all mappings flagged with notes='ddp_toggle'
      await query(`
        UPDATE courier_service_code_mappings
        SET    is_active = false
        WHERE  customer_id = $1 AND notes = 'ddp_toggle'
      `, [id]);
      await query(`UPDATE customers SET ddp_mode = false WHERE id = $1`, [id]);
      return res.json({ ddp_mode: false, deactivated: true });
    }

    // Enable: find all carriers that have both a standard air service and a DDP
    // variant and create per-customer overrides for this customer.
    //
    // Convention: DDP services have service_code ending in 'DDP'.
    // Standard-to-DDP pairs are derived by matching service_code + 'DDP' to an
    // existing service. e.g. DPD-10 → DPD-10DDP.
    //
    // We also load the global service code mappings for this carrier to find the
    // invoice codes (courier_codes) that currently map to the standard services,
    // then redirect those codes to the DDP service IDs.
    const pairsRes = await query(`
      SELECT
        std.courier_id      AS carrier_id,
        std.id              AS std_service_id,
        std.service_code    AS std_code,
        ddp.id              AS ddp_service_id,
        ddp.service_code    AS ddp_code,
        -- Invoice codes that currently map to the standard service (global, no customer)
        ARRAY_AGG(DISTINCT m.courier_code)  AS invoice_codes
      FROM   courier_services std
      JOIN   courier_services ddp
             ON  ddp.courier_id   = std.courier_id
             AND ddp.service_code = std.service_code || 'DDP'
      LEFT JOIN courier_service_code_mappings m
             ON  m.carrier_id   = std.courier_id
             AND m.service_id   = std.id
             AND m.customer_id  IS NULL
             AND m.is_active    = true
      GROUP  BY std.courier_id, std.id, std.service_code, ddp.id, ddp.service_code
      HAVING COUNT(m.courier_code) > 0
    `);

    const created = [];
    for (const pair of pairsRes.rows) {
      for (const invoiceCode of (pair.invoice_codes || [])) {
        if (!invoiceCode) continue;
        // Upsert the per-customer mapping
        const existing = await query(`
          SELECT id FROM courier_service_code_mappings
          WHERE  carrier_id   = $1
            AND  courier_code = $2
            AND  customer_id  = $3
        `, [pair.carrier_id, invoiceCode, id]);

        if (existing.rows.length > 0) {
          await query(`
            UPDATE courier_service_code_mappings
            SET    service_id = $1, is_active = true, notes = 'ddp_toggle'
            WHERE  id = $2
          `, [pair.ddp_service_id, existing.rows[0].id]);
        } else {
          await query(`
            INSERT INTO courier_service_code_mappings
              (carrier_id, courier_code, service_id, customer_id, notes, is_active)
            VALUES ($1, $2, $3, $4, 'ddp_toggle', true)
          `, [pair.carrier_id, invoiceCode, pair.ddp_service_id, id]);
        }
        created.push({ carrier_id: pair.carrier_id, invoice_code: invoiceCode, std_code: pair.std_code, ddp_code: pair.ddp_code });
      }
    }

    await query(`UPDATE customers SET ddp_mode = true WHERE id = $1`, [id]);
    res.json({ ddp_mode: true, created });
  } catch (err) { next(err); }
});

export default router;
