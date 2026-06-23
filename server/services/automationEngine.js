/**
 * Moov OS — Unified Automation Rules engine.
 *
 * Replaces the old split between slaEngine (triggers→priority) and the hard-coded
 * sla_configs groups. ONE ordered list of automation_rules; the FIRST rule whose
 * every provided condition matches wins. That rule sets the ticket's priority, its
 * SLA response/resolution window, the breach-escalation toggle, and the autopilot
 * mode (off | draft | full — 'full' is still gated downstream by workflow_trust).
 *
 * Run on every newly-created ticket regardless of source (Gmail ingest OR the
 * manual POST /api/queries path) so behaviour is identical everywhere.
 * Never throws into the request path.
 */

import { query } from '../db/index.js';

// Does a single rule match the ticket context? All provided (non-null) conditions
// must hold; any null condition is ignored.
function ruleMatches(rule, fields) {
  if (rule.cond_subject_contains) {
    const hay = `${fields.subject} ${fields.body}`.toLowerCase();
    if (!hay.includes(String(rule.cond_subject_contains).toLowerCase())) return false;
  }
  if (rule.cond_courier_code) {
    if (String(fields.courierCode || '').toLowerCase() !== String(rule.cond_courier_code).toLowerCase()) return false;
  }
  if (rule.cond_query_type) {
    const want = String(rule.cond_query_type).toLowerCase();
    const have = [fields.queryType, fields.triageIntent].map(v => String(v || '').toLowerCase());
    if (!have.includes(want)) return false;
  }
  if (rule.cond_customer_tier) {
    if (String(fields.customerTier || '').toLowerCase() !== String(rule.cond_customer_tier).toLowerCase()) return false;
  }
  return true;
}

/**
 * Evaluate the automation rules for a ticket and apply the winning rule.
 * @returns {Promise<{matched:boolean, rule?:object}>}
 */
export async function evaluateAutomationRules(queryId, ctx = {}) {
  try {
    const { rows: rules } = await query(
      `SELECT * FROM automation_rules WHERE is_active = true ORDER BY position ASC, created_at ASC`,
    );
    if (!rules.length) return { matched: false };

    const fields = {
      subject:      ctx.subject      || '',
      body:         ctx.body         || '',
      courierCode:  ctx.courierCode  || '',
      queryType:    ctx.queryType    || '',
      triageIntent: ctx.triageIntent || '',
      customerTier: ctx.customerTier || '',
    };

    const rule = rules.find(r => ruleMatches(r, fields));
    if (!rule) return { matched: false };

    // THEN — priority override
    if (rule.set_priority) {
      await query(`UPDATE queries SET priority = $1 WHERE id = $2`, [rule.set_priority, queryId]);
    }

    // THEN — SLA response window: store the minutes + an absolute breach time the
    // ticket header/badges and the monitor both read.
    if (rule.response_minutes) {
      await query(
        `UPDATE queries
            SET sla_response_minutes = $2,
                matched_rule_id      = $3,
                courier_sla_expires_at = NOW() + ($2 || ' minutes')::INTERVAL
          WHERE id = $1`,
        [queryId, rule.response_minutes, rule.id],
      );
    } else {
      await query(`UPDATE queries SET matched_rule_id = $2 WHERE id = $1`, [queryId, rule.id]);
    }

    console.log(`[Automation] rule "${rule.name}" matched ticket ${queryId} → priority=${rule.set_priority || '—'}, response=${rule.response_minutes || '—'}m, autopilot=${rule.autopilot_mode}`);
    return { matched: true, rule };
  } catch (e) {
    console.warn('[Automation] evaluateAutomationRules error:', e.message);
    return { matched: false };
  }
}

// Convenience: fetch the rule already matched to a ticket (for autopilot / monitor).
export async function getMatchedRule(queryId) {
  try {
    const r = await query(
      `SELECT ar.* FROM automation_rules ar
         JOIN queries q ON q.matched_rule_id = ar.id
        WHERE q.id = $1`,
      [queryId],
    );
    return r.rows[0] || null;
  } catch { return null; }
}
