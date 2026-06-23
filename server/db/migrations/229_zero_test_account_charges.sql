-- ─── Migration 229 — Zero out existing charges for test accounts ─────────────
--
-- Charges created before the is_test_account flag existed may have
-- price = NULL (rate card lookup failed / no customer matched).
-- This migration sets price = 0 and cost_price = 0 for all non-cancelled
-- courier charges belonging to customers marked as test accounts,
-- and clears price_failure_reason so they no longer show as pricing errors.

DO $$
DECLARE
  v_updated INT := 0;
BEGIN
  UPDATE charges
  SET    price               = 0,
         cost_price          = 0,
         price_auto          = true,
         price_failure_reason = NULL
  WHERE  cancelled = false
    AND  charge_type = 'courier'
    AND  (price IS NULL OR price = 0)
    AND  customer_id IN (
           SELECT id FROM customers WHERE is_test_account = true
         );

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RAISE NOTICE 'Migration 229: zeroed % charge(s) for test account customers.', v_updated;

  -- Also zero out any fuel/surcharge rows on those same shipments
  UPDATE charges
  SET    price      = 0,
         cost_price = 0
  WHERE  cancelled = false
    AND  charge_type IN ('fuel', 'surcharge')
    AND  shipment_id IN (
           SELECT c.shipment_id
           FROM   charges c
           JOIN   customers cu ON cu.id = c.customer_id
           WHERE  cu.is_test_account = true
             AND  c.cancelled = false
         );

  RAISE NOTICE 'Migration 229: also zeroed fuel/surcharge rows on test account shipments.';
END $$;
