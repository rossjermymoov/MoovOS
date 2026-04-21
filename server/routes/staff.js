/**
 * Moov OS — Staff API
 * Used to populate dropdowns and manage internal staff/users
 */

import express from 'express';
import { query } from '../db/index.js';

const router = express.Router();

const VALID_ROLES = ['sales', 'account_management', 'onboarding', 'finance', 'customer_service', 'manager', 'director'];

// GET /api/staff  — list active staff, optionally filtered by role
router.get('/', async (req, res, next) => {
  try {
    const { role } = req.query;
    let sql = 'SELECT id, full_name, email, role, is_active FROM staff WHERE is_active = true';
    const values = [];
    if (role) { sql += ' AND role = $1'; values.push(role); }
    sql += ' ORDER BY full_name';
    const result = await query(sql, values);
    res.json(result.rows);
  } catch (err) { next(err); }
});

// GET /api/staff/all  — all staff including inactive (for settings page)
router.get('/all', async (req, res, next) => {
  try {
    const result = await query(
      'SELECT id, full_name, email, role, is_active, created_at FROM staff ORDER BY is_active DESC, full_name'
    );
    res.json(result.rows);
  } catch (err) { next(err); }
});

// GET /api/staff/:id
router.get('/:id', async (req, res, next) => {
  try {
    const result = await query('SELECT * FROM staff WHERE id = $1', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Staff member not found' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

// POST /api/staff  — create staff member
router.post('/', async (req, res, next) => {
  try {
    const { full_name, email, role } = req.body;
    if (!full_name?.trim()) return res.status(400).json({ error: 'full_name is required' });
    if (!email?.trim())     return res.status(400).json({ error: 'email is required' });
    if (!VALID_ROLES.includes(role)) return res.status(400).json({ error: `role must be one of: ${VALID_ROLES.join(', ')}` });

    const result = await query(
      'INSERT INTO staff (full_name, email, role) VALUES ($1, $2, $3) RETURNING *',
      [full_name.trim(), email.trim().toLowerCase(), role]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'A staff member with that email already exists' });
    next(err);
  }
});

// PATCH /api/staff/:id  — update or deactivate
router.patch('/:id', async (req, res, next) => {
  try {
    const allowed = ['full_name', 'email', 'role', 'is_active'];
    const updates = Object.entries(req.body).filter(([k]) => allowed.includes(k));
    if (!updates.length) return res.status(400).json({ error: 'No valid fields to update' });

    const setClauses = updates.map(([k], i) => `${k} = $${i + 2}`).join(', ');
    const values = [req.params.id, ...updates.map(([, v]) => v)];

    const result = await query(
      `UPDATE staff SET ${setClauses} WHERE id = $1 RETURNING *`,
      values
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Staff member not found' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

export default router;
