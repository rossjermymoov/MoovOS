/**
 * threadRepair.js — split email conversations that were wrongly merged into
 * one ticket (#2153, #2416, …).
 *
 * Until the fix in gmailSync.js, a courier email on a new thread was attached to
 * any open ticket whose stored "consignment" appeared in its text — and junk was
 * stored as consignments (a map-link ID from a signature, an 8-digit number).
 * A courier account manager's emails about many different customers piled into
 * single tickets, and Moov's replies on those threads followed them in.
 *
 * A ticket's extra Gmail threads are kept when they genuinely belong: the
 * ticket has a real consignment number and the thread mentions it (couriers do
 * start new chains about the same parcel). Every other extra thread is moved to
 * a ticket of its own. The ticket's first thread always stays.
 *
 *   findMergedThreads()          — report only, changes nothing
 *   splitMergedThreads({ ... })  — applies the report
 *   splitMergedThreadsOnce()     — runs the split once, at server start after
 *                                  deploy, guarded by a marker row (same pattern
 *                                  as gmailSync's one-time email repair). There
 *                                  is deliberately no web endpoint that applies
 *                                  it: the API has no login.
 */

import { query } from '../db/index.js';
import { getTrackingMatchers, recognizeTracking, courierFamily } from './courierAutomation.js';
import { resolveCustomer } from './gmailSync.js';

const SUPPORT = /@(moovparcel\.co\.uk|moov-os\.com|moovparcel\.com)\s*>?$/i;
const RESOLVED = ['resolved', 'resolved_claim_approved', 'resolved_claim_rejected'];
// A split-out conversation quiet for this long comes back Resolved, so finished
// threads from weeks ago don't flood the queue as new Open tickets.
const STALE_DAYS = 30;

function consignmentForms(c) {
  const u = String(c || '').replace(/\s+/g, '').toUpperCase();
  const out = new Set([u]);
  const m = u.match(/^1550(\d{10})[A-Z0-9]?$/); if (m) out.add(m[1]);
  if (/^\d{10}$/.test(u)) out.add(`1550${u}`);
  return [...out];
}

function mentions(text, forms) {
  const squashed = String(text || '').replace(/\s+/g, '').toUpperCase();
  return forms.some(f => f.length >= 8 && squashed.includes(f));
}

