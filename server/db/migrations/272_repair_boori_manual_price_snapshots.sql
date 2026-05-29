-- Migration 272: Repair BOORIEUR-270526 zero-sell finalized_billing_lines
--
-- Problem
-- ───────
-- buildSnapshot() only applied corrected_sell_price inside the charge
-- enrichment block (guarded by "IF enrichChargeId IS NOT NULL").  For Boori
-- EUR lines that are external bookings (no Moov OS shipment record, charge_id
-- IS NULL), the enrichment block was skipped entirely and all sell amounts
-- were written as £0.00 — even for lines where Ross had manually set a price.
--
-- Symptoms reported by Ross:
--   tracking 4652548311 — manual price £5,499 — CSV shows zero cost, zero sell.
--   Likely affects all other manual_price corrected lines on this run that had
--   no linked charge_id (external booking lines common on Boori EUR DHL account).
--
-- Root cause
-- ──────────
-- finalizationService.js buildSnapshot():
--   correctedSell = (line.corrected_sell_price != null && !line.surcharge_id)
--     ? round4(parseFloat(line.corrected_sell_price)) : null;
--
-- This code lives inside "if (enrichChargeId) { if (enrichRes.rows.length) { ... } }"
-- so it never executes when charge_id is null.  The fix (in finalizationService.js)
-- adds a fallback AFTER the enrichment block that applies corrected_sell_price as
-- sell_base_amount whenever both sell_base and sell_total are still zero.
--
-- Fix (data — this migration)
-- ───────────────────────────
-- 1. Delete finalized_billing_lines rows for BOORIEUR-270526 where
--    sell_base_amount = 0 AND sell_total_amount = 0 but the corresponding
--    reconciliation_line has corrected_sell_price > 0.
--    These are definitively wrong snapshots — a corrected line cannot
--    legitimately have a zero sell price.
-- 2. Un-finalize the run (finalized=false, status='processing') so
--    Ross can click "Finalise Run" once more to re-insert the fixed rows.
--    Existing correct rows (non-zero sell) are untouched — ON CONFLICT DO
--    NOTHING in insertSnapshot means re-finalization will skip them safely.
--
-- ACTION REQUIRED AFTER DEPLOYING
-- ────────────────────────────────
-- 1. Confirm finalizationService.js fix is live.
-- 2. Open the reconciliation run for BOORIEUR-270526.
-- 3. Click "Finalise Run" — only the deleted rows will be re-inserted,
--    now with correct sell amounts from corrected_sell_price.
-- 4. Re-download the customer CSV and verify sell prices appear.

-- ── 1. Delete incorrectly zero-snapshotted rows ───────────────────────────────
-- Only targets rows where the corrected price IS set but the snapshot is zero —
-- these are unambiguously wrong.  Correct rows (non-zero sell) are left intact.
DELETE FROM finalized_billing_lines fbl
USING reconciliation_lines rl
WHERE rl.id                  = fbl.reconciliation_line_id
  AND fbl.sell_base_amount   = 0
  AND fbl.sell_total_amount  = 0
  AND rl.corrected_sell_price > 0
  AND rl.surcharge_id IS NULL
  AND fbl.run_id = (
    SELECT id FROM reconciliation_runs WHERE invoice_ref = 'BOORIEUR-270526'
    LIMIT 1
  );

-- ── 2. Un-finalize the run ────────────────────────────────────────────────────
UPDATE reconciliation_runs
SET    finalized    = false,
       finalized_at = NULL,
       finalized_by = NULL,
       status       = 'processing'
WHERE  invoice_ref = 'BOORIEUR-270526'
  AND  finalized   = true;

-- ── Verify (informational) ───────────────────────────────────────────────────
-- After running, the following should return 0:
--
--   SELECT COUNT(*)
--   FROM   finalized_billing_lines fbl
--   JOIN   reconciliation_lines rl ON rl.id = fbl.reconciliation_line_id
--   WHERE  fbl.sell_base_amount = 0
--     AND  fbl.sell_total_amount = 0
--     AND  rl.corrected_sell_price > 0
--     AND  fbl.run_id = (SELECT id FROM reconciliation_runs WHERE invoice_ref = 'BOORIEUR-270526');
