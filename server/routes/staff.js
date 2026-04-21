/**
 * Moov OS — Staff API
 * Used to populate dropdowns across the system (salesperson, account manager, onboarding)
 */

import express from 'express';
import { query } from '../db/index.js';

const router = express.Router();

// GET /api/staff  — list all active staff, optionally filtered by role
router.get('/', async (req, res, next) => {
  try {
    const { role } = req.query;
    let sql = 'SELECT id, full_name, email, role FROM staff WHERE is_active = true';
    const values = [];

    if (role) {
      sql += ' AND role = $1';
      values.push(role);
    }

    sql += ' ORDER BY full_name';

    const result = await query(sql, values);
    res.json(result.rows);
  } catch (err) { next(err); }
});

// GET /api/staff/:id
router.get('/:id', async (req, res, next) => {
  try {
    const result = await query(
      'SELECT id, full_name, email, role FROM staff WHERE id = $1 AND is_active = true',
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Staff member not found' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

export default router;
