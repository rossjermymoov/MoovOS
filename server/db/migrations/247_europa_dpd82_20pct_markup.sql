-- ─── Migration 247 — Europa DPD Freight Next Day (DPD-82) sell rates +20% ────
--
-- Europa has no customer_rates entries for DPD-82 (DPD Freight Next Day).
-- Without sell rates the billing engine cannot price DPD-82 shipments for Europa.
--
-- Fix:
--   For every weight band in weight_bands for DPD-82 Mainland:
--     1. Ensure a dc_weight_classes row exists (needed by billing engine for
--        numeric weight-to-band resolution at invoice time).
--     2. Insert a customer_rates row with price = carrier_band_price × 1.20
--        (20% markup over DPD's cost rate), rounded to 2 d.p.
--
-- Scope: Mainland zone only (the only DPD-82 zone in seed data).
--        price_sub is left NULL — DPD-82 is a single-shipment freight rate,
--        not a multi-parcel sub-box service.
--
-- IDEMPOTENT: ON CONFLICT DO UPDATE — safe to re-run (re-runs will re-apply
-- the 20% markup to the current carrier cost, not compound it).

DO $$
DECLARE
  v_customer_id  UUID;
  v_service_id   INTEGER;
  v_courier_id   INTEGER;
  v_zone_id      INTEGER;
  v_wc_max_id    INTEGER;
  v_wc_id        INTEGER;
  v_wc_name      TEXT;
  v_inserted     INTEGER := 0;
  v_wc_created   INTEGER := 0;
  band           RECORD;
BEGIN

  -- ── Resolve Europa customer ──────────────────────────────────────────────────
  SELECT id INTO v_customer_id
  FROM   customers
  WHERE  business_name ILIKE '%europa%'
  ORDER  BY LENGTH(business_name) ASC
  LIMIT  1;

  IF v_customer_id IS NULL THEN
    RAISE NOTICE 'Migration 247: Europa customer not found — skipping';
    RETURN;
  END IF;

  RAISE NOTICE 'Migration 247: Europa customer_id = %', v_customer_id;

  -- ── Resolve DPD-82 service and courier ───────────────────────────────────────
  SELECT cs.id, cu.id
  INTO   v_service_id, v_courier_id
  FROM   courier_services cs
  JOIN   couriers         cu ON cu.id = cs.courier_id
  WHERE  cs.service_code = 'DPD-82'
  LIMIT  1;

  IF v_service_id IS NULL THEN
    RAISE NOTICE 'Migration 247: DPD-82 service not found — skipping';
    RETURN;
  END IF;

  RAISE NOTICE 'Migration 247: DPD-82 service_id=% courier_id=%', v_service_id, v_courier_id;

  -- ── Resolve DPD-82 Mainland zone ─────────────────────────────────────────────
  SELECT z.id INTO v_zone_id
  FROM   zones z
  WHERE  z.courier_service_id = v_service_id
    AND  z.name ILIKE '%mainland%'
  LIMIT  1;

  IF v_zone_id IS NULL THEN
    RAISE NOTICE 'Migration 247: DPD-82 Mainland zone not found — skipping';
    RETURN;
  END IF;

  RAISE NOTICE 'Migration 247: DPD-82 Mainland zone_id=%', v_zone_id;

  -- ── Seed base for new dc_weight_class_id values ───────────────────────────────
  SELECT COALESCE(MAX(dc_weight_class_id), 50000) INTO v_wc_max_id
  FROM   dc_weight_classes;

  -- ── Loop every DPD-82 weight band and upsert customer_rates ──────────────────
  FOR band IN
    SELECT min_weight_kg, max_weight_kg, price_first
    FROM   weight_bands
    WHERE  zone_id = v_zone_id
    ORDER  BY min_weight_kg
  LOOP
    -- Build a display name: "0 kg - 5 kg", "5.01 kg - 6.01 kg", etc.
    v_wc_name := TRIM(TO_CHAR(band.min_weight_kg, 'FM999990.99')) || ' kg - '
              || TRIM(TO_CHAR(band.max_weight_kg, 'FM999990.99')) || ' kg';

    -- ── Ensure dc_weight_classes entry exists ──────────────────────────────────
    SELECT dc_weight_class_id INTO v_wc_id
    FROM   dc_weight_classes
    WHERE  service_code    = 'DPD-82'
      AND  min_weight_kg   = band.min_weight_kg
      AND  max_weight_kg   = band.max_weight_kg
    LIMIT  1;

    IF v_wc_id IS NULL THEN
      v_wc_max_id := v_wc_max_id + 1;
      INSERT INTO dc_weight_classes
        (dc_weight_class_id, weight_class_name, courier_code, service_code, service_name,
         min_weight_kg, max_weight_kg)
      VALUES
        (v_wc_max_id, v_wc_name, 'DPD', 'DPD-82', 'DPD Freight Next Day',
         band.min_weight_kg, band.max_weight_kg)
      ON CONFLICT (dc_weight_class_id) DO NOTHING;

      v_wc_id      := v_wc_max_id;
      v_wc_created := v_wc_created + 1;
    ELSE
      -- Use existing entry's weight_class_name for display consistency
      SELECT weight_class_name INTO v_wc_name
      FROM   dc_weight_classes
      WHERE  dc_weight_class_id = v_wc_id;
    END IF;

    -- ── Upsert customer_rates for Europa ──────────────────────────────────────
    INSERT INTO customer_rates (
      customer_id, courier_id, courier_code, courier_name,
      service_id, service_code, service_name,
      zone_id, zone_name,
      weight_class_id, weight_class_name,
      price
    ) VALUES (
      v_customer_id, v_courier_id, 'DPD', 'DPD',
      v_service_id, 'DPD-82', 'DPD Freight Next Day',
      v_zone_id, 'Mainland',
      v_wc_id, v_wc_name,
      ROUND(band.price_first * 1.20, 2)
    )
    ON CONFLICT (customer_id, service_id, zone_name, weight_class_name)
    DO UPDATE SET
      price          = ROUND(EXCLUDED.price, 2),
      weight_class_id = EXCLUDED.weight_class_id;

    v_inserted := v_inserted + 1;
  END LOOP;

  RAISE NOTICE 'Migration 247: created % dc_weight_classes entries for DPD-82', v_wc_created;
  RAISE NOTICE 'Migration 247: inserted/updated % Europa DPD-82 customer_rates rows (20%% markup)', v_inserted;
  RAISE NOTICE 'Migration 247 complete — Europa DPD Freight Next Day sell rates active.';

END $$;
