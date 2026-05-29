-- Migration 279: Fix tracking 4652548311 by tracking number (not invoice_ref)
--
-- Migrations 276-278 all used WHERE invoice_ref = 'BOORIEUR-270526' which was
-- never the actual stored value.  The invoice_ref in reconciliation_runs is the
-- raw DHL invoice number (a plain numeric string).  This migration finds the
-- correct run via the reconciliation_lines tracking number instead, so the fix
-- is guaranteed to land on the right row regardless of what the invoice_ref says.
--
-- What this does:
--   1. Sets customer_id to the confirmed Boori (Europe) Ltd UUID
--   2. Sets corrected_sell_price = 54.99
--   3. Sets status = 'corrected', corrected_by = 'manual_price'
--   4. Deletes any stale FBL rows for this freight line (clean slate)
--   5. Un-finalizes the run so it can be re-finalized cleanly
--
-- Safe to re-run — updates are idempotent, DELETE is scoped, un-finalize is
-- a no-op if the run is already un-finalized.

-- ── 1. Fix the reconciliation_line ───────────────────────────────────────────
UPDATE reconciliation_lines
SET    customer_id          = '1b42c791-27e5-4f7d-9d6a-8f524bcad6b3',
       corrected_sell_price = 54.99,
       status               = 'corrected',
       corrected_by         = COALESCE(corrected_by, 'manual_price')
WHERE  tracking_number LIKE '%4652548311%'
  AND  is_fuel       = false
  AND  surcharge_id IS NULL
  AND  run_id = (
    SELECT rl2.run_id
    FROM   reconciliation_lines rl2
    WHERE  rl2.tracking_number LIKE '%4652548311%'
      AND  rl2.is_fuel       = false
      AND  rl2.surcharge_id IS NULL
    ORDER  BY rl2.id DESC
    LIMIT  1
  );

-- ── 2. Delete stale FBL rows for this freight line ───────────────────────────
DELETE FROM finalized_billing_lines
WHERE reconciliation_line_id IN (
  SELECT rl.id
  FROM   reconciliation_lines rl
  WHERE  rl.tracking_number LIKE '%4652548311%'
    AND  rl.is_fuel       = false
    AND  rl.surcharge_id IS NULL
);

-- ── 3. Un-finalize the run for clean re-finalization ─────────────────────────
UPDATE reconciliation_runs
SET    finalized    = false,
       finalized_at = NULL,
       finalized_by = NULL,
       status       = 'processing'
WHERE  id = (
  SELECT rl.run_id
  FROM   reconciliation_lines rl
  WHERE  rl.tracking_number LIKE '%4652548311%'
    AND  rl.is_fuel       = false
    AND  rl.surcharge_id IS NULL
  ORDER  BY rl.id DESC
  LIMIT  1
);
