-- ─── Migration 223 — Restore Yodel Medium 48 Mainland zone ──────────────────
--
-- Migration 222 used zone_name-only matching which was too broad.
-- Any customer that had Yodel Mini 48 (Mainland·Packet) caused Yodel Medium 48's
-- Mainland·Parcel to be deleted too — because "Mainland" matched across services.
-- Yodel Medium 48 is mainland-only, so those customers now have no Medium 48 rates.
--
-- Service info is read from customer_rates (customers not affected by mig 222
-- will still have their Medium rows). courier_services has no service_name column.
--
-- Prices are left NULL for manual entry.

DO $$
DECLARE
  rec        RECORD;
  v_svc      RECORD;
  v_inserted INT := 0;
  v_rows     INT := 0;
BEGIN
  -- Find Medium 48 service details from existing customer_rates rows
  -- (only customers who did NOT have Mini 48 are unaffected and still have rows)
  SELECT DISTINCT ON (cr.service_id)
    cr.service_id,
    cr.service_code,
    cr.service_name,
    cr.courier_id,
    cr.courier_code,
    cr.courier_name
  INTO v_svc
  FROM customer_rates cr
  WHERE cr.service_name ILIKE '%medium%'
    AND (
      cr.courier_name ILIKE '%AGL%' OR cr.courier_name ILIKE '%Yodel%'
      OR cr.courier_code ILIKE '%AGL%'
    )
  ORDER BY cr.service_id
  LIMIT 1;

  IF v_svc.service_id IS NULL THEN
    RAISE NOTICE 'Migration 223: no AGL/Yodel Medium rows found in customer_rates — nothing to restore.';
    RETURN;
  END IF;

  RAISE NOTICE 'Migration 223: found service "%" (%) id=%',
    v_svc.service_name, v_svc.service_code, v_svc.service_id;

  -- For every customer that has any AGL/Yodel rates but no Medium 48 rates, restore Mainland
  FOR rec IN
    SELECT DISTINCT cr.customer_id
    FROM   customer_rates cr
    WHERE  (cr.courier_name ILIKE '%AGL%' OR cr.courier_name ILIKE '%Yodel%'
            OR cr.courier_code ILIKE '%AGL%')
      AND  NOT EXISTS (
             SELECT 1 FROM customer_rates cr2
             WHERE  cr2.customer_id = cr.customer_id
               AND  cr2.service_id  = v_svc.service_id
           )
  LOOP
    INSERT INTO customer_rates
      (customer_id, courier_id, courier_code, courier_name,
       service_id,  service_code, service_name,
       zone_name,   weight_class_name,
       min_weight_kg, max_weight_kg,
       price, price_sub)
    SELECT
      rec.customer_id,
      v_svc.courier_id,
      v_svc.courier_code,
      v_svc.courier_name,
      v_svc.service_id,
      v_svc.service_code,
      v_svc.service_name,
      'Mainland',
      'Packet',
      NULL, NULL,
      0, NULL
    WHERE NOT EXISTS (
      SELECT 1 FROM customer_rates x
      WHERE  x.customer_id = rec.customer_id
        AND  x.service_id  = v_svc.service_id
        AND  x.zone_name   = 'Mainland'
    );

    GET DIAGNOSTICS v_rows = ROW_COUNT;
    v_inserted := v_inserted + v_rows;
  END LOOP;

  RAISE NOTICE 'Migration 223: restored Mainland·Packet for % customer(s) missing Yodel Medium 48.', v_inserted;
END $$;
