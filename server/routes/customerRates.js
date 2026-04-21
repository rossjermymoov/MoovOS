/**
 * Customer Rates API
 * GET /api/customer-rates/:customerId  — all rate rows for a customer, grouped by service
 * GET /api/customer-rates/:customerId/services  — service list with row counts (no rate detail)
 */

import express from 'express';
import { query } from '../db/index.js';

const router = express.Router();

// ─── GET /:customerId — full rate data grouped by courier → service ──────────
router.get('/:customerId', async (req, res, next) => {
  try {
    const { customerId } = req.params;
    const { service_id, zone_search, limit = 200, offset = 0 } = req.query;

    let sql = `
      SELECT
        courier_id, courier_code, courier_name,
        service_id, service_code, service_name,
        zone_id, zone_name,
        weight_class_id, weight_class_name,
        price
      FROM customer_rates
      WHERE customer_id = $1
    `;
    const values = [customerId];
    let idx = 2;

    if (service_id) {
      sql += ` AND service_id = $${idx++}`;
      values.push(parseInt(service_id));
    }
    if (zone_search) {
      sql += ` AND zone_name ILIKE $${idx++}`;
      values.push(`%${zone_search}%`);
    }

    sql += ` ORDER BY courier_name, service_name, zone_name, weight_class_name`;
    sql += ` LIMIT $${idx++} OFFSET $${idx++}`;
    values.push(parseInt(limit), parseInt(offset));

    // Also get totals per service (for the sidebar counts)
    const summaryRes = await query(`
      SELECT
        courier_id, courier_code, courier_name,
        service_id, service_code, service_name,
        COUNT(*) AS rate_count
      FROM customer_rates
      WHERE customer_id = $1
      GROUP BY courier_id, courier_code, courier_name, service_id, service_code, service_name
      ORDER BY courier_name, service_name
    `, [customerId]);

    const ratesRes = await query(sql, values);

    // Group rates by service_id
    const ratesByService = {};
    for (const row of ratesRes.rows) {
      if (!ratesByService[row.service_id]) ratesByService[row.service_id] = [];
      ratesByService[row.service_id].push({
        zone_id:           row.zone_id,
        zone_name:         row.zone_name,
        weight_class_id:   row.weight_class_id,
        weight_class_name: row.weight_class_name,
        price:             row.price,
      });
    }

    // Merge into service list
    const services = summaryRes.rows.map(s => ({
      courier_id:   s.courier_id,
      courier_code: s.courier_code,
      courier_name: s.courier_name,
      service_id:   s.service_id,
      service_code: s.service_code,
      service_name: s.service_name,
      rate_count:   parseInt(s.rate_count),
      rates:        ratesByService[s.service_id] || [],
    }));

    res.json({
      services,
      total_rates: services.reduce((a, s) => a + s.rate_count, 0),
    });
  } catch (err) { next(err); }
});

export default router;
