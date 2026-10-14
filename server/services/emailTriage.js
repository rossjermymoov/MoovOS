/**
 * emailTriage.js — Phase 0 of docs/email-triage-automation-plan.md.
 *
 * Signals gmailSync.js uses on top of its category triage. Every email is handled
 * on the Queries page as a ticket — it does NOT create Tasks-board tasks (an
 * earlier "companion task" per email was removed: Queries replaces Freshdesk's
 * ticket list, and Freshdesk has no concept of tasks).
 *
 *  - isAutomatedNotification() — portal noise skipped before any ticket exists.
 *  - checkClaimIntent() / checkCourierClaimSignal() — a claim is often a state
 *    change mid-conversation, not a fresh email; either signal moves the ticket
 *    into the Claims group via moveTicketToClaims().
 *  - recordClassification() — per-email audit record for the Freshdesk comparison.
 *
 * checkClaimIntent() mirrors dissatisfactionEngine.js's shape exactly (hard rules
 * first, Gemini grader fallback, never throws).
 */

import crypto from 'crypto';
import { query } from '../db/index.js';
import { geminiGenerate } from './geminiService.js';
import { isComplaintLanguage } from './dissatisfactionEngine.js';

const CLAIM_HARD_RULES = [
  /\bfile a claim\b/i,
  /\bwant to claim\b/i,
  /\bmake a claim\b/i,
  /\bclaim form\b/i,
  /\bclaims? department\b/i,
  /\bsubmit(ting)? a claim\b/i,
];

function buildClaimPrompt(text) {
  return (
    `Read this customer reply on an open parcel-delivery support ticket. Decide if the ` +
    `customer is now asking to FILE A CLAIM (compensation for a lost/damaged/missing ` +
    `parcel) — as opposed to just asking for a status update, which is normal on this ` +
    `kind of ticket and should NOT be flagged.\n\n` +
    `Examples that are NOT a claim request (do not flag): "Any update on where this is?", ` +
    `"Has this been found yet?", "Please chase the courier again".\n` +
    `Examples that ARE a claim request (flag): "I'd like to claim for the lost item", ` +
    `"This needs to be compensated, please start a claim", "Can you send me the claim ` +
    `form for this".\n\n` +
    `Return STRICT JSON only: {"claim_requested": true|false, "reasoning": string}.\n\n` +
    `Customer reply:\n${text.slice(0, 2000)}`
  );
}

export async function checkClaimIntent({ subject = '', body = '' } = {}) {
  const text = `${subject}\n${body}`;

  if (CLAIM_HARD_RULES.some(re => re.test(text))) {
    return { claim_requested: true, source: 'hard_rule', reasoning: 'Claim language pattern matched.' };
  }

  try {
    const raw = await geminiGenerate(buildClaimPrompt(text), { json: true, temperature: 0, maxTokens: 200, feature: 'claim_detection' });
    const parsed = JSON.parse(raw);
    return {
      claim_requested: parsed.claim_requested === true,
      source: 'ai_grader',
      reasoning: parsed.reasoning || null,
    };
  } catch (e) {
    console.warn('[ClaimIntent] check failed, defaulting to NOT flagged:', e.message);
    return { claim_requested: false, source: 'fallback', reasoning: null };
  }
}

/**
 * One check per customer follow-up, replacing what used to be up to three
 * separate Gemini calls on the same email (unhappy-customer check, claim
 * intent, and a re-sort for tickets still in Customer Service). The free
 * keyword rules decide first; AI is asked only the questions they couldn't
 * settle, in a single call — or not at all.
 *
 * Fails safe exactly like the checks it replaces: on any AI failure the
 * customer is NOT flagged unhappy (see dissatisfactionEngine.js on why) and no
 * claim is assumed.
 *
 * @param needCategory  also ask which group the email belongs to
 * @returns {{ dissatisfied, dissatisfaction_source, dissatisfaction_reasoning,
 *             claim_requested, claim_source, ticket_type, ai_called }}
 */
const FOLLOW_UP_CATEGORIES = ['query', 'claim', 'billing', 'technical', 'sales', 'returns', 'collection', 'supplies', 'other'];

