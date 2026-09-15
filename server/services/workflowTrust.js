/**
 * workflowTrust.js — Probation → Autopilot calibration per workflow category.
 *
 * A "category" is (courier_code, intent), e.g. (dpd, courier_chase) = "DPD Queries".
 * A Quick Approve with NO edits increments the streak (caps at 20); any edit resets
 * it to 0. At 20 the category is "Autopilot Ready" and a manager may toggle it to
 * Full Autopilot. Claims are permanently locked out of autopilot.
 */

import { query } from '../db/index.js';

export const TRUST_CAP = 20;

// Claims/complaints lockout scope (WISMO Phase 3, MOS-6): previously a hardcoded
// permanent lockout; now a per-category setting (workflow_trust.claims_lockout_scope).
//   full_lockout    — today's behaviour: the whole conversation stays human-only.
//   final_step_only — only the closing/resolution step is gated; earlier hops (the
//                     initial courier inquiry drafted here) may autopilot. The finer
//                     "is THIS specific draft the final step" check lives at the call
//                     site that drafts a courier-RESOLVED customer update
//                     (courierAutomation.js's draftCustomerUpdateFromCourier), not
//                     here — this function only knows the category, not which draft
//                     is about to be sent.
// courierCode is optional; when omitted (or no row exists) this defaults to the safe
// full_lockout behaviour, matching pre-Phase-3 semantics exactly.
export async function isLockedCategory(intent, groupName, courierCode = null) {
  const i = String(intent || '').toLowerCase();
  const g = String(groupName || '').toLowerCase();
  const isClaimsCategory = i === 'claim' || i === 'complaint' || g === 'claims';
  if (!isClaimsCategory) return false;
  if (!courierCode) return true;   // no category to look up scope for → safe default

  try {
    const r = await query(
      `SELECT claims_lockout_scope FROM workflow_trust WHERE courier_code = $1 AND intent = $2`,
      [String(courierCode).toLowerCase(), i],
    );
    const scope = r.rows[0]?.claims_lockout_scope || 'full_lockout';
    return scope !== 'final_step_only';
  } catch {
    return true;   // lookup failed → safe default, stay locked
  }
}

function norm(courierCode, intent) {
  return {
    cc: String(courierCode || 'unknown').toLowerCase(),
    it: String(intent || 'general').toLowerCase(),
  };
}

// Record a human approval outcome for a category. Edited → reset; clean → +1 (capped).
export async function recordApproval(courierCode, intent, wasEdited) {
  const { cc, it } = norm(courierCode, intent);
  if (wasEdited) {
    await query(
      `INSERT INTO workflow_trust (courier_code, intent, consecutive_clean_approvals, last_reset_at, updated_at)
       VALUES ($1, $2, 0, NOW(), NOW())
       ON CONFLICT (courier_code, intent)
       DO UPDATE SET consecutive_clean_approvals = 0, last_reset_at = NOW(), updated_at = NOW()`,
      [cc, it],
    );
  } else {
    await query(
      `INSERT INTO workflow_trust (courier_code, intent, consecutive_clean_approvals, updated_at)
       VALUES ($1, $2, 1, NOW())
       ON CONFLICT (courier_code, intent)
       DO UPDATE SET consecutive_clean_approvals = LEAST(workflow_trust.consecutive_clean_approvals + 1, $3),
                     updated_at = NOW()`,
      [cc, it, TRUST_CAP],
    );
  }
}

// Is this category currently cleared for autonomous dual-dispatch?
export async function isAutopilotEnabled(courierCode, intent) {
  const { cc, it } = norm(courierCode, intent);
  try {
    const r = await query(
      `SELECT autopilot_enabled FROM workflow_trust WHERE courier_code = $1 AND intent = $2`,
      [cc, it],
    );
    return r.rows[0]?.autopilot_enabled === true;
  } catch { return false; }
}
