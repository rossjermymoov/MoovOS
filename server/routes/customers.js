/**
 * Moov OS — Customer Management API
 * Covers: Section 1.1 – 1.11 of the Parcel Reseller OS Specification
 */

import express from 'express';
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
      (c.outstanding_balance / NULLIF(c.credit_limit, 0) * 100)::numeric(5,1) AS credit_utilisation_pct
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
          (c.outstanding_balance / NULLIF(c.credit_limit, 0) * 100)::numeric(5,1) AS credit_utilisation_pct
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
    } = req.body;

    if (!business_name || !postcode || !phone_number || !primary_email) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await query(`
      INSERT INTO customers (
        business_name, address_line_1, address_line_2, city, county, postcode, country,
        phone_number, primary_email,
        company_type, company_reg_number, vat_number,
        tier, payment_terms_days, billing_cycle, credit_limit,
        accounts_email, eori_number, ioss_number,
        salesperson_id, account_manager_id, onboarding_person_id
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22)
      RETURNING *
    `, [
      business_name, address_line_1 || null, address_line_2 || null, city || null, county || null,
      postcode, country || 'United Kingdom', phone_number, primary_email,
      company_type || null, company_reg_number || null, vat_number || null,
      tier || 'bronze', payment_terms_days, billing_cycle, credit_limit,
      accounts_email || null, eori_number || null, ioss_number || null,
      salesperson_id || null, account_manager_id || null, onboarding_person_id || null,
    ]);

    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
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

export default router;