export async function checkFollowUp({ subject = '', body = '', needCategory = false } = {}) {
  const text = `${subject}\n${body}`;
  const out = {
    dissatisfied: false, dissatisfaction_source: null, dissatisfaction_reasoning: null,
    claim_requested: false, claim_source: null,
    ticket_type: null, ai_called: false,
  };

  if (isComplaintLanguage(text)) {
    Object.assign(out, { dissatisfied: true, dissatisfaction_source: 'hard_rule', dissatisfaction_reasoning: 'Complaint language pattern matched.' });
  }
  if (CLAIM_HARD_RULES.some(re => re.test(text))) {
    Object.assign(out, { claim_requested: true, claim_source: 'hard_rule' });
  }

  const ask = {
    dissatisfied: !out.dissatisfied,
    claim: !out.claim_requested,
    category: needCategory,
  };
  if (!ask.dissatisfied && !ask.claim && !ask.category) return out;

  const questions = [];
  if (ask.dissatisfied) questions.push(
    `"dissatisfied": true ONLY if the customer is genuinely unhappy with how the case is being handled — ` +
    `demanding escalation, losing trust, threatening to leave. Ordinary impatience about a delayed parcel ` +
    `("any update?", "this is taking ages") is normal and is false.`);
  if (ask.claim) questions.push(
    `"claim_requested": true if the customer is now asking to FILE A CLAIM (compensation for a lost, damaged ` +
    `or missing parcel), e.g. "please start a claim", "send me the claim form". Asking for a status update is false.`);
  if (ask.category) questions.push(
    `"ticket_type": exactly one of ${JSON.stringify(FOLLOW_UP_CATEGORIES)} — "query" = delivery status of a parcel ` +
    `in transit, "collection" = a pickup that didn't happen, "supplies" = labels/bags/packaging, "other" if unclear.`);

  const prompt =
    `Read this customer's reply on an open parcel-delivery support ticket. Return STRICT JSON only, with these keys:\n` +
    questions.map(q => `- ${q}`).join('\n') +
    `\n- "reasoning": one short sentence.\n\nCustomer reply:\n${text.slice(0, 2000)}`;

  try {
    out.ai_called = true;
    const raw = await geminiGenerate(prompt, { json: true, temperature: 0, maxTokens: 200, feature: 'follow_up' });
    const parsed = JSON.parse(raw || '{}');
    if (ask.dissatisfied && parsed.dissatisfied === true) {
      Object.assign(out, { dissatisfied: true, dissatisfaction_source: 'ai_grader', dissatisfaction_reasoning: parsed.reasoning || null });
    }
    if (ask.claim && parsed.claim_requested === true) {
      Object.assign(out, { claim_requested: true, claim_source: 'ai_grader' });
    }
    if (ask.category && FOLLOW_UP_CATEGORIES.includes(parsed.ticket_type)) out.ticket_type = parsed.ticket_type;
  } catch (e) {
    console.warn('[FollowUpCheck] AI check failed, keyword results only:', e.message);
  }
  return out;
}

