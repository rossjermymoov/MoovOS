-- Migration 277: Correct sell price for tracking 4652548311 in BOORIEUR-270526
--
-- Migration 276 used COALESCE(corrected_sell_price, 5499) as a fallback —
-- the correct value is £54.99, not £5,499.
-- If 276 fired the fallback (corrected_sell_price was null), this corrects it.
-- If the value was already 54.99, this is a no-op (safe to run either way).
--
-- Also clears any FBL rows that might have been created with the wrong
-- £5,499 amount, and re-un-finalizes the run for clean re-finalization.

-- ── 1. Set the correct sell price unconditionally ─────────────────────────────
UPDATE reconciliation_lines
SET    corrected_sell_price = 54.99,
       corrected_by         = COALESCE(corrected_by, 'manual_price'),
       status               = 'corrected'
WHERE  run_id = (
    SELECT id FROM reconciliation_runs WHERE invoice_ref = 'BOORIEUR-270526' LIMIT 1
  )
  AND  tracking_number LIKE '%4652548311%'
  AND  is_fuel       = false
  AND  surcharge_id IS NULL;

-- ── 2. Delete any FBL rows that may have been created with the wrong amount ───
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

-- ── 3. Un-finalize for re-finalization ────────────────────────────────────────
UPDATE reconciliation_runs
SET    finalized    = false,
       finalized_at = NULL,
       finalized_by = NULL,
       status       = 'processing'
WHERE  invoice_ref = 'BOORIEUR-270526';
