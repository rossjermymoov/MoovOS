/**
 * scheduledSend.js — sending replies now or at a chosen time.
 *
 * Every outbound message typed or approved in MoovOS goes out through the Gmail
 * send gateway (sendGateway.js). This module adds:
 *   - sendNow(emailId)            claim the row, send it, record it as sent
 *   - runDueScheduledSends()      send every scheduled row whose time has come
 *   - startScheduledSender()      run that once a minute
 *
 * A row is claimed (send_status → 'sending') with a single conditional UPDATE
 * before Gmail is called, so the scheduler and a "Send now" click can never
 * both send the same message.
 */

import { query } from '../db/index.js';
import { sendQueryEmail } from './sendGateway.js';
import { STATUS_GROUPS } from './statusGroups.js';

// Scheduling limits: far enough out to be useful, near enough that a forgotten
// message doesn't surprise anyone months later.
export const MIN_SCHEDULE_LEAD_MS = 60 * 1000;
export const MAX_SCHEDULE_DAYS    = 60;

// A 'sending' row older than this was interrupted mid-send (deploy/crash). We
// can't know whether Gmail accepted it, so it is marked failed for a person to
// check rather than retried into a possible duplicate.
const STUCK_SENDING_MINUTES = 10;

export function validateScheduleTime(value) {
  const at = new Date(value);
  if (Number.isNaN(at.getTime())) return { error: 'That send time is not a valid date.' };
  const now = Date.now();
  if (at.getTime() < now + MIN_SCHEDULE_LEAD_MS) return { error: 'Pick a send time at least a minute from now.' };
  if (at.getTime() > now + MAX_SCHEDULE_DAYS * 86400000) return { error: `Pick a send time within the next ${MAX_SCHEDULE_DAYS} days.` };
  return { at };
}

// Once a message has actually left: stamp it sent, record first response time,
// and move the ticket on — a courier chase → Awaiting courier; the "please
// confirm the details" question → Awaiting customer info. Only from Open / In
// Progress, never over a claim or resolved ticket.
export async function markOutboundSent(emailId) {
  const r = await query(
    `UPDATE query_emails
        SET sent_at = NOW(), send_status = 'sent', send_error = NULL, is_ai_draft = false
      WHERE id = $1
      RETURNING query_id, direction`,
    [emailId],
  );
  const row = r.rows[0];
  if (!row) return;

  await query(
    `UPDATE queries
        SET first_response_at   = COALESCE(first_response_at, NOW()),
            first_response_mins = COALESCE(first_response_mins,
              CEIL(EXTRACT(EPOCH FROM (NOW() - created_at)) / 60)::int),
            updated_at = NOW()
      WHERE id = $1`,
    [row.query_id],
  );

  try {
    const t = await query(`SELECT internal_automation_state FROM queries WHERE id = $1`, [row.query_id]);
    const nextStatus = row.direction === 'outbound_courier' ? 'awaiting_courier'
      : row.direction === 'outbound_customer' && t.rows[0]?.internal_automation_state === 'awaiting_customer' ? 'awaiting_customer_info'
      : null;
    if (nextStatus) {
      await query(
        `UPDATE queries SET status = $2::query_status, updated_at = NOW()
          WHERE id = $1 AND status::text = ANY($3)`,
        [row.query_id, nextStatus, [...STATUS_GROUPS.open, ...STATUS_GROUPS.in_progress]],
      );
    }
  } catch (e) { console.warn('[Send] status update failed:', e.message); }
}

// Claim one unsent row and send it. Returns { sent: true } or throws with the
// gateway's reason (the row is then left 'failed' with send_error).
export async function sendNow(emailId, { sentBy = 'human' } = {}) {
  const claim = await query(
    `UPDATE query_emails SET send_status = 'sending', send_claimed_at = NOW()
      WHERE id = $1 AND sent_at IS NULL
        AND (send_status IS NULL OR send_status IN ('scheduled', 'failed'))
      RETURNING id`,
    [emailId],
  );
  if (!claim.rows.length) throw new Error('This message is already being sent or has been sent.');

  // On failure the gateway records send_status='failed' + send_error and throws.
  await sendQueryEmail(emailId, { sentBy });
  await markOutboundSent(emailId);
  return { sent: true };
}

export async function runDueScheduledSends() {
  const due = await query(
    `SELECT id FROM query_emails
      WHERE send_status = 'scheduled' AND sent_at IS NULL
        AND scheduled_send_at <= NOW()
      ORDER BY scheduled_send_at
      LIMIT 25`,
  );
  let sent = 0, failed = 0;
  for (const { id } of due.rows) {
    try { await sendNow(id, { sentBy: 'human' }); sent++; }
    catch (e) {
      failed++;
      console.warn(`[Scheduled send] ${id} not sent: ${e.message}`);
    }
  }
  if (sent || failed) console.log(`[Scheduled send] sent ${sent}, failed ${failed}`);
  return { sent, failed };
}

export async function recoverInterruptedSends() {
  const r = await query(
    `UPDATE query_emails
        SET send_status = 'failed',
            send_error  = 'Sending was interrupted. Check the Gmail Sent folder before sending again.'
      WHERE send_status = 'sending' AND sent_at IS NULL
        AND COALESCE(send_claimed_at, created_at) < NOW() - make_interval(mins => $1)
      RETURNING id`,
    [STUCK_SENDING_MINUTES],
  );
  if (r.rows.length) console.warn(`[Scheduled send] ${r.rows.length} interrupted send(s) marked failed`);
}

export function startScheduledSender(intervalMs = 60 * 1000) {
  let running = false;   // a slow Gmail run must not overlap the next tick
  const tick = () => {
    if (running) return;
    running = true;
    recoverInterruptedSends()
      .then(runDueScheduledSends)
      .catch(e => console.warn('[Scheduled send] run failed:', e.message))
      .finally(() => { running = false; });
  };
  setInterval(tick, intervalMs);
  setTimeout(tick, 15 * 1000);
  console.log('[Scheduled send] checking every minute');
}
