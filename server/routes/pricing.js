/**
 * Pricing routes — prospects, rate card templates, approvals
 * Base: /api/pricing
 */
import express from 'express';
import crypto from 'crypto';
import { query } from '../db/index.js';

const router = express.Router();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calcProjections(rates, volumeMix, weeklyParcels) {
  if (!weeklyParcels || !volumeMix?.length) return { revenue: null, cost: null, profit: null };
  let revenue = 0, cost = 0;
  for (const mix of volumeMix) {
    const rate = rates.find(r => r.service_code === mix.service_code);
    if (!rate) continue;
    const qty   = Math.round((mix.pct / 100) * weeklyParcels);
    revenue    += (parseFloat(rate.price      || 0)) * qty;
    cost       += (parseFloat(rate.cost_price || 0)) * qty;
  }
  return {
    revenue: parseFloat(revenue.toFixed(2)),
    cost:    parseFloat(cost.toFixed(2)),
    profit:  parseFloat((revenue - cost).toFixed(2)),
  };
}

// ─── GET /api/pricing/categories ─────────────────────────────────────────────

router.get('/categories', async (req, res, next) => {
  try {
    const r = await query(`SELECT * FROM rate_card_categories ORDER BY sort_order`);
    res.json(r.rows);
  } catch (err) { next(err); }
});

// ─── GET /api/pricing/templates ───────────────────────────────────────────────

router.get('/templates', async (req, res, next) => {
  try {
    const { courier_code, category_id, active } = req.query;
    const conds = [];
    const vals  = [];
    let   idx   = 1;
    if (courier_code) { conds.push(`t.courier_code = $${idx++}`); vals.push(courier_code); }
    if (category_id)  { conds.push(`t.category_id  = $${idx++}`); vals.push(category_id); }
    if (active !== undefined) { conds.push(`t.is_active = $${idx++}`); vals.push(active !== 'false'); }
    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
    const r = await query(`
      SELECT t.*, c.name AS category_name,
             s.full_name AS created_by_name
      FROM rate_card_templates t
      LEFT JOIN rate_card_categories c ON c.id = t.category_id
      LEFT JOIN staff s ON s.id = t.created_by
      ${where}
      ORDER BY c.sort_order, t.name
    `, vals);
    res.json(r.rows);
  } catch (err) { next(err); }
});

// ─── POST /api/pricing/templates ──────────────────────────────────────────────

router.post('/templates', async (req, res, next) => {
  try {
    const { name, category_id, courier_code, description, rates, surcharge_markups, fuel_markup_pct, created_by } = req.body;
    if (!name || !courier_code) return res.status(400).json({ error: 'name and courier_code required' });
    const r = await query(`
      INSERT INTO rate_card_templates
        (name, category_id, courier_code, description, rates, surcharge_markups, fuel_markup_pct, created_by)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      RETURNING *
    `, [name, category_id || null, courier_code, description || null,
        JSON.stringify(rates || []), JSON.stringify(surcharge_markups || []),
        fuel_markup_pct || null, created_by || null]);
    res.json(r.rows[0]);
  } catch (err) { next(err); }
});

// ─── PUT /api/pricing/templates/:id ───────────────────────────────────────────

router.put('/templates/:id', async (req, res, next) => {
  try {
    const { name, category_id, courier_code, description, rates, surcharge_markups, fuel_markup_pct, is_active } = req.body;
    const r = await query(`
      UPDATE rate_card_templates SET
        name               = COALESCE($1, name),
        category_id        = COALESCE($2, category_id),
        courier_code       = COALESCE($3, courier_code),
        description        = COALESCE($4, description),
        rates              = COALESCE($5, rates),
        surcharge_markups  = COALESCE($6, surcharge_markups),
        fuel_markup_pct    = COALESCE($7, fuel_markup_pct),
        is_active          = COALESCE($8, is_active),
        updated_at         = NOW()
      WHERE id = $9
      RETURNING *
    `, [name || null, category_id || null, courier_code || null, description || null,
        rates ? JSON.stringify(rates) : null,
        surcharge_markups ? JSON.stringify(surcharge_markups) : null,
        fuel_markup_pct ?? null, is_active ?? null, req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'Template not found' });
    res.json(r.rows[0]);
  } catch (err) { next(err); }
});

