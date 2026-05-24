-- ─── Migration 204 — Reassign order SD028 from TT Pro Turf to MOOV-0183 ──────
--
-- SD028 was received by the webhook when TT Pro Turf incorrectly held
-- dc_customer_id = 'MOOV-0183', causing the shipment and all its charges to
-- be attributed to TT Pro Turf (MOOV-0186). The correct owner is the customer
-- now registered as MOOV-0183.
--
-- Steps:
--   1. Resolve both customer IDs.
--   2. Reassign charges.customer_id where order_id = 'SD028'.
--   3. Reassign shipments.customer_id / customer_account for the related shipments.

DO $$
DECLARE
  v_proturf_id    UUID;
  v_new_id        UUID;
  v_charge_count  INT;
  v_ship_count    INT;
BEGIN
  SELECT id INTO v_proturf_id FROM customers WHERE account_number = 'MOOV-0186' LIMIT 1;
  SELECT id INTO v_new_id     FROM customers WHERE account_number = 'MOOV-0183' LIMIT 1;

  IF v_proturf_id IS NULL THEN
    RAISE NOTICE 'Migration 204: TT Pro Turf (MOOV-0186) not found — skipping.';
    RETURN;
  END IF;

  IF v_new_id IS NULL THEN
    RAISE NOTICE 'Migration 204: MOOV-0183 customer not yet created — skipping. Re-run after customer is added.';
    RETURN;
  END IF;

  -- ── Charges ────────────────────────────────────────────────────────────────
  UPDATE charges
  SET    customer_id = v_new_id
  WHERE  order_id    = 'SD028'
    AND  customer_id = v_proturf_id;

  GET DIAGNOSTICS v_charge_count = ROW_COUNT;

  -- ── Shipments (via charges join) ────────────────────────────────────────────
  UPDATE shipments s
  SET    customer_id      = v_new_id,
         customer_account = 'MOOV-0183'
  WHERE  s.customer_id   = v_proturf_id
    AND  s.id IN (
      SELECT DISTINCT c.shipment_id
      FROM   charges c
      WHERE  c.order_id    = 'SD028'
        AND  c.customer_id = v_new_id   -- already reassigned above
        AND  c.shipment_id IS NOT NULL
    );

  GET DIAGNOSTICS v_ship_count = ROW_COUNT;

  RAISE NOTICE 'Migration 204: moved % charge(s) and % shipment(s) for SD028 from TT Pro Turf to MOOV-0183.',
    v_charge_count, v_ship_count;
END $$;
