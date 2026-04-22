/**
 * Moov OS — Customer Service Pricing API
 *
 * Manages the markup/fixed-fee pricing config per customer per service.
 * Zones and weight bands come from the linked carrier rate card — customers
 * never configure those, only their markup % or fixed fee.
 *
 * GET  /api/customer-service-pricing/:customerId          — list all pricing configs for a customer
 * POST /api/customer-service-pricing/:customerId          — add/upsert a pricing config
 * PATCH /api/customer-service-pricing/:customerId/:id     — update markup or fee
 * DELETE /api/customer-service-pricing/:customerId/:id    — remove a pricing config
 *
 * GET /api/customer-service-pricing/available-rate-cards  — rate cards + services for picker
 */

import express from 'express';
import { query } from '../db/index.js';

const router = express.Router();

// ─── GET /:customerId ─────────────────────────────────────────────────────────
// Returns all pricing configs for a customer, with carrier/service/rate-card names.

router.get('/:customerId', async (req, res, next) => {
  try {
    const result = await query(`
      SELECT
        csp.id,
        csp.customer_id,
        csp.carrier_rate_card_id,
        csp.service_id,
        csp.pricing_type,
        csp.markup_pct,
        csp.fixed_fee,
        csp.notes,
        csp.created_at,
        crc.name          AS rate_card_name,
        crc.is_master     AS rate_card_is_master,
        cs.service_code,
        cs.name           AS service_name,
        c.name            AS courier_name,
        c.code            AS courier_code
      FROM customer_service_pricing csp
      JOIN carrier_rate_cards  crc ON crc.id = csp.carrier_rate_card_id
      JOIN courier_services    cs  ON cs.id  = csp.service_id
      JOIN couriers            c   ON c.id   = crc.courier_id
      WHERE csp.customer_id = $1
      ORDER BY c.name, cs.name
    `, [req.params.customerId]);

    res.json(result.rows);
  } catch (err) { next(err); }
});

// ─── POST /:customerId ────────────────────────────────────────────────────────
// Upserts a pricing config (by customer_id + service_id).