// ─── GET /api/pricing/volume-mix-snapshot?courier_code= ──────────────────────
// Returns actual service usage from last 90 days of charges, sorted by volume.
// Used to pre-populate the volume mix in RateCardEditor projections.

router.get('/volume-mix-snapshot', async (req, res, next) => {
  try {
    const { courier_code } = req.query;
    if (!courier_code) return res.status(400).json({ error: 'courier_code required' });

    // Volume alias rule: DPD-ND2KG historical charges are counted against DPD-32.
    // DPD-ND2KG remains as a separate service in the rate card (pct=0 via applySnapshot
    // missing-code logic on the client). Only DPD-32 appears in the snapshot so its
    // pct includes the combined volume of both services.
    const courierId = `(SELECT id FROM couriers WHERE code ILIKE $1)`;
    const r = await query(`
      WITH raw AS (
        SELECT
          CASE WHEN cs.service_code = 'DPD-ND2KG' THEN 'DPD-32' ELSE cs.service_code END AS service_code,
          COUNT(*) AS charge_count
        FROM charges ch
        JOIN courier_services cs
          ON cs.name ILIKE ch.service_name
         AND cs.courier_id = ${courierId}
        WHERE ch.charge_type = 'courier'
          AND ch.cancelled   = false
          AND ch.created_at >= NOW() - INTERVAL '90 days'
        GROUP BY
          CASE WHEN cs.service_code = 'DPD-ND2KG' THEN 'DPD-32' ELSE cs.service_code END
      )
      SELECT
        r.service_code,
        cs.name                                                                  AS service_name,
        SUM(r.charge_count)                                                      AS charge_count,
        ROUND(SUM(r.charge_count) * 100.0 / SUM(SUM(r.charge_count)) OVER (), 1) AS pct
      FROM raw r
      JOIN courier_services cs
        ON cs.service_code = r.service_code
       AND cs.courier_id   = ${courierId}
      GROUP BY r.service_code, cs.name
      ORDER BY charge_count DESC
    `, [courier_code]);

    res.json(r.rows);
  } catch (err) { next(err); }
});

// ─── GET /api/pricing/carrier-services?courier_code= ─────────────────────────
// Returns every service+zone for a carrier with cost price from master rate card.
// Used to populate Customer Rate Card Template rows.

router.get('/carrier-services', async (req, res, next) => {
  try {
    const { courier_code, include_bespoke } = req.query;
    if (!courier_code) return res.status(400).json({ error: 'courier_code required' });
    const showBespoke = include_bespoke === 'true';

    const r = await query(`
      SELECT
        cs.service_code,
        cs.name                             AS service_name,
        cs.service_type,
        cs.is_bespoke,
        (cs.service_type = 'international') AS is_international,
        z.name                              AS zone_name,
        z.id                                AS zone_id,
        (
          SELECT wb.price_first
          FROM weight_bands wb
          JOIN carrier_rate_cards crc ON crc.id = wb.carrier_rate_card_id
          WHERE wb.zone_id = z.id AND crc.is_master = true
          ORDER BY wb.min_weight_kg ASC NULLS LAST
          LIMIT 1
        ) AS cost_price,
        (
          SELECT wb.price_sub
          FROM weight_bands wb
          JOIN carrier_rate_cards crc ON crc.id = wb.carrier_rate_card_id
          WHERE wb.zone_id = z.id AND crc.is_master = true
          ORDER BY wb.min_weight_kg ASC NULLS LAST
          LIMIT 1
        ) AS cost_price_sub
      FROM couriers co
      JOIN courier_services cs ON cs.courier_id = co.id
      JOIN zones z              ON z.courier_service_id = cs.id
      WHERE co.code ILIKE $1
        AND ($2 OR cs.is_bespoke = false)
      ORDER BY cs.service_type, cs.service_code, z.name
    `, [courier_code, showBespoke]);

    res.json(r.rows);
  } catch (err) { next(err); }
});

