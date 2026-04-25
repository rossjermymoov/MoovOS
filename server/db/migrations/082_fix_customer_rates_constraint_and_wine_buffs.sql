-- 082_fix_customer_rates_constraint_and_wine_buffs.sql
--
-- Migration 014 tried to drop the old ID-based unique constraint but used the
-- full untruncated name. PostgreSQL silently truncated it to 63 chars, so the
-- DROP CONSTRAINT IF EXISTS was a no-op. Both constraints now exist:
--
--   OLD (still active, causing failures):
--     customer_rates_customer_id_service_id_zone_id_weight_class__key
--     (customer_id, service_id, zone_id, weight_class_id)
--
--   NEW (from migration 014):
--     customer_rates_unique_name
--     (customer_id, service_id, zone_name, weight_class_name)
--
-- Fix: drop the old constraint by its actual DB name (truncated).
-- Then clean up the partial Wine Buffs rate insert from 081 and re-run it.

-- ── Step 1: Drop the old ID-based constraint (try both names to be safe) ────
ALTER TABLE customer_rates
  DROP CONSTRAINT IF EXISTS "customer_rates_customer_id_service_id_zone_id_weight_class__key";

ALTER TABLE customer_rates
  DROP CONSTRAINT IF EXISTS "customer_rates_customer_id_service_id_zone_id_weight_class_id_key";

-- ── Step 2: Ensure the name-based constraint exists ─────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'customer_rates_unique_name'
  ) THEN
    ALTER TABLE customer_rates
      ADD CONSTRAINT customer_rates_unique_name
      UNIQUE (customer_id, service_id, zone_name, weight_class_name);
    RAISE NOTICE '082: added customer_rates_unique_name constraint';
  ELSE
    RAISE NOTICE '082: customer_rates_unique_name already exists — skipping';
  END IF;
END $$;

-- ── Step 3: Wipe any partial Wine Buffs rate rows from the failed 081 run ───
DELETE FROM customer_rates
WHERE customer_id = (
  SELECT id FROM customers WHERE account_number = 'MOOV-0173'
);

-- ── Step 4: Re-seed Wine Buffs DHL rates now that constraint is correct ──────
DO $$
DECLARE
  v_customer_id   UUID;
  v_courier_id    INTEGER;
  v_svc_ndper     INTEGER;
  v_svc_1kg       INTEGER;
  v_svc_2kg       INTEGER;
  v_svc_5kg       INTEGER;
