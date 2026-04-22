-- 036_price_europa_charges.sql
-- Directly price all unpriced charges for Europa using their customer_rates.
-- Matches on service_code + zone_name from the shipment data already stored.
-- For flat-rate services (weight_class_name = 'Parcel' with no numeric bounds),
-- zone is resolved via zone_postcode_rules using the shipment's postcode.

DO $$
DECLARE
  v_customer_id   UUID;
  v_updated       INTEGER := 0;
  v_skipped       INTEGER := 0;
  rec             RECORD;
  v_price         NUMERIC(10,4);
  v_zone_name     TEXT;
  v_outward       TEXT;
BEGIN
  -- Find Europa
  SELECT id INTO v_customer_id
  FROM customers
  WHERE dc_customer_id = 'Europa'
     OR LOWER(business_name) LIKE '%europa%'
  ORDER BY CASE WHEN dc_customer_id = 'Europa' THEN 0 ELSE 1 END
  LIMIT 1;

  IF v_customer_id IS NULL THEN
    RAISE NOTICE '036: Europa customer not found';
    RETURN;
  END IF;

  RAISE NOTICE '036: pricing Europa charges, customer_id=%', v_customer_id;

  -- Loop over every unpriced charge for Europa
  FOR rec IN
    SELECT
      c.id         AS charge_id,
      c.parcel_qty,
      s.dc_service_id,
      s.service_name,
      s.ship_to_postcode,
      s.total_weight_kg,
      s.parcel_count
    FROM charges c
    LEFT JOIN shipments s ON s.id = c.shipment_id
    WHERE c.customer_id = v_customer_id
      AND c.price IS NULL
      AND (c.cancelled IS NULL OR c.cancelled = false)
  LOOP
    v_price := NULL;
    v_zone_name := NULL;

    -- Extract outward code from postcode
    IF rec.ship_to_postcode IS NOT NULL AND rec.ship_to_postcode != '' THEN
      v_outward := UPPER(TRIM(SPLIT_PART(TRIM(rec.ship_to_postcode), ' ', 1)));
    ELSE
      v_outward := NULL;
    END IF;

    -- Try to resolve zone from postcode include rules (exact outward match)
    IF v_outward IS NOT NULL AND rec.dc_service_id IS NOT NULL THEN
      SELECT z.name INTO v_zone_name
      FROM zones z
      JOIN courier_services cs ON cs.id = z.courier_service_id
      JOIN zone_postcode_rules zpr ON zpr.zone_id = z.id
      WHERE cs.service_code ILIKE rec.dc_service_id
        AND zpr.rule_type = 'include'
        AND (
          zpr.postcode_prefix = v_outward
          OR (v_outward LIKE zpr.postcode_prefix || '%' AND zpr.postcode_prefix ~ '^[A-Z]+$')
        )
      LIMIT 1;
    END IF;

    -- If no include match, try catch-all (zone with excludes that don't exclude this postcode)
    IF v_zone_name IS NULL AND v_outward IS NOT NULL AND rec.dc_service_id IS NOT NULL THEN
      SELECT z.name INTO v_zone_name
      FROM zones z
      JOIN courier_services cs ON cs.id = z.courier_service_id
      WHERE cs.service_code ILIKE rec.dc_service_id
        AND EXISTS (
          SELECT 1 FROM zone_postcode_rules zpr2
          WHERE zpr2.zone_id = z.id AND zpr2.rule_type = 'exclude'
        )
        AND NOT EXISTS (
          SELECT 1 FROM zone_postcode_rules zpr3
          WHERE zpr3.zone_id = z.id AND zpr3.rule_type = 'exclude'
            AND (
              zpr3.postcode_prefix = v_outward
              OR (v_outward LIKE zpr3.postcode_prefix || '%' AND zpr3.postcode_prefix ~ '^[A-Z]+$')
            )
        )
      LIMIT 1;
    END IF;

    -- Look up price from customer_rates using zone
    IF v_zone_name IS NOT NULL AND rec.dc_service_id IS NOT NULL THEN
      SELECT cr.price INTO v_price
      FROM customer_rates cr
      WHERE cr.customer_id = v_customer_id
        AND cr.service_code ILIKE rec.dc_service_id
        AND LOWER(cr.zone_name) = LOWER(v_zone_name)
      ORDER BY cr.id
      LIMIT 1;
    END IF;

    -- Fallback: if still no price but we have service match, try cheapest rate for service
    IF v_price IS NULL AND rec.dc_service_id IS NOT NULL THEN
      SELECT cr.price, cr.zone_name INTO v_price, v_zone_name
      FROM customer_rates cr
      WHERE cr.customer_id = v_customer_id
        AND cr.service_code ILIKE rec.dc_service_id
      ORDER BY cr.price ASC
      LIMIT 1;
    END IF;

    IF v_price IS NOT NULL THEN
      UPDATE charges
      SET price      = v_price,
          price_auto = true,
          zone_name  = COALESCE(zone_name, v_zone_name),
          updated_at = NOW()
      WHERE id = rec.charge_id;
      v_updated := v_updated + 1;
    ELSE
      v_skipped := v_skipped + 1;
    END IF;
  END LOOP;

  RAISE NOTICE '036: done — % charges priced, % still unresolved', v_updated, v_skipped;
END $$;
