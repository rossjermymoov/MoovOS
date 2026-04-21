/**
 * Moov OS — Carriers API
 * Couriers, services, zones, weight bands, surcharges, rules engine
 */

import express from 'express';
import { query } from '../db/index.js';

const router = express.Router();

// ─────────────────────────────────────────────────────────────────────────────
// COURIERS
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/carriers/couriers
router.get('/couriers', async (req, res, next) => {
  try {
    const result = await query(
      `SELECT c.*,
         COUNT(cs.id)::int AS service_count,
         COALESCE(json_agg(jsonb_build_object(
           'id',cc.id,'name',cc.name,'phone',cc.phone,'email',cc.email,
           'department',cc.department,'role',cc.role,'notes',cc.notes
         ) ORDER BY cc.id) FILTER (WHERE cc.id IS NOT NULL), '[]') AS additional_contacts
       FROM couriers c
       LEFT JOIN courier_services cs ON cs.courier_id = c.id
       LEFT JOIN courier_contacts cc ON cc.courier_id = c.id
       GROUP BY c.id ORDER BY c.name`
    );
    res.json(result.rows);
  } catch (err) { next(err); }
});

// GET /api/carriers/couriers/:id — full detail with contacts and services
router.get('/couriers/:id', async (req, res, next) => {
  try {
    const courier = await query(
      `SELECT c.*,
         COALESCE(json_agg(jsonb_build_object(
           'id',cc.id,'name',cc.name,'phone',cc.phone,'email',cc.email,
           'department',cc.department,'role',cc.role,'notes',cc.notes
         ) ORDER BY cc.id) FILTER (WHERE cc.id IS NOT NULL), '[]') AS additional_contacts
       FROM couriers c
       LEFT JOIN courier_contacts cc ON cc.courier_id = c.id
       WHERE c.id = $1 GROUP BY c.id`,
      [req.params.id]
    );
    if (!courier.rows.length) return res.status(404).json({ error: 'Courier not found' });

    const services = await query(
      `SELECT cs.*, COUNT(z.id)::int AS zone_count
       FROM courier_services cs
       LEFT JOIN zones z ON z.courier_service_id = cs.id
       WHERE cs.courier_id = $1
       GROUP BY cs.id ORDER BY cs.sort_order NULLS LAST, cs.name`,
      [req.params.id]
    );

    res.json({ ...courier.rows[0], services: services.rows });
  } catch (err) { next(err); }
});

