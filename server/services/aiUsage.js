/**
 * aiUsage.js — records every AI call and enforces the limits set in
 * Settings → AI usage.
 *
 * Every Gemini (and Anthropic fallback) call goes through assertAiAllowed()
 * before it is sent and recordAiUsage() after. A call that isn't allowed (the
 * feature is switched off, or the monthly token limit is reached with "pause"
 * on) throws AiPausedError — every caller already catches AI errors and falls
 * back to its non-AI path, so pausing degrades exactly like an outage, but on
 * purpose and visibly.
 */

import { query } from '../db/index.js';

// Every feature that calls an AI model. Keys are stored on ai_usage_events.
export const FEATURES = {
  email_triage:       { label: 'Email sorting and summaries', description: 'Picks the group, writes the summary and finds the tracking number for each new email.' },
  priority:           { label: 'Priority grading',            description: 'Grades new emails High, Medium or Low when no urgent keyword is found.' },
  claim_detection:    { label: 'Claim detection',             description: 'Spots a customer asking to make a claim in a follow-up email.' },
  dissatisfaction:    { label: 'Unhappy-customer check',      description: 'Flags follow-ups from frustrated customers for attention.' },
  courier_reply:      { label: 'Reading courier replies',     description: 'Works out what a courier reply means and what to do next.' },
  courier_automation: { label: 'Courier automation',          description: 'Reads a ticket to decide which courier template applies.' },
  translation:        { label: 'Courier email translation',   description: 'Translates courier emails into the courier\'s language.' },
  drafts:             { label: 'Reply drafts',                description: 'Writes, revises and refines draft replies, including bulk drafting.' },
  bulk_triage:        { label: 'Bulk re-triage',              description: 'Re-sorts open tickets when run by hand.' },
  learning:           { label: 'Learning from approvals',     description: 'Turns approved replies into reusable patterns.' },
  customer_setup:     { label: 'Customer setup assistant',    description: 'Reads documents to fill in new customer records.' },
  katana:             { label: 'Katana assistant',            description: 'Answers questions in the Katana chat.' },
  other:              { label: 'Other',                       description: 'Anything not listed above.' },
};

export class AiPausedError extends Error {
  constructor(message) { super(message); this.name = 'AiPausedError'; this.paused = true; }
}

// ── Settings and month-to-date usage, cached briefly (checked on every call) ──
let settingsCache = null, settingsAt = 0;
let monthCache = null, monthAt = 0;
const CACHE_MS = 30_000;

export async function getAiSettings({ fresh = false } = {}) {
  if (!fresh && settingsCache && Date.now() - settingsAt < CACHE_MS) return settingsCache;
  const r = await query(`SELECT * FROM ai_usage_settings WHERE id = 1`);
  settingsCache = r.rows[0] || { disabled_features: [], warn_percent: 80, pause_at_limit: true, currency: 'GBP' };
  settingsAt = Date.now();
  return settingsCache;
}

export function invalidateAiSettings() { settingsCache = null; monthCache = null; }

async function monthTokens() {
  if (monthCache != null && Date.now() - monthAt < CACHE_MS) return monthCache;
  const r = await query(
    `SELECT COALESCE(SUM(input_tokens + output_tokens), 0)::bigint AS t
       FROM ai_usage_events WHERE created_at >= date_trunc('month', NOW())`,
  );
  monthCache = Number(r.rows[0].t);
  monthAt = Date.now();
  return monthCache;
}

/** Throws AiPausedError if this feature may not call AI right now. */
export async function assertAiAllowed(feature) {
  let s;
  try { s = await getAiSettings(); } catch { return; } // tracking must never block AI on its own failure
  if ((s.disabled_features || []).includes(feature)) {
    await recordAiUsage({ feature, ok: false, blocked: true, error: 'Feature switched off in Settings → AI usage' });
    throw new AiPausedError(`AI for "${FEATURES[feature]?.label || feature}" is switched off in Settings`);
  }
  if (s.pause_at_limit && s.monthly_token_limit) {
    const used = await monthTokens().catch(() => 0);
    if (used >= Number(s.monthly_token_limit)) {
      await recordAiUsage({ feature, ok: false, blocked: true, error: 'Monthly token limit reached' });
      throw new AiPausedError('Monthly AI token limit reached — AI is paused until next month or the limit is raised');
    }
  }
}

