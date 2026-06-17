/**
 * Moov OS — Onboarding Engine API (instance side)
 * Mounted at /api/v1/onboarding (see index.js).
 *
 * Onboarding is a STATE of a real customer. Starting onboarding snapshots a
 * template (stages + tasks + deps) onto the customer so later template edits
 * never disturb in-flight onboardings. Every task status change is logged to
 * onboarding_task_events for a full timeline ("how long things took").
 *
 *   GET   /board                              — Kanban of active onboardings
 *   POST  /customers/:customerId/start        — snapshot a template onto a customer
 *   GET   /customers/:customerId              — active onboarding for a customer (full tree)
 *   GET   /:onboardingId                       — onboarding by id (full tree)
 *   GET   /:onboardingId/timeline              — chronological event log
 *   POST  /:onboardingId/complete              — finish onboarding → customer 'active'
 *   PATCH /tasks/:taskId                        — status / assignee / due / duration (+ events, dep guard, auto-comms)
 *   POST  /tasks/:taskId/checklist              — add checklist item
 *   PATCH /checklist/:itemId                    — toggle / rename checklist item
 *   DELETE /checklist/:itemId
 *   POST  /tasks/:taskId/notes                  — add note
 *   POST  /tasks/:taskId/attachments            — register an attachment (metadata)
 *   DELETE /attachments/:attId
 *   POST  /tasks/:taskId/send-comms             — send the task's linked comms template now
 */

import express from 'express';
import { query, getClient } from '../db/index.js';
import { sendEmail } from '../services/emailService.js';

const router = express.Router();

// ─── Helpers ────────────────────────────────────────────────────────

/** Fill {{placeholders}} from a flat context object. Unknown tokens are left blank. */
function renderTemplate(str = '', ctx = {}) {
  return String(str).replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, key) => (ctx[key] ?? ''));
}

/** Build the merge context for comms templates from a customer + onboarding row. */
function commsContext(cust = {}, onb = {}) {
  return {
    customer_name: cust.business_name || '',
    trading_name:  cust.business_name || '',
    account_number: cust.account_number || '',
    template_name: onb.template_name || '',
    owner_name:    onb.owner_name || '',
  };
}

/** Append a timeline event. */
async function logEvent(client, { taskId, onboardingId, type, from, to, actorId, detail }) {
  await client.query(`
    INSERT INTO onboarding_task_events
      (task_id, onboarding_id, event_type, from_status, to_status, actor_id, detail)
    VALUES ($1,$2,$3,$4,$5,$6,COALESCE($7,'{}')::jsonb)
  `, [taskId, onboardingId, type, from || null, to || null, actorId || null, JSON.stringify(detail || {})]);
}

// ════════════════════════════════════════════════════════════════════
// BOARD
// ════════════════════════════════════════════════════════════════════
router.get('/board', async (_req, res, next) => {
  try {
    // One row per active onboarding, with progress + the next incomplete task.
    const { rows } = await query(`
      SELECT
        co.id AS onboarding_id, co.customer_id, co.template_name, co.started_at, co.target_go_live,
        c.account_number, c.business_name,
        owner.full_name AS owner_name,
        (SELECT COUNT(*) FROM onboarding_tasks t WHERE t.onboarding_id = co.id)::int AS tasks_total,
        (SELECT COUNT(*) FROM onboarding_tasks t WHERE t.onboarding_id = co.id AND t.status = 'complete')::int AS tasks_done,
        nx.title       AS next_action,
        nx.due_at      AS next_due_at,
        nx.stage_name  AS current_stage,
        (SELECT MAX(e.created_at) FROM onboarding_task_events e WHERE e.onboarding_id = co.id) AS last_activity_at
      FROM customer_onboarding co
      JOIN customers c ON c.id = co.customer_id
      LEFT JOIN staff owner ON owner.id = co.owner_id
      LEFT JOIN LATERAL (
        SELECT t.title, t.due_at, s.name AS stage_name
        FROM onboarding_tasks t
        JOIN onboarding_stages s ON s.id = t.stage_id
        WHERE t.onboarding_id = co.id AND t.status <> 'complete' AND t.status <> 'skipped'
        ORDER BY s.position, t.position
        LIMIT 1
      ) nx ON TRUE
      WHERE co.status = 'active'
      ORDER BY nx.due_at ASC NULLS LAST, co.started_at ASC
    `);

    // Group into dynamic columns by the customer's current stage.
    const order = [];
    const byStage = {};
    for (const r of rows) {
      const key = r.current_stage || 'Go-Live Ready';
      if (!byStage[key]) { byStage[key] = []; order.push(key); }
      byStage[key].push(r);
    }
    const columns = order.map(stage => ({ stage, cards: byStage[stage] }));
    res.json({ columns, total: rows.length, server_time: new Date().toISOString() });
  } catch (err) { next(err); }
});

