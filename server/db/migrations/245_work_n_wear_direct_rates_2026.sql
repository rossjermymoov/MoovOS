-- ─── Migration 245 — Work N Wear Direct DPD rates 2026 ───────────────────────
--
-- Source: "Moov Parcel DPD Domestic First & Sub Rate Sheet 2026 - WORK & WEAR DIRECT LTD"
-- Volume basis: 350 parcels/week
-- Fuel surcharge: 5.2% (billed as a separate surcharge line by DPD, not embedded here)
--
-- ── Services updated ─────────────────────────────────────────────────────────
--   DPD-12  (DPD Next Day)          Mainland £4.85  Sub £3.35
--   DPD-14  (DPD Next Day 10.30)    Mainland £15.30 Sub £11.65
--   DPD-13  (DPD Next Day 12.00)    Mainland £8.25  Sub £6.55
--   DPD-18  (DPD Saturday 10.30)    Mainland £18.70 Sub £15.15
--   DPD-17  (DPD Saturday 12.00)    Mainland £15.30 Sub £11.65
--   DPD-16  (DPD Saturday)          Mainland £7.25  Sub £5.75
--   DPD-01  (DPD Sunday)            Mainland £8.25  Sub £5.75
--   DPD-12  Northern Ireland        £32.40 (Next Day)
--   DPD-12  Highlands and Islands   £11.19
--   DPD-11  Northern Ireland        £10.25 (2Day+)
--   DPD-11  Scottish Highlands      £11.19 (2Day+)
--   DPD-11  Scottish Islands        £11.19 (2Day+)
--   DPD-11  Isle of Man             £12.80 (2Day+)
--   DPD-11  Channel Islands         £14.25 (2Day+)
--   DPD-11ROI Ireland               £9.95  (DPD Ireland 2Day)
--
-- IDEMPOTENT: uses ON CONFLICT DO UPDATE — safe to re-run.

DO $$
DECLARE
  v_customer_id  UUID;
  v_courier_id   INTEGER;
  v_svc_01       INTEGER;
  v_svc_11       INTEGER;
  v_svc_11roi    INTEGER;
  v_svc_12       INTEGER;
  v_svc_13       INTEGER;
  v_svc_14       INTEGER;
  v_svc_16       INTEGER;
  v_svc_17       INTEGER;
  v_svc_18       INTEGER;
