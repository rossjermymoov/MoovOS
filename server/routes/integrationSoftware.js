/**
 * Moov OS — Integration Software list
 * A reusable, growing list of third-party shipping software names so they
 * appear in dropdowns for future customers. Mounted at /api/integration-software.
 */
import express from 'express';
import { query } from '../db/index.js';

const router = express.Router();

router.get('/', async (_req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT id, name FROM integration_software WHERE is_active = TRUE ORDER BY name`);
    res.json(rows);
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const name = (req.body?.name || '').trim();
    if (!name) return res.status(400).json({ error: 'name is required' });
    const { rows } = await query(`
      INSERT INTO integration_software (name) VALUES ($1)
      ON CONFLICT (LOWER(name)) DO UPDATE SET is_active = TRUE
      RETURNING id, name
    `, [name]);
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

export default router;
