/**
 * geminiService.js — Gemini 1.5 Flash triage extraction
 *
 * Given a customer email, extract the courier, tracking code and issue type so
 * the automation loop can match a template. Returns structured JSON. Falls back
 * to lightweight regex heuristics if the API key is absent or the call fails, so
 * the loop never hard-crashes.
 */

import { ISSUE_TYPES } from './courierTemplates.js';

const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

// Generic Gemini 1.5 Flash text generation (REST — Node-18 safe). Replaces the
// legacy Anthropic /v1/messages calls. Throws if the key is missing or the call
// fails so callers can surface a clean error.
export async function geminiGenerate(prompt, { system = '', json = false, maxTokens = 900, temperature = 0.3 } = {}) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured');
  const fullPrompt = system ? `${system}\n\n${prompt}` : prompt;
  const resp = await fetch(`${GEMINI_URL}?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: fullPrompt }] }],
      generationConfig: {
        temperature,
        maxOutputTokens: maxTokens,
        ...(json ? { responseMimeType: 'application/json' } : {}),
      },
    }),
  });
  if (!resp.ok) throw new Error(`Gemini API error ${resp.status}: ${await resp.text()}`);
  const j = await resp.json();
  return (j.candidates?.[0]?.content?.parts?.[0]?.text || '').trim();
}

const KNOWN_COURIERS = ['dpd', 'dhl', 'evri', 'hermes', 'royal_mail', 'yodel', 'ups', 'fedex', 'parcelforce'];

function regexFallback(subject, body) {
  const text = `${subject || ''} ${body || ''}`.toLowerCase();
  const courier =
    /\bdpd\b/.test(text) ? 'dpd' :
    /\bdhl\b/.test(text) ? 'dhl' :
    /\bevri|hermes\b/.test(text) ? 'evri' :
    null;
  const trackMatch = (body || '').match(/\b([A-Z0-9]{8,30})\b/);
  const issue =
    /damaged|broken|smashed/.test(text)            ? 'DAMAGED' :
    /return to sender|rts/.test(text)              ? 'RETURN_TO_SENDER' :
    /failed deliver|not delivered/.test(text)      ? 'FAILED_DELIVERY' :
    /lost|missing/.test(text)                      ? 'LOST' :
    /no scan|not scanned|no update|stuck/.test(text) ? 'NO_SCAN_24H' :
    'GENERAL';
  return {
    courier_code: courier,
    tracking_code: trackMatch ? trackMatch[1] : null,
    issue_type: issue,
    needs_human: !courier,
    needs_human_triage: !courier,
    reason: courier ? null : 'Courier could not be identified from the email.',
    source: 'regex_fallback',
  };
}

export async function extractTriage(subject, body) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return regexFallback(subject, body);

  const prompt =
    `You are triaging a parcel support email for a courier reseller.\n` +
    `Return STRICT JSON only with keys: courier_code, tracking_code, issue_type, needs_human, reason.\n` +
    `- courier_code: one of ${KNOWN_COURIERS.join(', ')} (lowercase), or null if not stated.\n` +
    `- tracking_code: the consignment/tracking number if present, else null.\n` +
    `- issue_type: one of ${ISSUE_TYPES.join(', ')}.\n` +
    `- needs_human: true if a human agent is required (no courier, unclear, complaint/escalation), else false.\n` +
    `  Set this to true whenever you cannot confidently categorise the email or map it to a structured rule.\n` +
    `- reason: short string when needs_human is true, else null.\n\n` +
    `Subject: ${subject || '(none)'}\nBody: ${(body || '').slice(0, 2000)}`;

  try {
    const resp = await fetch(`${GEMINI_URL}?key=${encodeURIComponent(apiKey)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0, responseMimeType: 'application/json' },
      }),
    });
    if (!resp.ok) {
      console.warn('[Gemini] non-OK response:', resp.status);
      return regexFallback(subject, body);
    }
    const json = await resp.json();
    const text = json.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const parsed = JSON.parse(text);
    // Normalise + guard the shape.
    return {
      courier_code: parsed.courier_code ? String(parsed.courier_code).toLowerCase() : null,
      tracking_code: parsed.tracking_code || null,
      issue_type: ISSUE_TYPES.includes(parsed.issue_type) ? parsed.issue_type : 'GENERAL',
      needs_human: !!parsed.needs_human || !parsed.courier_code,
      needs_human_triage: !!parsed.needs_human || !!parsed.needs_human_triage || !parsed.courier_code,
      reason: parsed.reason || (parsed.courier_code ? null : 'Courier not identified.'),
      source: 'gemini-1.5-flash',
    };
  } catch (e) {
    console.warn('[Gemini] extractTriage failed:', e.message);
    return regexFallback(subject, body);
  }
}
