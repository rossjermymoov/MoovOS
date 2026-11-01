/**
 * matchingCleanup.js — one-time clean-up after the email matching rules
 * changed (Nov 2026, client-approved fixes 1–6):
 *
 *   1. Conversations about several parcels filed on one customer's ticket are
 *      moved to tickets of their own (threadRepair's rule now requires a kept
 *      thread to name only the ticket's parcel) — e.g. DPD's clawback emails
 *      on East London Packaging's #1420.
 *   2. Tickets made from a courier's noreply notices (#4347 "Confirmation of
 *      Parcel Exceptions from DPD") are resolved: nobody wrote to us.
 *   3. Unsent courier drafts that name no parcel ("consignment null",
 *      "consignment (n/a)") are removed.
 *
 * Runs once at server start, guarded by a marker row; progress and outcome are
 * stored in app_job_status (job 'email_matching_cleanup'). No web endpoint
 * applies it — the API has no login.
 */

import { query } from '../db/index.js';
import { splitMergedThreads, consignmentForms, mentions } from './threadRepair.js';
import { consignmentsInText } from './gmailSync.js';
import { getTrackingMatchers, recognizeTracking } from './courierAutomation.js';

const MARKER = 'email_matching_cleanup_v1';
const JOB = 'email_matching_cleanup';
const RESOLVED = `('resolved','resolved_claim_approved','resolved_claim_rejected')`;
// Same senders gmailSync treats as automatic courier notices (COURIER_NOREPLY),
// written for Postgres, restricted to courier domains.
const NOREPLY_SQL = `'^(no[-_.]?reply|do[-_.]?not[-_.]?reply|donotreply)[^@]*@'`;
const COURIER_DOMAIN_SQL = `'@([a-z0-9-]+\\.)*(dpd|dhl|evri|hermes|myhermes|yodel|ups|parcelforce|royalmail|fedex|agl)\\.'`;

async function setJobStatus(fields) {
  await query(`CREATE TABLE IF NOT EXISTS app_job_status (job TEXT PRIMARY KEY, status JSONB NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`);
  await query(
    `INSERT INTO app_job_status (job, status, updated_at) VALUES ($1, $2::jsonb, NOW())
     ON CONFLICT (job) DO UPDATE SET status = app_job_status.status || EXCLUDED.status, updated_at = NOW()`,
    [JOB, JSON.stringify(fields)],
  );
}

export async function getMatchingCleanupStatus() {
  try {
    const r = await query(`SELECT status, updated_at FROM app_job_status WHERE job = $1`, [JOB]);
    return r.rows[0] ? { ...r.rows[0].status, updated_at: r.rows[0].updated_at } : null;
  } catch { return null; }
}

// Tickets that only ever held a courier's noreply notices: no Moov email sent,
// every email from a noreply courier address. Resolved, with their unsent AI
// drafts removed.
export async function resolveNoreplyNoticeTickets() {
  const r = await query(`
    WITH notice_tickets AS (
      SELECT q.id, q.ticket_number
        FROM queries q
       WHERE q.status NOT IN ${RESOLVED}
         AND lower(q.sender_email) ~ ${NOREPLY_SQL}
         AND lower(q.sender_email) ~ ${COURIER_DOMAIN_SQL}
         AND NOT EXISTS (
           SELECT 1 FROM query_emails qe
            WHERE qe.query_id = q.id AND COALESCE(qe.is_ai_draft, false) = false
              AND NOT (qe.direction = 'inbound_courier' AND lower(qe.from_address) ~ ${NOREPLY_SQL})
         )
    ), drafts AS (
      DELETE FROM query_emails qe USING notice_tickets n
       WHERE qe.query_id = n.id AND qe.is_ai_draft = true AND qe.sent_at IS NULL
      RETURNING qe.id
    )
    UPDATE queries q
       SET status = 'resolved', resolved_at = NOW(), requires_attention = false,
           internal_automation_state = 'completed_autopilot', updated_at = NOW()
      FROM notice_tickets n
     WHERE q.id = n.id
    RETURNING q.ticket_number, (SELECT COUNT(*) FROM drafts) AS drafts_removed`);
  return {
    tickets: r.rows.map(x => Number(x.ticket_number)),
    drafts_removed: Number(r.rows[0]?.drafts_removed || 0),
  };
}

// Unsent courier drafts that don't name a parcel.
export async function removeParcelessCourierDrafts() {
  const r = await query(`
    DELETE FROM query_emails
     WHERE is_ai_draft = true AND sent_at IS NULL AND direction = 'outbound_courier'
       AND (body_text ILIKE '%consignment null%' OR body_text ILIKE '%consignment (n/a)%')
    RETURNING query_id`);
  return r.rows.length;
}

