/**
 * replyInterpreter.js — WISMO Phase 2 (MOS-3): Courier Reply Interpreter
 *
 * Classifies an inbound courier reply BEFORE deciding what to draft, instead of
 * always translating it straight to the customer (the old behaviour). Three
 * outcomes, cheapest/most certain checked first:
 *
 *   GDPR address reconfirmation  → auto-answer the courier with the address on
 *                                  file (known, expected DPD behaviour — not an
 *                                  exception), else fall through to AMBIGUOUS.
 *   Generic non-answer            → treated as NEEDS_MORE_INFO, never RESOLVED,
 *   (hard-rule, ops-editable)       so a copy-paste "we're looking into it" can't
 *                                  falsely close out a case.
 *   Gemini classification         → RESOLVED / NEEDS_MORE_INFO / AMBIGUOUS.
 *
 * Draft-only: every branch either drafts (customer or courier) for human approval
 * via the existing QA Bay, or escalates — nothing auto-sends. No reply-consistency
 * check here; that's Phase 3 per docs/wismo-automation-solution.md §6.
 */

import { query } from '../db/index.js';
import { geminiGenerate } from './geminiService.js';
import {
  insertDraft, stitch, getCourierTemplates, resolveCourierEmail,
  draftCustomerUpdateFromCourier,
} from './courierAutomation.js';

// Two independent checks, order-agnostic — real phrasing puts the "confirm the
// address" ask either before or after the GDPR justification (e.g. "can you
// confirm the delivery address for GDPR purposes" vs "for GDPR reasons please
// reconfirm the address"), so a single sequential pattern is too brittle.
const GDPR_MENTION_PATTERN   = /\b(gdpr|data protection)\b/i;
const ADDRESS_CONFIRM_PATTERN = /\b(confirm|reconfirm)\b[\s\S]{0,60}\b(address|delivery details)\b|\b(address|delivery details)\b[\s\S]{0,60}\b(confirm|reconfirm)\b/i;
function isGdprAddressRequest(body) {
  return GDPR_MENTION_PATTERN.test(body) && ADDRESS_CONFIRM_PATTERN.test(body);
}
const DEFAULT_GENERIC_PATTERNS = ['unexpected issue'];
const HISTORY_LIMIT = 10;

// Cascade: courier-specific patterns → 'default' row → built-in fallback. Mirrors
// getCourierTemplates' existing cascade in courierAutomation.js.
async function getGenericPatterns(courierCode) {
  try {
    const codes = ['default'];
    const code = courierCode ? courierCode.toLowerCase() : null;
    if (code && code !== 'default') codes.push(code);

    const r = await query(
      `SELECT courier_code, generic_reply_patterns FROM courier_routing_rules WHERE courier_code = ANY($1)`,
      [codes],
    );
    const byCode = Object.fromEntries(r.rows.map(row => [row.courier_code, row.generic_reply_patterns]));
    const raw = (code && byCode[code]) || byCode['default'];
    const patterns = String(raw || '').split(/\n+/).map(s => s.trim()).filter(Boolean);
    return patterns.length ? patterns : DEFAULT_GENERIC_PATTERNS;
  } catch (e) {
    console.warn('[ReplyInterpreter] generic pattern lookup failed:', e.message);
    return DEFAULT_GENERIC_PATTERNS;
  }
}

async function getLatestInboundCourierEmailId(queryId) {
  const r = await query(
    `SELECT id FROM query_emails
      WHERE query_id = $1 AND direction = 'inbound_courier'
      ORDER BY COALESCE(received_at, created_at) DESC LIMIT 1`,
    [queryId],
  );
  return r.rows[0]?.id || null;
}

async function stampClassification(queryId, classification) {
  const emailId = await getLatestInboundCourierEmailId(queryId);
  if (emailId) {
    await query(`UPDATE query_emails SET reply_classification = $2 WHERE id = $1`, [emailId, classification]);
  }
}

const INTERPRET_SYSTEM =
  'You are reviewing a courier\'s reply on an open customer support ticket. ' +
  'Given the thread history and the courier\'s latest reply, decide: ' +
  'RESOLVED — clearly answers with a concrete status/outcome (a specific fact: ' +
  'status, date, reason, location); ' +
  'NEEDS_MORE_INFO — acknowledges but gives no concrete new fact (boilerplate, ' +
  '"investigating", no detail); ' +
  'AMBIGUOUS — unclear, off-topic, or contradicts the thread. ' +
  'Return STRICT JSON only: {"classification":"RESOLVED"|"NEEDS_MORE_INFO"|"AMBIGUOUS","reasoning":string}.';

function buildPrompt(history, newReply) {
  const thread = history.map(h => `[${h.direction}] ${(h.body_text || '').slice(0, 1000)}`).join('\n\n');
  return `Thread history (oldest first):\n${thread}\n\nCourier's latest reply:\n${newReply}`;
}

