-- ─── Migration 222 — Remove Parcel rows matched by zone_name only ────────────
--
-- Every previous migration (217–221) correlated Parcel rows to non-Parcel rows
-- using service_id, service_code, or service_name. All deleted 0 rows.
-- This means the Parcel rows and Packet rows cannot be correlated by any service
-- field — they are either NULL, empty, or different in the Parcel rows.
--
-- This migration ignores service fields entirely.
-- Rule: if a customer has a non-Parcel row with the same zone_name (e.g. Mainland·Packet),
-- then any Parcel row for the same customer+zone_name is a duplicate and must go.

DO $$
DECLARE
  v_deleted INT := 0;
BEGIN
  RAISE NOTICE 'Migration 222: deleting Parcel rows where same customer has non-Parcel row with same zone_name...';

  DELETE FROM customer_rates
  WHERE weight_class_name ILIKE 'Parcel'
    AND EXISTS (
      SELECT 1 FROM customer_rates cr2
      WHERE cr2.customer_id = customer_rates.customer_id
        AND LOWER(cr2.zone_name) = LOWER(customer_rates.zone_name)
        AND cr2.weight_class_name NOT ILIKE 'Parcel'
        AND cr2.id != customer_rates.id
    );

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RAISE NOTICE 'Migration 222 pass1: deleted % Parcel row(s) matched by zone_name.', v_deleted;

  -- Pass 2: handle Parcel rows where zone_name is NULL or empty.
  -- If the customer has any non-Parcel rows at all, remove these orphaned Parcel rows.
  DELETE FROM customer_rates
  WHERE weight_class_name ILIKE 'Parcel'
    AND (zone_name IS NULL OR TRIM(zone_name) = '')
    AND EXISTS (
      SELECT 1 FROM customer_rates cr2
      WHERE cr2.customer_id = customer_rates.customer_id
        AND cr2.weight_class_name NOT ILIKE 'Parcel'
        AND cr2.id != customer_rates.id
    );

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RAISE NOTICE 'Migration 222 pass2: deleted % Parcel row(s) with null/empty zone_name.', v_deleted;
END $$;