/** Run the clean-up once, ever. Safe on every start; reruns after a failure only redo what's left. */
export async function matchingCleanupOnce() {
  try {
    await query(`CREATE TABLE IF NOT EXISTS app_backfill_markers (key TEXT PRIMARY KEY, completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`);
    const done = await query(`SELECT 1 FROM app_backfill_markers WHERE key = $1`, [MARKER]);
    if (done.rows.length) return { skipped: 'already run' };
    await setJobStatus({ state: 'running', started_at: new Date().toISOString(), error: null });
    console.log('[Matching clean-up] Starting…');

    const split = await splitMergedThreads();
    const notices = await resolveNoreplyNoticeTickets();
    const parceless = await removeParcelessCourierDrafts();

    const summary = {
      state: split.failed.length ? 'done_with_failures' : 'done',
      finished_at: new Date().toISOString(),
      threads_moved: split.new_tickets,
      moves: split.moves.slice(0, 50).map(m => ({ from: m.from_ticket, to: m.new_ticket, subject: m.subject, status: m.status })),
      notice_tickets_resolved: notices.tickets.length,
      notice_tickets: notices.tickets.slice(0, 100),
      notice_drafts_removed: notices.drafts_removed,
      parceless_drafts_removed: parceless,
      failures: split.failed.slice(0, 20),
    };
    await setJobStatus(summary);
    console.log(`[Matching clean-up] Done: ${split.new_tickets} conversation(s) moved to their own tickets, ` +
      `${notices.tickets.length} noreply-notice ticket(s) resolved, ${parceless + notices.drafts_removed} draft(s) removed, ` +
      `${split.failed.length} failed.`);
    if (!split.failed.length) await query(`INSERT INTO app_backfill_markers (key) VALUES ($1) ON CONFLICT DO NOTHING`, [MARKER]);
    return summary;
  } catch (e) {
    console.warn('[Matching clean-up] stopped:', e.message);
    await setJobStatus({ state: 'error', error: e.message, failed_at: new Date().toISOString() }).catch(() => {});
    throw e;
  }
}

// ── Undo of wrong moves (v1 counted a DPD return relabel, other boxes of the
// same shipment and "C-…" references as extra parcels) ──────────────────────
// Every ticket the clean-up created carries a "moved_off" link to the ticket
// its conversation came from. Re-judged with the corrected parcel count, a
// conversation that names only that ticket's parcel goes back, and the ticket
// made for it is removed (or resolved, if anything else now refers to it).
const UNDO_MARKER = 'email_matching_undo_v1';
const UNDO_JOB = 'email_matching_undo';

export async function undoWrongMoves() {
  const matchers = await getTrackingMatchers();
  const moved = (await query(`
    SELECT n.id AS new_id, n.ticket_number AS new_no, o.id AS orig_id, o.ticket_number AS orig_no, o.consignment_number
      FROM queries n
      CROSS JOIN LATERAL jsonb_to_recordset(n.linked_ticket_suggestions) AS s(query_id uuid, reason text)
      JOIN queries o ON o.id = s.query_id
     WHERE s.reason = 'moved_off'`)).rows;
  const restored = [], kept = [], failed = [];
  for (const m of moved) {
    try {
      const text = (await query(
        `SELECT string_agg(COALESCE(subject,'') || E'\n' || COALESCE(LEFT(body_text, 20000),''), E'\n') AS t
           FROM query_emails WHERE query_id = $1`, [m.new_id])).rows[0]?.t || '';
      const real = recognizeTracking(m.consignment_number, matchers);
      const belongs = real && mentions(text, consignmentForms(m.consignment_number))
        && (await consignmentsInText(text, null)).size <= 1;
      if (!belongs) { kept.push({ ticket: Number(m.new_no), from: Number(m.orig_no) }); continue; }

      const back = await query(`UPDATE query_emails SET query_id = $1 WHERE query_id = $2 RETURNING id`, [m.orig_id, m.new_id]);
      await query(`UPDATE queries SET updated_at = NOW() WHERE id = $1`, [m.orig_id]);
      let removed = true;
      try { await query(`DELETE FROM queries WHERE id = $1`, [m.new_id]); }
      catch {
        removed = false;
        await query(
          `UPDATE queries SET status = 'resolved', resolved_at = NOW(), requires_attention = false,
                  description = $2, updated_at = NOW() WHERE id = $1`,
          [m.new_id, `Emails moved back to #${m.orig_no}.`]);
      }
      restored.push({ ticket: Number(m.new_no), back_to: Number(m.orig_no), emails: back.rows.length, removed });
    } catch (e) {
      failed.push({ ticket: Number(m.new_no), error: e.message });
      console.warn(`[Matching undo] #${m.new_no} failed:`, e.message);
    }
  }
  return { restored, kept, failed };
}

export async function undoWrongMovesOnce() {
  try {
    await query(`CREATE TABLE IF NOT EXISTS app_backfill_markers (key TEXT PRIMARY KEY, completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`);
    const done = await query(`SELECT 1 FROM app_backfill_markers WHERE key = $1`, [UNDO_MARKER]);
    if (done.rows.length) return { skipped: 'already run' };
    console.log('[Matching undo] Putting wrongly moved conversations back…');
    const r = await undoWrongMoves();
    const summary = {
      state: r.failed.length ? 'done_with_failures' : 'done', finished_at: new Date().toISOString(),
      restored: r.restored.length, restored_list: r.restored.slice(0, 50), kept_separate: r.kept, failures: r.failed.slice(0, 20),
    };
    await query(`CREATE TABLE IF NOT EXISTS app_job_status (job TEXT PRIMARY KEY, status JSONB NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`);
    await query(
      `INSERT INTO app_job_status (job, status, updated_at) VALUES ($1, $2::jsonb, NOW())
       ON CONFLICT (job) DO UPDATE SET status = EXCLUDED.status, updated_at = NOW()`,
      [UNDO_JOB, JSON.stringify(summary)]);
    console.log(`[Matching undo] Done: ${r.restored.length} conversation(s) put back, ${r.kept.length} kept separate, ${r.failed.length} failed.`);
    if (!r.failed.length) await query(`INSERT INTO app_backfill_markers (key) VALUES ($1) ON CONFLICT DO NOTHING`, [UNDO_MARKER]);
    return summary;
  } catch (e) {
    console.warn('[Matching undo] stopped:', e.message);
    throw e;
  }
}

export async function getUndoStatus() {
  try {
    const r = await query(`SELECT status, updated_at FROM app_job_status WHERE job = $1`, [UNDO_JOB]);
    return r.rows[0] ? { ...r.rows[0].status, updated_at: r.rows[0].updated_at } : null;
  } catch { return null; }
}
