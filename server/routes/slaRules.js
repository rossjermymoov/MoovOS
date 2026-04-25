/**
 * Moov OS — SLA Policies & Rules API
 *
 * GET/POST/PATCH/DELETE /api/sla/policies
 * GET/POST/PATCH/DELETE /api/sla/rules
 */

import express from 'express';
import { query } from '../db/index.js';

const router = express.Router();

// ─── SLA Policies ─────────────────────────────────────────────

// GET /api/sla/policies
router.get('/policies', async (req, res, next) => {
  try {
    const result = await query(
      'SELECT * FROM sla_policies ORDER BY priority DESC, name'
    );
    res.json(result.rows);
  } catch (err) { next(err); }
});

// POST /api/sla/policies
router.post('/policies', async (req, res, next) => {
  try {
    const { name, courier_code, query_type, duration_hours, priority = 0 } = req.body;
    if (!name?.trim())                    return res.status(400).json({ error: 'name is required' });
    if (!duration_hours || isNaN(+duration_hours)) return res.status(400).json({ error: 'duration_hours must be a number' });

    const result = await query(
      `INSERT INTO sla_policies (name, courier_code, query_type, duration_hours, priority)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [name.trim(), courier_code || null, query_type || null, +duration_hours, +priority]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
});

// PATCH /api/sla/policies/:id
router.patch('/policies/:id', async (req, res, next) => {
  try {
    const allowed = ['name', 'courier_code', 'query_type', 'duration_hours', 'priority', 'is_active'];
    const updates = Object.entries(req.body).filter(([k]) => allowed.includes(k));
    if (!updates.length) return res.status(400).json({ error: 'No valid fields' });

    const set    = updates.map(([k], i) => `${k} = $${i + 2}`).join(', ');
    const values = [req.params.id, ...updates.map(([, v]) => v)];
    const result = await query(`UPDATE sla_policies SET ${set} WHERE id = $1 RETURNING *`, values);
    if (!result.rows.length) return res.status(404).json({ error: 'Policy not found' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

// DELETE /api/sla/policies/:id
router.delete('/policies/:id', async (req, res, next) => {
  try {
    const result = await query('DELETE FROM sla_policies WHERE id = $1 RETURNING id', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Policy not found' });
    res.json({ deleted: true });
  } catch (err) { next(err); }
});

// ─── SLA Rules ────────────────────────────────────────────────

// GET /api/sla/rules
router.get('/rules', async (req, res, next) => {
  try {
    const result = await query(`
      SELECT r.*, p.name AS policy_name, p.duration_hours AS policy_hours
      FROM sla_rules r
      LEFT JOIN sla_policies p ON p.id = r.policy_id
      ORDER BY r.priority DESC, r.name
    `);
    res.json(result.rows);
  } catch (err) { next(err); }
});

// POST /api/sla/rules
router.post('/rules', async (req, res, next) => {
  try {
    const { name, condition_type, condition_value, policy_id, priority = 0 } = req.body;
    if (!name?.trim())            return res.status(400).json({ error: 'name is required' });
    if (!condition_type)          return res.status(400).json({ error: 'condition_type is required' });
    if (!condition_value?.trim()) return res.status(400).json({ error: 'condition_value is required' });
    if (!policy_id)               return res.status(400).json({ error: 'policy_id is required' });

    const result = await query(
      `INSERT INTO sla_rules (name, condition_type, condition_value, policy_id, priority)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [name.trim(), condition_type, condition_value.trim(), policy_id, +priority]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
});

// PATCH /api/sla/rules/:id
router.patch('/rules/:id', async (req, res, next) => {
  try {
    const allowed = ['name', 'condition_type', 'condition_value', 'policy_id', 'priority', 'is_active'];
    const updates = Object.entries(req.body).filter(([k]) => allowed.includes(k));
    if (!updates.length) return res.status(400).json({ error: 'No valid fields' });

    const set    = updates.map(([k], i) => `${k} = $${i + 2}`).join(', ');
    const values = [req.params.id, ...updates.map(([, v]) => v)];
    const result = await query(`UPDATE sla_rules SET ${set} WHERE id = $1 RETURNING *`, values);
    if (!result.rows.length) return res.status(404).json({ error: 'Rule not found' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

// DELETE /api/sla/rules/:id
router.delete('/rules/:id', async (req, res, next) => {
  try {
    const result = await query('DELETE FROM sla_rules WHERE id = $1 RETURNING id', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Rule not found' });
    res.json({ deleted: true });
  } catch (err) { next(err); }
});

export default router;