// ════════════════════════════════════════════════════════════════════
// START ONBOARDING — snapshot a template onto a customer
// ════════════════════════════════════════════════════════════════════
router.post('/customers/:customerId/start', async (req, res, next) => {
  const client = await getClient();
  try {
    const { customerId } = req.params;
    const { template_id, owner_id, target_go_live, team_members } = req.body || {};
    if (!template_id) return res.status(400).json({ error: 'template_id is required' });

    // team_members: { [team_id]: staff_id } chosen for this client at go-live.
    const memberMap = team_members && typeof team_members === 'object' ? team_members : {};

    // Guard: no existing active onboarding.
    const existing = await client.query(
      `SELECT id FROM customer_onboarding WHERE customer_id = $1 AND status = 'active'`, [customerId]);
    if (existing.rows[0]) {
      return res.status(409).json({ error: 'Customer already has an active onboarding', onboarding_id: existing.rows[0].id });
    }

    // Load the template tree.
    const tmpl = await client.query(`SELECT * FROM onboarding_templates WHERE id = $1`, [template_id]);
    if (!tmpl.rows[0]) return res.status(404).json({ error: 'Template not found' });
    const stages = await client.query(
      `SELECT * FROM onboarding_template_stages WHERE template_id = $1 ORDER BY position`, [template_id]);
    const tasks = await client.query(
      `SELECT * FROM onboarding_template_tasks WHERE template_id = $1 ORDER BY position`, [template_id]);
    const deps = await client.query(`
      SELECT d.* FROM onboarding_template_task_deps d
      JOIN onboarding_template_tasks k ON k.id = d.task_id WHERE k.template_id = $1`, [template_id]);

    await client.query('BEGIN');

    // 1. Onboarding header
    const co = await client.query(`
      INSERT INTO customer_onboarding (customer_id, template_id, template_name, owner_id, target_go_live)
      VALUES ($1, $2, $3, $4, $5) RETURNING *
    `, [customerId, template_id, tmpl.rows[0].name, owner_id || null, target_go_live || null]);
    const onboardingId = co.rows[0].id;

    // 2. Flip the customer into 'onboarding' state.
    await client.query(`UPDATE customers SET account_status = 'onboarding' WHERE id = $1`, [customerId]);

    // 3. Copy stages, remembering template→instance id mapping.
    const stageMap = {};
    for (const s of stages.rows) {
      const r = await client.query(`
        INSERT INTO onboarding_stages (onboarding_id, name, description, position)
        VALUES ($1,$2,$3,$4) RETURNING id
      `, [onboardingId, s.name, s.description, s.position]);
      stageMap[s.id] = r.rows[0].id;
    }

    // 4. Copy tasks (two passes so parent_task_id can be remapped).
    const taskMap = {};
    for (const t of tasks.rows) {
      // Due date is calculated from onboarding start now. 'post_call' tasks have
      // no due date until the call is booked (set via PATCH /:id/call).
      const due = (t.sla_basis !== 'post_call' && t.target_duration_hours)
        ? new Date(Date.now() + t.target_duration_hours * 3600 * 1000) : null;
      // Resolve assignee from the team→person mapping chosen at go-live.
      const assignee = (t.team_id && memberMap[t.team_id]) || t.default_assignee_id || null;
      const r = await client.query(`
        INSERT INTO onboarding_tasks
          (onboarding_id, stage_id, template_task_id, title, description, position,
           assignee_id, team_id, is_required, target_duration_hours, due_at, comms_template_id, auto_send_comms, sla_basis)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
        RETURNING id
      `, [onboardingId, stageMap[t.stage_id], t.id, t.title, t.description, t.position,
          assignee, t.team_id, t.is_required, t.target_duration_hours, due,
          t.comms_template_id, t.auto_send_comms, t.sla_basis || 'onboarding_start']);
      taskMap[t.id] = r.rows[0].id;
    }

    // Persist the team → person choices on the onboarding.
    for (const [teamId, staffId] of Object.entries(memberMap)) {
      if (!staffId) continue;
      await client.query(`
        INSERT INTO customer_onboarding_team_members (onboarding_id, team_id, staff_id)
        VALUES ($1,$2,$3) ON CONFLICT (onboarding_id, team_id) DO UPDATE SET staff_id = EXCLUDED.staff_id
      `, [onboardingId, teamId, staffId]);
    }
    // Second pass: parent links + creation events.
    for (const t of tasks.rows) {
      if (t.parent_task_id && taskMap[t.parent_task_id]) {
        await client.query(`UPDATE onboarding_tasks SET parent_task_id = $1 WHERE id = $2`,
          [taskMap[t.parent_task_id], taskMap[t.id]]);
      }
      await logEvent(client, { taskId: taskMap[t.id], onboardingId, type: 'created', to: 'not_started', actorId: owner_id });
    }

    // 5. Copy dependencies.
    for (const d of deps.rows) {
      if (taskMap[d.task_id] && taskMap[d.depends_on_id]) {
        await client.query(`
          INSERT INTO onboarding_task_deps (task_id, depends_on_id) VALUES ($1,$2) ON CONFLICT DO NOTHING
        `, [taskMap[d.task_id], taskMap[d.depends_on_id]]);
      }
    }

    await client.query('COMMIT');
    res.status(201).json({ onboarding_id: onboardingId, customer_id: customerId, template_name: tmpl.rows[0].name });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    next(err);
  } finally {
    client.release();
  }
});

