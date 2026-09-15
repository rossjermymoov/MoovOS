/**
 * dissatisfactionEngine.js — WISMO Phase 3 (MOS-6): customer dissatisfaction check.
 *
 * Runs on a customer's follow-up reply on an already-open ticket (not the initial
 * message — that's triaged separately). Two hard triggers only, per Ross: explicit
 * complaint language, or an AI sentiment read. Either fires an escalation.
 *
 * Mirrors triageEngine.js's two-phase shape (hard rules → Gemini grader), but fails
 * safe in the OPPOSITE direction on purpose: an uncertain courier reply escalates
 * (replyInterpreter.js, Phase 2) because nothing sends without a human anyway in
 * that branch. An uncertain customer sentiment read must NOT escalate — Ross flagged
 * that over-triggering here defeats the entire point of autopilot, since ordinary
 * "where's my parcel" frustration is common and not the same as genuine
 * dissatisfaction. Do not "fix" this asymmetry — it's intentional.
 */

import { geminiGenerate } from './geminiService.js';

const HARD_RULES = [
  /\bunacceptable\b/i,
  /\bdisgusted\b/i,
  /\bsolicitor\b/i,
  /\btrading standards\b/i,
  /\bcancel my account\b/i,
  /\bformal complaint\b/i,
  /\bombudsman\b/i,
  /\blegal action\b/i,
];

function buildPrompt(text) {
  return (
    `Read this customer reply on an open parcel-delivery support ticket. Decide if the ` +
    `customer is GENUINELY DISSATISFIED — actively unhappy with how the case is being ` +
    `handled, demanding escalation, or losing trust — as opposed to ordinary frustration ` +
    `or impatience about a delayed parcel, which is normal and expected in this domain ` +
    `and should NOT be flagged.\n\n` +
    `Examples that are NOT dissatisfaction (do not flag): "This is taking ages, please ` +
    `hurry up", "Still no update?? Getting annoying now", "Any news? Been 3 days now".\n` +
    `Examples that ARE dissatisfaction (flag): "I'm done waiting, cancel this order and ` +
    `refund me", "Your service has been terrible throughout this", "I want to speak to ` +
    `a manager about how badly this has been handled".\n\n` +
    `Return STRICT JSON only: {"dissatisfied": true|false, "reasoning": string}.\n\n` +
    `Customer reply:\n${text.slice(0, 2000)}`
  );
}

export async function checkDissatisfaction({ subject = '', body = '' } = {}) {
  const text = `${subject}\n${body}`;

  if (HARD_RULES.some(re => re.test(text))) {
    return { dissatisfied: true, source: 'hard_rule', reasoning: 'Complaint language pattern matched.' };
  }

  try {
    const raw = await geminiGenerate(buildPrompt(text), { json: true, temperature: 0, maxTokens: 200 });
    const parsed = JSON.parse(raw);
    return {
      dissatisfied: parsed.dissatisfied === true,
      source: 'ai_grader',
      reasoning: parsed.reasoning || null,
    };
  } catch (e) {
    console.warn('[Dissatisfaction] check failed, defaulting to NOT flagged:', e.message);
    return { dissatisfied: false, source: 'fallback', reasoning: null };
  }
}
