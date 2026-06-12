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
import { extractTriage } from './geminiService.js';
import { matchTemplate, fillTemplate } from './courierTemplates.js';

const DEFAULT_SLA_HOURS = 24;
const SUPPORT_FROM = 'service@moovparcel.co.uk';

async function insertDraft(queryId, direction, subject, body) {
  await query(
    `INSERT INTO query_emails
       (query_id, direction, subject, body_text, from_address, is_ai_draft, created_at)
     VALUES ($1, $2::email_direction, $3, $4, $5, true, NOW())`,
    [queryId, direction, subject, body, SUPPORT_FROM],
  );
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

  // Sandbox: create drafts only — nothing leaves the building.
  await insertDraft(queryId, 'outbound_customer',
    `Re: ${ticket.subject || 'your enquiry'}`,
    fillTemplate(template.customerConfirmation, vars));
  await insertDraft(queryId, 'outbound_courier',
    `${template.courierName} — ${triage.issue_type} — ${vars.tracking_code}`,
    fillTemplate(template.courierInquiry, vars));

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

// A courier reply arrived on the thread → record it and hand the ball back to us.
export async function recordCourierReply(queryId, { subject = '', body = '' } = {}) {
  await query(
    `INSERT INTO query_emails
       (query_id, direction, subject, body_text, from_address, is_ai_draft, received_at, created_at)
     VALUES ($1, 'inbound_courier'::email_direction, $2, $3, 'courier@external.invalid', false, NOW(), NOW())`,
    [queryId, subject || 'Courier update', body],
  );
  await query(
    `UPDATE queries
        SET internal_automation_state = 'action_required',
            updated_at = NOW()
      WHERE id = $1`,
    [queryId],
  );
  return { status: 'courier_reply_recorded' };
}
