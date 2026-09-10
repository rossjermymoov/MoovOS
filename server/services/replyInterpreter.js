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

// isConsistent: null = not checked (hard-rule paths never call Gemini so have
// nothing to report here), true/false = the consistency-check verdict from the
// classification call (WISMO Phase 3, MOS-6).
async function stampClassification(queryId, classification, isConsistent = null) {
  const emailId = await getLatestInboundCourierEmailId(queryId);
  if (emailId) {
    await query(
      `UPDATE query_emails SET reply_classification = $2, is_consistent = $3 WHERE id = $1`,
      [emailId, classification, isConsistent],
    );
  }
}

// Consistency check (WISMO Phase 3, MOS-6 — deliberately deferred from Phase 2)
// folded into this same call rather than a second Gemini round-trip: the shared
// 20-req/min free-tier quota (discovered during Phase 2 testing) makes every extra
// call a real reliability cost, and the model already has the full thread in front
// of it for the classification itself.
const INTERPRET_SYSTEM =
  'You are reviewing a courier\'s reply on an open customer support ticket. ' +
  'Given the thread history and the courier\'s latest reply, decide TWO things: ' +
  '1. classification — RESOLVED (clearly answers with a concrete status/outcome: a ' +
  'specific fact like status, date, reason, or location), NEEDS_MORE_INFO ' +
  '(acknowledges but gives no concrete new fact — boilerplate, "investigating", no ' +
  'detail), or AMBIGUOUS (unclear, off-topic, or contradicts the thread). ' +
  '2. is_consistent — does this reply logically follow from the thread history (not ' +
  'about a different parcel, not contradicting earlier facts, not clearly misrouted)? ' +
  'If the thread history is too short to judge (e.g. only 1-2 prior messages), return ' +
  'true by default — never manufacture a false inconsistency from thin history. ' +
  'Return STRICT JSON only: {"classification":"RESOLVED"|"NEEDS_MORE_INFO"|"AMBIGUOUS","is_consistent":true|false,"reasoning":string}.';

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

async function handleResolved(queryId, body, isConsistent = null) {
  const result = await draftCustomerUpdateFromCourier(queryId, body);
  await stampClassification(queryId, 'resolved', isConsistent);
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

async function handleNeedsMoreInfo(queryId, ticket, reason, isConsistent = null) {
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
  await stampClassification(queryId, reason, isConsistent);
  return { status: reason };
}

async function escalate(queryId, reasoning, escalationSource, defaultReason) {
  await query(
    `UPDATE queries
        SET requires_attention = true,
            attention_reason = $2,
            escalation_source = $3,
            internal_automation_state = 'action_required',
            updated_at = NOW()
      WHERE id = $1`,
    [queryId, reasoning || defaultReason, escalationSource],
  );
}

async function handleAmbiguous(queryId, reasoning) {
  await escalate(queryId, reasoning, 'ambiguous_reply', 'Courier reply does not clearly answer the query — needs human review.');
  await stampClassification(queryId, 'ambiguous');
  return { status: 'ambiguous', reasoning: reasoning || null };
}

// Consistency-check failure (WISMO Phase 3, MOS-6) overrides whatever classification
// the model returned — a reply that doesn't logically fit the thread shouldn't be
// trusted even if it separately claimed to "resolve" something (safety net for
// DPD's habit of fragmenting one case across multiple email threads).
async function handleInconsistent(queryId, reasoning) {
  await escalate(queryId, reasoning, 'inconsistent_reply', 'Courier reply does not appear to match this ticket\'s conversation history — needs human review.');
  await stampClassification(queryId, 'ambiguous', false);
  return { status: 'inconsistent', reasoning: reasoning || null };
}

// ── Entry point ────────────────────────────────────────────────────────────────

// ── Pure classification (no DB writes, no drafting) ─────────────────────────────
// Exported separately so the WISMO Phase 3 (MOS-6) calibration script
// (server/scripts/calibratePhase3.js) can run the EXACT same decision logic
// read-only against historical tickets, with zero risk of drafting or sending
// anything — single source of truth for the prompt/rules, not a duplicate copy.
export async function classifyCourierReply(ticket, body, history) {
  if (isGdprAddressRequest(body)) return { kind: 'gdpr' };

  const patterns = await getGenericPatterns(ticket.courier_code);
  const lower = body.toLowerCase();
  if (patterns.some(p => lower.includes(p.toLowerCase()))) {
    return { kind: 'generic_non_answer' };
  }

  try {
    const raw = await geminiGenerate(buildPrompt(history, body), {
      system: INTERPRET_SYSTEM, json: true, maxTokens: 500, temperature: 0.2,
    });
    const parsed = JSON.parse(raw);
    return { kind: 'gemini', classification: parsed.classification, is_consistent: parsed.is_consistent, reasoning: parsed.reasoning };
  } catch (e) {
    console.warn('[ReplyInterpreter] classification failed:', e.message);
    return { kind: 'gemini_failed' };
  }
}

export async function interpretCourierReply(queryId, body) {
  const tRes = await query(
    `SELECT id, courier_code, subject, customer_name, consignment_number FROM queries WHERE id = $1`,
    [queryId],
  );
  if (!tRes.rows.length) return { status: 'error', reason: 'ticket not found' };
  const ticket = tRes.rows[0];

  const history = await getThreadHistory(queryId);
  const result = await classifyCourierReply(ticket, body, history);

  if (result.kind === 'gdpr')               return handleGdprRequest(queryId, ticket);
  if (result.kind === 'generic_non_answer') return handleNeedsMoreInfo(queryId, ticket, 'generic_non_answer');

  // Consistency check overrides classification — checked before branching on it.
  if (result.kind === 'gemini' && result.is_consistent === false) return handleInconsistent(queryId, result.reasoning);

  if (result.classification === 'RESOLVED')        return handleResolved(queryId, body, true);
  if (result.classification === 'NEEDS_MORE_INFO') return handleNeedsMoreInfo(queryId, ticket, 'needs_more_info', true);
  return handleAmbiguous(queryId, result.reasoning);   // default on any failure/uncertainty
}