BEGIN

  -- ── Resolve customer ────────────────────────────────────────────────────────
  SELECT id INTO v_customer_id
  FROM   customers
  WHERE  business_name ILIKE '%work%wear%direct%'
     OR  business_name ILIKE '%work & wear direct%'
     OR  business_name ILIKE '%work n wear direct%'
  LIMIT  1;

  IF v_customer_id IS NULL THEN
    RAISE NOTICE 'Migration 245: customer "Work N Wear Direct" not found — skipping';
    RETURN;
  END IF;

  RAISE NOTICE 'Migration 245: found customer_id = %', v_customer_id;

  -- ── Resolve courier and service IDs ────────────────────────────────────────
  SELECT id INTO v_courier_id FROM couriers WHERE UPPER(code) = 'DPD' LIMIT 1;

  SELECT id INTO v_svc_01    FROM courier_services WHERE service_code = 'DPD-01'    LIMIT 1;
  SELECT id INTO v_svc_11    FROM courier_services WHERE service_code = 'DPD-11'    LIMIT 1;
  SELECT id INTO v_svc_11roi FROM courier_services WHERE service_code = 'DPD-11ROI' LIMIT 1;
  SELECT id INTO v_svc_12    FROM courier_services WHERE service_code = 'DPD-12'    LIMIT 1;
  SELECT id INTO v_svc_13    FROM courier_services WHERE service_code = 'DPD-13'    LIMIT 1;
  SELECT id INTO v_svc_14    FROM courier_services WHERE service_code = 'DPD-14'    LIMIT 1;
  SELECT id INTO v_svc_16    FROM courier_services WHERE service_code = 'DPD-16'    LIMIT 1;
  SELECT id INTO v_svc_17    FROM courier_services WHERE service_code = 'DPD-17'    LIMIT 1;
  SELECT id INTO v_svc_18    FROM courier_services WHERE service_code = 'DPD-18'    LIMIT 1;

  -- ── Mainland rates (price + price_sub) ─────────────────────────────────────
  -- DPD-12 Next Day — Mainland £4.85 / Sub £3.35
  IF v_svc_12 IS NOT NULL THEN
    INSERT INTO customer_rates (
      customer_id, courier_id, courier_code, courier_name,
      service_id, service_code, service_name,
      zone_id, zone_name, weight_class_id, weight_class_name,
      price, price_sub
    ) VALUES (
      v_customer_id, v_courier_id, 'DPD', 'DPD',
      v_svc_12, 'DPD-12', 'DPD Next Day',
      0, 'Mainland', 0, 'parcel',
      4.85, 3.35
    )
    ON CONFLICT (customer_id, service_id, zone_name, weight_class_name)
    DO UPDATE SET price = 4.85, price_sub = 3.35;
  END IF;

  -- DPD-14 Next Day 10.30 — Mainland £15.30 / Sub £11.65
  IF v_svc_14 IS NOT NULL THEN
    INSERT INTO customer_rates (
      customer_id, courier_id, courier_code, courier_name,
      service_id, service_code, service_name,
      zone_id, zone_name, weight_class_id, weight_class_name,
      price, price_sub
    ) VALUES (
      v_customer_id, v_courier_id, 'DPD', 'DPD',
      v_svc_14, 'DPD-14', 'DPD Next Day 10.30',
      0, 'Mainland', 0, 'parcel',
      15.30, 11.65
    )
    ON CONFLICT (customer_id, service_id, zone_name, weight_class_name)
    DO UPDATE SET price = 15.30, price_sub = 11.65;
  END IF;

  -- DPD-13 Next Day 12.00 — Mainland £8.25 / Sub £6.55
  IF v_svc_13 IS NOT NULL THEN
    INSERT INTO customer_rates (
      customer_id, courier_id, courier_code, courier_name,
      service_id, service_code, service_name,
      zone_id, zone_name, weight_class_id, weight_class_name,
      price, price_sub
    ) VALUES (
      v_customer_id, v_courier_id, 'DPD', 'DPD',
      v_svc_13, 'DPD-13', 'DPD Next Day 12.00',
      0, 'Mainland', 0, 'parcel',
      8.25, 6.55
    )
    ON CONFLICT (customer_id, service_id, zone_name, weight_class_name)
    DO UPDATE SET price = 8.25, price_sub = 6.55;
  END IF;

  -- DPD-18 Saturday 10.30 — Mainland £18.70 / Sub £15.15
  IF v_svc_18 IS NOT NULL THEN
    INSERT INTO customer_rates (
      customer_id, courier_id, courier_code, courier_name,
      service_id, service_code, service_name,
      zone_id, zone_name, weight_class_id, weight_class_name,
      price, price_sub
    ) VALUES (
      v_customer_id, v_courier_id, 'DPD', 'DPD',
      v_svc_18, 'DPD-18', 'DPD Saturday 10.30',
      0, 'Mainland', 0, 'parcel',
      18.70, 15.15
    )
    ON CONFLICT (customer_id, service_id, zone_name, weight_class_name)
    DO UPDATE SET price = 18.70, price_sub = 15.15;
  END IF;

  -- DPD-17 Saturday 12.00 — Mainland £15.30 / Sub £11.65
  IF v_svc_17 IS NOT NULL THEN
    INSERT INTO customer_rates (
      customer_id, courier_id, courier_code, courier_name,
      service_id, service_code, service_name,
      zone_id, zone_name, weight_class_id, weight_class_name,
      price, price_sub
    ) VALUES (
      v_customer_id, v_courier_id, 'DPD', 'DPD',
      v_svc_17, 'DPD-17', 'DPD Saturday 12.00',
      0, 'Mainland', 0, 'parcel',
      15.30, 11.65
    )
    ON CONFLICT (customer_id, service_id, zone_name, weight_class_name)
    DO UPDATE SET price = 15.30, price_sub = 11.65;
  END IF;

  -- DPD-16 Saturday — Mainland £7.25 / Sub £5.75
  IF v_svc_16 IS NOT NULL THEN
    INSERT INTO customer_rates (
      customer_id, courier_id, courier_code, courier_name,
      service_id, service_code, service_name,
      zone_id, zone_name, weight_class_id, weight_class_name,
      price, price_sub
    ) VALUES (
      v_customer_id, v_courier_id, 'DPD', 'DPD',
      v_svc_16, 'DPD-16', 'DPD Saturday',
      0, 'Mainland', 0, 'parcel',
      7.25, 5.75
    )
    ON CONFLICT (customer_id, service_id, zone_name, weight_class_name)
    DO UPDATE SET price = 7.25, price_sub = 5.75;
  END IF;

  -- DPD-01 Sunday — Mainland £8.25 / Sub £5.75
  IF v_svc_01 IS NOT NULL THEN
    INSERT INTO customer_rates (
      customer_id, courier_id, courier_code, courier_name,
      service_id, service_code, service_name,
      zone_id, zone_name, weight_class_id, weight_class_name,
      price, price_sub
    ) VALUES (
      v_customer_id, v_courier_id, 'DPD', 'DPD',
      v_svc_01, 'DPD-01', 'DPD Sunday',
      0, 'Mainland', 0, 'parcel',
      8.25, 5.75
    )
    ON CONFLICT (customer_id, service_id, zone_name, weight_class_name)
    DO UPDATE SET price = 8.25, price_sub = 5.75;
  END IF;

  -- ── Offshore / out-of-area rates (flat per parcel, no sub price) ───────────

  -- DPD-12 Northern Ireland (Next Day) — £32.40
  IF v_svc_12 IS NOT NULL THEN
    INSERT INTO customer_rates (
      customer_id, courier_id, courier_code, courier_name,
      service_id, service_code, service_name,
      zone_id, zone_name, weight_class_id, weight_class_name,
      price, price_sub
    ) VALUES (
      v_customer_id, v_courier_id, 'DPD', 'DPD',
      v_svc_12, 'DPD-12', 'DPD Next Day',
      0, 'Northern Ireland', 0, 'parcel',
      32.40, NULL
    )
    ON CONFLICT (customer_id, service_id, zone_name, weight_class_name)
    DO UPDATE SET price = 32.40, price_sub = NULL;
  END IF;

  -- DPD-12 Highlands and Islands — £11.19
  IF v_svc_12 IS NOT NULL THEN
    INSERT INTO customer_rates (
      customer_id, courier_id, courier_code, courier_name,
      service_id, service_code, service_name,
      zone_id, zone_name, weight_class_id, weight_class_name,
      price, price_sub
    ) VALUES (
      v_customer_id, v_courier_id, 'DPD', 'DPD',
      v_svc_12, 'DPD-12', 'DPD Next Day',
      0, 'Highlands and Islands', 0, 'parcel',
      11.19, NULL
    )
    ON CONFLICT (customer_id, service_id, zone_name, weight_class_name)
    DO UPDATE SET price = 11.19, price_sub = NULL;
  END IF;

  -- DPD-11 Northern Ireland (2Day+) — £10.25
  IF v_svc_11 IS NOT NULL THEN
    INSERT INTO customer_rates (
      customer_id, courier_id, courier_code, courier_name,
      service_id, service_code, service_name,
      zone_id, zone_name, weight_class_id, weight_class_name,
      price, price_sub
    ) VALUES (
      v_customer_id, v_courier_id, 'DPD', 'DPD',
      v_svc_11, 'DPD-11', 'DPD Two Day',
      0, 'Northern Ireland', 0, 'parcel',
      10.25, NULL
    )
    ON CONFLICT (customer_id, service_id, zone_name, weight_class_name)
    DO UPDATE SET price = 10.25, price_sub = NULL;
  END IF;

  -- DPD-11 Scottish Highlands (2Day+) — £11.19
  IF v_svc_11 IS NOT NULL THEN
    INSERT INTO customer_rates (
      customer_id, courier_id, courier_code, courier_name,
      service_id, service_code, service_name,
      zone_id, zone_name, weight_class_id, weight_class_name,
      price, price_sub
    ) VALUES (
      v_customer_id, v_courier_id, 'DPD', 'DPD',
      v_svc_11, 'DPD-11', 'DPD Two Day',
      0, 'Scottish Highlands', 0, 'parcel',
      11.19, NULL
    )
    ON CONFLICT (customer_id, service_id, zone_name, weight_class_name)
    DO UPDATE SET price = 11.19, price_sub = NULL;
  END IF;

  -- DPD-11 Scottish Islands (2Day+) — £11.19
  IF v_svc_11 IS NOT NULL THEN
    INSERT INTO customer_rates (
      customer_id, courier_id, courier_code, courier_name,
      service_id, service_code, service_name,
      zone_id, zone_name, weight_class_id, weight_class_name,
      price, price_sub
    ) VALUES (
      v_customer_id, v_courier_id, 'DPD', 'DPD',
      v_svc_11, 'DPD-11', 'DPD Two Day',
      0, 'Scottish Islands', 0, 'parcel',
      11.19, NULL
    )
    ON CONFLICT (customer_id, service_id, zone_name, weight_class_name)
    DO UPDATE SET price = 11.19, price_sub = NULL;
  END IF;

  -- DPD-11 Isle of Man (2Day+) — £12.80
  IF v_svc_11 IS NOT NULL THEN
    INSERT INTO customer_rates (
      customer_id, courier_id, courier_code, courier_name,
      service_id, service_code, service_name,
      zone_id, zone_name, weight_class_id, weight_class_name,
      price, price_sub
    ) VALUES (
      v_customer_id, v_courier_id, 'DPD', 'DPD',
      v_svc_11, 'DPD-11', 'DPD Two Day',
      0, 'Isle of Man', 0, 'parcel',
      12.80, NULL
    )
    ON CONFLICT (customer_id, service_id, zone_name, weight_class_name)
    DO UPDATE SET price = 12.80, price_sub = NULL;
  END IF;

  -- DPD-11 Channel Islands (2Day+) — £14.25
  IF v_svc_11 IS NOT NULL THEN
    INSERT INTO customer_rates (
      customer_id, courier_id, courier_code, courier_name,
      service_id, service_code, service_name,
      zone_id, zone_name, weight_class_id, weight_class_name,
      price, price_sub
    ) VALUES (
      v_customer_id, v_courier_id, 'DPD', 'DPD',
      v_svc_11, 'DPD-11', 'DPD Two Day',
      0, 'Channel Islands', 0, 'parcel',
      14.25, NULL
    )
    ON CONFLICT (customer_id, service_id, zone_name, weight_class_name)
    DO UPDATE SET price = 14.25, price_sub = NULL;
  END IF;

  -- DPD-11ROI Ireland (2Day) — £9.95
  IF v_svc_11roi IS NOT NULL THEN
    INSERT INTO customer_rates (
      customer_id, courier_id, courier_code, courier_name,
      service_id, service_code, service_name,
      zone_id, zone_name, weight_class_id, weight_class_name,
      price, price_sub
    ) VALUES (
      v_customer_id, v_courier_id, 'DPD', 'DPD',
      v_svc_11roi, 'DPD-11ROI', 'DPD Ireland',
      0, 'Ireland', 0, 'parcel',
      9.95, NULL
    )
    ON CONFLICT (customer_id, service_id, zone_name, weight_class_name)
    DO UPDATE SET price = 9.95, price_sub = NULL;
  END IF;

  RAISE NOTICE 'Migration 245: Work N Wear Direct DPD rates 2026 applied successfully.';

END $$;
