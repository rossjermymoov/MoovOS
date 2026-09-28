/**
 * urgencyScorer.js — Phase 0 of email-triage-automation-plan.md, Section 6.1
 * item 4.
 *
 * Computes urgency independently of Freshdesk's own priority field — the
 * plan's Freshdesk research found it unreliable (87% of tickets marked Low
 * regardless of actual urgency, per Section 4.3). Keyword hard-rules only, no
 * Gemini call — same shape as dissatisfactionEngine.js's hard-rule check, but
 * applied across EVERY category, not just WISMO (Section 8.3's open question:
 * the plan recommends starting with all categories rather than claims only).
 *
 * Two independent signals, either one is enough to flag: explicit urgent
 * language, or repeated unresolved contact on the same thread (a customer
 * emailing 3+ times without a satisfactory reply is itself an urgency signal,
 * even in calm language).
 */

import { query } from '../db/index.js';

const URGENT_HARD_RULES = [
  { re: /\bfinal notice\b/i,                                        reason: '"final notice" language' },
  { re: /\bsuspend(ed|ing)?\b/i,                                     reason: 'account/service suspension mentioned' },
  { re: /\blegal action\b|\bsolicitor\b|\btrading standards\b/i,     reason: 'legal escalation threatened' },
  { re: /\bcancel(ling|led)?\s+(our|my)\s+(account|service|contract)\b/i, reason: 'threatening to cancel the account' },
  { re: /\bunacceptable\b/i,                                         reason: '"unacceptable" language' },
  { re: /\bescalat(e|ing|ion)\b/i,                                   reason: 'explicit escalation request' },
  { re: /\bcomplaint\b/i,                                            reason: 'explicit complaint' },
  { re: /\burgent(ly)?\b/i,                                          reason: '"urgent" language' },
  { re: /\basap\b/i,                                                 reason: '"ASAP" language' },
];

const REPEAT_CONTACT_THRESHOLD = 3;

export async function scoreUrgency({ subject = '', body = '', gmailThreadId = null } = {}) {
  const text = `${subject}\n${body}`;
  const hit = URGENT_HARD_RULES.find(r => r.re.test(text));
  if (hit) return { urgent: true, reason: hit.reason };

  if (gmailThreadId) {
    const r = await query(
      `SELECT COUNT(*)::int AS n FROM query_emails WHERE gmail_thread_id = $1 AND direction = 'inbound_customer'`,
      [gmailThreadId],
    );
    const n = r.rows[0]?.n || 0;
    if (n >= REPEAT_CONTACT_THRESHOLD) {
      return { urgent: true, reason: `Customer has contacted ${n} times on this thread without resolution` };
    }
  }
  return { urgent: false, reason: null };
}
