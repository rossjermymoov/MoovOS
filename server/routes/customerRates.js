/**
 * Customer Rates API
 *
 * GET    /api/customer-rates/:customerId        — all rates grouped by courier → service
 * PATCH  /api/customer-rates/rate/:rateId       — update a single rate's price
 * DELETE /api/customer-rates/rate/:rateId       — delete a single rate row
 * POST   /api/customer-rates/:customerId        — add a new rate row for a customer
 */

import express from 'express';
import { query } from '../db/index.js';

const router = express.Router();

// ─── PATCH /rate/:rateId — update price ──────────────────────
router.patch('/rate/:rateId', async (req, res, next) => {
  try {
    const { rateId } = req.params;
    const { price, price_sub } = req.body;
    if (price == null && price_sub === undefined) return res.status(400).json({ error: 'price or price_sub required' });

    const sets = [];
    const vals = [];
    if (price != null)        { sets.push(`price     = $${sets.length + 1}`); vals.push(parseFloat(price)); }
    if (price_sub !== undefined) {
      sets.push(`price_sub = $${sets.length + 1}`);
      vals.push(price_sub === null || price_sub === '' ? null : parseFloat(price_sub));
    }
    vals.push(rateId);

    const result = await query(
      `UPDATE customer_rates SET ${sets.join(', ')} WHERE id = $${vals.length} RETURNING *`,
      vals
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
      price,
    } = req.body;

    if (!service_id || !zone_name || price == null) {
      return res.status(400).json({ error: 'service_id, zone_name, and price are required' });
    }

    const result = await query(`
      INSERT INTO customer_rates
        (customer_id, courier_id, courier_code, courier_name,
         service_id, service_code, service_name,
         zone_name, weight_class_name, price)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      ON CONFLICT (customer_id, service_id, zone_name, weight_class_name)
      DO UPDATE SET price = EXCLUDED.price
      RETURNING *
    `, [customerId, courier_id, courier_code, courier_name,
        service_id, service_code, service_name,
        zone_name, weight_class_name, parseFloat(price)]);

    res.status(201).json(result.rows[0]);
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
        COALESCE(cs.service_type::text, 'domestic') AS service_type
      FROM customer_rates cr
      LEFT JOIN courier_services cs ON cs.service_code = cr.service_code
      WHERE cr.customer_id = $1
      GROUP BY cr.courier_id, cr.courier_code, cr.courier_name, cr.service_id, cr.service_code, cr.service_name, cs.service_type
      ORDER BY cr.courier_name, cr.service_name
    `, [customerId]);

    // All rate rows (include id for edit/delete)
    const ratesRes = await query(`
      SELECT id, service_id, zone_name, weight_class_name, price
      FROM customer_rates
      WHERE customer_id = $1
      ORDER BY zone_name, weight_class_name
    `, [customerId]);

    // Group rates by service_id
    const ratesByService = {};
    for (const row of ratesRes.rows) {
      if (!ratesByService[row.service_id]) ratesByService[row.service_id] = [];
      ratesByService[row.service_id].push({
        id:                row.id,
        zone_name:         row.zone_name,
        weight_class_name: row.weight_class_name,
        price:             row.price,
      });
    }

    const services = summaryRes.rows.map(s => ({
      courier_id:   s.courier_id,
      courier_code: s.courier_code,
      courier_name: s.courier_name,
      service_id:   s.service_id,
      service_code: s.service_code,
      service_name: s.service_name,
      service_type: s.service_type,
      rate_count:   parseInt(s.rate_count),
      rates:        ratesByService[s.service_id] || [],
    }));

    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.json({
      services,
      total_rates: services.reduce((a, s) => a + s.rate_count, 0),
    });
  } catch (err) { next(err); }
});

export default router;
