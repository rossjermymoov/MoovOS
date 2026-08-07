/**
 * Moov OS — Tasks API
 *
 * Task-management module with real relational links into staff, customers,
 * parcels (tracking), queries and couriers (carriers).
 *
 * Routes (mounted at /api/tasks):
 *   GET    /                      list tasks (filters: space, assignee_id, status)
 *   GET    /:id                   single task + links + comments + attachments
 *   POST   /                      create a task (optionally with links[])
 *   PATCH  /:id                   update task fields
 *   DELETE /:id                   delete a task
 *   POST   /:id/comments          add a comment
 *   POST   /:id/links             link a record  { link_type, ref }
 *   DELETE /:id/links/:linkId     unlink a record
 *   POST   /:id/attachments       add an attachment { kind, name, url, size_bytes }
 *   DELETE /:id/attachments/:attId
 */

import express from 'express';
import { query } from '../db/index.js';
import { notify } from './notifications.js';

const router = express.Router();

const STATUSES   = ['todo', 'progress', 'review', 'done']; // defaults; statuses are now user-configurable
const PRIORITIES = ['urgent', 'high', 'medium', 'low'];
// Status keys are user-defined in board settings, so validate by format, not an allowlist.
const isStatusKey = (s) => typeof s === 'string' && /^[a-z0-9_]{1,20}$/.test(s);
const LINK_TYPES = ['customer', 'carrier', 'query', 'tracking'];
const LINK_COL   = { customer: 'customer_id', carrier: 'courier_id', query: 'query_id', tracking: 'parcel_id' };

// Enriched links aggregate — resolves each link to a display label + deep-link route.
const LINKS_JSON = `
  COALESCE((
    SELECT json_agg(json_build_object(
      'id',    l.id,
      'type',  l.link_type,
      'ref',   COALESCE(l.customer_id::text, l.courier_id::text, l.query_id::text, l.parcel_id::text),
      'label', CASE l.link_type
                 WHEN 'customer' THEN cu.business_name
                 WHEN 'carrier'  THEN co.name
                 WHEN 'query'    THEN q.subject
                 WHEN 'tracking' THEN p.consignment_number END,
      'sub',   CASE l.link_type
                 WHEN 'customer' THEN cu.account_number
                 WHEN 'carrier'  THEN co.code
                 WHEN 'query'    THEN q.status::text
                 WHEN 'tracking' THEN p.recipient_postcode END,
      'status',CASE l.link_type
                 WHEN 'query'    THEN q.status::text
                 WHEN 'tracking' THEN p.status::text END,
      'route', CASE l.link_type
                 WHEN 'customer' THEN '/customers/' || cu.id
                 WHEN 'carrier'  THEN '/carriers'
                 WHEN 'query'    THEN '/queries/'   || q.id
                 WHEN 'tracking' THEN '/tracking/'  || p.consignment_number END
    ) ORDER BY l.id)
    FROM task_links l
    LEFT JOIN customers cu ON cu.id = l.customer_id
    LEFT JOIN couriers  co ON co.id = l.courier_id
    LEFT JOIN queries   q  ON q.id  = l.query_id
    LEFT JOIN parcels   p  ON p.id  = l.parcel_id
    WHERE l.task_id = t.id
  ), '[]') AS links`;

const TASK_SELECT = `
  SELECT t.*,
         s.full_name AS assignee_name,
         cb.full_name AS created_by_name,
         (SELECT COUNT(*)::int FROM task_comments    tc WHERE tc.task_id = t.id) AS comment_count,
         (SELECT COUNT(*)::int FROM task_attachments ta WHERE ta.task_id = t.id) AS attachment_count,
         ${LINKS_JSON}
  FROM tasks t
  LEFT JOIN staff s  ON s.id  = t.assignee_id
  LEFT JOIN staff cb ON cb.id = t.created_by`;

