-- Migration 274: Remove duplicate fuel/surcharge finalized_billing_lines for BOORIEUR-270526
--
-- Problem
-- ───────
-- buildSnapshot() for map_to_surcharge lines (migration 270 fix) resolved
-- enrichChargeId to the FREIGHT charge so that sell_base would reflect the
-- freight sell price.  However this caused each surcharge recon line to produce
-- a snapshot that DUPLICATES the full freight row (base + fuel + all surcharges),
-- inflating the customer CSV total by the full freight sell for every surcharge
-- line on every shipment.
--
-- Similarly, is_fuel = true recon lines that have charge_id set (DHL uses linked
-- fuel charges) were enriched from the fuel charge, producing a snapshot with
-- sell_base = fuel sell price + sell_fuel = same fuel price (doubled), plus any
-- surcharges for the shipment — again duplicating amounts from the freight row.
--
-- Root cause fix (code — finalizationService.js)
-- ───────────────────────────────────────────────
-- buildSnapshot() now has early returns for is_fuel=true and surcharge_id IS NOT
-- NULL lines:
--   • Fuel lines:      record carrier_fuel_amount only; all sell amounts = 0.
--   • Surcharge lines: record carrier_surcharge_amount only; all sell amounts = 0.
-- The sell amounts for fuel and surcharges are already captured in the FREIGHT
-- recon line's snapshot via the per-shipment sell_fuel and sell_surcharge subqueries.
--
-- generateCustomerCSV() now filters finalized_billing_lines to
-- sell_total_amount > 0 so zero-sell fuel/surcharge rows are excluded.
--
-- Fix (data — this migration)
-- ───────────────────────────
-- 1. Delete all finalized_billing_lines for BOORIEUR-270526 where the
--    corresponding reconciliation_line has is_fuel = true OR surcharge_id IS NOT
--    NULL.  These rows contain duplicated/inflated sell amounts from the old code.
-- 2. Un-finalize the run (finalized=false, status='processing') so Ross can click
--    "Finalise Run" once more.  ON CONFLICT DO NOTHING in insertSnapshot means
--    the correct freight rows are skipped; only the deleted fuel/surcharge rows
--    are re-inserted — now with zero sell amounts and correct carrier amounts.
--
-- ACTION REQUIRED AFTER DEPLOYING
-- ────────────────────────────────
-- 1. Confirm finalizationService.js fix is live.
-- 2. Open the reconciliation run for BOORIEUR-270526.
-- 3. Click "Finalise Run".
-- 4. Re-download the customer CSV — each tracking number should appear once, with
--    the correct base / fuel / named-surcharge breakdown and no duplicate rows.

-- ── 1. Delete duplicate fuel and surcharge finalized_billing_lines ────────────
DELETE FROM finalized_billing_lines fbl
USING reconciliation_lines rl
WHERE rl.id      = fbl.reconciliation_line_id
  AND (rl.is_fuel = true OR rl.surcharge_id IS NOT NULL)
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
-- After running, this should return 0:
--
--   SELECT COUNT(*)
--   FROM   finalized_billing_lines fbl
--   JOIN   reconciliation_lines    rl ON rl.id = fbl.reconciliation_line_id
--   WHERE  (rl.is_fuel = true OR rl.surcharge_id IS NOT NULL)
--     AND  fbl.run_id = (SELECT id FROM reconciliation_runs WHERE invoice_ref='BOORIEUR-270526');
