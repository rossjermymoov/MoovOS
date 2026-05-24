-- ─── Migration 220 — Fill missing carrier zones, correctly per customer ───────
--
-- Migration 216 was flawed: its LATERAL join picked ONE template row globally
-- (the cheapest across all customers) and only filled zones for that one customer.
-- Every other customer with missing zones was ignored.
--
-- This migration iterates over every (customer, service) pair that has at least
-- one rate, finds carrier zones they are missing, and inserts them using that
-- CUSTOMER'S OWN cheapest zone rate as the price template.
--
-- Runs after migration 219 which changed the unique constraint to
-- (customer_id, service_id, zone_name), so ON CONFLICT targets that.

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

  -- For every customer+service combination, find missing carrier zones
  -- and use the customer's own cheapest existing zone rate as the template.
  SELECT DISTINCT ON (cr.customer_id, cr.service_id, z.name)
    cr.customer_id,
    cr.courier_id,
    cr.courier_code,
    cr.courier_name,
    cr.service_id,
    cr.service_code,
    cr.service_name,
    z.name            AS zone_name,
    cr.weight_class_name,
    cr.min_weight_kg,
    cr.max_weight_kg,
    cr.price,
    cr.price_sub
  FROM customer_rates cr
  JOIN courier_services cs ON cs.id = cr.service_id
  JOIN zones z             ON z.courier_service_id = cs.id
  WHERE
    -- Only zones this customer is missing
    NOT EXISTS (
      SELECT 1 FROM customer_rates cr2
      WHERE  cr2.customer_id = cr.customer_id
        AND  cr2.service_id  = cr.service_id
        AND  cr2.zone_name   = z.name
    )
  ORDER BY
    cr.customer_id,
    cr.service_id,
    z.name,
    -- Prefer non-Parcel weight class as template
    CASE WHEN cr.weight_class_name ILIKE 'Parcel' THEN 1 ELSE 0 END ASC,
    -- Then prefer rows that have a price
    CASE WHEN cr.price IS NULL OR cr.price = 0 THEN 1 ELSE 0 END ASC,
    cr.price ASC NULLS LAST

  ON CONFLICT (customer_id, service_id, zone_name) DO NOTHING;

  GET DIAGNOSTICS v_inserted = ROW_COUNT;
  RAISE NOTICE 'Migration 220: inserted % missing zone rate row(s) across all customers.', v_inserted;
END $$;
