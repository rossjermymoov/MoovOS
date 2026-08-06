/**
 * Moov OS — Tasks board configuration  (mounted at /api/task-config)
 *
 * Stores the editable spaces + status columns as a single JSON blob shared by
 * the whole team. Keys within are stable; only labels/colours/order change.
 *
 *   GET /   → the config object ({} if never configured — client falls back to defaults)
 *   PUT /   → replace the config object
 */
import express from 'express';
import { query } from '../db/index.js';

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const r = await query(`SELECT data FROM task_config WHERE id = 1`);
    res.json(r.rows[0]?.data || {});
  } catch (err) { next(err); }
});

router.put('/', async (req, res, next) => {
  try {
    const data = (req.body && typeof req.body === 'object' && !Array.isArray(req.body)) ? req.body : {};
    await query(
      `INSERT INTO task_config (id, data, updated_at) VALUES (1, $1::jsonb, NOW())
       ON CONFLICT (id) DO UPDATE SET data = $1::jsonb, updated_at = NOW()`,
      [JSON.stringify(data)]
    );
    res.json(data);
  } catch (err) { next(err); }
});

export default router;