// ════════════════════════════════════════════════════════════════════
// READ — full onboarding tree
// ════════════════════════════════════════════════════════════════════
async function loadOnboardingTree(onboardingId) {
  const co = await query(`
    SELECT co.*, c.business_name, c.account_number, owner.full_name AS owner_name
    FROM customer_onboarding co
    JOIN customers c ON c.id = co.customer_id
    LEFT JOIN staff owner ON owner.id = co.owner_id
    WHERE co.id = $1
  `, [onboardingId]);
  if (!co.rows[0]) return null;

  const [stages, tasks, deps, checklist, notes, attachments] = await Promise.all([
    query(`SELECT * FROM onboarding_stages WHERE onboarding_id = $1 ORDER BY position`, [onboardingId]),
    query(`SELECT t.*, a.full_name AS assignee_name, tm.name AS team_name, tm.key AS team_key
           FROM onboarding_tasks t
           LEFT JOIN staff a ON a.id = t.assignee_id
           LEFT JOIN teams tm ON tm.id = t.team_id
           WHERE t.onboarding_id = $1 ORDER BY position`, [onboardingId]),
    query(`SELECT d.* FROM onboarding_task_deps d
           JOIN onboarding_tasks t ON t.id = d.task_id WHERE t.onboarding_id = $1`, [onboardingId]),
    query(`SELECT ch.* FROM onboarding_task_checklist ch
           JOIN onboarding_tasks t ON t.id = ch.task_id WHERE t.onboarding_id = $1 ORDER BY ch.position`, [onboardingId]),
    query(`SELECT n.*, s.full_name AS author_name FROM onboarding_task_notes n
           LEFT JOIN staff s ON s.id = n.author_id
           JOIN onboarding_tasks t ON t.id = n.task_id WHERE t.onboarding_id = $1 ORDER BY n.created_at`, [onboardingId]),
    query(`SELECT at.* FROM onboarding_task_attachments at
           JOIN onboarding_tasks t ON t.id = at.task_id WHERE t.onboarding_id = $1`, [onboardingId]),
  ]);

  const depByTask = {}; deps.rows.forEach(d => (depByTask[d.task_id] ||= []).push(d.depends_on_id));
  const chkByTask = {}; checklist.rows.forEach(c => (chkByTask[c.task_id] ||= []).push(c));
  const noteByTask = {}; notes.rows.forEach(n => (noteByTask[n.task_id] ||= []).push(n));
  const attByTask = {}; attachments.rows.forEach(a => (attByTask[a.task_id] ||= []).push(a));

  const stageList = stages.rows.map(s => ({
    ...s,
    tasks: tasks.rows.filter(t => t.stage_id === s.id).map(t => ({
      ...t,
      depends_on: depByTask[t.id] || [],
      checklist:  chkByTask[t.id] || [],
      notes:      noteByTask[t.id] || [],
      attachments: attByTask[t.id] || [],
    })),
  }));

  return { ...co.rows[0], stages: stageList };
}