BEGIN
  SELECT id INTO v_customer_id FROM customers WHERE account_number = 'MOOV-0173';
  IF v_customer_id IS NULL THEN
    RAISE NOTICE '082: Wine Buffs (MOOV-0173) not found — skipping rates';
    RETURN;
  END IF;

  SELECT id INTO v_courier_id FROM couriers WHERE UPPER(code) = 'DHL' LIMIT 1;
  SELECT id INTO v_svc_ndper  FROM courier_services WHERE service_code ILIKE 'DHL-NDPER'  LIMIT 1;
  SELECT id INTO v_svc_1kg    FROM courier_services WHERE service_code ILIKE 'DHL-1KGC2C' LIMIT 1;
  SELECT id INTO v_svc_2kg    FROM courier_services WHERE service_code ILIKE 'DHL-2KGC2C' LIMIT 1;
  SELECT id INTO v_svc_5kg    FROM courier_services WHERE service_code ILIKE 'DHL-5KGC2C' LIMIT 1;

  -- DHL Next Day (DHL-NDPER): Zone A/B = £5.60/£3.90 sub, Zone C/D = £15.00/£8.00 sub
  INSERT INTO customer_rates (
    customer_id, courier_id, courier_code, courier_name,
    service_id, service_code, service_name,
    zone_id, zone_name, weight_class_id, weight_class_name,
    price, price_sub
  ) VALUES
    (v_customer_id, v_courier_id, 'DHL', 'DHL',
     COALESCE(v_svc_ndper, 0), 'DHL-NDPER', 'DHL Next Day Perishable',
     0, 'Zone A', 0, 'Parcel', 5.60, 3.90),
    (v_customer_id, v_courier_id, 'DHL', 'DHL',
     COALESCE(v_svc_ndper, 0), 'DHL-NDPER', 'DHL Next Day Perishable',
     0, 'Zone B', 0, 'Parcel', 5.60, 3.90),
    (v_customer_id, v_courier_id, 'DHL', 'DHL',
     COALESCE(v_svc_ndper, 0), 'DHL-NDPER', 'DHL Next Day Perishable',
     0, 'Zone C', 0, 'Parcel', 15.00, 8.00),
    (v_customer_id, v_courier_id, 'DHL', 'DHL',
     COALESCE(v_svc_ndper, 0), 'DHL-NDPER', 'DHL Next Day Perishable',
     0, 'Zone D', 0, 'Parcel', 15.00, 8.00)
  ON CONFLICT (customer_id, service_id, zone_name, weight_class_name)
  DO UPDATE SET price = EXCLUDED.price, price_sub = EXCLUDED.price_sub;

  -- DHL Small BagIt (1kg): £4.20 — Zones A & B
  IF v_svc_1kg IS NOT NULL THEN
    INSERT INTO customer_rates (
      customer_id, courier_id, courier_code, courier_name,
      service_id, service_code, service_name,
      zone_id, zone_name, weight_class_id, weight_class_name,
      price, price_sub
    ) VALUES
      (v_customer_id, v_courier_id, 'DHL', 'DHL',
       v_svc_1kg, 'DHL-1KGC2C', 'DHL Small BagIt',
       0, 'Zone A', 0, 'Small BagIt', 4.20, NULL),
      (v_customer_id, v_courier_id, 'DHL', 'DHL',
       v_svc_1kg, 'DHL-1KGC2C', 'DHL Small BagIt',
       0, 'Zone B', 0, 'Small BagIt', 4.20, NULL)
    ON CONFLICT (customer_id, service_id, zone_name, weight_class_name)
    DO UPDATE SET price = EXCLUDED.price, price_sub = NULL;
  END IF;

  -- DHL Medium BagIt (2kg): £4.30 — Zones A & B
  IF v_svc_2kg IS NOT NULL THEN
    INSERT INTO customer_rates (
      customer_id, courier_id, courier_code, courier_name,
      service_id, service_code, service_name,
      zone_id, zone_name, weight_class_id, weight_class_name,
      price, price_sub
    ) VALUES
      (v_customer_id, v_courier_id, 'DHL', 'DHL',
       v_svc_2kg, 'DHL-2KGC2C', 'DHL Medium BagIt',
       0, 'Zone A', 0, 'Medium BagIt', 4.30, NULL),
      (v_customer_id, v_courier_id, 'DHL', 'DHL',
       v_svc_2kg, 'DHL-2KGC2C', 'DHL Medium BagIt',
       0, 'Zone B', 0, 'Medium BagIt', 4.30, NULL)
    ON CONFLICT (customer_id, service_id, zone_name, weight_class_name)
    DO UPDATE SET price = EXCLUDED.price, price_sub = NULL;
  END IF;

  -- DHL Large BagIt (5kg): £4.40 — Zones A & B
  IF v_svc_5kg IS NOT NULL THEN
    INSERT INTO customer_rates (
      customer_id, courier_id, courier_code, courier_name,
      service_id, service_code, service_name,
      zone_id, zone_name, weight_class_id, weight_class_name,
      price, price_sub
    ) VALUES
      (v_customer_id, v_courier_id, 'DHL', 'DHL',
       v_svc_5kg, 'DHL-5KGC2C', 'DHL Large BagIt',
       0, 'Zone A', 0, 'Large BagIt', 4.40, NULL),
      (v_customer_id, v_courier_id, 'DHL', 'DHL',
       v_svc_5kg, 'DHL-5KGC2C', 'DHL Large BagIt',
       0, 'Zone B', 0, 'Large BagIt', 4.40, NULL)
    ON CONFLICT (customer_id, service_id, zone_name, weight_class_name)
    DO UPDATE SET price = EXCLUDED.price, price_sub = NULL;
  END IF;

  -- Ensure DHL carrier link is active
  INSERT INTO customer_carrier_links (customer_id, courier_id, carrier_rate_card_id)
  SELECT
    v_customer_id,
    c.id,
    (SELECT id FROM carrier_rate_cards WHERE courier_id = c.id AND is_master = true LIMIT 1)
  FROM couriers c WHERE UPPER(c.code) = 'DHL'
  ON CONFLICT (customer_id, courier_id) DO NOTHING;

  RAISE NOTICE '082: Wine Buffs rates seeded — customer_id=%', v_customer_id;
END $$;
