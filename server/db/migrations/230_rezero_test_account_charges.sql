-- ─── Migration 230 — Re-zero test account charges after relinking ────────────
--
-- Migration 229 ran before charges were relinked to the test account customer,
-- so those charges still have price = NULL / price_failure_reason set.
-- Now that customer_id is correct, zero them out.
--
-- Also fixes price_auto so the UI shows £0 as a valid price rather than
-- "no price found".

DO $$
DECLARE
  v_courier  INT := 0;
  v_other    INT := 0;
BEGIN
  -- Zero courier charges
  UPDATE charges
  SET    price                = 0,
         cost_price           = 0,
         price_auto           = true,
         price_failure_reason = NULL
  WHERE  cancelled     = false
    AND  charge_type   = 'courier'
    AND  customer_id IN (SELECT id FROM customers WHERE is_test_account = true);

  GET DIAGNOSTICS v_courier = ROW_COUNT;

  -- Zero fuel / surcharge rows on the same shipments
  UPDATE charges
  SET    price      = 0,
         cost_price = 0
  WHERE  cancelled  = false
    AND  charge_type IN ('fuel', 'surcharge')
    AND  shipment_id IN (
           SELECT c.shipment_id
           FROM   charges c
           JOIN   customers cu ON cu.id = c.customer_id
           WHERE  cu.is_test_account = true
             AND  c.cancelled = false
         );

  GET DIAGNOSTICS v_other = ROW_COUNT;

  RAISE NOTICE 'Migration 230: zeroed % courier charge(s) and % fuel/surcharge row(s) for test accounts.', v_courier, v_other;
END $$;
