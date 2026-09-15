/**
 * calibratePhase3.js — WISMO Phase 3 (MOS-6) calibration harness.
 *
 * Runs the Reply Interpreter's classification and the dissatisfaction check as a
 * READ-ONLY dry run against already-resolved historical tickets. No drafts are
 * created, no emails are sent, and nothing is written back to the database — this
 * is purely for a human to eyeball how the new logic would have judged real past
 * cases before ever trusting it live. Uses classifyCourierReply() and
 * checkDissatisfaction() directly (the same pure functions the live system calls),
 * not a reimplementation, so there is exactly one source of truth for the rules.
 *
 * Usage (from the server/ directory, or project root):
 *   node server/scripts/calibratePhase3.js [--limit=20]
 *
 * Requires GEMINI_API_KEY and DATABASE_URL in the environment. Respects the shared
 * 20-req/min free-tier quota by throttling one classification call every 4 seconds
 * — do not remove the delay to "speed this up".
 */

import { query } from '../db/index.js';
import { classifyCourierReply } from '../services/replyInterpreter.js';
import { checkDissatisfaction } from '../services/dissatisfactionEngine.js';

const RESOLVED = `('resolved','resolved_claim_approved','resolved_claim_rejected')`;
const THROTTLE_MS = 4000;

function arg(name, fallback) {
  const m = process.argv.find(a => a.startsWith(`--${name}=`));
  return m ? m.split('=')[1] : fallback;
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function getTicketsWithHistory(limit) {
  const r = await query(`
    SELECT id, ticket_number, subject, courier_code, consignment_number, customer_name, status
      FROM queries
     WHERE status IN ${RESOLVED}
       AND EXISTS (SELECT 1 FROM query_emails WHERE query_id = queries.id AND direction = 'inbound_courier')
       AND EXISTS (SELECT 1 FROM query_emails WHERE query_id = queries.id AND direction = 'inbound_customer')
     ORDER BY updated_at DESC
     LIMIT $1
  `, [limit]);
  return r.rows;
}

async function getThread(queryId) {
  const r = await query(
    `SELECT direction, body_text FROM query_emails
      WHERE query_id = $1
      ORDER BY COALESCE(received_at, created_at) ASC`,
    [queryId],
  );
  return r.rows;
}

function excerpt(text, n = 140) {
  return (text || '').replace(/\s+/g, ' ').trim().slice(0, n);
}

async function run() {
  const limit = parseInt(arg('limit', '20'), 10);
  console.log(`\n[Calibration] Sampling up to ${limit} resolved tickets with courier + customer reply history...\n`);

  const tickets = await getTicketsWithHistory(limit);
  console.log(`[Calibration] Found ${tickets.length} candidate ticket(s).\n`);

  let calls = 0;

  for (const ticket of tickets) {
    const thread = await getThread(ticket.id);
    console.log(`\n=== Ticket ${ticket.ticket_number} (${ticket.courier_code || 'no courier'}, final status: ${ticket.status}) ===`);
    console.log(`Subject: ${ticket.subject}`);

    // Walk the thread; for each inbound_courier message, classify it against
    // everything that came before — exactly what the live system would have seen.
    for (let i = 0; i < thread.length; i++) {
      const msg = thread[i];
      const history = thread.slice(0, i);

      if (msg.direction === 'inbound_courier') {
        await sleep(THROTTLE_MS); calls++;
        const result = await classifyCourierReply(ticket, msg.body_text || '', history);
        console.log(`  [courier reply] "${excerpt(msg.body_text)}"`);
        console.log(`    → ${JSON.stringify(result)}`);
      }

      // Only check follow-up customer messages (i.e. not the very first message on
      // the ticket, which is the initial triage, not a mid-thread reply — matches
      // the live hook point in gmailSync.js, which only fires on existing tickets).
      if (msg.direction === 'inbound_customer') {
        const isFirstCustomerMsg = i === thread.findIndex(m => m.direction === 'inbound_customer');
        if (!isFirstCustomerMsg) {
          await sleep(THROTTLE_MS); calls++;
          const d = await checkDissatisfaction({ subject: ticket.subject, body: msg.body_text || '' });
          console.log(`  [customer reply] "${excerpt(msg.body_text)}"`);
          console.log(`    → ${JSON.stringify(d)}`);
        }
      }
    }
  }

  console.log(`\n[Calibration] Done. ${calls} classification call(s) made across ${tickets.length} ticket(s).`);
  console.log(`[Calibration] This was READ-ONLY — nothing was drafted, sent, or written to the database.\n`);
  process.exit(0);
}

run().catch(e => { console.error('[Calibration] Fatal error:', e); process.exit(1); });
