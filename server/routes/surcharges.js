/**
 * Surcharges API
 *
 * Surcharge definitions (per carrier), rules (filter conditions), and
 * customer-specific overrides.
 *
 * Routes:
 *   GET    /api/surcharges?courier_id=X      — list surcharges (with rules)
 *   POST   /api/surcharges                   — create surcharge
 *   PATCH  /api/surcharges/:id               — update surcharge
 *   DELETE /api/surcharges/:id               — delete surcharge
 *
 *   POST   /api/surcharges/:id/rules         — add rule to surcharge
 *   PATCH  /api/surcharges/:id/rules/:rid    — update rule
 *   DELETE /api/surcharges/:id/rules/:rid    — delete rule
 *
 *   GET    /api/surcharges/customer-overrides/:customerId   — list overrides
 *   POST   /api/surcharges/customer-overrides/:customerId   — upsert override
 *   DELETE /api/surcharges/customer-overrides/:customerId/:oid — remove override
 */

const express = require('express');
const router  = express.Router();
const { query } = require('../db');

// ── Surcharge definitions ─────────────────────────────────────────────────────

router.get('/', async (req, res, next) => {
  try {
    const { courier_id } = req.query;
    let sql = `
      SELECT s.*,
             c.code AS courier_code,
             c.name AS courier_name,
             COALESCE((
               SELECT json_agg(r ORDER BY r.created_at)
               FROM surcharge_rules r
               WHERE r.surcharge_id = s.id
             ), '[]'::json) AS rules
      FROM surcharges s
      JOIN couriers c ON c.id = s.courier_id
      WHERE 1=1
    `;
    const params = [];
    if (courier_id) {
      params.push(courier_id);
      sql += ` AND s.courier_id = $${params.length}`;
    }
    sql += ' ORDER BY c.name, s.name';
    const { rows } = await query(sql, params);
    res.json(rows);
  } catch (e) { next(e); }
});

router.post('/', async (req, res, next) => {
  try {
    const { courier_id, code, name, description, calc_type, calc_base, default_value } = req.body;
    if (!courier_id || !code || !name) {
      return res.status(400).json({ error: 'courier_id, code, and name are required' });
    }
    const { rows } = await query(
      `INSERT INTO surcharges (courier_id, code, name, description, calc_type, calc_base, default_value)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING *`,
      [
        courier_id, code.toUpperCase().trim(), name.trim(),
        description || null,
        calc_type || 'flat',
        calc_base || 'fixed',
        parseFloat(default_value) || 0,
      ]
    );
    res.status(201).json(rows[0]);
  } catch (e) { next(e); }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const allowed = ['code', 'name', 'description', 'calc_type', 'calc_base', 'default_value', 'active'];
    const sets = []; const vals = [];
    for (const k of allowed) {
      if (req.body[k] !== undefined) {
        vals.push(k === 'code' ? String(req.body[k]).toUpperCase().trim() : req.body[k]);
        sets.push(`${k}=$${vals.length}`);
      }
    }
    if (!sets.length) return res.json({});
    vals.push(req.params.id);
    const { rows } = await query(
      `UPDATE surcharges SET ${sets.join(',')}, updated_at=NOW() WHERE id=$${vals.length} RETURNING *`,
      vals
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (e) { next(e); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await query('DELETE FROM surcharges WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// ── Rules ─────────────────────────────────────────────────────────────────────

router.post('/:id/rules', async (req, res, next) => {
  try {
    const { name, filters } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });
    const { rows } = await query(
      `INSERT INTO surcharge_rules (surcharge_id, name, filters)
       VALUES ($1,$2,$3)
       RETURNING *`,
      [req.params.id, name.trim(), JSON.stringify(Array.isArray(filters) ? filters : [])]
    );
    res.status(201).json(rows[0]);
  } catch (e) { next(e); }
});

router.patch('/:id/rules/:rid', async (req, res, next) => {
  try {
    const allowed = ['name', 'filters', 'active'];
    const sets = []; const vals = [];
    for (const k of allowed) {
      if (req.body[k] !== undefined) {
        vals.push(k === 'filters' ? JSON.stringify(req.body[k]) : req.body[k]);
        sets.push(`${k}=$${vals.length}`);
      }
    }
    if (!sets.length) return res.json({});
    vals.push(req.params.rid);
    const { rows } = await query(
      `UPDATE surcharge_rules SET ${sets.join(',')}, updated_at=NOW()
       WHERE id=$${vals.length}
       RETURNING *`,
      vals
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (e) { next(e); }
});

router.delete('/:id/rules/:rid', async (req, res, next) => {
  try {
    await query('DELETE FROM surcharge_rules WHERE id=$1 AND surcharge_id=$2', [req.params.rid, req.params.id]);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// ── Customer overrides ─────────────────────────────────────────────────────────
// Must come BEFORE /:id so Express doesn't try to match 'customer-overrides' as an id

router.get('/customer-overrides/:customerId', async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT cso.*,
              s.code,
              s.name          AS surcharge_name,
              s.calc_type,
              s.calc_base,
              s.default_value,
              c.name          AS courier_name,
              c.code          AS courier_code
       FROM customer_surcharge_overrides cso
       JOIN surcharges s ON s.id = cso.surcharge_id
       JOIN couriers   c ON c.id = s.courier_id
       WHERE cso.customer_id = $1
       ORDER BY c.name, s.name`,
      [req.params.customerId]
    );
    res.json(rows);
  } catch (e) { next(e); }
});

router.post('/customer-overrides/:customerId', async (req, res, next) => {
  try {
    const { surcharge_id, override_value } = req.body;
    if (!surcharge_id || override_value === undefined) {
      return res.status(400).json({ error: 'surcharge_id and override_value are required' });
    }
    const { rows } = await query(
      `INSERT INTO customer_surcharge_overrides (customer_id, surcharge_id, override_value)
       VALUES ($1,$2,$3)
       ON CONFLICT (customer_id, surcharge_id)
       DO UPDATE SET override_value=$3, active=true, updated_at=NOW()
       RETURNING *`,
      [req.params.customerId, surcharge_id, parseFloat(override_value)]
    );
    res.status(201).json(rows[0]);
  } catch (e) { next(e); }
});

router.delete('/customer-overrides/:customerId/:overrideId', async (req, res, next) => {
  try {
    await query(
      'DELETE FROM customer_surcharge_overrides WHERE id=$1 AND customer_id=$2',
      [req.params.overrideId, req.params.customerId]
    );
    res.json({ ok: true });
  } catch (e) { next(e); }
});

module.exports = router;
