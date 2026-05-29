-- Migration 270: Repair Boori BOORIEUR-270526 finalized_billing_lines
--
-- Problem
-- ───────
-- The Boori (Europe) LTD reconciliation run for DHL invoice BOORIEUR-270526
-- was finalized with incorrect sell_base_amount on 29 lines that were resolved
-- via map_to_surcharge.
--
-- Root cause
-- ──────────
-- When a freight recon line is resolved via map_to_surcharge, the code at
-- resolve time creates a surcharge charge and replaces charge_id on the recon
-- line with the new surcharge charge's ID.  buildSnapshot() then enriches from
-- that surcharge charge, writing the *surcharge sell price* into sell_base_amount
-- and double-counting the surcharge in sell_surcharge_amount.  The real freight
-- sell price was never captured in the snapshot.
--
-- Fix (code)
-- ──────────
-- finalizationService.js buildSnapshot() now detects lines with surcharge_id
-- set, looks up the freight charge via the surcharge charge's shipment_id, and
-- uses that for enrichment.  corrected_sell_price is no longer applied as
-- sell_base for surcharge lines (it is already captured by surcharge_detail).
--
-- Fix (data — this migration)
-- ───────────────────────────
-- 1. Un-finalize the affected run (set finalized=false, status='processing')
--    so finalizeRun() will accept it again.
-- 2. Delete the finalized_billing_lines rows whose recon line had surcharge_id
--    set — these are the 29 incorrectly snapshotted lines.
--    (The ON CONFLICT DO NOTHING in insertSnapshot uses reconciliation_line_id
--    as the conflict key, so deleting these rows allows re-insertion with
--    correct values when the run is re-finalized.)
-- 3. The other finalized_billing_lines rows (correct lines) are left intact.
--    ON CONFLICT DO NOTHING means re-finalization will skip them — no risk of
--    overwriting correct data.
--
-- ACTION REQUIRED AFTER DEPLOYING THIS MIGRATION
-- ───────────────────────────────────────────────
-- 1. Confirm the fix is live (finalizationService.js change deployed).
-- 2. Open the reconciliation run for invoice BOORIEUR-270526.
-- 3. Click "Finalise Run" again — only the 29 deleted rows will be re-inserted
--    with correct sell_base_amount (freight sell) and correct surcharge_detail.
-- 4. Re-download the customer CSV and verify named surcharge columns appear.

-- ── 1. Un-finalize the run ────────────────────────────────────────────────────
-- Identify run by invoice reference (unique per run).
UPDATE reconciliation_runs
SET    finalized    = false,
       finalized_at = NULL,
       finalized_by = NULL,
       status       = 'processing'
WHERE  invoice_reference = 'BOORIEUR-270526'
  AND  finalized         = true;

-- ── 2. Delete the incorrectly snapshotted finalized_billing_lines rows ────────
-- Only delete rows where the corresponding recon line had surcharge_id set
-- (the 29 map_to_surcharge lines).  Correct lines are left untouched.
DELETE FROM finalized_billing_lines fbl
USING reconciliation_lines rl
WHERE rl.id           = fbl.reconciliation_line_id
  AND rl.surcharge_id IS NOT NULL
  AND fbl.run_id = (
    SELECT id FROM reconciliation_runs WHERE invoice_reference = 'BOORIEUR-270526'
    LIMIT 1
  );

-- ── Verify (informational) ───────────────────────────────────────────────────
-- After running, the following should return 0 rows for the affected run:
--
--   SELECT fbl.*
--   FROM   finalized_billing_lines fbl
--   JOIN   reconciliation_lines    rl  ON rl.id = fbl.reconciliation_line_id
--   WHERE  rl.surcharge_id IS NOT NULL
--     AND  fbl.run_id = (SELECT id FROM reconciliation_runs WHERE invoice_reference='BOORIEUR-270526');
