/**
 * Moov OS — AI usage (Settings → AI usage)
 *
 *   GET  /api/ai-usage           — this month's usage, by feature and by day, limits, credit, health
 *   GET  /api/ai-usage/health    — is AI working? (drives the Queries page warning)
 *   PUT  /api/ai-usage/settings  — limits, prices, credit balance, per-feature on/off
 */

import express from 'express';
import { query } from '../db/index.js';
import { FEATURES, getAiUsageSummary, getAiHealth, getAiSettings, invalidateAiSettings } from '../services/aiUsage.js';

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    res.set('Cache-Control', 'no-store');
    res.json(await getAiUsageSummary());
  } catch (err) { next(err); }
});

router.get('/health', async (req, res, next) => {
  try {
    res.set('Cache-Control', 'no-store');
    res.json(await getAiHealth());
  } catch (err) { next(err); }
});

// Empty string / null clears an optional number; anything else must be a
// non-negative number.
function optionalNumber(v, field) {
  if (v === undefined) return undefined;
  if (v === null || v === '') return null;
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0) throw Object.assign(new Error(`${field} must be a positive number`), { status: 400 });
  return n;
}

router.put('/settings', async (req, res, next) => {
  try {
    const b = req.body || {};
    const current = await getAiSettings({ fresh: true });
    const updates = [];
    const values = [];
    const set = (col, val) => { values.push(val); updates.push(`${col} = $${values.length}`); };

    const limit = optionalNumber(b.monthly_token_limit, 'Monthly token limit');
    if (limit !== undefined) set('monthly_token_limit', limit === null ? null : Math.round(limit));
    if (b.warn_percent !== undefined) {
      const w = Number(b.warn_percent);
      if (!Number.isInteger(w) || w < 1 || w > 100) return res.status(400).json({ error: 'Warning level must be between 1 and 100%' });
      set('warn_percent', w);
    }
    if (b.pause_at_limit !== undefined) set('pause_at_limit', !!b.pause_at_limit);
    const pin = optionalNumber(b.price_input_per_m, 'Input price');
    if (pin !== undefined) set('price_input_per_m', pin);
    const pout = optionalNumber(b.price_output_per_m, 'Output price');
    if (pout !== undefined) set('price_output_per_m', pout);
    if (b.currency !== undefined) {
      if (!/^[A-Z]{3}$/.test(String(b.currency))) return res.status(400).json({ error: 'Currency must be a 3-letter code, e.g. GBP' });
      set('currency', b.currency);
    }
    const credit = optionalNumber(b.credit_balance, 'Credit balance');
    if (credit !== undefined) {
      set('credit_balance', credit);
      // A new balance figure restarts the "spent since" count from now.
      const changed = credit === null ? current.credit_balance != null : Number(current.credit_balance) !== credit;
      if (changed) updates.push(`credit_balance_set_at = ${credit === null ? 'NULL' : 'NOW()'}`);
    }
    if (b.disabled_features !== undefined) {
      if (!Array.isArray(b.disabled_features) || b.disabled_features.some(f => !FEATURES[f])) {
        return res.status(400).json({ error: 'Unknown feature in disabled_features' });
      }
      set('disabled_features', b.disabled_features);
    }

    if (!updates.length) return res.status(400).json({ error: 'Nothing to update' });
    updates.push('updated_at = NOW()');
    await query(`UPDATE ai_usage_settings SET ${updates.join(', ')} WHERE id = 1`, values);
    invalidateAiSettings();
    res.json(await getAiUsageSummary());
  } catch (err) {
    if (err.status === 400) return res.status(400).json({ error: err.message });
    next(err);
  }
});

export default router;