router.get('/customers/:customerId', async (req, res, next) => {
  try {
    const co = await query(
      `SELECT id FROM customer_onboarding WHERE customer_id = $1 AND status = 'active' ORDER BY started_at DESC LIMIT 1`,
      [req.params.customerId]);
    if (!co.rows[0]) return res.status(404).json({ error: 'No active onboarding' });
    res.json(await loadOnboardingTree(co.rows[0].id));
  } catch (err) { next(err); }
});

router.get('/:onboardingId', async (req, res, next) => {
  try {
    const tree = await loadOnboardingTree(req.params.onboardingId);
    if (!tree) return res.status(404).json({ error: 'Not found' });
    res.json(tree);
  } catch (err) { next(err); }
});

router.get('/:onboardingId/timeline', async (req, res, next) => {
  try {
    const { rows } = await query(`
      SELECT e.*, t.title AS task_title, s.full_name AS actor_name
      FROM onboarding_task_events e
      JOIN onboarding_tasks t ON t.id = e.task_id
      LEFT JOIN staff s ON s.id = e.actor_id
      WHERE e.onboarding_id = $1 ORDER BY e.created_at
    `, [req.params.onboardingId]);
    res.json(rows);
  } catch (err) { next(err); }
});

// ════════════════════════════════════════════════════════════════════
// TASK MUTATIONS
// ════════════════════════════════════════════════════════════════════
router.patch('/tasks/:taskId', async (req, res, next) => {
  const client = await getClient();
  try {
    const { taskId } = req.params;
    const b = req.body || {};
    const actorId = b.actor_id || null;

    const cur = await client.query(`SELECT * FROM onboarding_tasks WHERE id = $1`, [taskId]);
    const task = cur.rows[0];
    if (!task) return res.status(404).json({ error: 'Not found' });

    // Dependency guard — can't complete/progress while a blocker is open.
    if (b.status && (b.status === 'in_progress' || b.status === 'complete')) {
      const blockers = await client.query(`
        SELECT t.title FROM onboarding_task_deps d
        JOIN onboarding_tasks t ON t.id = d.depends_on_id
        WHERE d.task_id = $1 AND t.status <> 'complete' AND t.status <> 'skipped'
      `, [taskId]);
      if (blockers.rows.length) {
        return res.status(409).json({
          error: 'Blocked by incomplete dependencies',
          blockers: blockers.rows.map(r => r.title),
        });
      }
    }

    await client.query('BEGIN');

    const sets = [], vals = [];
    let i = 1;
    const allow = ['assignee_id', 'due_at', 'target_duration_hours', 'title', 'description'];
    for (const f of allow) if (b[f] !== undefined) { sets.push(`${f} = $${i++}`); vals.push(b[f]); }

    // Status transition drives started_at / completed_at.
    if (b.status !== undefined && b.status !== task.status) {
      sets.push(`status = $${i++}::onboarding_task_status`); vals.push(b.status);
      if (b.status === 'in_progress' && !task.started_at) { sets.push(`started_at = NOW()`); }
      if (b.status === 'complete') { sets.push(`completed_at = NOW()`); if (!task.started_at) sets.push(`started_at = NOW()`); }
      if (b.status !== 'complete') { sets.push(`completed_at = NULL`); }
    }

    let updated = task;
    if (sets.length) {
      vals.push(taskId);
      const r = await client.query(
        `UPDATE onboarding_tasks SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`, vals);
      updated = r.rows[0];
    }

    // Timeline events.
    if (b.status !== undefined && b.status !== task.status) {
      await logEvent(client, { taskId, onboardingId: task.onboarding_id, type: 'status_change',
        from: task.status, to: b.status, actorId });
    }
    if (b.assignee_id !== undefined && b.assignee_id !== task.assignee_id) {
      await logEvent(client, { taskId, onboardingId: task.onboarding_id, type: 'assigned',
        actorId, detail: { assignee_id: b.assignee_id } });
    }

    // Mark the parent stage started/completed based on its tasks.
    await refreshStageProgress(client, task.stage_id);

    await client.query('COMMIT');

    // Auto-send linked comms on completion (fire-and-forget).
    if (b.status === 'complete' && updated.auto_send_comms && updated.comms_template_id) {
      sendTaskComms(taskId, actorId).catch(e => console.warn('[onboarding] auto-comms failed:', e.message));
    }

    res.json(updated);
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    next(err);
  } finally {
    client.release();
  }
});

