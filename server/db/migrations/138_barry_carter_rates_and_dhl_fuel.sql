-- Migration 138: Barry Carter rates migration + DHL domestic fuel group
--
-- Two fixes:
--
-- 1. MIGRATE customer_pricing → customer_rates (Barry Carter Motor Products, MOOV-0113)
--    His sell prices are in the legacy customer_pricing table. The current
--    pricing engine only looks in customer_service_pricing and customer_rates,
--    so reprice returns "no matching rate" and no sell price is ever written.
--    This copies his fixed-price rows into customer_rates so the engine finds them.
--    Only 'fixed' method rows are migrated (markup_pct/margin_pct need carrier
--    cost to derive a price — skip those and let them be entered via the UI).
--
-- 2. DHL DOMESTIC FUEL GROUP
--    DHL courier_services currently have fuel_group_id = NULL, so no fuel
--    surcharge is ever applied to DHL shipments (pricingEngine.js skips fuel
--    when fuelGroupId is null). This creates a "Domestic" fuel group for DHL
--    and links all domestic DHL services to it.
--
--    Default rates: 9.5% cost (what DHL charges us), 9.5% sell (what we charge
--    customers). Update the exact rates via Billing Settings → Fuel Groups.
--    International services (DHLPCUK-101, DHLPCUK-204, DHL-NDPER) are excluded
--    and can be linked to a separate fuel group as needed.

DO $$
DECLARE
  v_customer_id    UUID;
  v_dhl_courier_id INTEGER;
  v_fuel_group_id  INTEGER;
  v_rows_migrated  INTEGER;
BEGIN

  -- ── 1. Barry Carter: customer_pricing → customer_rates ──────────────────────

  SELECT id INTO v_customer_id
  FROM customers WHERE account_number = 'MOOV-0113';

  IF v_customer_id IS NULL THEN
    RAISE NOTICE 'Barry Carter (MOOV-0113): customer not found — rates migration skipped';
  ELSE
    INSERT INTO customer_rates
      (customer_id,
       courier_id, courier_code, courier_name,
       service_id, service_code, service_name,
       zone_id, zone_name,
       weight_class_id, weight_class_name,
       price,
       min_weight_kg, max_weight_kg)
    SELECT
      cp.customer_id,
      cs.courier_id,
      c.code                AS courier_code,
      c.name                AS courier_name,
      cs.id                 AS service_id,
      cs.service_code,
      cs.name               AS service_name,
      0                     AS zone_id,   -- 0 = manually created, no DC zone FK needed
      z.name                AS zone_name,
      0                     AS weight_class_id,
      CASE
        WHEN cp.min_weight_kg IS NULL AND cp.max_weight_kg IS NULL
          THEN 'All weights'
        WHEN cp.min_weight_kg IS NULL
          THEN '0–' || TRIM(TO_CHAR(cp.max_weight_kg, 'FM999990.999')) || ' kg'
        WHEN cp.max_weight_kg IS NULL
          THEN TRIM(TO_CHAR(cp.min_weight_kg, 'FM999990.999')) || '+ kg'
        ELSE TRIM(TO_CHAR(cp.min_weight_kg, 'FM999990.999'))
             || '–'
             || TRIM(TO_CHAR(cp.max_weight_kg, 'FM999990.999'))
             || ' kg'
      END                   AS weight_class_name,
      cp.fixed_price        AS price,
      cp.min_weight_kg,
      cp.max_weight_kg
    FROM  customer_pricing cp
    JOIN  courier_services cs ON cs.id = cp.courier_service_id
    JOIN  couriers         c  ON c.id  = cs.courier_id
    JOIN  zones            z  ON z.id  = cp.zone_id
    WHERE cp.customer_id    = v_customer_id
      AND cp.pricing_method = 'fixed'
      AND cp.fixed_price    IS NOT NULL
    ON CONFLICT (customer_id, service_id, zone_name, weight_class_name) DO NOTHING;

    GET DIAGNOSTICS v_rows_migrated = ROW_COUNT;
    RAISE NOTICE 'Barry Carter (MOOV-0113): % rows inserted into customer_rates (ON CONFLICT DO NOTHING for duplicates)', v_rows_migrated;
  END IF;

  -- ── 2. DHL domestic fuel group ────────────────────────────────────────────

  SELECT id INTO v_dhl_courier_id
  FROM couriers WHERE UPPER(code) = 'DHL' LIMIT 1;

  IF v_dhl_courier_id IS NULL THEN
    RAISE NOTICE 'DHL courier not found — fuel group setup skipped';
  ELSE

    -- Create the fuel group if it does not already exist
    SELECT id INTO v_fuel_group_id
    FROM fuel_groups
    WHERE courier_id = v_dhl_courier_id
      AND LOWER(name) = 'domestic'
    LIMIT 1;

    IF v_fuel_group_id IS NULL THEN
      INSERT INTO fuel_groups
        (courier_id, name, fuel_surcharge_pct, standard_sell_pct)
      VALUES
        (v_dhl_courier_id, 'Domestic', 9.5, 9.5)
      RETURNING id INTO v_fuel_group_id;
      RAISE NOTICE 'DHL Domestic fuel group created (id=%). IMPORTANT: verify rates via Billing Settings.', v_fuel_group_id;
    ELSE
      RAISE NOTICE 'DHL Domestic fuel group already exists (id=%) — no changes to rates.', v_fuel_group_id;
    END IF;

    -- Link DHL domestic services that currently have no fuel group.
    -- Excluded: international air (101), international road (204), perishable (NDPER).
    UPDATE courier_services
    SET    fuel_group_id = v_fuel_group_id,
           updated_at    = NOW()
    WHERE  courier_id    = v_dhl_courier_id
      AND  fuel_group_id IS NULL
      AND  service_code  NOT ILIKE 'DHL-NDPER'
      AND  service_code  NOT ILIKE 'DHLPCUK-101'
      AND  service_code  NOT ILIKE 'DHLPCUK-204';

    RAISE NOTICE 'DHL domestic courier_services linked to fuel group %.',  v_fuel_group_id;

  END IF;

END $$;
