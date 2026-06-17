/**
 * Moov OS — Onboarding Template Engine API (definition side)
 * Mounted at /api/onboarding-templates (see index.js).
 *
 *   Templates:  CRUD + nested stages, tasks, dependencies
 *   Comms:      CRUD email-template library (/comms…)
 */

import express from 'express';
import { query } from '../db/index.js';

const router = express.Router();

// ════════════════════════════════════════════════════════════════════
// COMMS TEMPLATE LIBRARY
// ════════════════════════════════════════════════════════════════════
router.get('/comms', async (_req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT * FROM onboarding_comms_templates ORDER BY is_active DESC, name`
    );
    res.json(rows);
  } catch (err) { next(err); }
});

router.post('/comms', async (req, res, next) => {
  try {
    const { name, description, subject, body_html, body_text, variables } = req.body || {};
    if (!name || !subject || !body_html) {
      return res.status(400).json({ error: 'name, subject and body_html are required' });
    }
    const { rows } = await query(`
      INSERT INTO onboarding_comms_templates (name, description, subject, body_html, body_text, variables)
      VALUES ($1, $2, $3, $4, $5, COALESCE($6,'[]')::jsonb)
      RETURNING *
    `, [name, description || null, subject, body_html, body_text || null, JSON.stringify(variables || [])]);
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

router.patch('/comms/:id', async (req, res, next) => {
  try {
    const fields = ['name', 'description', 'subject', 'body_html', 'body_text', 'is_active'];
    const sets = [], vals = [];
    let i = 1;
    for (const f of fields) {
      if (req.body[f] !== undefined) { sets.push(`${f} = $${i++}`); vals.push(req.body[f]); }
    }
    if (req.body.variables !== undefined) { sets.push(`variables = $${i++}::jsonb`); vals.push(JSON.stringify(req.body.variables)); }
    if (!sets.length) return res.status(400).json({ error: 'No fields to update' });
    vals.push(req.params.id);
    const { rows } = await query(
      `UPDATE onboarding_comms_templates SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`, vals);
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

router.delete('/comms/:id', async (req, res, next) => {
  try {
    await query(`DELETE FROM onboarding_comms_templates WHERE id = $1`, [req.params.id]);
    res.status(204).end();
  } catch (err) { next(err); }
});

// ════════════════════════════════════════════════════════════════════
// TEMPLATES
// ════════════════════════════════════════════════════════════════════
router.get('/', async (_req, res, next) => {
  try {
    const { rows } = await query(`
      SELECT t.*,
        (SELECT COUNT(*) FROM onboarding_template_stages s WHERE s.template_id = t.id)::int AS stage_count,
        (SELECT COUNT(*) FROM onboarding_template_tasks  k WHERE k.template_id = t.id)::int AS task_count
      FROM onboarding_templates t
      ORDER BY t.is_active DESC, t.is_default DESC, t.name
    `);
    res.json(rows);
  } catch (err) { next(err); }
});

// Full template tree: stages (ordered) → tasks (ordered) → dependency ids.
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const tmpl = await query(`SELECT * FROM onboarding_templates WHERE id = $1`, [id]);
    if (!tmpl.rows[0]) return res.status(404).json({ error: 'Not found' });

    const [stages, tasks, deps] = await Promise.all([
      query(`SELECT * FROM onboarding_template_stages WHERE template_id = $1 ORDER BY position, created_at`, [id]),
      query(`SELECT * FROM onboarding_template_tasks  WHERE template_id = $1 ORDER BY position, created_at`, [id]),
      query(`SELECT d.* FROM onboarding_template_task_deps d
             JOIN onboarding_template_tasks k ON k.id = d.task_id WHERE k.template_id = $1`, [id]),
    ]);

    const depByTask = {};
    deps.rows.forEach(d => { (depByTask[d.task_id] ||= []).push(d.depends_on_id); });

    const stageList = stages.rows.map(s => ({
      ...s,
      tasks: tasks.rows
        .filter(k => k.stage_id === s.id)
        .map(k => ({ ...k, depends_on: depByTask[k.id] || [] })),
    }));

    res.json({ ...tmpl.rows[0], stages: stageList });
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const { name, code, description, customer_type, is_default, created_by,
            applicable_tiers, applicable_methods } = req.body || {};
    if (!name) return res.status(400).json({ error: 'name is required' });
    const { rows } = await query(`
      INSERT INTO onboarding_templates
        (name, code, description, customer_type, is_default, created_by, applicable_tiers, applicable_methods)
      VALUES ($1, $2, $3, COALESCE($4,'custom')::onboarding_customer_type, COALESCE($5,false), $6,
              COALESCE($7::text[],'{}'), COALESCE($8::text[],'{}'))
      RETURNING *
    `, [name, code || null, description || null, customer_type || null, is_default || false, created_by || null,
        applicable_tiers || [], applicable_methods || []]);
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const fields = ['name', 'code', 'description', 'customer_type', 'is_active', 'is_default',
      'applicable_tiers', 'applicable_methods'];
    const sets = [], vals = [];
    let i = 1;
    for (const f of fields) {
      if (req.body[f] !== undefined) {
        if (f === 'customer_type') { sets.push(`customer_type = $${i++}::onboarding_customer_type`); }
        else { sets.push(`${f} = $${i++}`); }
        vals.push(req.body[f]);
      }
    }
    if (!sets.length) return res.status(400).json({ error: 'No fields to update' });
    vals.push(req.params.id);
    const { rows } = await query(
      `UPDATE onboarding_templates SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`, vals);
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await query(`DELETE FROM onboarding_templates WHERE id = $1`, [req.params.id]);
    res.status(204).end();
  } catch (err) { next(err); }
});

// ─── Stages ─────────────────────────────────────────────────────────
router.post('/:id/stages', async (req, res, next) => {
  try {
    const { name, description, position } = req.body || {};
    if (!name) return res.status(400).json({ error: 'name is required' });
    const pos = position ?? (await nextPosition('onboarding_template_stages', 'template_id', req.params.id));
    const { rows } = await query(`
      INSERT INTO onboarding_template_stages (template_id, name, description, position)
      VALUES ($1, $2, $3, $4) RETURNING *
    `, [req.params.id, name, description || null, pos]);
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

router.patch('/stages/:stageId', async (req, res, next) => {
  try {
    const fields = ['name', 'description', 'position'];
    const sets = [], vals = [];
    let i = 1;
    for (const f of fields) if (req.body[f] !== undefined) { sets.push(`${f} = $${i++}`); vals.push(req.body[f]); }
    if (!sets.length) return res.status(400).json({ error: 'No fields to update' });
    vals.push(req.params.stageId);
    const { rows } = await query(
      `UPDATE onboarding_template_stages SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`, vals);
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

router.delete('/stages/:stageId', async (req, res, next) => {
  try {
    await query(`DELETE FROM onboarding_template_stages WHERE id = $1`, [req.params.stageId]);
    res.status(204).end();
  } catch (err) { next(err); }
});

// ─── Tasks ──────────────────────────────────────────────────────────
router.post('/:id/tasks', async (req, res, next) => {
  try {
    const b = req.body || {};
    if (!b.stage_id || !b.title) return res.status(400).json({ error: 'stage_id and title are required' });
    const pos = b.position ?? (await nextPosition('onboarding_template_tasks', 'stage_id', b.stage_id));
    const { rows } = await query(`
      INSERT INTO onboarding_template_tasks
        (template_id, stage_id, parent_task_id, title, description, position,
         default_assignee_id, target_duration_hours, is_required, comms_template_id, auto_send_comms)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,COALESCE($9,true),$10,COALESCE($11,false))
      RETURNING *
    `, [req.params.id, b.stage_id, b.parent_task_id || null, b.title, b.description || null, pos,
        b.default_assignee_id || null, b.target_duration_hours || null, b.is_required,
        b.comms_template_id || null, b.auto_send_comms]);
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

router.patch('/tasks/:taskId', async (req, res, next) => {
  try {
    const fields = ['stage_id', 'parent_task_id', 'title', 'description', 'position',
      'default_assignee_id', 'target_duration_hours', 'is_required', 'comms_template_id', 'auto_send_comms'];
    const sets = [], vals = [];
    let i = 1;
    for (const f of fields) if (req.body[f] !== undefined) { sets.push(`${f} = $${i++}`); vals.push(req.body[f]); }
    if (!sets.length) return res.status(400).json({ error: 'No fields to update' });
    vals.push(req.params.taskId);
    const { rows } = await query(
      `UPDATE onboarding_template_tasks SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`, vals);
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

router.delete('/tasks/:taskId', async (req, res, next) => {
  try {
    await query(`DELETE FROM onboarding_template_tasks WHERE id = $1`, [req.params.taskId]);
    res.status(204).end();
  } catch (err) { next(err); }
});

// ─── Task dependencies ──────────────────────────────────────────────
router.post('/tasks/:taskId/deps', async (req, res, next) => {
  try {
    const { depends_on_id } = req.body || {};
    if (!depends_on_id) return res.status(400).json({ error: 'depends_on_id is required' });
    if (depends_on_id === req.params.taskId) return res.status(400).json({ error: 'A task cannot depend on itself' });
    await query(`
      INSERT INTO onboarding_template_task_deps (task_id, depends_on_id)
      VALUES ($1, $2) ON CONFLICT DO NOTHING
    `, [req.params.taskId, depends_on_id]);
    res.status(201).json({ task_id: req.params.taskId, depends_on_id });
  } catch (err) { next(err); }
});

router.delete('/tasks/:taskId/deps/:dependsOnId', async (req, res, next) => {
  try {
    await query(`DELETE FROM onboarding_template_task_deps WHERE task_id = $1 AND depends_on_id = $2`,
      [req.params.taskId, req.params.dependsOnId]);
    res.status(204).end();
  } catch (err) { next(err); }
});

// ─── helper ─────────────────────────────────────────────────────────
async function nextPosition(table, fkCol, fkVal) {
  const r = await query(`SELECT COALESCE(MAX(position), -1) + 1 AS pos FROM ${table} WHERE ${fkCol} = $1`, [fkVal]);
  return r.rows[0].pos;
}

export default router;
