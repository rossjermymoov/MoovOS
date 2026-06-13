/**
 * settings.js — Moov OS settings APIs
 *
 * Carrier communication templates (Top-and-Tail header/footer boilerplate that
 * wraps Gemini's dynamic middle analysis on outbound drafts).
 *
 *   GET /api/settings/couriers
 *   PUT /api/settings/couriers/:courier_code/templates
 */

import express from 'express';
import { query } from '../db/index.js';

const router = express.Router();

// Editable columns: the two routing endpoints + the four boilerplate templates.
const EDITABLE_COLS = [
  'queries_email',
  'claims_email',
  'tracking_pattern',
  'tracking_example',
  'courier_header_template',
  'courier_footer_template',
  'customer_header_template',
  'customer_footer_template',
];

// GET /api/settings/couriers — list courier routing rules incl. templates.
router.get('/couriers', async (req, res, next) => {
  try {
    const result = await query(`
      SELECT courier_code, courier_name, queries_email, claims_email, is_active,
             tracking_pattern, tracking_example,
             courier_header_template, courier_footer_template,
             customer_header_template, customer_footer_template
      FROM courier_routing_rules
      ORDER BY courier_code
    `);
    res.json(result.rows);
  } catch (err) { next(err); }
});

// PUT /api/settings/couriers/:courier_code/templates — update the 4 boilerplates.
router.put('/couriers/:courier_code/templates', async (req, res, next) => {
  try {
    const code    = (req.params.courier_code || '').toLowerCase();
    const updates = Object.entries(req.body).filter(([k]) => EDITABLE_COLS.includes(k));
    if (!updates.length) return res.status(400).json({ error: 'No valid fields provided' });

    const set    = updates.map(([k], i) => `${k} = $${i + 2}`).join(', ');
    const values = [code, ...updates.map(([, v]) => (v == null ? null : String(v)))];
    const result = await query(
      `UPDATE courier_routing_rules SET ${set}, updated_at = NOW() WHERE courier_code = $1 RETURNING *`,
      values,
    );
    if (!result.rows.length) return res.status(404).json({ error: `No courier routing rule for '${code}'` });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

export default router;
