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

// Default Top-and-Tail boilerplate, used when a courier has no custom row.
const DEFAULT_TEMPLATES = {
  courier_header_template:  'Dear Carrier Team,',
  courier_footer_template:  'Many thanks,\nMoov Parcel Team',
  customer_header_template: 'Hi {{customer_name}},\n\nHere is an operational update regarding your delivery:',
  customer_footer_template: 'Kind regards,\nMoov Parcel Support Team',
};

// Read a courier's header/footer templates from courier_routing_rules.
async function getCourierTemplates(courierCode) {
  if (!courierCode) return { ...DEFAULT_TEMPLATES };
  try {
    const r = await query(
      `SELECT courier_header_template, courier_footer_template,
              customer_header_template, customer_footer_template
         FROM courier_routing_rules WHERE courier_code = $1 LIMIT 1`,
      [courierCode.toLowerCase()],
    );
    if (!r.rows.length) return { ...DEFAULT_TEMPLATES };
    // Fall back to defaults for any null column.
    const row = r.rows[0];
    const out = { ...DEFAULT_TEMPLATES };
    for (const k of Object.keys(DEFAULT_TEMPLATES)) if (row[k] != null) out[k] = row[k];
    return out;
  } catch (e) {
    console.warn('[CourierAutomation] template lookup failed:', e.message);
    return { ...DEFAULT_TEMPLATES };
  }
}

// Top-and-Tail stitcher: header + dynamic middle + footer, with token fill.
function stitch(header, middle, footer, vars) {
  return `${fillTemplate(header, vars)}\n\n${(middle || '').trim()}\n\n${fillTemplate(footer, vars)}`;
}

// Resolve the live outbound courier address from courier_routing_rules.
// Picks the claims inbox for claim-type issues, else the general queries inbox.
// Falls back to the general address, then null, so drafting never blocks.
async function resolveCourierEmail(courierCode, issueType) {
  if (!courierCode) return null;
  try {
    const r = await query(
      `SELECT queries_email, claims_email
         FROM courier_routing_rules
        WHERE courier_code = $1 AND is_active = true
        LIMIT 1`,
      [courierCode.toLowerCase()],
    );
    if (!r.rows.length) return null;
    const row = r.rows[0];
    return CLAIM_ISSUES.has(issueType)
      ? (row.claims_email || row.queries_email)
      : (row.queries_email || row.claims_email);
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

  // Live routing — resolve the real courier inbox + Top-and-Tail templates.
  const courierEmail = await resolveCourierEmail(courierCode, triage.issue_type);
  const tpl = await getCourierTemplates(courierCode);

  // Courier inquiry — header + concise (greeting-free) middle ask + footer.
  const issueLabel = (triage.issue_type || 'GENERAL').replace(/_/g, ' ').toLowerCase();
  const courierMiddle =
    `Please could you assist with consignment ${vars.tracking_code} regarding a ${issueLabel} issue ` +
    `for our customer ${vars.customer_name}? Please investigate and confirm the current status and next steps.`;
  const courierBody = stitch(tpl.courier_header_template, courierMiddle, tpl.courier_footer_template, vars);

  // Sandbox: create drafts only — nothing leaves the building.
  await insertDraft(queryId, 'outbound_customer',
    `Re: ${ticket.subject || 'your enquiry'}`,
    fillTemplate(template.customerConfirmation, vars));
  await insertDraft(queryId, 'outbound_courier',
    `${template.courierName} — ${triage.issue_type} — ${vars.tracking_code}`,
    courierBody,
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
// Middle-only: header/footer come from the courier's Top-and-Tail templates, so
// Gemini must NOT add its own greeting or sign-off — just the clear explanation.
const TRANSLATION_SYSTEM =
  'You are a customer success translation engine. Read this dry, technical, or ' +
  'internal logistics update from a courier, strip out internal jargon/codes, and ' +
  'write a polite, completely clear, reassuring explanation for the final customer ' +
  'of what is happening to their parcel. IMPORTANT: do NOT include any greeting ' +
  '(no "Hi"/"Dear") or sign-off — output ONLY the middle body paragraph(s).';

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
    const tRes = await query(
      `SELECT subject, customer_name, courier_code FROM queries WHERE id = $1`, [queryId],
    );
    const t    = tRes.rows[0] || {};
    const subj = t.subject ? `Re: ${t.subject}` : 'Update on your parcel';

    // Top-and-Tail: stitch the customer header + Gemini analysis + footer.
    const tpl  = await getCourierTemplates(t.courier_code);
    const vars = { customer_name: t.customer_name || 'there' };
    const finalOutboundEmail = stitch(
      tpl.customer_header_template, translated.trim(), tpl.customer_footer_template, vars,
    );

    await insertDraft(queryId, 'outbound_customer', subj, finalOutboundEmail);
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
