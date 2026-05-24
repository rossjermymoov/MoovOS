-- ─── Migration 223 — Restore Yodel Medium 48 Mainland zone ──────────────────
--
-- Migration 222 used zone_name-only matching which was too broad.
-- Any customer that had Yodel Mini 48 (Mainland·Packet) caused Yodel Medium 48's
-- Mainland·Parcel to be deleted too — because "Mainland" matched across services.
-- Yodel Medium 48 is mainland-only, so those customers now have no Medium 48 rates.
--
-- This migration re-adds a Mainland·Packet row (price NULL) for every customer
-- that has any AGL/Yodel service rates but is missing Yodel Medium 48 entirely.
-- Prices are left NULL for manual entry.

DO $$
DECLARE
  rec        RECORD;
  v_svc      RECORD;
  v_courier  RECORD;
  v_inserted INT := 0;
  v_rows     INT := 0;
BEGIN
  -- Find the Yodel Medium 48 service (AGL courier, service_name contains 'medium')
  SELECT cs.id, cs.service_code, cs.service_name, cs.courier_id
  INTO   v_svc
  FROM   courier_services cs
  WHERE  cs.service_name ILIKE '%medium%'
    AND  EXISTS (
           SELECT 1 FROM couriers c
           WHERE c.id = cs.courier_id
             AND (c.name ILIKE '%AGL%' OR c.name ILIKE '%Yodel%')
         )
  LIMIT 1;

  IF v_svc.id IS NULL THEN
    RAISE NOTICE 'Migration 223: could not find AGL/Yodel Medium service — skipping.';
    RETURN;
  END IF;

  RAISE NOTICE 'Migration 223: found service "%" (%) id=%', v_svc.service_name, v_svc.service_code, v_svc.id;

  -- Get courier display fields
  SELECT code, name INTO v_courier
  FROM   couriers
  WHERE  id = v_svc.courier_id;

  -- For every customer that has any AGL/Yodel rates but no Medium 48 rates, restore Mainland
  FOR rec IN
    SELECT DISTINCT cr.customer_id
    FROM   customer_rates cr
    JOIN   courier_services cs ON cs.service_code = cr.service_code
    JOIN   couriers c          ON c.id = cs.courier_id
    WHERE  (c.name ILIKE '%AGL%' OR c.name ILIKE '%Yodel%')
      AND  NOT EXISTS (
             SELECT 1 FROM customer_rates cr2
             WHERE  cr2.customer_id = cr.customer_id
               AND  cr2.service_id  = v_svc.id
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
      v_courier.code,
      v_courier.name,
      v_svc.id,
      v_svc.service_code,
      v_svc.service_name,
      'Mainland',
      'Packet',
      NULL, NULL,
      NULL, NULL
    WHERE NOT EXISTS (
      SELECT 1 FROM customer_rates x
      WHERE  x.customer_id = rec.customer_id
        AND  x.service_id  = v_svc.id
        AND  x.zone_name   = 'Mainland'
    );

    GET DIAGNOSTICS v_rows = ROW_COUNT;
    v_inserted := v_inserted + v_rows;
  END LOOP;

  RAISE NOTICE 'Migration 223: restored Mainland·Packet for % customer(s) missing Yodel Medium 48.', v_inserted;
END $$;