async function getThreadHistory(queryId) {
  const r = await query(
    `SELECT direction, body_text FROM query_emails
      WHERE query_id = $1
      ORDER BY COALESCE(received_at, created_at) DESC LIMIT $2`,
    [queryId, HISTORY_LIMIT],
  );
  return r.rows.reverse();
}

// ── Branch handlers ───────────────────────────────────────────────────────────

async function handleResolved(queryId, body) {
  const result = await draftCustomerUpdateFromCourier(queryId, body);
  await stampClassification(queryId, 'resolved');
  return { status: 'resolved', ...result };
}

async function handleGdprRequest(queryId, ticket) {
  const r = await query(
    `SELECT recipient_address FROM parcels WHERE consignment_number = $1 LIMIT 1`,
    [ticket.consignment_number],
  );
  const address = r.rows[0]?.recipient_address;
  if (!address) return handleAmbiguous(queryId, 'GDPR address request but no address on file to confirm — needs a human.');

  const tpl = await getCourierTemplates(ticket.courier_code);
  const vars = { customer_name: ticket.customer_name || 'the customer', tracking_code: ticket.consignment_number };
  const middle = `Confirming the delivery address for consignment ${ticket.consignment_number}: ${address}`;
  const courierBody = stitch(tpl.courier_header_template, middle, tpl.courier_footer_template, vars);
  const courierEmail = await resolveCourierEmail(ticket.courier_code, 'GENERAL');

  await insertDraft(
    ticket.id, 'outbound_courier',
    `Re: ${ticket.subject || 'your enquiry'} — address confirmation`,
    courierBody, courierEmail,
  );
  await query(
    `UPDATE queries SET internal_automation_state = 'awaiting_courier_response', updated_at = NOW() WHERE id = $1`,
    [queryId],
  );
  await stampClassification(queryId, 'gdpr_address_request');
  return { status: 'gdpr_address_confirmed' };
}

async function handleNeedsMoreInfo(queryId, ticket, reason) {
  const tpl = await getCourierTemplates(ticket.courier_code);
  const vars = { customer_name: ticket.customer_name || 'the customer', tracking_code: ticket.consignment_number };
  const middle =
    `Thanks for the update — could you confirm the current status/location and expected resolution ` +
    `date for consignment ${ticket.consignment_number}? We need this to keep our customer informed.`;
  const courierBody = stitch(tpl.courier_header_template, middle, tpl.courier_footer_template, vars);
  const courierEmail = await resolveCourierEmail(ticket.courier_code, 'GENERAL');

  await insertDraft(
    ticket.id, 'outbound_courier',
    `Re: ${ticket.subject || 'your enquiry'} — following up`,
    courierBody, courierEmail,
  );
  await query(
    `UPDATE queries SET internal_automation_state = 'awaiting_courier_response', updated_at = NOW() WHERE id = $1`,
    [queryId],
  );
  await stampClassification(queryId, reason);
  return { status: reason };
}

async function handleAmbiguous(queryId, reasoning) {
  await query(
    `UPDATE queries
        SET requires_attention = true,
            attention_reason = $2,
            internal_automation_state = 'action_required',
            updated_at = NOW()
      WHERE id = $1`,
    [queryId, reasoning || 'Courier reply does not clearly answer the query — needs human review.'],
  );
  await stampClassification(queryId, 'ambiguous');
  return { status: 'ambiguous', reasoning: reasoning || null };
}

// ── Entry point ────────────────────────────────────────────────────────────────

export async function interpretCourierReply(queryId, body) {
  const tRes = await query(
    `SELECT id, courier_code, subject, customer_name, consignment_number FROM queries WHERE id = $1`,
    [queryId],
  );
  if (!tRes.rows.length) return { status: 'error', reason: 'ticket not found' };
  const ticket = tRes.rows[0];

  if (isGdprAddressRequest(body)) return handleGdprRequest(queryId, ticket);

  const patterns = await getGenericPatterns(ticket.courier_code);
  const lower = body.toLowerCase();
  if (patterns.some(p => lower.includes(p.toLowerCase()))) {
    return handleNeedsMoreInfo(queryId, ticket, 'generic_non_answer');
  }

  const history = await getThreadHistory(queryId);
  let parsed = null;
  try {
    const raw = await geminiGenerate(buildPrompt(history, body), {
      system: INTERPRET_SYSTEM, json: true, maxTokens: 500, temperature: 0.2,
    });
    parsed = JSON.parse(raw);
  } catch (e) {
    console.warn('[ReplyInterpreter] classification failed:', e.message);
  }

  if (parsed?.classification === 'RESOLVED')        return handleResolved(queryId, body);
  if (parsed?.classification === 'NEEDS_MORE_INFO') return handleNeedsMoreInfo(queryId, ticket, 'needs_more_info');
  return handleAmbiguous(queryId, parsed?.reasoning);   // default on any failure/uncertainty
}