/** Record one AI call. Never throws. */
export async function recordAiUsage({ feature = 'other', provider = 'gemini', model = null, inputTokens = 0, outputTokens = 0,
  ok, blocked = false, httpStatus = null, error = null, durationMs = null }) {
  try {
    await query(
      `INSERT INTO ai_usage_events (feature, provider, model, input_tokens, output_tokens, ok, blocked, http_status, error, duration_ms)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [FEATURES[feature] ? feature : 'other', provider, model, inputTokens || 0, outputTokens || 0, !!ok, blocked,
        httpStatus, error ? String(error).slice(0, 500) : null, durationMs],
    );
    if (monthCache != null) monthCache += (inputTokens || 0) + (outputTokens || 0);
  } catch (e) {
    console.warn('[AI usage] record failed:', e.message);
  }
}

// Gemini usageMetadata → tokens. Thinking tokens are billed as output.
export function geminiTokens(usageMetadata = {}) {
  return {
    inputTokens:  usageMetadata.promptTokenCount || 0,
    outputTokens: (usageMetadata.candidatesTokenCount || 0) + (usageMetadata.thoughtsTokenCount || 0),
  };
}

// ── Plain-language explanation of an AI failure ──────────────────────────────
export function explainAiError(status, error) {
  const e = String(error || '');
  if (status === 402 || /credits are depleted|prepay/i.test(e)) return 'Gemini prepaid credits are used up. Top up in Google AI Studio.';
  if (status === 429) return 'Gemini rate limit or quota reached.';
  if (status === 401 || status === 403) return 'The Gemini API key was rejected. Check GEMINI_API_KEY.';
  if (status === 404) return 'The Gemini model was not found. Check GEMINI_MODEL.';
  if (/not configured/i.test(e)) return 'No Gemini API key is set (GEMINI_API_KEY).';
  if (status >= 500) return 'Gemini is having problems on Google\'s side.';
  return 'AI calls are failing.';
}

/**
 * Is AI working? 'ok' | 'failing' | 'paused' | 'idle', with a sentence for the UI.
 * Failing = the latest real call failed and either the error is one that won't
 * fix itself (key/credits/model) or the last three calls all failed.
 */
export async function getAiHealth() {
  const s = await getAiSettings();
  const recent = await query(
    `SELECT created_at, ok, blocked, http_status, error FROM ai_usage_events
      WHERE created_at > NOW() - INTERVAL '24 hours' ORDER BY created_at DESC LIMIT 20`,
  );
  const rows = recent.rows;
  const latestBlocked = rows[0]?.blocked;
  if (latestBlocked && /limit/i.test(rows[0].error || '')) {
    return { status: 'paused', message: 'AI is paused: this month\'s token limit has been reached. Emails are being sorted by keywords.', since: rows[0].created_at };
  }
  const real = rows.filter(r => !r.blocked);
  if (!real.length) return { status: 'idle', message: 'No AI calls in the last 24 hours.' };
  const latest = real[0];
  if (latest.ok) return { status: 'ok', message: 'AI is working.', last_success_at: latest.created_at };
  const hard = [401, 402, 403, 404].includes(latest.http_status) || /not configured|credits/i.test(latest.error || '');
  const streak = real.findIndex(r => r.ok);
  const failingCount = streak === -1 ? real.length : streak;
  if (hard || failingCount >= 3) {
    const since = real[failingCount - 1]?.created_at || latest.created_at;
    return {
      status: 'failing',
      message: `AI calls are failing: ${explainAiError(latest.http_status, latest.error)} Emails are being sorted by keywords until this is fixed.`,
      since, http_status: latest.http_status,
    };
  }
  return { status: 'ok', message: 'AI is working, with occasional failures.', last_success_at: real.find(r => r.ok)?.created_at };
}

// ── Summary for Settings → AI usage ──────────────────────────────────────────
export async function getAiUsageSummary() {
  const s = await getAiSettings({ fresh: true });
  const pin = s.price_input_per_m != null ? Number(s.price_input_per_m) : null;
  const pout = s.price_output_per_m != null ? Number(s.price_output_per_m) : null;
  const priced = pin != null && pout != null;
  const cost = (i, o) => priced ? (Number(i) / 1e6) * pin + (Number(o) / 1e6) * pout : null;

  const [byFeature, daily, errors, credit] = await Promise.all([
    query(`
      SELECT feature,
             COUNT(*) FILTER (WHERE NOT blocked)::int                AS calls,
             COUNT(*) FILTER (WHERE NOT ok AND NOT blocked)::int     AS failures,
             COUNT(*) FILTER (WHERE blocked)::int                    AS blocked,
             COALESCE(SUM(input_tokens), 0)::bigint                  AS tokens_in,
             COALESCE(SUM(output_tokens), 0)::bigint                 AS tokens_out
        FROM ai_usage_events
       WHERE created_at >= date_trunc('month', NOW())
       GROUP BY feature`),
    query(`
      SELECT to_char(d, 'YYYY-MM-DD') AS day,
             COALESCE(SUM(e.input_tokens + e.output_tokens), 0)::bigint AS tokens,
             COUNT(e.id) FILTER (WHERE NOT e.blocked)::int              AS calls,
             COUNT(e.id) FILTER (WHERE NOT e.ok AND NOT e.blocked)::int AS failures
        FROM generate_series(date_trunc('day', NOW()) - INTERVAL '29 days', date_trunc('day', NOW()), INTERVAL '1 day') d
        LEFT JOIN ai_usage_events e ON e.created_at >= d AND e.created_at < d + INTERVAL '1 day'
       GROUP BY d ORDER BY d`),
    query(`
      SELECT created_at, feature, http_status, error FROM ai_usage_events
       WHERE NOT ok AND NOT blocked ORDER BY created_at DESC LIMIT 5`),
    s.credit_balance != null && s.credit_balance_set_at
      ? query(`SELECT COALESCE(SUM(input_tokens),0)::bigint AS i, COALESCE(SUM(output_tokens),0)::bigint AS o
                 FROM ai_usage_events WHERE created_at >= $1`, [s.credit_balance_set_at])
      : Promise.resolve(null),
  ]);

  const rows = byFeature.rows.map(r => ({
    ...r,
    tokens_in: Number(r.tokens_in), tokens_out: Number(r.tokens_out),
    tokens: Number(r.tokens_in) + Number(r.tokens_out),
    cost: cost(r.tokens_in, r.tokens_out),
  }));
  const tot = rows.reduce((a, r) => ({
    calls: a.calls + r.calls, failures: a.failures + r.failures, blocked: a.blocked + r.blocked,
    tokens_in: a.tokens_in + r.tokens_in, tokens_out: a.tokens_out + r.tokens_out,
  }), { calls: 0, failures: 0, blocked: 0, tokens_in: 0, tokens_out: 0 });
  const tokens = tot.tokens_in + tot.tokens_out;

  // Every known feature appears, used or not, so each can be switched off.
  const disabled = new Set(s.disabled_features || []);
  const features = Object.entries(FEATURES).map(([key, f]) => {
    const r = rows.find(x => x.feature === key) || { calls: 0, failures: 0, blocked: 0, tokens_in: 0, tokens_out: 0, tokens: 0, cost: priced ? 0 : null };
    return { key, ...f, enabled: !disabled.has(key), ...r, share: tokens ? r.tokens / tokens : 0 };
  }).sort((a, b) => b.tokens - a.tokens || a.label.localeCompare(b.label));

  const limit = s.monthly_token_limit ? Number(s.monthly_token_limit) : null;
  const pct = limit ? tokens / limit : null;

  return {
    settings: s,
    priced,
    month: { ...tot, tokens, cost: cost(tot.tokens_in, tot.tokens_out) },
    limit: limit && {
      tokens: limit, used: tokens, left: Math.max(0, limit - tokens), percent: pct,
      state: pct >= 1 ? 'reached' : pct * 100 >= (s.warn_percent || 80) ? 'warning' : 'ok',
    },
    credit: credit && priced ? (() => {
      const spent = cost(credit.rows[0].i, credit.rows[0].o);
      return { balance: Number(s.credit_balance), set_at: s.credit_balance_set_at, spent, left: Number(s.credit_balance) - spent };
    })() : null,
    features,
    daily: daily.rows.map(d => ({ ...d, tokens: Number(d.tokens) })),
    recent_errors: errors.rows.map(e => ({ ...e, explanation: explainAiError(e.http_status, e.error) })),
    health: await getAiHealth(),
  };
}