router.post('/:customerId', async (req, res, next) => {
  try {
    const { customerId } = req.params;
    const { carrier_rate_card_id, service_id, pricing_type, markup_pct, fixed_fee, notes } = req.body;

    if (!carrier_rate_card_id || !service_id || !pricing_type) {
      return res.status(400).json({ error: 'carrier_rate_card_id, service_id and pricing_type required' });
    }
    if (pricing_type === 'markup'    && markup_pct == null) return res.status(400).json({ error: 'markup_pct required for markup pricing' });
    if (pricing_type === 'fixed_fee' && fixed_fee  == null) return res.status(400).json({ error: 'fixed_fee required for fixed_fee pricing' });

    const result = await query(`
      INSERT INTO customer_service_pricing
        (customer_id, carrier_rate_card_id, service_id, pricing_type, markup_pct, fixed_fee, notes, updated_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())
      ON CONFLICT (customer_id, service_id) DO UPDATE SET
        carrier_rate_card_id = EXCLUDED.carrier_rate_card_id,
        pricing_type         = EXCLUDED.pricing_type,
        markup_pct           = EXCLUDED.markup_pct,
        fixed_fee            = EXCLUDED.fixed_fee,
        notes                = EXCLUDED.notes,
        updated_at           = NOW()
      RETURNING *
    `, [customerId, carrier_rate_card_id, service_id, pricing_type,
        pricing_type === 'markup'    ? markup_pct : null,
        pricing_type === 'fixed_fee' ? fixed_fee  : null,
        notes || null]);

    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

// ─── PATCH /:customerId/:id ───────────────────────────────────────────────────

router.patch('/:customerId/:id', async (req, res, next) => {
  try {
    const { customerId, id } = req.params;
    const allowed = ['carrier_rate_card_id','pricing_type','markup_pct','fixed_fee','notes'];
    const updates = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)));
    if (!Object.keys(updates).length) return res.status(400).json({ error: 'No valid fields to update' });

    const sets = Object.keys(updates).map((k, i) => `${k} = $${i + 3}`);
    const vals = Object.values(updates);

    const result = await query(
      `UPDATE customer_service_pricing SET ${sets.join(', ')}, updated_at = NOW()
       WHERE customer_id = $1 AND id = $2 RETURNING *`,
      [customerId, id, ...vals]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

// ─── DELETE /:customerId/:id ──────────────────────────────────────────────────

router.delete('/:customerId/:id', async (req, res, next) => {
  try {
    const { customerId, id } = req.params;
    await query(
      'DELETE FROM customer_service_pricing WHERE customer_id = $1 AND id = $2',
      [customerId, id]
    );
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// ─── GET /carrier-overview/:customerId ───────────────────────────────────────
// One endpoint for the customer pricing overview panel.
// Returns every carrier that has a master carrier_rate_card, with:
//   • customer_pricing  — customer_service_pricing entries for this customer
//   • fuel_groups       — carrier's fuel groups (cost side: what Moov pays)
//   • fuel_surcharges   — percentage surcharges for this carrier + customer override (sell side)
//
// NOTE: must be declared BEFORE /:customerId so Express doesn't match "carrier-overview" as an id.

router.get('/carrier-overview/:customerId', async (req, res, next) => {
  try {
    const { customerId } = req.params;

    // Main carrier + rate card rows, with customer pricing and fuel groups
    const mainRes = await query(`
      SELECT
        c.id            AS courier_id,
        c.name          AS courier_name,
        c.code          AS courier_code,
        crc.id          AS rate_card_id,
        crc.name        AS rate_card_name,
        COALESCE(
          json_agg(DISTINCT jsonb_build_object(
            'id',           csp.id,
            'service_id',   csp.service_id,
            'service_code', cs.service_code,
            'service_name', cs.name,
            'pricing_type', csp.pricing_type,
            'markup_pct',   csp.markup_pct,
            'fixed_fee',    csp.fixed_fee,
            'notes',        csp.notes
          )) FILTER (WHERE csp.id IS NOT NULL),
          '[]'::json
        ) AS customer_pricing,
        COALESCE(
          json_agg(DISTINCT jsonb_build_object(
            'id',                fg.id,
            'name',              fg.name,
            'fuel_surcharge_pct', fg.fuel_surcharge_pct
          )) FILTER (WHERE fg.id IS NOT NULL),
          '[]'::json
        ) AS fuel_groups
      FROM carrier_rate_cards crc
      JOIN couriers c ON c.id = crc.courier_id
      LEFT JOIN customer_service_pricing csp
             ON csp.carrier_rate_card_id = crc.id AND csp.customer_id = $1
      LEFT JOIN courier_services cs ON cs.id = csp.service_id
      LEFT JOIN fuel_groups fg ON fg.courier_id = c.id
      WHERE crc.is_master = true
      GROUP BY c.id, c.name, c.code, crc.id, crc.name
      ORDER BY c.name
    `, [customerId]);

    // Percentage surcharges per carrier + customer override (the sell-side of fuel)
    const surchargesRes = await query(`
      SELECT
        s.id            AS surcharge_id,
        s.courier_id,
        s.code          AS surcharge_code,
        s.name          AS surcharge_name,
        s.default_value AS standard_rate,
        s.applies_when,
        cso.id          AS override_id,
        cso.override_value AS customer_rate
      FROM surcharges s
      LEFT JOIN customer_surcharge_overrides cso
             ON cso.surcharge_id = s.id AND cso.customer_id = $1
      WHERE s.calc_type = 'percentage' AND s.active = true
      ORDER BY s.courier_id, s.name
    `, [customerId]);

    // Attach fuel_surcharges to each carrier row
    const surchargesByCourier = {};
    for (const row of surchargesRes.rows) {
      if (!surchargesByCourier[row.courier_id]) surchargesByCourier[row.courier_id] = [];
      surchargesByCourier[row.courier_id].push(row);
    }

    const result = mainRes.rows.map(row => ({
      ...row,
      fuel_surcharges: surchargesByCourier[row.courier_id] || [],
    }));

    res.json(result);
  } catch (err) { next(err); }
});

// ─── GET /available-rate-cards ────────────────────────────────────────────────
// Returns all carrier rate cards with their services — used for the add-pricing picker.

router.get('/available-rate-cards/list', async (req, res, next) => {
  try {
    const result = await query(`
      SELECT
        crc.id    AS rate_card_id,
        crc.name  AS rate_card_name,
        crc.is_master,
        crc.is_active,
        c.id      AS courier_id,
        c.name    AS courier_name,
        c.code    AS courier_code,
        cs.id     AS service_id,
        cs.name   AS service_name,
        cs.service_code
      FROM carrier_rate_cards crc
      JOIN couriers         c  ON c.id  = crc.courier_id
      JOIN courier_services cs ON cs.courier_id = c.id
      WHERE crc.is_active = true
      ORDER BY c.name, crc.name, cs.name
    `);
    res.json(result.rows);
  } catch (err) { next(err); }
});

export default router;
