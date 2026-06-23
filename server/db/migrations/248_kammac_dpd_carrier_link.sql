-- ─── Migration 248 — Add DPD carrier link for Kammac ─────────────────────────
--
-- Kammac has no customer_carrier_links row for DPD.  Without it, the DPD
-- carrier logo is not highlighted on the customer record and the rate card UI
-- blocks adding or editing DPD rates for this customer.
--
-- Fix: insert a customer_carrier_links row linking Kammac → DPD master rate card.
--
-- IDEMPOTENT: INSERT ... ON CONFLICT DO NOTHING — safe to re-run.

DO $$
DECLARE
  v_customer_id  UUID;
  v_courier_id   INTEGER;
  v_rate_card_id INTEGER;
BEGIN

  -- ── Resolve Kammac customer ──────────────────────────────────────────────────
  SELECT id INTO v_customer_id
  FROM   customers
  WHERE  business_name ILIKE '%kammac%'
  ORDER  BY LENGTH(business_name) ASC
  LIMIT  1;

  IF v_customer_id IS NULL THEN
    RAISE NOTICE 'Migration 248: Kammac customer not found — skipping';
    RETURN;
  END IF;

  RAISE NOTICE 'Migration 248: found Kammac customer_id = %', v_customer_id;

  -- ── Resolve DPD courier ───────────────────────────────────────────────────────
  SELECT id INTO v_courier_id
  FROM   couriers
  WHERE  code ILIKE 'DPD' OR name ILIKE 'DPD%'
  ORDER  BY id
  LIMIT  1;

  IF v_courier_id IS NULL THEN
    RAISE NOTICE 'Migration 248: DPD courier not found — skipping';
    RETURN;
  END IF;

  -- ── Resolve DPD master rate card ──────────────────────────────────────────────
  SELECT id INTO v_rate_card_id
  FROM   carrier_rate_cards
  WHERE  courier_id = v_courier_id
    AND  is_master  = true
  LIMIT  1;

  IF v_rate_card_id IS NULL THEN
    RAISE NOTICE 'Migration 248: DPD master rate card not found — skipping';
    RETURN;
  END IF;

  RAISE NOTICE 'Migration 248: DPD courier_id=% master rate_card_id=%', v_courier_id, v_rate_card_id;

  -- ── Insert carrier link ───────────────────────────────────────────────────────
  INSERT INTO customer_carrier_links (customer_id, courier_id, carrier_rate_card_id)
  VALUES (v_customer_id, v_courier_id, v_rate_card_id)
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Migration 248: DPD carrier link added for Kammac — DPD now active in carrier grid.';

END $$;