async function getTaskFull(id) {
  const taskRes = await query(`${TASK_SELECT} WHERE t.id = $1`, [id]);
  if (!taskRes.rows.length) return null;
  const task = taskRes.rows[0];
  const [comments, attachments, subtasks] = await Promise.all([
    query(
      `SELECT c.id, c.body, c.created_at, c.author_id, s.full_name AS author_name
       FROM task_comments c LEFT JOIN staff s ON s.id = c.author_id
       WHERE c.task_id = $1 ORDER BY c.created_at ASC`, [id]),
    query(
      `SELECT id, kind, name, url, size_bytes, created_at
       FROM task_attachments WHERE task_id = $1 ORDER BY created_at ASC`, [id]),
    query(
      `SELECT t.id, t.title, t.status, t.priority, t.due_date, t.assignee_id,
              s.full_name AS assignee_name,
              (SELECT COUNT(*)::int FROM task_comments tc WHERE tc.task_id = t.id) AS comment_count
       FROM tasks t LEFT JOIN staff s ON s.id = t.assignee_id
       WHERE t.parent_id = $1 ORDER BY t.created_at ASC`, [id]),
  ]);
  task.comments = comments.rows;
  task.attachments = attachments.rows;
  task.subtasks = subtasks.rows;
  if (task.parent_id) {
    const p = await query(`SELECT title FROM tasks WHERE id = $1`, [task.parent_id]);
    task.parent_title = p.rows[0]?.title || null;
  }
  return task;
}

// ─── LIST ─────────────────────────────────────────────────────────────────────
router.get('/', async (req, res, next) => {
  try {
    const { space, assignee_id, status } = req.query;
    const where = [];
    const values = [];
    if (space)       { values.push(space);       where.push(`t.space = $${values.length}`); }
    if (assignee_id) { values.push(assignee_id); where.push(`t.assignee_id = $${values.length}`); }
    if (status)      { values.push(status);      where.push(`t.status = $${values.length}`); }
    const sql = `${TASK_SELECT} ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY t.created_at DESC`;
    const result = await query(sql, values);
    res.json(result.rows);
  } catch (err) { next(err); }
});

