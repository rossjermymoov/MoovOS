/**
 * Moov OS — Notifications API  (mounted at /api/notifications)
 *
 * A universal, cross-module notification feed. Any module can drop a row in via
 * the exported notify() helper. The feed a user sees is:
 *   - stored event rows  (assigned to you, new comment, …)  — dismissible
 *   - live task "nudges" (overdue / due-soon tasks assigned to you) — always current
 *
 * Identity: routes are not behind global auth in this app, so the caller passes
 * ?user_id= (the signed-in staff id, or a bypass "view as" id). If a Bearer
 * token is present, req.staffId takes precedence.
 *
 * Routes:
 *   GET   /?user_id=            → { items, nudges, unread_count }
 *   PATCH /:id/read            → mark one read
 *   POST  /read-all            → { user_id } mark all read
 */
import express from 'express';
import { query } from '../db/index.js';

const router = express.Router();

const meId = (req) => req.staffId || req.query.user_id || req.body?.user_id || null;

/**
 * Insert a notification row. Safe to call from anywhere.
 * Skips self-notifications (user_id === actor_id) and never throws into the caller.
 */
export async function notify({ user_id, actor_id = null, type, severity = 'info', title, body = null, entity_type = null, entity_id = null, route = null }) {
  try {
    if (!user_id) return;
    if (actor_id && String(user_id) === String(actor_id)) return; // don't notify yourself
    await query(
      `INSERT INTO notifications (user_id, actor_id, type, severity, title, body, entity_type, entity_id, route)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [user_id, actor_id, type, severity, title, body, entity_type, entity_id, route]
    );
  } catch (err) {
    console.error('notify() failed:', err.message);
  }
}

// ─── GET / ─────────────────────────────────────────────────────────────────────
router.get('/', async (req, res, next) => {
  try {
    const me = meId(req);
    if (!me) return res.json({ items: [], nudges: [], unread_count: 0 });

    // Which status keys mean "complete"? Read the team's board config (defaults to 'done').
    let completeKeys = ['done'];
    try {
      const cfgRes = await query(`SELECT data FROM task_config WHERE id = 1`);
      const cfg = cfgRes.rows[0]?.data;
      if (cfg && Array.isArray(cfg.statuses)) {
        const ck = cfg.statuses.filter(s => s.isComplete).map(s => s.key);
        if (ck.length) completeKeys = ck;
      }
    } catch { /* task_config may not exist yet — fall back to 'done' */ }

    const [itemsRes, nudgeRes] = await Promise.all([
      query(
        `SELECT n.id, n.type, n.severity, n.title, n.body, n.entity_type, n.entity_id,
                n.route, n.read_at, n.created_at, a.full_name AS actor_name
         FROM notifications n
         LEFT JOIN staff a ON a.id = n.actor_id
         WHERE n.user_id = $1
         ORDER BY n.created_at DESC
         LIMIT 40`, [me]),
      query(
        `SELECT t.id, t.title, t.due_date, t.status,
                CASE WHEN t.due_date < CURRENT_DATE THEN 'overdue' ELSE 'due_soon' END AS kind
         FROM tasks t
         WHERE t.assignee_id = $1
           AND NOT (t.status = ANY($2::text[]))
           AND t.due_date IS NOT NULL
           AND t.due_date <= CURRENT_DATE + INTERVAL '2 day'
         ORDER BY t.due_date ASC`, [me, completeKeys]),
    ]);

    const items = itemsRes.rows;
    const nudges = nudgeRes.rows.map(n => ({
      id: `nudge-${n.id}`,
      task_id: n.id,
      kind: n.kind,                             // overdue | due_soon
      severity: n.kind === 'overdue' ? 'red' : 'amber',
      title: n.title,
      due_date: n.due_date,
      route: `/tasks?task=${n.id}`,
    }));

    const unread_count = items.filter(i => !i.read_at).length + nudges.length;
    res.json({ items, nudges, unread_count });
  } catch (err) { next(err); }
});

// ─── PATCH /:id/read ─────────────────────────────────────────────────────────────
router.patch('/:id/read', async (req, res, next) => {
  try {
    await query(`UPDATE notifications SET read_at = NOW() WHERE id = $1 AND read_at IS NULL`, [req.params.id]);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// ─── POST /read-all ──────────────────────────────────────────────────────────────
router.post('/read-all', async (req, res, next) => {
  try {
    const me = meId(req);
    if (me) await query(`UPDATE notifications SET read_at = NOW() WHERE user_id = $1 AND read_at IS NULL`, [me]);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

export default router;
