/**
 * courierAutomation.js — Split-Timeline Courier Orchestration (sandbox mode)
 *
 * The autonomous loop, draft-first: a customer email is triaged by Gemini,
 * matched to a courier template, and TWO drafts are created — a confirmation to
 * the customer and a structured inquiry to the courier — plus a 24h courier SLA.
 * Nothing is sent; agents approve drafts via the existing AI-draft UI. Flip
 * `AUTO_SEND` on once you trust it.
 */

import { query } from '../db/index.js';
import { extractTriage, geminiGenerate } from './geminiService.js';
import { matchTemplate, fillTemplate } from './courierTemplates.js';

const DEFAULT_SLA_HOURS = 24;
const SUPPORT_FROM = 'service@moovparcel.co.uk';

// Issue types that should route to the courier's claims/disputes inbox.
const CLAIM_ISSUES = new Set(['DAMAGED', 'LOST', 'RETURN_TO_SENDER']);

async function insertDraft(queryId, direction, subject, body, toAddress = null) {
  await query(
    `INSERT INTO query_emails
       (query_id, direction, subject, body_text, from_address, to_address, is_ai_draft, created_at)
     VALUES ($1, $2::email_direction, $3, $4, $5, $6, true, NOW())`,
    [queryId, direction, subject, body, SUPPORT_FROM, toAddress],
  );
}

// Resolve the live outbound courier address from courier_routing_rules.
// Picks the claims inbox for claim-type issues, else the general queries inbox.
// Falls back to the general address, then null, so drafting never blocks.
async function resolveCourierEmail(courierCode, issueType) {
  if (!courierCode) return null;
  try {
    const r = await query(
      `SELECT general_query_email, claims_email
         FROM courier_routing_rules
        WHERE courier_code = $1 AND is_active = true
        LIMIT 1`,
      [courierCode.toLowerCase()],
    );
    if (!r.rows.length) return null;
    const row = r.rows[0];
    return CLAIM_ISSUES.has(issueType)
      ? (row.claims_email || row.general_query_email)
      : (row.general_query_email || row.claims_email);
  } catch (e) {
    console.warn('[CourierAutomation] routing lookup failed:', e.message);
    return null;
  }
}

// Triage a customer email → draft customer confirmation + courier inquiry → set SLA.
export async function processCustomerEmail(queryId, { subject = '', body = '' } = {}) {
  const tRes = await query(
    `SELECT id, customer_name, courier_code, courier_name, consignment_number, subject
       FROM queries WHERE id = $1`,
    [queryId],
  );
  if (!tRes.rows.length) return { status: 'error', reason: 'ticket not found' };
  const ticket = tRes.rows[0];

  const triage = await extractTriage(subject || ticket.subject, body);

  // ── Acknowledgement filter ──────────────────────────────────────────────────
  // Automated receipts / 'do not reply' noise need no response. Close the loop
  // autonomously, bump the autopilot tally, and create NO drafts.
  if (triage.requires_reply === false) {
    await query(
      `UPDATE queries
          SET internal_automation_state = 'completed_autopilot',
              updated_at = NOW()
        WHERE id = $1`,
      [queryId],
    );
    return { status: 'autopilot_completed', reason: 'no reply required (automated/non-actionable)', triage };
  }

  const courierCode = triage.courier_code || ticket.courier_code;
  const template = courierCode ? matchTemplate(courierCode, triage.issue_type) : null;

  // No courier rule matched, or Gemini flagged a structural blocker → human.
  if (triage.needs_human || !template) {
    await query(
      `UPDATE queries
          SET internal_automation_state = 'action_required',
              requires_attention = true,
              attention_reason = $2,
              updated_at = NOW()
        WHERE id = $1`,
      [queryId, triage.reason || 'Automation could not match a courier rule — human review needed.'],
    );
    return { status: 'needs_human', triage };
  }

  const vars = {
    customer_name: ticket.customer_name || 'there',
    courier_name:  template.courierName,
    tracking_code: triage.tracking_code || ticket.consignment_number || '(tracking number)',
  };

  // Live routing — resolve the real courier inbox from courier_routing_rules.
  const courierEmail = await resolveCourierEmail(courierCode, triage.issue_type);

  // Sandbox: create drafts only — nothing leaves the building.
  await insertDraft(queryId, 'outbound_customer',
    `Re: ${ticket.subject || 'your enquiry'}`,
    fillTemplate(template.customerConfirmation, vars));
  await insertDraft(queryId, 'outbound_courier',
    `${template.courierName} — ${triage.issue_type} — ${vars.tracking_code}`,
    fillTemplate(template.courierInquiry, vars),
    courierEmail);

  const expiresAt = new Date(Date.now() + (template.slaHours || DEFAULT_SLA_HOURS) * 3600 * 1000);
  await query(
    `UPDATE queries
        SET internal_automation_state = 'awaiting_courier_response',
            courier_sla_expires_at = $2,
            courier_code = COALESCE(courier_code, $3),
            updated_at = NOW()
      WHERE id = $1`,
    [queryId, expiresAt, courierCode],
  );

  return {
    status: 'drafted',
    triage,
    courier: template.courierName,
    issue_type: triage.issue_type,
    sla_expires_at: expiresAt,
  };
}

// A courier reply arrived on the thread → record it, then run the autonomous
// "Courier Jargon Translation" loop: Gemini rewrites the dry/technical courier
// update into a clear, reassuring customer-facing draft, which lands in the
// Autopilot QA Bay for one-click approval.
const TRANSLATION_SYSTEM =
  'You are a customer success translation engine. Read this dry, technical, or ' +
  'internal logistics update from a courier, strip out internal jargon/codes, and ' +
  'write a polite, completely clear, reassuring response draft meant for the final ' +
  'customer explaining what is happening to their parcel. Sign off as "The Moov Parcel Team". ' +
  'Return ONLY the email body text, no preamble.';

export async function recordCourierReply(queryId, { subject = '', body = '', from = '' } = {}) {
  await query(
    `INSERT INTO query_emails
       (query_id, direction, subject, body_text, from_address, is_ai_draft, received_at, created_at)
     VALUES ($1, 'inbound_courier'::email_direction, $2, $3, $4, false, NOW(), NOW())`,
    [queryId, subject || 'Courier update', body, from || 'courier@external.invalid'],
  );

  // ── Autonomous translation → customer-facing draft ──────────────────────────
  let translated = null;
  try {
    translated = await geminiGenerate(body, { system: TRANSLATION_SYSTEM, maxTokens: 700, temperature: 0.4 });
  } catch (e) {
    console.warn('[CourierAutomation] translation failed:', e.message);
  }

  if (translated && translated.trim()) {
    const tRes = await query(`SELECT subject FROM queries WHERE id = $1`, [queryId]);
    const subj = tRes.rows[0]?.subject ? `Re: ${tRes.rows[0].subject}` : 'Update on your parcel';
    await insertDraft(queryId, 'outbound_customer', subj, translated.trim());
    // Draft is ready for a human to approve → surface it as awaiting QA.
    await query(
      `UPDATE queries
          SET internal_automation_state = 'awaiting_courier_response',
              updated_at = NOW()
        WHERE id = $1`,
      [queryId],
    );
    return { status: 'translated_draft_created' };
  }

  // No translation (no key / failure) → hand back to a human.
  await query(
    `UPDATE queries
        SET internal_automation_state = 'action_required',
            requires_attention = true,
            updated_at = NOW()
      WHERE id = $1`,
    [queryId],
  );
  return { status: 'courier_reply_recorded' };
}