// ─── GET ONE ──────────────────────────────────────────────────────────────────
router.get('/:id', async (req, res, next) => {
  try {
    const task = await getTaskFull(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json(task);
  } catch (err) { next(err); }
});

// ─── CREATE ───────────────────────────────────────────────────────────────────
router.post('/', async (req, res, next) => {
  try {
    const b = req.body || {};
    if (!b.title?.trim()) return res.status(400).json({ error: 'title is required' });
    const status   = isStatusKey(b.status)           ? b.status   : 'todo';
    const priority = PRIORITIES.includes(b.priority) ? b.priority : 'medium';

    const ins = await query(
      `INSERT INTO tasks (title, description, status, priority, space, assignee_id, created_by, start_date, due_date, progress, parent_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id`,
      [b.title.trim(), b.description || null, status, priority, b.space || 'cs',
       b.assignee_id || null, b.created_by || null, b.start_date || null, b.due_date || null,
       Number.isFinite(b.progress) ? b.progress : 0, b.parent_id || null]);
    const id = ins.rows[0].id;

    // Notify the assignee (unless they assigned it to themselves)
    if (b.assignee_id) {
      await notify({
        user_id: b.assignee_id, actor_id: b.created_by,
        type: 'assigned', severity: 'amber',
        title: 'You were assigned a task', body: b.title.trim(),
        entity_type: 'task', entity_id: id, route: `/tasks?task=${id}`,
      });
    }

    // Optional links supplied at creation: [{ link_type, ref }]
    if (Array.isArray(b.links)) {
      for (const lnk of b.links) {
        const col = LINK_COL[lnk.link_type];
        if (!col || lnk.ref == null) continue;
        await query(`INSERT INTO task_links (task_id, link_type, ${col}) VALUES ($1,$2,$3)`,
          [id, lnk.link_type, lnk.ref]);
      }
    }
    res.status(201).json(await getTaskFull(id));
  } catch (err) { next(err); }
});

// ─── UPDATE ───────────────────────────────────────────────────────────────────
router.patch('/:id', async (req, res, next) => {
  try {
    const allowed = ['title', 'description', 'status', 'priority', 'space', 'assignee_id', 'start_date', 'due_date', 'progress'];
    const sets = [];
    const values = [];
    for (const key of allowed) {
      if (key in req.body) {
        if (key === 'status'   && !isStatusKey(req.body[key]))         return res.status(400).json({ error: 'invalid status' });
        if (key === 'priority' && !PRIORITIES.includes(req.body[key])) return res.status(400).json({ error: 'invalid priority' });
        values.push(req.body[key] === '' ? null : req.body[key]);
        sets.push(`${key} = $${values.length}`);
      }
    }
    if (!sets.length) return res.status(400).json({ error: 'no updatable fields provided' });
    values.push(req.params.id);
    const upd = await query(
      `UPDATE tasks SET ${sets.join(', ')}, updated_at = NOW() WHERE id = $${values.length} RETURNING id`, values);
    if (!upd.rows.length) return res.status(404).json({ error: 'Task not found' });
    const full = await getTaskFull(req.params.id);

    // Notify on (re)assignment — actor_id is passed by the client, not stored on the task
    if ('assignee_id' in req.body && req.body.assignee_id) {
      await notify({
        user_id: req.body.assignee_id, actor_id: req.body.actor_id,
        type: 'assigned', severity: 'amber',
        title: 'A task was assigned to you', body: full.title,
        entity_type: 'task', entity_id: full.id, route: `/tasks?task=${full.id}`,
      });
    }
    res.json(full);
  } catch (err) { next(err); }
});

// ─── DELETE ───────────────────────────────────────────────────────────────────
router.delete('/:id', async (req, res, next) => {
  try {
    const del = await query('DELETE FROM tasks WHERE id = $1 RETURNING id', [req.params.id]);
    if (!del.rows.length) return res.status(404).json({ error: 'Task not found' });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// ─── COMMENTS ─────────────────────────────────────────────────────────────────
router.post('/:id/comments', async (req, res, next) => {
  try {
    if (!req.body?.body?.trim()) return res.status(400).json({ error: 'body is required' });
    await query(`INSERT INTO task_comments (task_id, author_id, body) VALUES ($1,$2,$3)`,
      [req.params.id, req.body.author_id || null, req.body.body.trim()]);
    const full = await getTaskFull(req.params.id);
    const author = req.body.author_id;
    const mentionIds = Array.isArray(req.body.mention_ids) ? req.body.mention_ids.filter(Boolean) : [];
    const mentioned = new Set(mentionIds.map(String));
    const snippet = req.body.body.trim().slice(0, 140);

    // @mentions are direct asks — notify them first, in amber.
    for (const uid of new Set(mentionIds)) {
      await notify({
        user_id: uid, actor_id: author,
        type: 'mention', severity: 'amber',
        title: 'Mentioned you in a comment', body: snippet,
        entity_type: 'task', entity_id: full.id, route: `/tasks?task=${full.id}&focus=comments`,
      });
    }
    // Assignee + creator get a plain comment note — unless they were already @-mentioned.
    for (const uid of new Set([full.assignee_id, full.created_by].filter(Boolean))) {
      if (mentioned.has(String(uid))) continue;
      await notify({
        user_id: uid, actor_id: author,
        type: 'comment', severity: 'info',
        title: 'New comment on a task', body: full.title,
        entity_type: 'task', entity_id: full.id, route: `/tasks?task=${full.id}&focus=comments`,
      });
    }
    res.status(201).json(full);
  } catch (err) { next(err); }
});

// ─── LINKS ────────────────────────────────────────────────────────────────────
router.post('/:id/links', async (req, res, next) => {
  try {
    const { link_type, ref } = req.body || {};
    const col = LINK_COL[link_type];
    if (!col)        return res.status(400).json({ error: `link_type must be one of: ${LINK_TYPES.join(', ')}` });
    if (ref == null) return res.status(400).json({ error: 'ref is required' });
    await query(`INSERT INTO task_links (task_id, link_type, ${col}) VALUES ($1,$2,$3)`,
      [req.params.id, link_type, ref]);
    res.status(201).json(await getTaskFull(req.params.id));
  } catch (err) { next(err); }
});

router.delete('/:id/links/:linkId', async (req, res, next) => {
  try {
    await query('DELETE FROM task_links WHERE id = $1 AND task_id = $2', [req.params.linkId, req.params.id]);
    res.json(await getTaskFull(req.params.id));
  } catch (err) { next(err); }
});

// ─── ATTACHMENTS (links / Google Drive for v1; binary upload is a follow-up) ───
router.post('/:id/attachments', async (req, res, next) => {
  try {
    const { kind, name, url, size_bytes } = req.body || {};
    if (!name?.trim()) return res.status(400).json({ error: 'name is required' });
    await query(`INSERT INTO task_attachments (task_id, kind, name, url, size_bytes) VALUES ($1,$2,$3,$4,$5)`,
      [req.params.id, kind || 'link', name.trim(), url || null, size_bytes || null]);
    res.status(201).json(await getTaskFull(req.params.id));
  } catch (err) { next(err); }
});

router.delete('/:id/attachments/:attId', async (req, res, next) => {
  try {
    await query('DELETE FROM task_attachments WHERE id = $1 AND task_id = $2', [req.params.attId, req.params.id]);
    res.json(await getTaskFull(req.params.id));
  } catch (err) { next(err); }
});

export default router;
