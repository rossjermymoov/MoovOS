/**
 * Moov OS — Customer Pricing API
 * Sell rate cards, volume tiers per customer
 */

import express from 'express';
import { query } from '../db/index.js';

const router = express.Router();

// ─────────────────────────────────────────────────────────────────────────────
// CUSTOMER PRICING (SELL RATES)
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/customer-pricing?customer_id=
router.get('/', async (req, res, next) => {
  try {
    const { customer_id } = req.query;
    if (!customer_id) return res.status(400).json({ error: 'customer_id is required' });

    const result = await query(
      `SELECT cp.*,
         cs.name AS service_name, cs.service_code,
         c.name  AS courier_name, c.code AS courier_code,
         z.name  AS zone_name
       FROM customer_pricing cp
       JOIN courier_services cs ON cs.id = cp.courier_service_id
       JOIN couriers c ON c.id = cs.courier_id
       JOIN zones z ON z.id = cp.zone_id
       WHERE cp.customer_id = $1
       ORDER BY c.name, cs.name, z.name, cp.min_weight_kg`,
      [customer_id]
    );
    res.json(result.rows);
  } catch (err) { next(err); }
});

// POST /api/customer-pricing
router.post('/', async (req, res, next) => {
  try {
    const {
      customer_id, courier_service_id, zone_id,
      min_weight_kg, max_weight_kg,
      pricing_method, fixed_price, markup_pct, margin_pct
    } = req.body;

    if (!customer_id)         return res.status(400).json({ error: 'customer_id is required' });
    if (!courier_service_id)  return res.status(400).json({ error: 'courier_service_id is required' });
    if (!zone_id)             return res.status(400).json({ error: 'zone_id is required' });
    if (min_weight_kg == null) return res.status(400).json({ error: 'min_weight_kg is required' });
    if (max_weight_kg == null) return res.status(400).json({ error: 'max_weight_kg is required' });

    const validMethods = ['fixed', 'markup_pct', 'margin_pct'];
    if (!validMethods.includes(pricing_method))
      return res.status(400).json({ error: `pricing_method must be one of: ${validMethods.join(', ')}` });

    if (pricing_method === 'fixed'      && fixed_price == null) return res.status(400).json({ error: 'fixed_price is required for fixed pricing' });
    if (pricing_method === 'markup_pct' && markup_pct  == null) return res.status(400).json({ error: 'markup_pct is required' });
    if (pricing_method === 'margin_pct' && margin_pct  == null) return res.status(400).json({ error: 'margin_pct is required' });

    const result = await query(
      `INSERT INTO customer_pricing
         (customer_id, courier_service_id, zone_id, min_weight_kg, max_weight_kg, pricing_method, fixed_price, markup_pct, margin_pct)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [customer_id, courier_service_id, zone_id, min_weight_kg, max_weight_kg,
       pricing_method, fixed_price || null, markup_pct || null, margin_pct || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
});

// PATCH /api/customer-pricing/:id
router.patch('/:id', async (req, res, next) => {
  try {
    const allowed = ['min_weight_kg', 'max_weight_kg', 'pricing_method', 'fixed_price', 'markup_pct', 'margin_pct'];
    const updates = Object.entries(req.body).filter(([k]) => allowed.includes(k));
    if (!updates.length) return res.status(400).json({ error: 'No valid fields to update' });
    const setClauses = updates.map(([k], i) => `${k} = $${i + 2}`).join(', ');
    const result = await query(
      `UPDATE customer_pricing SET ${setClauses}, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [req.params.id, ...updates.map(([, v]) => v)]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Pricing record not found' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

// DELETE /api/customer-pricing/:id
router.delete('/:id', async (req, res, next) => {
  try {
    await query('DELETE FROM customer_pricing WHERE id = $1', [req.params.id]);
    res.json({ deleted: true });
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────────────────────
// VOLUME TIERS
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/customer-pricing/volume-tiers?customer_id=
router.get('/volume-tiers', async (req, res, next) => {
  try {
    const { customer_id } = req.query;
    if (!customer_id) return res.status(400).json({ error: 'customer_id is required' });
    const result = await query(
      `SELECT vt.*,
         cs.name AS service_name, cs.service_code,
         z.name  AS zone_name
       FROM volume_tiers vt
       JOIN courier_services cs ON cs.id = vt.courier_service_id
       LEFT JOIN zones z ON z.id = vt.zone_id
       WHERE vt.customer_id = $1
       ORDER BY cs.name, vt.min_parcels`,
      [customer_id]
    );
    res.json(result.rows);
  } catch (err) { next(err); }
});

// POST /api/customer-pricing/volume-tiers
router.post('/volume-tiers', async (req, res, next) => {
  try {
    const { customer_id, courier_service_id, zone_id, min_parcels, max_parcels, tier_type, price } = req.body;
    if (!customer_id)        return res.status(400).json({ error: 'customer_id is required' });
    if (!courier_service_id) return res.status(400).json({ error: 'courier_service_id is required' });
    if (min_parcels == null) return res.status(400).json({ error: 'min_parcels is required' });
    if (!['flat','graduated'].includes(tier_type)) return res.status(400).json({ error: 'tier_type must be flat or graduated' });
    if (price == null)       return res.status(400).json({ error: 'price is required' });

    const result = await query(
      'INSERT INTO volume_tiers (customer_id, courier_service_id, zone_id, min_parcels, max_parcels, tier_type, price) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
      [customer_id, courier_service_id, zone_id || null, min_parcels, max_parcels || null, tier_type, price]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
});

// PATCH /api/customer-pricing/volume-tiers/:id
router.patch('/volume-tiers/:id', async (req, res, next) => {
  try {
    const allowed = ['min_parcels', 'max_parcels', 'tier_type', 'price', 'zone_id'];
    const updates = Object.entries(req.body).filter(([k]) => allowed.includes(k));
    if (!updates.length) return res.status(400).json({ error: 'No valid fields to update' });
    const setClauses = updates.map(([k], i) => `${k} = $${i + 2}`).join(', ');
    const result = await query(
      `UPDATE volume_tiers SET ${setClauses}, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [req.params.id, ...updates.map(([, v]) => v)]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Volume tier not found' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

// DELETE /api/customer-pricing/volume-tiers/:id
router.delete('/volume-tiers/:id', async (req, res, next) => {
  try {
    await query('DELETE FROM volume_tiers WHERE id = $1', [req.params.id]);
    res.json({ deleted: true });
  } catch (err) { next(err); }
});

export default router;
