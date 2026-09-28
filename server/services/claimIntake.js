/**
 * claimIntake.js — Phase 2 of docs/email-triage-automation-plan.md.
 *
 * Populates the claim-lifecycle schema that already exists (queries.claim_number
 * / claim_deadline_at / status, query_evidence) automatically when a courier's
 * claim-form email arrives — today an agent has to type all of this in by hand.
 * This does NOT touch the courier's actual claim-form portal — that stays
 * human-gated behind a real Google reCAPTCHA (confirmed live against a real DPD
 * link; automating past it would mean building bot-detection evasion, which
 * this deliberately does not do). This only prepares the data a human needs to
 * act quickly once they open that link themselves.
 */

import { query } from '../db/index.js';

// DPD's stated claim-document deadline (courier_query_config.claim_deadline_days
// — that table is legacy/flagged for deletion per a prior session's cleanup
// note, so the value is kept here directly rather than reading a table on its
// way out).
const DPD_CLAIM_DEADLINE_DAYS = 28;

function extractClaimFormDetails(text) {
  const claimRef = text.match(/Claim Reference:\s*(\S+)/i)?.[1] || null;
  const consignment = text.match(/Consignment Number:\s*(\S+)/i)?.[1] || null;
  const customerRef = text.match(/Customer Reference:\s*(\S+)/i)?.[1] || null;
  const linkMatch = text.match(/https?:\/\/\S*salesforce-sites\.com\S*/i);
  const claimFormUrl = linkMatch ? linkMatch[0].replace(/[.,)]+$/, '') : null;
  return { claimRef, consignment, customerRef, claimFormUrl };
}

// Same lookup path walked manually earlier — shipments.customer_account for
// the specific consignment first (unambiguous, since a customer can have
// multiple DPD accounts), falling back to customer_carrier_links.
async function resolveDpdAccountNumber(queryId, consignmentFromEmail) {
  const q = await query(`SELECT consignment_number, customer_id FROM queries WHERE id = $1`, [queryId]);
  const row = q.rows[0];
  const tracking = row?.consignment_number || consignmentFromEmail;

  if (tracking) {
    const bare = tracking.replace(/^1550/, '');
    const prefixed = tracking.startsWith('1550') ? tracking : `1550${tracking}`;
    const s = await query(
      `SELECT customer_account FROM shipments WHERE tracking_codes && ARRAY[$1, $2, $3] AND customer_account IS NOT NULL LIMIT 1`,
      [tracking, bare, prefixed],
    );
    if (s.rows[0]?.customer_account) return s.rows[0].customer_account;
  }

  if (row?.customer_id) {
    const c = await query(
      `SELECT ccl.account_number FROM customer_carrier_links ccl
         JOIN couriers co ON co.id = ccl.courier_id
        WHERE ccl.customer_id = $1 AND co.code ILIKE 'dpd%' AND ccl.account_number IS NOT NULL
        LIMIT 1`,
      [row.customer_id],
    );
    if (c.rows[0]?.account_number) return c.rows[0].account_number;
  }
  return null;
}

// Parcel description/contents/value were already extracted once, when the
// original courier inquiry was drafted (courierAutomation.js's required-fields
// backstop guarantees these three lines are present together whenever that
// draft succeeded) — reuse that text instead of a second Gemini call.
async function getParcelFieldsFromCourierDraft(queryId) {
  const r = await query(
    `SELECT body_text FROM query_emails
      WHERE query_id = $1 AND direction = 'outbound_courier'
      ORDER BY created_at DESC LIMIT 1`,
    [queryId],
  );
  const body = r.rows[0]?.body_text || '';
  return {
    description: body.match(/Parcel description:\s*(.+)/i)?.[1]?.trim() || null,
    contents: body.match(/Contents:\s*(.+)/i)?.[1]?.trim() || null,
    value: body.match(/Declared value:\s*(.+)/i)?.[1]?.trim() || null,
  };
}

async function addEvidenceIfMissing(queryId, evidenceType, valueText) {
  if (!valueText) return;
  const existing = await query(
    `SELECT 1 FROM query_evidence WHERE query_id = $1 AND evidence_type = $2 LIMIT 1`,
    [queryId, evidenceType],
  );
  if (existing.rows.length) return;
  await query(
    `INSERT INTO query_evidence (query_id, evidence_type, value_text, provided_by_name)
     VALUES ($1,$2,$3,'MoovOS automation')`,
    [queryId, evidenceType, valueText],
  );
}

/**
 * Called when checkCourierClaimSignal() detects a DPD claim-form email.
 * Extracts the claim reference/consignment/link, resolves the DPD account
 * number, and carries forward the already-extracted parcel fields — all into
 * the existing claim-tracking columns/evidence table, so the countdown
 * dashboard and evidence panel are populated without a human typing anything.
 */
export async function intakeClaimForm(queryId, { subject = '', body = '' } = {}) {
  const text = `${subject}\n${body}`;
  const { claimRef, consignment, customerRef, claimFormUrl } = extractClaimFormDetails(text);
  if (!claimRef && !claimFormUrl) return { intake: false };

  await query(
    `UPDATE queries
        SET claim_number = COALESCE($2, claim_number),
            claim_deadline_at = COALESCE(claim_deadline_at, NOW() + ($3 || ' days')::INTERVAL),
            status = 'awaiting_claim_docs'::query_status,
            requires_attention = true,
            attention_reason = $4,
            updated_at = NOW()
      WHERE id = $1`,
    [queryId, claimRef, DPD_CLAIM_DEADLINE_DAYS,
     `Claim form received${claimRef ? ` (${claimRef})` : ''} — needs parcel evidence submitted within ${DPD_CLAIM_DEADLINE_DAYS} days.`],
  );

  const account = await resolveDpdAccountNumber(queryId, consignment);
  const parcelFields = await getParcelFieldsFromCourierDraft(queryId);

  await addEvidenceIfMissing(queryId, 'claim_form_link', claimFormUrl);
  await addEvidenceIfMissing(queryId, 'dpd_account_number', account);
  await addEvidenceIfMissing(queryId, 'dpd_customer_reference', customerRef);
  await addEvidenceIfMissing(queryId, 'item_description', parcelFields.description);
  await addEvidenceIfMissing(queryId, 'goods_description', parcelFields.contents);
  await addEvidenceIfMissing(queryId, 'cost_price', parcelFields.value);

  return { intake: true, claimRef, consignment, claimFormUrl, account };
}
