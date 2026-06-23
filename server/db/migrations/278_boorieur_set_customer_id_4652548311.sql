-- Migration 278: Explicitly set customer_id on freight recon line for 4652548311
--
-- Migration 276 tried to inherit customer_id from companion lines via COALESCE.
-- This migration sets it explicitly to the confirmed Boori (Europe) Ltd UUID
-- so there is no ambiguity.  Also re-runs the sell price and status fix in
-- case 276/277 ran before the recon line existed in the expected state.
--
-- Customer: Boori (Europe) Ltd — id 1b42c791-27e5-4f7d-9d6a-8f524bcad6b3

UPDATE reconciliation_lines
SET    customer_id          = '1b42c791-27e5-4f7d-9d6a-8f524bcad6b3',
       corrected_sell_price = 54.99,
       status               = 'corrected',
       corrected_by         = COALESCE(corrected_by, 'manual_price')
WHERE  run_id = (
    SELECT id FROM reconciliation_runs WHERE invoice_ref = 'BOORIEUR-270526' LIMIT 1
  )
  AND  tracking_number LIKE '%4652548311%'
  AND  is_fuel       = false
  AND  surcharge_id IS NULL;

-- Delete any stale FBL rows for this freight line (clean slate for re-finalization)
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

-- Un-finalize for clean re-finalization
UPDATE reconciliation_runs
SET    finalized    = false,
       finalized_at = NULL,
       finalized_by = NULL,
       status       = 'processing'
WHERE  invoice_ref = 'BOORIEUR-270526';
