/**
 * Customer Rates API
 *
 * GET    /api/customer-rates/:customerId              — all rates grouped by courier → service
 * PATCH  /api/customer-rates/rate/:rateId             — update a single rate's price and/or price_sub
 * DELETE /api/customer-rates/rate/:rateId             — delete a single rate row
 * POST   /api/customer-rates/:customerId              — add a new rate row for a customer
 * POST   /api/customer-rates/:customerId/sub-rates    — bulk apply sub rates by service_code + zone_name
 */

import express from 'express';
import { query } from '../db/index.js';

const router = express.Router();

// ─── PATCH /rate/:rateId — update price, price_sub, and/or per_kg fields ──────
router.patch('/rate/:rateId', async (req, res, next) => {
  try {
    const { rateId } = req.params;
    const { price, price_sub, per_kg_rate, per_kg_threshold_kg } = req.body;

    if (price == null && price_sub === undefined && per_kg_rate === undefined && per_kg_threshold_kg === undefined) {
      return res.status(400).json({ error: 'price, price_sub, per_kg_rate, or per_kg_threshold_kg is required' });
    }

    const sets   = [];
    const values = [];

    if (price != null) {
      values.push(parseFloat(price));
      sets.push(`price = $${values.length}`);
    }
    if (price_sub !== undefined) {
      // Allow explicit null to clear a sub price
      values.push(price_sub === null ? null : parseFloat(price_sub));
      sets.push(`price_sub = $${values.length}`);
    }
    if (per_kg_rate !== undefined) {
      // Allow explicit null to clear per-kg rate
      values.push(per_kg_rate === null ? null : parseFloat(per_kg_rate));
      sets.push(`per_kg_rate = $${values.length}`);
    }
    if (per_kg_threshold_kg !== undefined) {
      values.push(per_kg_threshold_kg === null ? null : parseFloat(per_kg_threshold_kg));
      sets.push(`per_kg_threshold_kg = $${values.length}`);
    }

    values.push(rateId);
    const result = await query(
      `UPDATE customer_rates SET ${sets.join(', ')} WHERE id = $${values.length} RETURNING *`,
      values
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Rate not found' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

// ─── DELETE /rate/:rateId — remove a rate row ─────────────────
router.delete('/rate/:rateId', async (req, res, next) => {
  try {
    const result = await query(
      `DELETE FROM customer_rates WHERE id = $1 RETURNING id`,
      [req.params.rateId]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Rate not found' });
    res.json({ deleted: true, id: result.rows[0].id });
  } catch (err) { next(err); }
});

// ─── POST /:customerId — add a new rate ───────────────────────
router.post('/:customerId', async (req, res, next) => {
  try {
    const { customerId } = req.params;
    const {
      courier_id = 0, courier_code = '', courier_name = '',
      service_id, service_code = '', service_name = '',
      zone_name, weight_class_name = 'Parcel',
      price, price_sub = null,
    } = req.body;

    if (!service_id || !zone_name || price == null) {
      return res.status(400).json({ error: 'service_id, zone_name, and price are required' });
    }

    // Pull numeric weight bounds from dc_weight_classes if available.
    // This makes the carrier rate card the source of truth rather than
    // relying on the weight_class_name text to be parsed at pricing time.
    const wcRes = await query(
      `SELECT min_weight_kg, max_weight_kg
       FROM dc_weight_classes
       WHERE service_code = $1 AND weight_class_name = $2
       LIMIT 1`,
      [service_code, weight_class_name]
    );
    const wc = wcRes.rows[0] || {};

    const result = await query(`
      INSERT INTO customer_rates
        (customer_id, courier_id, courier_code, courier_name,
         service_id, service_code, service_name,
         zone_name, weight_class_name,
         min_weight_kg, max_weight_kg,
         price, price_sub)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
      ON CONFLICT (customer_id, service_id, zone_name, weight_class_name)
      DO UPDATE SET
        price         = EXCLUDED.price,
        price_sub     = EXCLUDED.price_sub,
        min_weight_kg = COALESCE(customer_rates.min_weight_kg, EXCLUDED.min_weight_kg),
        max_weight_kg = COALESCE(customer_rates.max_weight_kg, EXCLUDED.max_weight_kg)
      RETURNING *
    `, [customerId, courier_id, courier_code, courier_name,
        service_id, service_code, service_name,
        zone_name, weight_class_name,
        wc.min_weight_kg ?? null, wc.max_weight_kg ?? null,
        parseFloat(price),
        price_sub != null ? parseFloat(price_sub) : null]);

    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
});

// ─── POST /:customerId/sub-rates — bulk apply sub rates ───────
//
// Accepts an array of { service_code, zone_name, price_sub } objects.
// Updates matching customer_rates rows for this customer.
// Useful when loading sub rates from a rate card PDF or CSV.
//
// Body: { rates: [ { service_code, zone_name, price_sub } ] }
// Returns: { updated, not_found }
router.post('/:customerId/sub-rates', async (req, res, next) => {
  try {
    const { customerId } = req.params;
    const { rates } = req.body;

    if (!Array.isArray(rates) || !rates.length) {
      return res.status(400).json({ error: 'rates array required' });
    }

    let updated = 0;
    const not_found = [];

    for (const row of rates) {
      const { service_code, zone_name, price_sub } = row;
      if (!service_code || !zone_name || price_sub == null) continue;

      const result = await query(
        `UPDATE customer_rates
         SET price_sub = $1
         WHERE customer_id = $2
           AND service_code = $3
           AND zone_name    = $4
         RETURNING id`,
        [parseFloat(price_sub), customerId, service_code, zone_name]
      );

      if (result.rows.length) {
        updated += result.rows.length;
      } else {
        not_found.push({ service_code, zone_name });
      }
    }

    res.json({ updated, not_found });
  } catch (err) { next(err); }
});

// ─── GET /zones/:serviceCode — zone/weight-band template ─────
// Returns the distinct (zone_name, weight_class_name) pairs that exist
// in customer_rates for this service across ALL customers.  This is used
// as the canonical zone template when setting up a new customer's rate card
// so that zones match the carrier's structure rather than being entered manually.
// Must be declared BEFORE /:customerId so Express does not treat "zones" as an id.
router.get('/zones/:serviceCode', async (req, res, next) => {
  try {
    const { serviceCode } = req.params;
    // has_sub_price = true when ANY customer has a sub price for this zone/weight combo.
    // Used by the frontend to show an amber sub-price slot alongside unpriced zones.
    const result = await query(`
      SELECT   zone_name, weight_class_name,
               BOOL_OR(price_sub IS NOT NULL) AS has_sub_price
      FROM     customer_rates
      WHERE    service_code ILIKE $1
      GROUP BY zone_name, weight_class_name
      ORDER BY zone_name, weight_class_name
    `, [serviceCode]);
    res.json(result.rows);
  } catch (err) { next(err); }
});

// ─── GET /:customerId — rates grouped by courier → service ────
router.get('/:customerId', async (req, res, next) => {
  try {
    const { customerId } = req.params;

    // Service summary with rate counts + service_type from courier_services
    const summaryRes = await query(`
      SELECT
        cr.courier_id, cr.courier_code, cr.courier_name,
        cr.service_id, cr.service_code, cr.service_name,
        COUNT(*) AS rate_count,
        COALESCE(cs.service_type::text, 'domestic') AS service_type,
        BOOL_OR(cr.price_sub IS NOT NULL) AS has_sub_rates
      FROM customer_rates cr
      LEFT JOIN courier_services cs ON cs.service_code = cr.service_code
      WHERE cr.customer_id = $1
      GROUP BY cr.courier_id, cr.courier_code, cr.courier_name, cr.service_id, cr.service_code, cr.service_name, cs.service_type
      ORDER BY cr.courier_name, cr.service_name
    `, [customerId]);

    // All rate rows (include id, price_sub for edit/delete)
    // Sort weight bands numerically by extracting the leading number from the
    // weight_class_name (e.g. "2KG"→2, "5KG"→5, "10KG"→10) so that "2KG" sorts
    // before "5KG" before "10KG", rather than alphabetically ("10KG" first).
    const ratesRes = await query(`
      SELECT id, service_id, zone_name, weight_class_name, price, price_sub,
             per_kg_rate, per_kg_threshold_kg
      FROM customer_rates
      WHERE customer_id = $1
      ORDER BY
        zone_name,
        CASE
          WHEN weight_class_name ~ '^[0-9]' THEN
            (regexp_replace(weight_class_name, '[^0-9.].*$', '', ''))::numeric
          ELSE NULL
        END NULLS LAST,
        weight_class_name
    `, [customerId]);

    // Group rates by service_id
    const ratesByService = {};
    for (const row of ratesRes.rows) {
      if (!ratesByService[row.service_id]) ratesByService[row.service_id] = [];
      ratesByService[row.service_id].push({
        id:                  row.id,
        zone_name:           row.zone_name,
        weight_class_name:   row.weight_class_name,
        price:               row.price,
        price_sub:           row.price_sub,
        per_kg_rate:         row.per_kg_rate,
        per_kg_threshold_kg: row.per_kg_threshold_kg,
      });
    }

    const services = summaryRes.rows.map(s => ({
      courier_id:    s.courier_id,
      courier_code:  s.courier_code,
      courier_name:  s.courier_name,
      service_id:    s.service_id,
      service_code:  s.service_code,
      service_name:  s.service_name,
      service_type:  s.service_type,
      rate_count:    parseInt(s.rate_count),
      has_sub_rates: s.has_sub_rates,
      rates:         ratesByService[s.service_id] || [],
    }));

    res.json({
      services,
      total_rates: services.reduce((a, s) => a + s.rate_count, 0),
    });
  } catch (err) { next(err); }
});

export default router;