// POST /api/carriers/couriers
router.post('/couriers', async (req, res, next) => {
  try {
    const { code, name } = req.body;
    if (!code?.trim()) return res.status(400).json({ error: 'code is required' });
    if (!name?.trim()) return res.status(400).json({ error: 'name is required' });
    const result = await query(
      'INSERT INTO couriers (code, name) VALUES ($1, $2) RETURNING *',
      [code.trim().toUpperCase(), name.trim()]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Courier code already exists' });
    next(err);
  }
});

// PATCH /api/carriers/couriers/:id
router.patch('/couriers/:id', async (req, res, next) => {
  try {
    const allowed = ['code', 'name', 'account_number', 'primary_contact_name', 'primary_contact_phone', 'primary_contact_email', 'notes'];
    const updates = Object.entries(req.body).filter(([k]) => allowed.includes(k));
    if (!updates.length) return res.status(400).json({ error: 'No valid fields to update' });
    const setClauses = updates.map(([k], i) => `${k} = $${i + 2}`).join(', ');
    const values = [req.params.id, ...updates.map(([, v]) => v)];
    const result = await query(
      `UPDATE couriers SET ${setClauses}, updated_at = NOW() WHERE id = $1 RETURNING *`, values
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Courier not found' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

// DELETE /api/carriers/couriers/:id
router.delete('/couriers/:id', async (req, res, next) => {
  try {
    const result = await query('DELETE FROM couriers WHERE id = $1 RETURNING id', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Courier not found' });
    res.json({ deleted: true });
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────────────────────
// COURIER SERVICES
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/carriers/services?courier_id=
router.get('/services', async (req, res, next) => {
  try {
    const { courier_id } = req.query;
    let sql = `SELECT cs.*, c.name AS courier_name, c.code AS courier_code,
                COUNT(z.id)::int AS zone_count
               FROM courier_services cs
               JOIN couriers c ON c.id = cs.courier_id
               LEFT JOIN zones z ON z.courier_service_id = cs.id`;
    const values = [];
    if (courier_id) { sql += ' WHERE cs.courier_id = $1'; values.push(courier_id); }
    sql += ' GROUP BY cs.id, c.id ORDER BY c.name, cs.sort_order NULLS LAST, cs.name';
    const result = await query(sql, values);
    res.json(result.rows);
  } catch (err) { next(err); }
});

// GET /api/carriers/services/:id  — full detail with zones, weight bands, etc.
router.get('/services/:id', async (req, res, next) => {
  try {
    const svc = await query(
      `SELECT cs.*, c.name AS courier_name, c.code AS courier_code
       FROM courier_services cs JOIN couriers c ON c.id = cs.courier_id
       WHERE cs.id = $1`, [req.params.id]
    );
    if (!svc.rows.length) return res.status(404).json({ error: 'Service not found' });

    const zones = await query(
      `SELECT z.*,
         COALESCE(json_agg(DISTINCT jsonb_build_object('id',zcc.id,'country_iso',zcc.country_iso)) FILTER (WHERE zcc.id IS NOT NULL), '[]') AS country_codes,
         COALESCE(json_agg(DISTINCT jsonb_build_object('id',zpr.id,'postcode_prefix',zpr.postcode_prefix,'rule_type',zpr.rule_type)) FILTER (WHERE zpr.id IS NOT NULL), '[]') AS postcode_rules,
         COALESCE(json_agg(DISTINCT jsonb_build_object('id',wb.id,'min_weight_kg',wb.min_weight_kg,'max_weight_kg',wb.max_weight_kg,'price_first',wb.price_first,'price_sub',wb.price_sub)) FILTER (WHERE wb.id IS NOT NULL), '[]') AS weight_bands
       FROM zones z
       LEFT JOIN zone_country_codes zcc ON zcc.zone_id = z.id
       LEFT JOIN zone_postcode_rules zpr ON zpr.zone_id = z.id
       LEFT JOIN weight_bands wb ON wb.zone_id = z.id
       WHERE z.courier_service_id = $1
       GROUP BY z.id ORDER BY z.name`, [req.params.id]
    );

    const dimRules = await query(
      'SELECT * FROM dimensional_weight_rules WHERE courier_service_id = $1 ORDER BY name',
      [req.params.id]
    );

    const congestion = await query(
      'SELECT * FROM congestion_surcharges WHERE courier_service_id = $1 ORDER BY postcode_prefix',
      [req.params.id]
    );

    const customRates = await query(
      'SELECT * FROM custom_cost_rate_cards WHERE courier_service_id = $1 ORDER BY name, min_weight_kg',
      [req.params.id]
    );

    res.json({
      ...svc.rows[0],
      zones: zones.rows,
      dimensional_weight_rules: dimRules.rows,
      congestion_surcharges: congestion.rows,
      custom_cost_rate_cards: customRates.rows,
    });
  } catch (err) { next(err); }
});

// POST /api/carriers/services
router.post('/services', async (req, res, next) => {
  try {
    const { courier_id, service_code, name, fuel_surcharge_pct } = req.body;
    if (!courier_id)        return res.status(400).json({ error: 'courier_id is required' });
    if (!service_code?.trim()) return res.status(400).json({ error: 'service_code is required' });
    if (!name?.trim())      return res.status(400).json({ error: 'name is required' });
    const result = await query(
      'INSERT INTO courier_services (courier_id, service_code, name, fuel_surcharge_pct) VALUES ($1,$2,$3,$4) RETURNING *',
      [courier_id, service_code.trim().toUpperCase(), name.trim(), fuel_surcharge_pct || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Service code already exists' });
    next(err);
  }
});

// PUT /api/carriers/couriers/:id/services/reorder
// Body: { service_ids: [3, 1, 5, 2, 4] }  — ordered array assigns sort_order 1,2,3…
router.put('/couriers/:id/services/reorder', async (req, res, next) => {
  try {
    const { service_ids } = req.body;
    if (!Array.isArray(service_ids) || service_ids.length === 0)
      return res.status(400).json({ error: 'service_ids array required' });

    await Promise.all(
      service_ids.map((svcId, i) =>
        query(
          'UPDATE courier_services SET sort_order = $1, updated_at = NOW() WHERE id = $2 AND courier_id = $3',
          [i + 1, svcId, req.params.id]
        )
      )
    );
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// PATCH /api/carriers/services/:id
router.patch('/services/:id', async (req, res, next) => {
  try {
    const allowed = ['service_code', 'name', 'fuel_surcharge_pct'];
    const updates = Object.entries(req.body).filter(([k]) => allowed.includes(k));
    if (!updates.length) return res.status(400).json({ error: 'No valid fields to update' });
    const setClauses = updates.map(([k], i) => `${k} = $${i + 2}`).join(', ');
    const result = await query(
      `UPDATE courier_services SET ${setClauses}, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [req.params.id, ...updates.map(([, v]) => v)]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Service not found' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

// DELETE /api/carriers/services/:id
router.delete('/services/:id', async (req, res, next) => {
  try {
    const result = await query('DELETE FROM courier_services WHERE id = $1 RETURNING id', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Service not found' });
    res.json({ deleted: true });
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────────────────────
// ZONES
// ─────────────────────────────────────────────────────────────────────────────

// POST /api/carriers/zones
router.post('/zones', async (req, res, next) => {
  try {
    const { courier_service_id, name } = req.body;
    if (!courier_service_id) return res.status(400).json({ error: 'courier_service_id is required' });
    if (!name?.trim())       return res.status(400).json({ error: 'name is required' });
    const result = await query(
      'INSERT INTO zones (courier_service_id, name) VALUES ($1,$2) RETURNING *',
      [courier_service_id, name.trim()]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
});

// PATCH /api/carriers/zones/:id
router.patch('/zones/:id', async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'name is required' });
    const result = await query(
      'UPDATE zones SET name = $2, updated_at = NOW() WHERE id = $1 RETURNING *',
      [req.params.id, name.trim()]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Zone not found' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

// DELETE /api/carriers/zones/:id
router.delete('/zones/:id', async (req, res, next) => {
  try {
    const result = await query('DELETE FROM zones WHERE id = $1 RETURNING id', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Zone not found' });
    res.json({ deleted: true });
  } catch (err) { next(err); }
});

// POST /api/carriers/zones/:id/countries
router.post('/zones/:id/countries', async (req, res, next) => {
  try {
    const { country_iso } = req.body;
    if (!country_iso?.trim()) return res.status(400).json({ error: 'country_iso is required' });
    const result = await query(
      'INSERT INTO zone_country_codes (zone_id, country_iso) VALUES ($1,$2) RETURNING *',
      [req.params.id, country_iso.trim().toUpperCase()]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Country code already assigned to this zone' });
    next(err);
  }
});

// DELETE /api/carriers/zones/countries/:id
router.delete('/zones/countries/:id', async (req, res, next) => {
  try {
    await query('DELETE FROM zone_country_codes WHERE id = $1', [req.params.id]);
    res.json({ deleted: true });
  } catch (err) { next(err); }
});

// POST /api/carriers/zones/:id/postcode-rules
router.post('/zones/:id/postcode-rules', async (req, res, next) => {
  try {
    const { postcode_prefix, rule_type } = req.body;
    if (!postcode_prefix?.trim()) return res.status(400).json({ error: 'postcode_prefix is required' });
    if (!['include', 'exclude'].includes(rule_type)) return res.status(400).json({ error: 'rule_type must be include or exclude' });
    const result = await query(
      'INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type) VALUES ($1,$2,$3) RETURNING *',
      [req.params.id, postcode_prefix.trim().toUpperCase(), rule_type]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
});

// DELETE /api/carriers/zones/postcode-rules/:id
router.delete('/zones/postcode-rules/:id', async (req, res, next) => {
  try {
    await query('DELETE FROM zone_postcode_rules WHERE id = $1', [req.params.id]);
    res.json({ deleted: true });
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────────────────────
// WEIGHT BANDS
// ─────────────────────────────────────────────────────────────────────────────

// POST /api/carriers/weight-bands
router.post('/weight-bands', async (req, res, next) => {
  try {
    const { zone_id, min_weight_kg, max_weight_kg, price_first, price_sub } = req.body;
    if (!zone_id)         return res.status(400).json({ error: 'zone_id is required' });
    if (min_weight_kg == null) return res.status(400).json({ error: 'min_weight_kg is required' });
    if (max_weight_kg == null) return res.status(400).json({ error: 'max_weight_kg is required' });
    if (price_first == null)   return res.status(400).json({ error: 'price_first is required' });
    const result = await query(
      'INSERT INTO weight_bands (zone_id, min_weight_kg, max_weight_kg, price_first, price_sub) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [zone_id, min_weight_kg, max_weight_kg, price_first, price_sub || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
});

// PATCH /api/carriers/weight-bands/:id
router.patch('/weight-bands/:id', async (req, res, next) => {
  try {
    const allowed = ['min_weight_kg', 'max_weight_kg', 'price_first', 'price_sub'];
    const updates = Object.entries(req.body).filter(([k]) => allowed.includes(k));
    if (!updates.length) return res.status(400).json({ error: 'No valid fields to update' });
    const setClauses = updates.map(([k], i) => `${k} = $${i + 2}`).join(', ');
    const result = await query(
      `UPDATE weight_bands SET ${setClauses}, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [req.params.id, ...updates.map(([, v]) => v)]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Weight band not found' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

// DELETE /api/carriers/weight-bands/:id
router.delete('/weight-bands/:id', async (req, res, next) => {
  try {
    await query('DELETE FROM weight_bands WHERE id = $1', [req.params.id]);
    res.json({ deleted: true });
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────────────────────
// DIMENSIONAL WEIGHT RULES
// ─────────────────────────────────────────────────────────────────────────────

router.post('/dim-weight-rules', async (req, res, next) => {
  try {
    const { courier_service_id, name, divisor } = req.body;
    if (!courier_service_id) return res.status(400).json({ error: 'courier_service_id is required' });
    if (!name?.trim())       return res.status(400).json({ error: 'name is required' });
    if (!divisor)            return res.status(400).json({ error: 'divisor is required' });
    const result = await query(
      'INSERT INTO dimensional_weight_rules (courier_service_id, name, divisor) VALUES ($1,$2,$3) RETURNING *',
      [courier_service_id, name.trim(), divisor]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
});

router.patch('/dim-weight-rules/:id', async (req, res, next) => {
  try {
    const { name, divisor } = req.body;
    const result = await query(
      'UPDATE dimensional_weight_rules SET name = COALESCE($2,name), divisor = COALESCE($3,divisor), updated_at = NOW() WHERE id = $1 RETURNING *',
      [req.params.id, name || null, divisor || null]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Rule not found' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

router.delete('/dim-weight-rules/:id', async (req, res, next) => {
  try {
    await query('DELETE FROM dimensional_weight_rules WHERE id = $1', [req.params.id]);
    res.json({ deleted: true });
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────────────────────
// CONGESTION SURCHARGES
// ─────────────────────────────────────────────────────────────────────────────

router.post('/congestion-surcharges', async (req, res, next) => {
  try {
    const { courier_service_id, postcode_prefix, fee } = req.body;
    if (!courier_service_id)    return res.status(400).json({ error: 'courier_service_id is required' });
    if (!postcode_prefix?.trim()) return res.status(400).json({ error: 'postcode_prefix is required' });
    if (fee == null)            return res.status(400).json({ error: 'fee is required' });
    const result = await query(
      'INSERT INTO congestion_surcharges (courier_service_id, postcode_prefix, fee) VALUES ($1,$2,$3) RETURNING *',
      [courier_service_id, postcode_prefix.trim().toUpperCase(), fee]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
});

router.patch('/congestion-surcharges/:id', async (req, res, next) => {
  try {
    const { postcode_prefix, fee } = req.body;
    const result = await query(
      'UPDATE congestion_surcharges SET postcode_prefix = COALESCE($2,postcode_prefix), fee = COALESCE($3,fee), updated_at = NOW() WHERE id = $1 RETURNING *',
      [req.params.id, postcode_prefix || null, fee || null]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Surcharge not found' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

router.delete('/congestion-surcharges/:id', async (req, res, next) => {
  try {
    await query('DELETE FROM congestion_surcharges WHERE id = $1', [req.params.id]);
    res.json({ deleted: true });
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────────────────────
// RULES ENGINE
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/carriers/rules
router.get('/rules', async (req, res, next) => {
  try {
    const rules = await query(
      `SELECT r.*, cs.name AS service_name,
         COALESCE(json_agg(jsonb_build_object(
           'id',c.id,'logic_operator',c.logic_operator,
           'json_field_path',c.json_field_path,'operator',c.operator,'value',c.value
         ) ORDER BY c.id) FILTER (WHERE c.id IS NOT NULL), '[]') AS conditions
       FROM rules_engine_rules r
       LEFT JOIN courier_services cs ON cs.id = r.courier_service_id
       LEFT JOIN rules_engine_conditions c ON c.rule_id = r.id
       GROUP BY r.id, cs.name ORDER BY r.name`
    );
    res.json(rules.rows);
  } catch (err) { next(err); }
});

// POST /api/carriers/rules
router.post('/rules', async (req, res, next) => {
  try {
    const { name, courier_service_id, charge_method, charge_value, charge_base, is_active } = req.body;
    if (!name?.trim())    return res.status(400).json({ error: 'name is required' });
    if (!charge_method)   return res.status(400).json({ error: 'charge_method is required' });
    if (charge_value == null) return res.status(400).json({ error: 'charge_value is required' });
    const result = await query(
      'INSERT INTO rules_engine_rules (name, courier_service_id, charge_method, charge_value, charge_base, is_active) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [name.trim(), courier_service_id || null, charge_method, charge_value, charge_base || null, is_active !== false]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
});

// PATCH /api/carriers/rules/:id
router.patch('/rules/:id', async (req, res, next) => {
  try {
    const allowed = ['name', 'courier_service_id', 'charge_method', 'charge_value', 'charge_base', 'is_active'];
    const updates = Object.entries(req.body).filter(([k]) => allowed.includes(k));
    if (!updates.length) return res.status(400).json({ error: 'No valid fields to update' });
    const setClauses = updates.map(([k], i) => `${k} = $${i + 2}`).join(', ');
    const result = await query(
      `UPDATE rules_engine_rules SET ${setClauses}, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [req.params.id, ...updates.map(([, v]) => v)]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Rule not found' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

// DELETE /api/carriers/rules/:id
router.delete('/rules/:id', async (req, res, next) => {
  try {
    await query('DELETE FROM rules_engine_rules WHERE id = $1', [req.params.id]);
    res.json({ deleted: true });
  } catch (err) { next(err); }
});

// POST /api/carriers/rules/:id/conditions
router.post('/rules/:id/conditions', async (req, res, next) => {
  try {
    const { logic_operator, json_field_path, operator, value } = req.body;
    if (!json_field_path?.trim()) return res.status(400).json({ error: 'json_field_path is required' });
    if (!operator)                return res.status(400).json({ error: 'operator is required' });
    if (value == null)            return res.status(400).json({ error: 'value is required' });
    const result = await query(
      'INSERT INTO rules_engine_conditions (rule_id, logic_operator, json_field_path, operator, value) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [req.params.id, logic_operator || 'AND', json_field_path.trim(), operator, String(value)]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
});

// DELETE /api/carriers/rules/conditions/:id
router.delete('/rules/conditions/:id', async (req, res, next) => {
  try {
    await query('DELETE FROM rules_engine_conditions WHERE id = $1', [req.params.id]);
    res.json({ deleted: true });
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────────────────────
// CUSTOM COST RATE CARDS
// ─────────────────────────────────────────────────────────────────────────────

router.post('/custom-cost-rates', async (req, res, next) => {
  try {
    const { courier_service_id, zone_id, name, min_weight_kg, max_weight_kg, price_first, price_sub, active_from, active_to } = req.body;
    if (!courier_service_id) return res.status(400).json({ error: 'courier_service_id is required' });
    if (!zone_id)            return res.status(400).json({ error: 'zone_id is required' });
    if (min_weight_kg == null) return res.status(400).json({ error: 'min_weight_kg is required' });
    if (max_weight_kg == null) return res.status(400).json({ error: 'max_weight_kg is required' });
    if (price_first == null)   return res.status(400).json({ error: 'price_first is required' });
    const result = await query(
      'INSERT INTO custom_cost_rate_cards (courier_service_id, zone_id, name, min_weight_kg, max_weight_kg, price_first, price_sub, active_from, active_to) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *',
      [courier_service_id, zone_id, name || null, min_weight_kg, max_weight_kg, price_first, price_sub || null, active_from || null, active_to || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
});

router.patch('/custom-cost-rates/:id', async (req, res, next) => {
  try {
    const allowed = ['name', 'min_weight_kg', 'max_weight_kg', 'price_first', 'price_sub', 'active_from', 'active_to'];
    const updates = Object.entries(req.body).filter(([k]) => allowed.includes(k));
    if (!updates.length) return res.status(400).json({ error: 'No valid fields to update' });
    const setClauses = updates.map(([k], i) => `${k} = $${i + 2}`).join(', ');
    const result = await query(
      `UPDATE custom_cost_rate_cards SET ${setClauses}, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [req.params.id, ...updates.map(([, v]) => v)]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Rate card not found' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

router.delete('/custom-cost-rates/:id', async (req, res, next) => {
  try {
    await query('DELETE FROM custom_cost_rate_cards WHERE id = $1', [req.params.id]);
    res.json({ deleted: true });
  } catch (err) { next(err); }
});

// ─────────────────────────────────────────────────────────────────────────────
// COURIER ADDITIONAL CONTACTS
// ─────────────────────────────────────────────────────────────────────────────

// POST /api/carriers/couriers/:id/contacts
router.post('/couriers/:id/contacts', async (req, res, next) => {
  try {
    const { name, phone, email, department, role, notes } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'name is required' });
    const result = await query(
      `INSERT INTO courier_contacts (courier_id, name, phone, email, department, role, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [req.params.id, name.trim(), phone||null, email||null, department||null, role||null, notes||null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
});

// PATCH /api/carriers/couriers/contacts/:id
router.patch('/couriers/contacts/:id', async (req, res, next) => {
  try {
    const allowed = ['name','phone','email','department','role','notes'];
    const updates = Object.entries(req.body).filter(([k]) => allowed.includes(k));
    if (!updates.length) return res.status(400).json({ error: 'No valid fields' });
    const setClauses = updates.map(([k],i) => `${k} = $${i+2}`).join(', ');
    const result = await query(
      `UPDATE courier_contacts SET ${setClauses}, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [req.params.id, ...updates.map(([,v]) => v)]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Contact not found' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

// DELETE /api/carriers/couriers/contacts/:id
router.delete('/couriers/contacts/:id', async (req, res, next) => {
  try {
    await query('DELETE FROM courier_contacts WHERE id = $1', [req.params.id]);
    res.json({ deleted: true });
  } catch (err) { next(err); }
});

export default router;
