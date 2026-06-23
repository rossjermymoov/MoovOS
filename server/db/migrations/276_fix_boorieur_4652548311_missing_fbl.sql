-- Migration 276: Fix missing finalized_billing_line for tracking 4652548311
--
-- Problem
-- ───────
-- The freight recon line for tracking 4652548311 in BOORIEUR-270526 is not
-- producing a finalized_billing_line row when the run is finalized, causing:
--   1. The shipment is invisible in the customer CSV
--   2. The run shows a negative margin (companion fuel/surcharge FBL rows have
--      carrier_amount > 0 but sell = 0; without the freight FBL row to offset
--      them with sell = £5,499, the net margin for this shipment is negative)
--
-- Root cause (most likely)
-- ────────────────────────
-- When the line was manually resolved with "manual_price = 5499", the
-- reconciliation_line may have retained customer_id = NULL if the DHL account
-- mapping was not established at resolution time.
--
-- finalizationService.finalizeRun() catches the subsequent NOT NULL violation
-- on finalized_billing_lines.customer_id with a silent "continue" — the error
-- is logged to Railway but the run still marks as finalized successfully.
--
-- Fix (this migration)
-- ────────────────────
-- 1. Set customer_id on the freight recon line from the companion fuel/surcharge
--    lines for the same tracking (they got customer_id from account mapping even
--    if the freight line missed it).  Also ensures corrected_sell_price = 5499
--    and status = 'corrected' so buildSnapshot will use the fallback path.
--
-- 2. Delete any existing FBL rows for this freight recon line (there may be a
--    zero-sell ghost row surviving from a prior failed finalization attempt,
--    which would block re-insertion via ON CONFLICT DO NOTHING).
--
-- 3. Force un-finalize the run so Ross can click "Finalise Run" one more time.
--
-- ACTION REQUIRED AFTER DEPLOYING
-- ────────────────────────────────
-- 1. Open BOORIEUR-270526 reconciliation run.
-- 2. The run should be in an unfinalized / processing state.
-- 3. Click "Finalise Run".
-- 4. Verify tracking 4652548311 appears in the customer CSV with sell = £5,499.
-- 5. Check the run margin — should now be positive (or at least not deeply negative).

-- ── 1. Patch the freight reconciliation_line for tracking 4652548311 ───────────
--
-- Set customer_id from companion lines if null; guarantee corrected values.

UPDATE reconciliation_lines rl
SET
  -- Inherit customer_id from any companion line for the same tracking in this run
  customer_id          = COALESCE(
    rl.customer_id,
    (
      SELECT rl2.customer_id
      FROM   reconciliation_lines rl2
      WHERE  rl2.run_id          = rl.run_id
        AND  rl2.tracking_number = rl.tracking_number
        AND  rl2.customer_id    IS NOT NULL
        AND  rl2.id             != rl.id
      LIMIT  1
    )
  ),
  -- Ensure the manual sell price is still set (guard against accidental clear)
  corrected_sell_price = COALESCE(rl.corrected_sell_price, 5499),
  -- Ensure status is 'corrected' so finalizeRun picks it up
  status               = 'corrected',
  -- Preserve corrected_by label (set to manual_price if somehow cleared)
  corrected_by         = COALESCE(rl.corrected_by, 'manual_price')
WHERE  rl.run_id = (
    SELECT id FROM reconciliation_runs WHERE invoice_ref = 'BOORIEUR-270526' LIMIT 1
  )
  AND  rl.tracking_number LIKE '%4652548311%'
  AND  rl.is_fuel       = false
  AND  rl.surcharge_id IS NULL;

-- ── 2. Delete any stale/incorrect FBL rows for this freight line ──────────────
--
-- Removes both zero-sell ghost rows (sell = 0) and any incorrectly-valued rows
-- so that re-finalization inserts a clean row via the corrected_sell_price
-- fallback in buildSnapshot.

DELETE FROM finalized_billing_lines
WHERE reconciliation_line_id IN (
  SELECT rl.id
  FROM   reconciliation_lines rl
  JOIN   reconciliation_runs  rr ON rr.id = rl.run_id
  WHERE  rr.invoice_ref        = 'BOORIEUR-270526'
    AND  rl.tracking_number   LIKE '%4652548311%'
    AND  rl.is_fuel            = false
    AND  rl.surcharge_id      IS NULL
);

-- ── 3. Force un-finalize the run (no guard — removes finalized = true/false) ──

UPDATE reconciliation_runs
SET    finalized    = false,
       finalized_at = NULL,
       finalized_by = NULL,
       status       = 'processing'
WHERE  invoice_ref = 'BOORIEUR-270526';
