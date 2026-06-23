/**
 * Moov OS — Automation Rules API  (/api/automation-rules)
 *
 * The single unified engine that replaced the old SLA Rules + SLA/Autopilot
 * Switchboard. Each rule is WHEN (conditions) → THEN (priority, SLA window,
 * scream toggle, autopilot mode). Evaluated first-match by ascending position.
 */

import express from 'express';
import { query } from '../db/index.js';
import { TRUST_CAP } from '../services/workflowTrust.js';

const router = express.Router();

const PRIORITIES = ['urgent', 'high', 'medium', 'low'];
const MODES      = ['off', 'draft', 'full'];

const EDITABLE = [
  'name', 'position', 'is_active',
  'cond_subject_contains', 'cond_courier_code', 'cond_query_type', 'cond_customer_tier',
  'set_priority', 'response_minutes', 'resolution_minutes', 'scream_to_google_chat', 'autopilot_mode',
];

// Empty string → NULL so "no condition" is stored cleanly.
function clean(v) {
  if (v === '' || v === undefined) return null;
  return v;
}

// GET /api/automation-rules  → ordered rules + the autopilot trust cap for the UI.
router.get('/', async (req, res, next) => {
  try {
    const r = await query(`SELECT * FROM automation_rules ORDER BY position ASC, created_at ASC`);
    res.json({ rules: r.rows, trust_cap: TRUST_CAP });
  } catch (err) { next(err); }
});

// POST /api/automation-rules
router.post('/', async (req, res, next) => {
  try {
    const b = req.body || {};
    if (!b.name?.trim()) return res.status(400).json({ error: 'name is required' });
    if (b.set_priority && !PRIORITIES.includes(b.set_priority)) return res.status(400).json({ error: 'invalid set_priority' });
    if (b.autopilot_mode && !MODES.includes(b.autopilot_mode)) return res.status(400).json({ error: 'invalid autopilot_mode' });

    const r = await query(
      `INSERT INTO automation_rules
        (name, position, is_active, cond_subject_contains, cond_courier_code, cond_query_type,
         cond_customer_tier, set_priority, response_minutes, resolution_minutes,
         scream_to_google_chat, autopilot_mode)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [
        b.name.trim(),
        Number.isFinite(+b.position) ? +b.position : 100,
        b.is_active !== false,
        clean(b.cond_subject_contains), clean(b.cond_courier_code), clean(b.cond_query_type),
        clean(b.cond_customer_tier), clean(b.set_priority),
        clean(b.response_minutes) == null ? null : +b.response_minutes,
        clean(b.resolution_minutes) == null ? null : +b.resolution_minutes,
        b.scream_to_google_chat !== false,
        MODES.includes(b.autopilot_mode) ? b.autopilot_mode : 'draft',
      ],
    );
    res.status(201).json(r.rows[0]);
  } catch (err) { next(err); }
});

// PATCH /api/automation-rules/:id
router.patch('/:id', async (req, res, next) => {
  try {
    const updates = Object.entries(req.body || {}).filter(([k]) => EDITABLE.includes(k));
    if (!updates.length) return res.status(400).json({ error: 'No valid fields' });
    if (req.body.set_priority && !PRIORITIES.includes(req.body.set_priority)) return res.status(400).json({ error: 'invalid set_priority' });
    if (req.body.autopilot_mode && !MODES.includes(req.body.autopilot_mode)) return res.status(400).json({ error: 'invalid autopilot_mode' });

    const set    = updates.map(([k], i) => `${k} = $${i + 2}`).join(', ');
    const values = [req.params.id, ...updates.map(([k, v]) =>
      ['cond_subject_contains', 'cond_courier_code', 'cond_query_type', 'cond_customer_tier', 'set_priority'].includes(k) ? clean(v) : v,
    )];
    const r = await query(`UPDATE automation_rules SET ${set}, updated_at = NOW() WHERE id = $1 RETURNING *`, values);
    if (!r.rows.length) return res.status(404).json({ error: 'Rule not found' });
    res.json(r.rows[0]);
  } catch (err) { next(err); }
});

// DELETE /api/automation-rules/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const r = await query(`DELETE FROM automation_rules WHERE id = $1 RETURNING id`, [req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'Rule not found' });
    res.json({ deleted: true });
  } catch (err) { next(err); }
});

export default router;