// ─── DELETE /api/pricing/templates/:id ───────────────────────────────────────

router.delete('/templates/:id', async (req, res, next) => {
  try {
    await query(`DELETE FROM rate_card_templates WHERE id = $1`, [req.params.id]);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// ─── GET /api/pricing/stats ───────────────────────────────────────────────────

router.get('/stats', async (req, res, next) => {
  try {
    const r = await query(`
      SELECT
        COUNT(*)                                                           AS total,
        COUNT(*) FILTER (WHERE status IN ('quote','draft','pending_approval','approved')) AS quotes_out,
        COUNT(*) FILTER (WHERE status = 'sent')                           AS forms_sent,
        COUNT(*) FILTER (WHERE status = 'form_returned')                  AS forms_returned,
        COUNT(*) FILTER (WHERE status = 'onboarding')                     AS in_onboarding,
        COUNT(*) FILTER (WHERE status = 'converted')                      AS converted,
        COUNT(*) FILTER (WHERE status = 'lost')                           AS lost
      FROM prospects
    `);
    // Prospects currently in onboarding with name
    const onboarding = await query(`
      SELECT id, company_name, contact_name, updated_at
      FROM prospects WHERE status = 'onboarding'
      ORDER BY updated_at DESC
    `);
    res.json({ ...r.rows[0], onboarding_list: onboarding.rows });
  } catch (err) { next(err); }
});

// ─── GET /api/pricing/prospects ───────────────────────────────────────────────

router.get('/prospects', async (req, res, next) => {
  try {
    const { status, assigned_to, search, limit = 50, offset = 0 } = req.query;
    const conds = [];
    const vals  = [];
    let   idx   = 1;
    if (status)      { conds.push(`p.status = $${idx++}`);                           vals.push(status); }
    if (assigned_to) { conds.push(`p.assigned_to = $${idx++}`);                      vals.push(assigned_to); }
    if (search)      { conds.push(`p.company_name ILIKE $${idx++}`);                 vals.push(`%${search}%`); }
    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
    const countR = await query(`SELECT COUNT(*)::int FROM prospects p ${where}`, vals);
    const rows   = await query(`
      SELECT p.*,
             s.full_name AS assigned_to_name,
             cb.full_name AS created_by_name,
             (SELECT json_agg(prc ORDER BY prc.created_at DESC)
              FROM prospect_rate_cards prc WHERE prc.prospect_id = p.id) AS rate_cards
      FROM prospects p
      LEFT JOIN staff s  ON s.id  = p.assigned_to
      LEFT JOIN staff cb ON cb.id = p.created_by
      ${where}
      ORDER BY p.created_at DESC
      LIMIT $${idx++} OFFSET $${idx++}
    `, [...vals, parseInt(limit), parseInt(offset)]);
    res.json({ total: countR.rows[0].count, prospects: rows.rows });
  } catch (err) { next(err); }
});

// ─── POST /api/pricing/prospects ──────────────────────────────────────────────

router.post('/prospects', async (req, res, next) => {
  try {
    const { company_name, contact_name, contact_email, contact_phone, assigned_to, notes, created_by } = req.body;
    if (!company_name || !contact_name) return res.status(400).json({ error: 'company_name and contact_name required' });
    const r = await query(`
      INSERT INTO prospects (company_name, contact_name, contact_email, contact_phone, assigned_to, notes, created_by)
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      RETURNING *
    `, [company_name, contact_name, contact_email || null, contact_phone || null,
        assigned_to || null, notes || null, created_by || null]);
    res.json(r.rows[0]);
  } catch (err) { next(err); }
});

// ─── PATCH /api/pricing/prospects/:id ────────────────────────────────────────

router.patch('/prospects/:id', async (req, res, next) => {
  try {
    const { company_name, contact_name, contact_email, contact_phone, status, assigned_to, notes } = req.body;
    const r = await query(`
      UPDATE prospects SET
        company_name  = COALESCE($1, company_name),
        contact_name  = COALESCE($2, contact_name),
        contact_email = COALESCE($3, contact_email),
        contact_phone = COALESCE($4, contact_phone),
        status        = COALESCE($5, status),
        assigned_to   = COALESCE($6, assigned_to),
        notes         = COALESCE($7, notes),
        updated_at    = NOW()
      WHERE id = $8
      RETURNING *
    `, [company_name || null, contact_name || null, contact_email || null,
        contact_phone || null, status || null, assigned_to || null,
        notes || null, req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'Prospect not found' });
    res.json(r.rows[0]);
  } catch (err) { next(err); }
});

// ─── GET /api/pricing/rate-card/:id — single rate card detail ────────────────

router.get('/rate-card/:id', async (req, res, next) => {
  try {
    const r = await query(`
      SELECT prc.*,
             t.name AS template_name,
             c.name AS category_name,
             p.company_name AS prospect_company,
             p.contact_name AS prospect_contact,
             s.full_name AS created_by_name,
             (SELECT row_to_json(a) FROM rate_card_approvals a
              WHERE a.rate_card_id = prc.id ORDER BY a.requested_at DESC LIMIT 1) AS latest_approval
      FROM prospect_rate_cards prc
      LEFT JOIN rate_card_templates t ON t.id = prc.template_id
      LEFT JOIN rate_card_categories c ON c.id = t.category_id
      LEFT JOIN prospects p ON p.id = prc.prospect_id
      LEFT JOIN staff s ON s.id = prc.created_by
      WHERE prc.id = $1
    `, [req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'Rate card not found' });
    res.json(r.rows[0]);
  } catch (err) { next(err); }
});

// ─── DELETE /api/pricing/prospects/:id ───────────────────────────────────────

router.delete('/prospects/:id', async (req, res, next) => {
  try {
    await query(`DELETE FROM prospects WHERE id = $1`, [req.params.id]);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// ─── GET /api/pricing/prospects/:id/rate-cards ───────────────────────────────

router.get('/prospects/:id/rate-cards', async (req, res, next) => {
  try {
    const r = await query(`
      SELECT prc.*,
             t.name AS template_name,
             c.name AS category_name,
             s.full_name AS created_by_name,
             (SELECT row_to_json(a) FROM rate_card_approvals a
              WHERE a.rate_card_id = prc.id ORDER BY a.requested_at DESC LIMIT 1) AS latest_approval
      FROM prospect_rate_cards prc
      LEFT JOIN rate_card_templates t ON t.id = prc.template_id
      LEFT JOIN rate_card_categories c ON c.id = t.category_id
      LEFT JOIN staff s ON s.id = prc.created_by
      WHERE prc.prospect_id = $1
      ORDER BY prc.created_at DESC
    `, [req.params.id]);
    res.json(r.rows);
  } catch (err) { next(err); }
});

// ─── POST /api/pricing/prospects/:id/rate-cards ──────────────────────────────

router.post('/prospects/:id/rate-cards', async (req, res, next) => {
  try {
    const {
      template_id, courier_code, courier_name,
      rates, surcharge_markups, fuel_markup_pct, intl_markup_pct,
      weekly_parcels, volume_mix, created_by,
    } = req.body;
    if (!courier_code) return res.status(400).json({ error: 'courier_code required' });

    const proj = calcProjections(rates || [], volume_mix || [], weekly_parcels);

    const r = await query(`
      INSERT INTO prospect_rate_cards
        (prospect_id, template_id, courier_code, courier_name,
         rates, surcharge_markups, fuel_markup_pct, intl_markup_pct,
         weekly_parcels, volume_mix,
         projected_weekly_revenue, projected_weekly_cost, projected_weekly_profit,
         created_by)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
      RETURNING *
    `, [req.params.id, template_id || null, courier_code, courier_name || null,
        JSON.stringify(rates || []), JSON.stringify(surcharge_markups || []),
        fuel_markup_pct || null, intl_markup_pct || null,
        weekly_parcels || null, JSON.stringify(volume_mix || []),
        proj.revenue, proj.cost, proj.profit,
        created_by || null]);
    res.json(r.rows[0]);
  } catch (err) { next(err); }
});

// ─── PUT /api/pricing/rate-cards/:id ─────────────────────────────────────────

router.put('/rate-cards/:id', async (req, res, next) => {
  try {
    const {
      rates, surcharge_markups, fuel_markup_pct, intl_markup_pct,
      weekly_parcels, volume_mix,
    } = req.body;
    const proj = calcProjections(rates || [], volume_mix || [], weekly_parcels);
    const r = await query(`
      UPDATE prospect_rate_cards SET
        rates              = COALESCE($1, rates),
        surcharge_markups  = COALESCE($2, surcharge_markups),
        fuel_markup_pct    = COALESCE($3, fuel_markup_pct),
        intl_markup_pct    = COALESCE($4, intl_markup_pct),
        weekly_parcels     = COALESCE($5, weekly_parcels),
        volume_mix         = COALESCE($6, volume_mix),
        projected_weekly_revenue = $7,
        projected_weekly_cost    = $8,
        projected_weekly_profit  = $9,
        updated_at         = NOW()
      WHERE id = $10
      RETURNING *
    `, [rates ? JSON.stringify(rates) : null,
        surcharge_markups ? JSON.stringify(surcharge_markups) : null,
        fuel_markup_pct ?? null, intl_markup_pct ?? null,
        weekly_parcels ?? null,
        volume_mix ? JSON.stringify(volume_mix) : null,
        proj.revenue, proj.cost, proj.profit,
        req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'Rate card not found' });
    res.json(r.rows[0]);
  } catch (err) { next(err); }
});

// ─── POST /api/pricing/rate-cards/:id/submit-for-approval ────────────────────

router.post('/rate-cards/:id/submit-for-approval', async (req, res, next) => {
  try {
    const { requested_by } = req.body;
    if (!requested_by) return res.status(400).json({ error: 'requested_by (staff id) required' });

    // Update rate card status
    const rcRes = await query(`
      UPDATE prospect_rate_cards SET status = 'pending_approval', updated_at = NOW()
      WHERE id = $1 RETURNING *, (SELECT prospect_id FROM prospect_rate_cards WHERE id = $1) AS pid
    `, [req.params.id]);
    if (!rcRes.rows.length) return res.status(404).json({ error: 'Rate card not found' });

    // Update prospect status
    await query(`UPDATE prospects SET status = 'pending_approval', updated_at = NOW() WHERE id = $1`,
      [rcRes.rows[0].prospect_id]);

    // Create approval record
    const approvalRes = await query(`
      INSERT INTO rate_card_approvals (rate_card_id, requested_by)
      VALUES ($1, $2) RETURNING *
    `, [req.params.id, requested_by]);

    // Get managers/directors to notify
    const managers = await query(`
      SELECT id, full_name, email FROM staff
      WHERE role IN ('manager','director') AND is_active = true
    `);

    // Get requester name + prospect info
    const requesterRes = await query(`SELECT full_name FROM staff WHERE id = $1`, [requested_by]);
    const prospectRes  = await query(`
      SELECT p.company_name FROM prospects p
      JOIN prospect_rate_cards prc ON prc.prospect_id = p.id
      WHERE prc.id = $1
    `, [req.params.id]);

    const requesterName = requesterRes.rows[0]?.full_name || 'A sales person';
    const prospectName  = prospectRes.rows[0]?.company_name || 'a prospect';

    res.json({
      ok: true,
      approval: approvalRes.rows[0],
      notify_managers: managers.rows.map(m => ({
        id: m.id, name: m.full_name, email: m.email,
        subject: `Rate card approval needed — ${prospectName}`,
        body: `${requesterName} has submitted a rate card for ${prospectName} and needs your approval.`,
      })),
    });
  } catch (err) { next(err); }
});

// ─── POST /api/pricing/approvals/:id/review ──────────────────────────────────
// Manager approves or rejects. Sales cannot review their own submission.

router.post('/approvals/:id/review', async (req, res, next) => {
  try {
    const { reviewed_by, status, comment } = req.body;
    if (!reviewed_by || !['approved','rejected'].includes(status)) {
      return res.status(400).json({ error: 'reviewed_by and status (approved|rejected) required' });
    }

    // Load the approval
    const apprRes = await query(`SELECT * FROM rate_card_approvals WHERE id = $1`, [req.params.id]);
    if (!apprRes.rows.length) return res.status(404).json({ error: 'Approval not found' });
    const appr = apprRes.rows[0];

    // Prevent self-approval
    if (appr.requested_by === reviewed_by) {
      return res.status(403).json({ error: 'You cannot approve your own rate card submission' });
    }

    // Update approval record
    await query(`
      UPDATE rate_card_approvals SET
        reviewed_by = $1, status = $2, comment = $3, reviewed_at = NOW()
      WHERE id = $4
    `, [reviewed_by, status, comment || null, req.params.id]);

    // Update rate card + prospect status
    const newRcStatus  = status === 'approved' ? 'approved' : 'draft';
    const newProspStatus = status === 'approved' ? 'approved' : 'quote';
    const rcRes = await query(`
      UPDATE prospect_rate_cards SET status = $1, updated_at = NOW()
      WHERE id = $2 RETURNING prospect_id
    `, [newRcStatus, appr.rate_card_id]);

    await query(`UPDATE prospects SET status = $1, updated_at = NOW() WHERE id = $2`,
      [newProspStatus, rcRes.rows[0].prospect_id]);

    // Get sales person to notify
    const salesRes = await query(`SELECT full_name, email FROM staff WHERE id = $1`, [appr.requested_by]);
    const reviewerRes = await query(`SELECT full_name FROM staff WHERE id = $1`, [reviewed_by]);
    const prospRes = await query(`
      SELECT p.company_name FROM prospects p
      JOIN prospect_rate_cards prc ON prc.prospect_id = p.id
      WHERE prc.id = $1
    `, [appr.rate_card_id]);

    res.json({
      ok: true,
      status,
      notify_sales: salesRes.rows[0] ? {
        email: salesRes.rows[0].email,
        subject: `Rate card ${status} — ${prospRes.rows[0]?.company_name}`,
        body: `Your rate card for ${prospRes.rows[0]?.company_name} has been ${status} by ${reviewerRes.rows[0]?.full_name}.${comment ? ` Comment: ${comment}` : ''}`,
      } : null,
    });
  } catch (err) { next(err); }
});

// ─── GET /api/pricing/approvals/pending ──────────────────────────────────────

router.get('/approvals/pending', async (req, res, next) => {
  try {
    const r = await query(`
      SELECT a.*,
             prc.courier_code, prc.courier_name, prc.projected_weekly_revenue,
             p.company_name, p.contact_name,
             s.full_name AS requested_by_name, s.email AS requested_by_email
      FROM rate_card_approvals a
      JOIN prospect_rate_cards prc ON prc.id = a.rate_card_id
      JOIN prospects p             ON p.id   = prc.prospect_id
      JOIN staff s                 ON s.id   = a.requested_by
      WHERE a.status = 'pending'
      ORDER BY a.requested_at ASC
    `);
    res.json(r.rows);
  } catch (err) { next(err); }
});

export default router;
