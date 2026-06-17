/**
 * Moov OS — Teams
 * Onboarding / Service / Finance teams, each with a shared inbox email and members.
 * Mounted at /api/teams.
 */
import express from 'express';
import { query } from '../db/index.js';

const router = express.Router();

// GET /api/teams — teams with member list
router.get('/', async (_req, res, next) => {
  try {
    const { rows } = await query(`
      SELECT t.*,
        COALESCE(
          (SELECT json_agg(json_build_object('id', s.id, 'full_name', s.full_name, 'email', s.email) ORDER BY s.full_name)
           FROM staff s WHERE s.team_id = t.id AND s.is_active = true), '[]'
        ) AS members
      FROM teams t ORDER BY t.position, t.name
    `);
    res.json(rows);
  } catch (err) { next(err); }
});

// PATCH /api/teams/:id — edit name / inbox email
router.patch('/:id', async (req, res, next) => {
  try {
    const fields = ['name', 'inbox_email'];
    const sets = [], vals = [];
    let i = 1;
    for (const f of fields) if (req.body[f] !== undefined) { sets.push(`${f} = $${i++}`); vals.push(req.body[f]); }
    if (!sets.length) return res.status(400).json({ error: 'No fields to update' });
    vals.push(req.params.id);
    const { rows } = await query(
      `UPDATE teams SET ${sets.join(', ')}, updated_at = NOW() WHERE id = $${i} RETURNING *`, vals);
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

export default router;
