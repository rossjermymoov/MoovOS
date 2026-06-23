-- ─── Migration 226 — Fill missing carrier zones (service_code join) ───────────
--
-- Migration 220 filled missing zones but joined on service_id (integer) which
-- is unreliable — some customer_rates rows have a different service_id from
-- courier_services for the same logical service. This caused it to silently
-- skip many customers.
--
-- This migration joins on service_code (text) instead, making it resilient to
-- service_id mismatches. For every (customer, service_code) that has any rates,
-- it finds carrier zones they are missing and inserts them using that customer's
-- own cheapest non-zero rate as the price template.
--
-- Safe to re-run: the NOT EXISTS check prevents double-insertion.

DO $$
DECLARE
  v_inserted INT := 0;
BEGIN
  INSERT INTO customer_rates
    (customer_id, courier_id, courier_code, courier_name,
     service_id, service_code, service_name,
     zone_name, weight_class_name,
     min_weight_kg, max_weight_kg,
     price, price_sub)

  SELECT DISTINCT ON (cr.customer_id, LOWER(cr.service_code), z.name)
    cr.customer_id,
    c.id          AS courier_id,
    c.code        AS courier_code,
    c.name        AS courier_name,
    cs.id         AS service_id,
    cs.service_code,
    cr.service_name,
    z.name        AS zone_name,
    cr.weight_class_name,
    cr.min_weight_kg,
    cr.max_weight_kg,
    cr.price,
    cr.price_sub

  FROM customer_rates cr
  JOIN courier_services cs ON LOWER(cs.service_code) = LOWER(cr.service_code)
  JOIN couriers c          ON c.id = cs.courier_id
  JOIN zones z             ON z.courier_service_id = cs.id

  WHERE
    -- Only zones this customer is missing for this service_code
    NOT EXISTS (
      SELECT 1 FROM customer_rates cr2
      WHERE  cr2.customer_id              = cr.customer_id
        AND  LOWER(cr2.service_code)      = LOWER(cr.service_code)
        AND  LOWER(cr2.zone_name)         = LOWER(z.name)
    )

  ORDER BY
    cr.customer_id,
    LOWER(cr.service_code),
    z.name,
    -- Prefer non-Parcel weight class as template
    CASE WHEN cr.weight_class_name ILIKE 'Parcel' THEN 1 ELSE 0 END ASC,
    -- Prefer rows that have a real price
    CASE WHEN cr.price IS NULL OR cr.price = 0 THEN 1 ELSE 0 END ASC,
    cr.price ASC NULLS LAST;

  GET DIAGNOSTICS v_inserted = ROW_COUNT;
  RAISE NOTICE 'Migration 226: inserted % missing zone row(s) across all customers and services.', v_inserted;
END $$;