const firstAddress = (s) => (String(s || '').match(/[^\s<>,;"']+@[^\s<>,;"']+/) || [])[0]?.toLowerCase() || null;

/** Report of wrongly merged threads. Read-only. */
export async function findMergedThreads({ ticketNumbers = null } = {}) {
  const matchers = await getTrackingMatchers();
  const candidates = await query(`
    SELECT q.id, q.ticket_number, q.customer_name, q.consignment_number, q.status
      FROM queries q
      JOIN query_emails qe ON qe.query_id = q.id AND qe.gmail_thread_id IS NOT NULL
     ${ticketNumbers?.length ? 'WHERE q.ticket_number = ANY($1::bigint[])' : ''}
     GROUP BY q.id
    HAVING COUNT(DISTINCT qe.gmail_thread_id) > 1
     ORDER BY q.ticket_number`, ticketNumbers?.length ? [ticketNumbers] : []);

  const report = [];
  for (const t of candidates.rows) {
    const emails = (await query(
      `SELECT id, gmail_thread_id, direction, from_address, to_address, subject,
              LEFT(body_text, 20000) AS body_text, COALESCE(received_at, created_at) AS at
         FROM query_emails WHERE query_id = $1 AND gmail_thread_id IS NOT NULL
        ORDER BY COALESCE(received_at, created_at), id`, [t.id])).rows;
    const home = emails[0].gmail_thread_id;
    const realConsignment = recognizeTracking(t.consignment_number, matchers);
    const forms = realConsignment ? consignmentForms(t.consignment_number) : [];

    const byThread = new Map();
    for (const e of emails) {
      if (!byThread.has(e.gmail_thread_id)) byThread.set(e.gmail_thread_id, []);
      byThread.get(e.gmail_thread_id).push(e);
    }
    const foreign = [];
    for (const [thread, list] of byThread) {
      if (thread === home) continue;
      const belongs = forms.length && list.some(e => mentions(`${e.subject}\n${e.body_text}`, forms));
      if (belongs) continue;
      const counterpartEmail = list.map(e => firstAddress(e.from_address)).find(a => a && !SUPPORT.test(a))
        || firstAddress(list[0].to_address);
      foreign.push({
        gmail_thread_id: thread,
        emails: list.length,
        first_subject: list[0].subject,
        first_at: list[0].at,
        last_at: list[list.length - 1].at,
        counterpart: counterpartEmail,
        latest_direction: list[list.length - 1].direction,
        email_ids: list.map(e => e.id),
      });
    }
    if (foreign.length) {
      report.push({
        ticket_id: t.id, ticket_number: Number(t.ticket_number), customer_name: t.customer_name,
        status: t.status, consignment: t.consignment_number, consignment_is_real: !!realConsignment,
        threads_total: byThread.size, threads_to_move: foreign.length,
        emails_to_move: foreign.reduce((n, f) => n + f.emails, 0),
        threads: foreign,
      });
    }
  }
  return {
    tickets_affected: report.length,
    threads_to_move: report.reduce((n, r) => n + r.threads_to_move, 0),
    emails_to_move: report.reduce((n, r) => n + r.emails_to_move, 0),
    tickets: report,
  };
}

/** Move each wrongly merged thread to a ticket of its own. Returns what was done. */
export async function splitMergedThreads({ ticketNumbers = null, onProgress = null } = {}) {
  const matchers = await getTrackingMatchers();
  const { tickets } = await findMergedThreads({ ticketNumbers });
  const done = [];
  const failed = [];
  const total = tickets.reduce((n, t) => n + t.threads.length, 0);
  for (const t of tickets) {
    for (const f of t.threads) {
      try {
      const counterpart = f.counterpart;
      const family = courierFamily(counterpart);
      const customer = family ? null : (counterpart ? await resolveCustomer(counterpart) : null);
      const stale = Date.now() - new Date(f.last_at).getTime() > STALE_DAYS * 86400000;
      const status = RESOLVED.includes(t.status) || stale ? 'resolved'
        : String(f.latest_direction || '').startsWith('inbound') ? 'open' : 'pending';

      // A real consignment mentioned in the thread, if any.
      const text = (await query(`SELECT string_agg(COALESCE(subject,'') || ' ' || COALESCE(LEFT(body_text, 5000),''), ' ') AS t
                                   FROM query_emails WHERE id = ANY($1)`, [f.email_ids])).rows[0]?.t || '';
      let consignment = null;
      for (const tok of text.match(/\b[A-Za-z0-9]{8,30}\b/g) || []) {
        const hit = recognizeTracking(tok, matchers);
        if (hit && (!family || courierFamily(hit.courier_code) === family || !courierFamily(hit.courier_code))) { consignment = hit.normalized; break; }
      }

      const ins = await query(`
        INSERT INTO queries
          (customer_id, customer_name, sender_email, sender_matched, subject, description,
           status, query_type, group_name, group_set_by, courier_code, courier_name, consignment_number,
           trigger, created_at, updated_at, resolved_at)
        VALUES ($1, $2, $3, $4, $5, $5, $6::query_status, 'other', 'Customer Service', 'triage', $7, $8, $9,
                'customer_email', $10, $11, CASE WHEN $6 = 'resolved' THEN $11::timestamptz END)
        RETURNING id, ticket_number`,
        [customer?.id || null,
         customer?.business_name || counterpart || '(unknown)',
         counterpart, customer != null,
         f.first_subject || '(no subject)',
         status,
         family === 'royalmail' ? 'royal_mail' : family,
         family ? family.toUpperCase() : null,
         consignment,
         f.first_at, f.last_at]);
      const moved = await query(
        `UPDATE query_emails SET query_id = $1 WHERE query_id = $2 AND gmail_thread_id = $3`,
        [ins.rows[0].id, t.ticket_id, f.gmail_thread_id]);
      done.push({ from_ticket: t.ticket_number, new_ticket: Number(ins.rows[0].ticket_number), thread: f.gmail_thread_id,
                  subject: f.first_subject, status, emails_moved: moved.rowCount });
      } catch (e) {
        // One bad thread is recorded and skipped, not allowed to stop the rest.
        failed.push({ from_ticket: t.ticket_number, thread: f.gmail_thread_id, subject: f.first_subject, error: e.message });
        console.warn(`[Thread repair] #${t.ticket_number} thread ${f.gmail_thread_id} failed:`, e.message);
      }
      if (onProgress) await onProgress({ total, moved: done.length, failed: failed.length, last_error: failed.at(-1)?.error || null });
    }
    // The junk "consignment" that caused the merging is cleared.
    if (!t.consignment_is_real && t.consignment) {
      await query(`UPDATE queries SET consignment_number = NULL, updated_at = NOW() WHERE id = $1`, [t.ticket_id]);
    }
  }
  return { tickets_split: tickets.length, new_tickets: done.length, moves: done, failed };
}

const SPLIT_MARKER = 'split_merged_threads_v1';
const JOB = 'split_merged_threads';

// Progress / outcome of the one-time job, readable through the report endpoint
// (the API can't see the server logs).
async function setJobStatus(fields) {
  await query(`CREATE TABLE IF NOT EXISTS app_job_status (job TEXT PRIMARY KEY, status JSONB NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`);
  await query(
    `INSERT INTO app_job_status (job, status, updated_at) VALUES ($1, $2::jsonb, NOW())
     ON CONFLICT (job) DO UPDATE SET status = app_job_status.status || EXCLUDED.status, updated_at = NOW()`,
    [JOB, JSON.stringify(fields)],
  );
}

export async function getSplitJobStatus() {
  try {
    const r = await query(`SELECT status, updated_at FROM app_job_status WHERE job = $1`, [JOB]);
    return r.rows[0] ? { ...r.rows[0].status, updated_at: r.rows[0].updated_at } : null;
  } catch { return null; }
}

/** Run the split once, ever. Safe to call on every start; a rerun after a crash is harmless (already-moved threads aren't found again). */
export async function splitMergedThreadsOnce() {
  try {
    await query(`CREATE TABLE IF NOT EXISTS app_backfill_markers (key TEXT PRIMARY KEY, completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`);
    const done = await query(`SELECT 1 FROM app_backfill_markers WHERE key = $1`, [SPLIT_MARKER]);
    if (done.rows.length) return { skipped: 'already run' };
    await setJobStatus({ state: 'running', started_at: new Date().toISOString(), error: null });
    console.log('[Thread repair] Splitting wrongly merged email threads into their own tickets…');
    let lastWrite = 0;
    const result = await splitMergedThreads({
      onProgress: async (p) => {
        if (Date.now() - lastWrite > 5000 || p.moved + p.failed === p.total) { lastWrite = Date.now(); await setJobStatus(p); }
      },
    });
    const resolved = result.moves.filter(m => m.status === 'resolved').length;
    const emails = result.moves.reduce((n, m) => n + m.emails_moved, 0);
    console.log(`[Thread repair] Done: ${result.tickets_split} ticket(s) cleaned, ${result.new_tickets} new ticket(s) ` +
      `(${resolved} resolved as quiet for ${STALE_DAYS}+ days), ${emails} email(s) moved, ${result.failed.length} failed.`);
    await setJobStatus({ state: result.failed.length ? 'done_with_failures' : 'done', finished_at: new Date().toISOString(),
      new_tickets: result.new_tickets, resolved, emails_moved: emails, failures: result.failed.slice(0, 20) });
    // Only mark complete when nothing failed, so a fix + redeploy retries the rest.
    if (!result.failed.length) await query(`INSERT INTO app_backfill_markers (key) VALUES ($1) ON CONFLICT DO NOTHING`, [SPLIT_MARKER]);
    return result;
  } catch (e) {
    console.warn('[Thread repair] stopped:', e.message);
    await setJobStatus({ state: 'error', error: e.message, failed_at: new Date().toISOString() }).catch(() => {});
    throw e;
  }
}
