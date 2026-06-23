-- ─── Migration 216 — Fill missing carrier zones in customer_rates ────────────
--
-- When AI onboarding imports a rate card it extracts only the zones listed
-- on the document (often just Zone A). If the carrier has Zone A, B, C, D
-- defined, the customer ends up missing B, C, D.
--
-- For each customer that has at least one rate for a service, this migration
-- inserts rows for any carrier zones not yet covered, copying the price from
-- the customer's cheapest existing zone rate for that service (Zone A proxy).
--
-- ON CONFLICT DO NOTHING means existing rows are never changed.

DO $$
DECLARE
  v_inserted INT := 0;
  v_count    INT;
BEGIN
  INSERT INTO customer_rates
    (customer_id, courier_id, courier_code, courier_name,
     service_id, service_code, service_name,
     zone_name, weight_class_name,
     min_weight_kg, max_weight_kg,
     price, price_sub)
  SELECT
    tmpl.customer_id,
    tmpl.courier_id,
    tmpl.courier_code,
    tmpl.courier_name,
    tmpl.service_id,
    tmpl.service_code,
    tmpl.service_name,
    z.name        AS zone_name,
    tmpl.weight_class_name,
    tmpl.min_weight_kg,
    tmpl.max_weight_kg,
    tmpl.price,
    tmpl.price_sub
  FROM zones z
  JOIN courier_services cs ON cs.id = z.courier_service_id
  -- For each customer that already has at least one rate for this service,
  -- use the lowest-priced zone row as the price template
  JOIN LATERAL (
    SELECT cr.*
    FROM customer_rates cr
    WHERE cr.service_id = cs.id
    ORDER BY cr.price ASC NULLS LAST
    LIMIT 1
  ) tmpl ON TRUE
  -- Only insert where this customer doesn't already have a rate for this zone
  WHERE NOT EXISTS (
    SELECT 1 FROM customer_rates cr2
    WHERE  cr2.customer_id = tmpl.customer_id
      AND  cr2.service_id  = tmpl.service_id
      AND  cr2.zone_name   = z.name
  )
  ON CONFLICT (customer_id, service_id, zone_name, weight_class_name) DO NOTHING;

  GET DIAGNOSTICS v_inserted = ROW_COUNT;
  RAISE NOTICE 'Migration 216: inserted % missing zone rate row(s) across all customers.', v_inserted;
END $$;
