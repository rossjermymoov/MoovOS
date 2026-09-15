/**
 * loopController.js — WISMO Phase 3 (MOS-6): whole-case SLA clock, auto-chase
 * cadence, and spot-check sampling.
 *
 * All three run on setInterval from index.js, the same pattern already used by
 * slaMonitor.js's runSlaScreamScan — no cron dependency in this codebase.
 *
 * IMPORTANT — safety: nothing in this file sends an email unless
 * AUTOPILOT_LIVE_SEND_ENABLED=true AND the specific (courier_code, intent) category
 * has workflow_trust.autopilot_enabled=true. Otherwise every chase lands as a normal
 * draft in QA Bay, identical to the existing manual /auto-remind behaviour.
 */

import { query } from '../db/index.js';
import { resolveCourierEmail, insertDraft } from './courierAutomation.js';
import { isAutopilotEnabled } from './workflowTrust.js';
import { sendQueryEmail } from './sendGateway.js';

const RESOLVED = `('resolved','resolved_claim_approved','resolved_claim_rejected')`;
const AUTOPILOT_LIVE = process.env.AUTOPILOT_LIVE_SEND_ENABLED === 'true';

async function getSettings() {
  const r = await query(`SELECT * FROM automation_settings WHERE id = 1`);
  return r.rows[0];
}

// ─── Whole-case SLA clock ───────────────────────────────────────────────────────
// Separate from the existing per-hop courier_sla_expires_at (slaMonitor.js). Set
// once at ticket creation, never reset by exchanges. Breach here means the WHOLE
// case has run past its human-escalation deadline, regardless of how many
// courier/customer round-trips happened in between.
export async function runWholeCaseSlaScan() {
  const due = await query(`
    SELECT id, ticket_number FROM queries
     WHERE whole_case_sla_deadline IS NOT NULL
       AND whole_case_sla_deadline < NOW()
       AND status NOT IN ${RESOLVED}
       AND COALESCE(requires_attention, false) = false
     LIMIT 100
  `);
  let escalated = 0;
  for (const t of due.rows) {
    await query(
      `UPDATE queries
          SET requires_attention = true,
              attention_reason = 'Whole-case SLA deadline passed — case has been open too long without resolution.',
              escalation_source = 'whole_case_sla_breach',
              updated_at = NOW()
        WHERE id = $1`,
      [t.id],
    );
    escalated++;
  }
  if (escalated) console.log(`[LoopController] whole-case SLA breach: escalated ${escalated} ticket(s)`);
  return { escalated };
}

// ─── Auto-chase composition (shared by the manual /auto-remind button and the
// scheduled scanner below) ──────────────────────────────────────────────────────
export function composeChaseEmail(ticket, stage) {
  const ref = ticket.courier_reference_id || `Moov-${ticket.ticket_number}`;
  const consignment = ticket.consignment_number || '(n/a)';
  const courierName = ticket.courier_name || 'courier';

  let middle, subjectPrefix;
  if (stage <= 1) {
    subjectPrefix = 'Reminder';
    middle =
      `Following up on our earlier query (Ref ${ref}) regarding consignment ${consignment}. ` +
      `We have not yet received a response — please provide an update when you can.`;
  } else if (stage === 2) {
    subjectPrefix = 'Second reminder — please respond';
    middle =
      `This is our second follow-up on consignment ${consignment} (Ref ${ref}). We still have not ` +
      `received a response and need to keep progressing this for our customer — please treat this as urgent.`;
  } else {
    subjectPrefix = `Escalation (chase ${stage}) — urgent response required`;
    middle =
      `We have chased consignment ${consignment} (Ref ${ref}) multiple times with no response. ` +
      `This is now being escalated — please respond urgently or advise who we should contact.`;
  }

  return {
    subject: `[Ref: ${ref}] ${subjectPrefix} — ${courierName}`,
    body: middle,
    // Stage 3+ escalates CC to the courier's claims inbox as an extra contact —
    // approximate, since real escalation contacts are Sam's to define per courier.
    ccEscalate: stage >= 3,
  };
}