/** Set stage.started_at when first task starts, completed_at when all required tasks done. */
async function refreshStageProgress(client, stageId) {
  const agg = await client.query(`
    SELECT
      COUNT(*) FILTER (WHERE status NOT IN ('not_started'))                          AS started,
      COUNT(*) FILTER (WHERE is_required AND status NOT IN ('complete','skipped'))   AS required_open
    FROM onboarding_tasks WHERE stage_id = $1
  `, [stageId]);
  const { started, required_open } = agg.rows[0];
  await client.query(`
    UPDATE onboarding_stages SET
      started_at   = CASE WHEN $2::int > 0 AND started_at   IS NULL THEN NOW() ELSE started_at END,
      completed_at = CASE WHEN $3::int = 0 THEN COALESCE(completed_at, NOW()) ELSE NULL END
    WHERE id = $1
  `, [stageId, Number(started), Number(required_open)]);
}

// ─── Checklist ──────────────────────────────────────────────────────
router.post('/tasks/:taskId/checklist', async (req, res, next) => {
  try {
    const { label, position } = req.body || {};
    if (!label) return res.status(400).json({ error: 'label is required' });
    const pos = position ?? (await query(
      `SELECT COALESCE(MAX(position),-1)+1 AS p FROM onboarding_task_checklist WHERE task_id=$1`, [req.params.taskId])).rows[0].p;
    const { rows } = await query(`
      INSERT INTO onboarding_task_checklist (task_id, label, position) VALUES ($1,$2,$3) RETURNING *
    `, [req.params.taskId, label, pos]);
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

router.patch('/checklist/:itemId', async (req, res, next) => {
  try {
    const b = req.body || {};
    const sets = [], vals = [];
    let i = 1;
    if (b.label !== undefined) { sets.push(`label = $${i++}`); vals.push(b.label); }
    if (b.is_done !== undefined) {
      sets.push(`is_done = $${i++}`); vals.push(b.is_done);
      sets.push(`done_at = ${b.is_done ? 'NOW()' : 'NULL'}`);
      if (b.is_done && b.done_by) { sets.push(`done_by = $${i++}`); vals.push(b.done_by); }
    }
    if (!sets.length) return res.status(400).json({ error: 'No fields to update' });
    vals.push(req.params.itemId);
    const { rows } = await query(
      `UPDATE onboarding_task_checklist SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`, vals);
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

router.delete('/checklist/:itemId', async (req, res, next) => {
  try {
    await query(`DELETE FROM onboarding_task_checklist WHERE id = $1`, [req.params.itemId]);
    res.status(204).end();
  } catch (err) { next(err); }
});

// ─── Notes ──────────────────────────────────────────────────────────
router.post('/tasks/:taskId/notes', async (req, res, next) => {
  try {
    const { body, author_id } = req.body || {};
    if (!body) return res.status(400).json({ error: 'body is required' });
    const cur = await query(`SELECT onboarding_id FROM onboarding_tasks WHERE id = $1`, [req.params.taskId]);
    if (!cur.rows[0]) return res.status(404).json({ error: 'Task not found' });
    const { rows } = await query(`
      INSERT INTO onboarding_task_notes (task_id, author_id, body) VALUES ($1,$2,$3) RETURNING *
    `, [req.params.taskId, author_id || null, body]);
    await query(`
      INSERT INTO onboarding_task_events (task_id, onboarding_id, event_type, actor_id, detail)
      VALUES ($1,$2,'note',$3,'{}'::jsonb)
    `, [req.params.taskId, cur.rows[0].onboarding_id, author_id || null]);
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

// ─── Attachments (metadata registration) ────────────────────────────
router.post('/tasks/:taskId/attachments', async (req, res, next) => {
  try {
    const b = req.body || {};
    if (!b.filename) return res.status(400).json({ error: 'filename is required' });
    const { rows } = await query(`
      INSERT INTO onboarding_task_attachments (task_id, filename, url, content_type, size_bytes, uploaded_by)
      VALUES ($1,$2,$3,$4,$5,$6) RETURNING *
    `, [req.params.taskId, b.filename, b.url || null, b.content_type || null, b.size_bytes || null, b.uploaded_by || null]);
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

router.delete('/attachments/:attId', async (req, res, next) => {
  try {
    await query(`DELETE FROM onboarding_task_attachments WHERE id = $1`, [req.params.attId]);
    res.status(204).end();
  } catch (err) { next(err); }
});

// ─── Send the task's linked comms template now ──────────────────────
router.post('/tasks/:taskId/send-comms', async (req, res, next) => {
  try {
    const result = await sendTaskComms(req.params.taskId, req.body?.actor_id || null, req.body?.to);
    res.json(result);
  } catch (err) { next(err); }
});

async function sendTaskComms(taskId, actorId, overrideTo) {
  const r = await query(`
    SELECT t.*, ct.subject, ct.body_html, ct.body_text, ct.name AS template_name,
           co.id AS onboarding_id, co.template_name AS onb_template_name,
           c.business_name, c.account_number, c.primary_email,
           owner.full_name AS owner_name
    FROM onboarding_tasks t
    JOIN customer_onboarding co ON co.id = t.onboarding_id
    JOIN customers c ON c.id = co.customer_id
    LEFT JOIN staff owner ON owner.id = co.owner_id
    LEFT JOIN onboarding_comms_templates ct ON ct.id = t.comms_template_id
    WHERE t.id = $1
  `, [taskId]);
  const row = r.rows[0];
  if (!row) throw new Error('Task not found');
  if (!row.comms_template_id) throw new Error('Task has no linked comms template');

  const to = overrideTo || row.primary_email;
  if (!to) throw new Error('No recipient email on the customer record');

  const ctx = commsContext(
    { business_name: row.business_name, account_number: row.account_number },
    { template_name: row.onb_template_name, owner_name: row.owner_name });
  const subject = renderTemplate(row.subject, ctx);
  const html    = renderTemplate(row.body_html, ctx);
  const text    = row.body_text ? renderTemplate(row.body_text, ctx) : undefined;

  await sendEmail(to, subject, html, text);
  await query(`UPDATE onboarding_tasks SET comms_sent_at = NOW() WHERE id = $1`, [taskId]);
  await query(`
    INSERT INTO onboarding_task_events (task_id, onboarding_id, event_type, actor_id, detail)
    VALUES ($1,$2,'comms_sent',$3,$4::jsonb)
  `, [taskId, row.onboarding_id, actorId, JSON.stringify({ to, template: row.template_name })]);

  return { sent: true, to, template: row.template_name };
}

// ════════════════════════════════════════════════════════════════════
// ONBOARDING CALL — book / record the call; recompute post-call SLAs
// ════════════════════════════════════════════════════════════════════
router.patch('/:onboardingId/call', async (req, res, next) => {
  const client = await getClient();
  try {
    const { onboardingId } = req.params;
    const b = req.body || {};

    const sets = [], vals = [];
    let i = 1;
    if (b.call_booked !== undefined)     { sets.push(`call_booked = $${i++}`);     vals.push(b.call_booked); }
    if (b.call_booked_for !== undefined) { sets.push(`call_booked_for = $${i++}`); vals.push(b.call_booked_for || null); }
    if (b.call_completed !== undefined)  { sets.push(`call_completed = $${i++}`);  vals.push(b.call_completed); }
    if (!sets.length) return res.status(400).json({ error: 'No call fields to update' });

    await client.query('BEGIN');
    vals.push(onboardingId);
    const upd = await client.query(
      `UPDATE customer_onboarding SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`, vals);
    if (!upd.rows[0]) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Not found' }); }
    const onb = upd.rows[0];

    // Recompute due dates for non-complete 'post_call' tasks from the call date.
    // If no call date, their due date is cleared (unknown until booked).
    await client.query(`
      UPDATE onboarding_tasks
      SET due_at = CASE
        WHEN $2::timestamptz IS NULL OR target_duration_hours IS NULL THEN NULL
        ELSE $2::timestamptz + (target_duration_hours || ' hours')::interval
      END
      WHERE onboarding_id = $1
        AND sla_basis = 'post_call'
        AND status NOT IN ('complete','skipped')
    `, [onboardingId, onb.call_booked_for]);

    await client.query('COMMIT');
    res.json(onb);
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    next(err);
  } finally {
    client.release();
  }
});

// ════════════════════════════════════════════════════════════════════
// CANCEL / CLEAR an onboarding (removes its milestones & tasks)
// ════════════════════════════════════════════════════════════════════
router.delete('/:onboardingId', async (req, res, next) => {
  try {
    const r = await query(
      `DELETE FROM customer_onboarding WHERE id = $1 RETURNING customer_id`, [req.params.onboardingId]);
    if (!r.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json({ deleted: true, customer_id: r.rows[0].customer_id });
  } catch (err) { next(err); }
});

// ════════════════════════════════════════════════════════════════════
// COMPLETE ONBOARDING → customer becomes 'active'
// ════════════════════════════════════════════════════════════════════
router.post('/:onboardingId/complete', async (req, res, next) => {
  const client = await getClient();
  try {
    const { onboardingId } = req.params;
    const force = req.body?.force === true;

    const co = await client.query(`SELECT * FROM customer_onboarding WHERE id = $1`, [onboardingId]);
    if (!co.rows[0]) return res.status(404).json({ error: 'Not found' });

    if (!force) {
      const open = await client.query(`
        SELECT COUNT(*)::int AS n FROM onboarding_tasks
        WHERE onboarding_id = $1 AND is_required AND status NOT IN ('complete','skipped')
      `, [onboardingId]);
      if (open.rows[0].n > 0) {
        return res.status(409).json({ error: 'Required tasks are still open', open_required: open.rows[0].n });
      }
    }

    await client.query('BEGIN');
    await client.query(
      `UPDATE customer_onboarding SET status = 'complete', completed_at = NOW() WHERE id = $1`, [onboardingId]);
    await client.query(
      `UPDATE customers SET account_status = 'active' WHERE id = $1`, [co.rows[0].customer_id]);
    await client.query('COMMIT');

    res.json({ onboarding_id: onboardingId, customer_id: co.rows[0].customer_id, status: 'complete' });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    next(err);
  } finally {
    client.release();
  }
});

export default router;