// Courier-side claim signal — a claim usually starts life looking exactly like a
// query (customers rarely say "I want to claim"; they report "it hasn't been
// scanned" or "it's lost", same as any other WISMO query). Studying real Freshdesk
// conversations (email-triage-automation-plan.md research) showed the far more
// reliable trigger is the COURIER's own reply: couriers send a fixed-template
// "claim form" / "claim reference" email once a depot investigation confirms
// loss/damage. That template is consistent enough that hard rules alone are
// reliable here — no Gemini call needed (unlike checkClaimIntent's customer-
// language check, which has to interpret free-form phrasing).
const COURIER_CLAIM_HARD_RULES = [
  ...CLAIM_HARD_RULES,
  /\bclaim reference\b/i,
  /\bclaim number\b/i,
  /\bCLM-\d+\b/,
  /\bstart a claim\b/i,
  /\bwe(?:'ve| have) raised a claim\b/i,
  /\bi have raised a claim\b/i,
];

export function checkCourierClaimSignal({ subject = '', body = '' } = {}) {
  const text = `${subject}\n${body}`;
  return { claim_detected: COURIER_CLAIM_HARD_RULES.some(re => re.test(text)) };
}

// Automatic mail — auto-replies ("We've Got Your Email", out-of-office) and
// newsletters/marketing ("Check your route before you go"). Recognised from
// standard headers for free, so they're sorted by keywords only and never cost
// an AI call. Courier mail is only treated as automatic when it's a genuine
// auto-REPLY: couriers' real answers and claim forms can come from automated
// systems too, and those still need reading.
export function automaticMailKind(headers = [], subject = '') {
  const h = (name) => (headers.find(x => x.name?.toLowerCase() === name)?.value || '').toLowerCase();
  const autoSubmitted = h('auto-submitted');
  if (autoSubmitted === 'auto-replied' || h('x-autoreply') || h('x-autorespond')
      || /^\s*(auto(matic)?[\s-]?reply|out of (the )?office|we'?ve got your email)\b/i.test(subject || '')) {
    return 'auto_reply';
  }
  if (h('list-unsubscribe') || h('list-id') || ['bulk', 'list', 'junk'].includes(h('precedence'))
      || (autoSubmitted && autoSubmitted !== 'no')) {
    return 'bulk';
  }
  return null;
}

// Automated third-party portal notifications — not genuine correspondence from
// a customer or courier at all. Real Freshdesk history showed a "ClearView"
// portal auto-generating "Ticket Comment: Non Delivery [...]" emails with no
// substantive content, misfiled across several groups (Claims-Yodel, Collection
// Issues-Yodel, etc.) purely because they landed in the shared inbox. Classifying
// these into a real category just creates a noise ticket nobody needs to act on —
// skip them entirely, the same way an unmatched courier reply is skipped.
const AUTOMATED_NOTIFICATION_HARD_RULES = [
  /please do not reply to this email/i,
  /do not reply to this email/i,
  /this is an automated (message|notification|email)/i,
  /^ticket comment:/i,
];

export function isAutomatedNotification({ subject = '', body = '' } = {}) {
  const text = `${subject}\n${body}`;
  return AUTOMATED_NOTIFICATION_HARD_RULES.some(re => re.test(text));
}

// Per-email audit record of what MoovOS decided this message was (Section 6.3
// of the plan) — separate from the operational `queries` row, this is what a
// comparison against Freshdesk tickets reads from. Only written when `category`
// is a real classification (i.e. this email actually went through triage — a
// follow-up on an existing thread doesn't get a fresh one). Only the hashed
// subject is stored, never raw subject/body content.
export async function recordClassification({ gmailMessageId, gmailThreadId, subject, category, groupName, urgent, urgencyReason, queryId, triageSource }) {
  if (!gmailMessageId || !category) return;
  const subjectHash = crypto.createHash('sha256').update((subject || '').trim().toLowerCase()).digest('hex');
  try {
    await query(
      `INSERT INTO inbox_classifications
         (gmail_message_id, gmail_thread_id, raw_subject_hash, moovos_category, moovos_group,
          moovos_urgency, moovos_urgency_reason, query_id, triage_source)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       ON CONFLICT (gmail_message_id) DO NOTHING`,
      [gmailMessageId, gmailThreadId || null, subjectHash, category, groupName || null, !!urgent, urgencyReason || null, queryId || null, triageSource || null],
    );
  } catch (e) { console.warn('[EmailTriage] recordClassification failed:', e.message); }
}

/**
 * A claim detected mid-conversation (the customer asks for one, or the courier
 * sends its claim form) moves the ticket into the Claims group on QueriesPage —
 * a ticket's group is otherwise only set once, when its first email is triaged.
 * The reason goes on the attention flag, without overwriting a reason already
 * there (e.g. an urgency or dissatisfaction escalation).
 */
export async function moveTicketToClaims(queryId, reason) {
  await query(
    `UPDATE queries
        SET group_name = 'Claims',
            attention_reason = CASE WHEN requires_attention THEN attention_reason ELSE $2 END,
            requires_attention = true,
            updated_at = NOW()
      WHERE id = $1 AND group_name IS DISTINCT FROM 'Claims'`,
    [queryId, reason],
  );
}