// ─── Auto-chase scanner ──────────────────────────────────────────────────────────
// Mirrors Sam's manual cadence: 48h → first chase, 120h → second, then repeating
// every chase_escalate_hours indefinitely until a reply arrives.
export async function runAutoChaseScan() {
  const settings = await getSettings();
  const due = await query(`
    SELECT q.id, q.ticket_number, q.courier_code, q.courier_name, q.consignment_number,
           q.courier_reference_id, q.chase_stage, q.last_chase_sent_at, q.triage_intent,
           (SELECT MIN(sent_at) FROM query_emails WHERE query_id = q.id AND direction = 'outbound_courier' AND sent_at IS NOT NULL) AS first_contact_at
      FROM queries q
     WHERE q.internal_automation_state = 'awaiting_courier_response'
       AND q.status NOT IN ${RESOLVED}
       AND q.last_courier_response_at IS NULL
     LIMIT 100
  `);

  let chased = 0;
  for (const t of due.rows) {
    if (!t.first_contact_at) continue;

    // Stages 0→1 and 1→2 are measured from the ORIGINAL outbound message (Sam's
    // cadence: 48h, then 120h — both absolute, not stacked). Stage 2+ escalates
    // incrementally from the last chase, since beyond that Sam's process is
    // "keep escalating" rather than a fixed schedule. Confirm exact cadence with
    // Sam before relying on this beyond the first two stages.
    const nextStage = t.chase_stage + 1;
    let hoursSince, thresholdHours;
    if (t.chase_stage <= 1) {
      hoursSince = (Date.now() - new Date(t.first_contact_at).getTime()) / 3600000;
      thresholdHours = t.chase_stage === 0 ? settings.chase_first_hours : settings.chase_second_hours;
    } else {
      const anchor = t.last_chase_sent_at || t.first_contact_at;
      hoursSince = (Date.now() - new Date(anchor).getTime()) / 3600000;
      thresholdHours = settings.chase_escalate_hours;
    }

    if (hoursSince < thresholdHours) continue;

    const { subject, body } = composeChaseEmail(t, nextStage);
    const courierEmail = await resolveCourierEmail(t.courier_code, 'GENERAL');

    const draftId = await insertDraft(t.id, 'outbound_courier', subject, body, courierEmail);

    // Only auto-send if BOTH the global kill switch and the category's trust are on
    // — otherwise this is a normal draft, same as the existing manual button.
    if (AUTOPILOT_LIVE && await isAutopilotEnabled(t.courier_code, t.triage_intent || 'courier_chase')) {
      try { await sendQueryEmail(draftId, { sentBy: 'autopilot' }); }
      catch (e) { console.warn(`[LoopController] auto-chase send failed for ticket ${t.id}:`, e.message); }
    }

    await query(
      `UPDATE queries SET chase_stage = $2, last_chase_sent_at = NOW(), updated_at = NOW() WHERE id = $1`,
      [t.id, nextStage],
    );
    chased++;
  }
  if (chased) console.log(`[LoopController] auto-chase: drafted/sent ${chased} chase(s)`);
  return { chased };
}

// ─── Spot-check sampling ─────────────────────────────────────────────────────────
// Once/day (date-guarded, not time-of-day guarded, so it survives restarts and
// missed ticks cleanly). Samples from real autopilot dispatches in the last 24h.
export async function runSpotCheckSampling() {
  const settings = await getSettings();
  const today = new Date().toISOString().slice(0, 10);
  if (settings.spot_check_last_run_on === today) return { skipped: 'already run today' };

  const candidates = await query(`
    SELECT DISTINCT ON (a.query_id) a.query_id, q.courier_code, q.triage_intent
      FROM audit_logs a
      JOIN queries q ON q.id = a.query_id
     WHERE a.action_type = 'autopilot_dispatch'
       AND a.created_at > NOW() - INTERVAL '24 hours'
     ORDER BY a.query_id, a.created_at DESC
  `);

  const pool = candidates.rows;
  const sampleSize = Math.min(settings.spot_check_daily_target, pool.length);
  const sampled = pool.sort(() => Math.random() - 0.5).slice(0, sampleSize);

  for (const c of sampled) {
    await query(
      `INSERT INTO spot_check_samples (query_id, courier_code, intent) VALUES ($1, $2, $3)`,
      [c.query_id, c.courier_code, c.triage_intent],
    );
  }

  await query(`UPDATE automation_settings SET spot_check_last_run_on = $1, updated_at = NOW() WHERE id = 1`, [today]);
  if (sampled.length) console.log(`[LoopController] spot-check: sampled ${sampled.length} of ${pool.length} autopiloted ticket(s)`);
  return { sampled: sampled.length, pool: pool.length };
}
