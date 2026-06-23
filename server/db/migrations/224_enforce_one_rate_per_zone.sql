-- ─── Migration 224 — Enforce one rate per zone (constraint fix) ──────────────
--
-- Migration 219 attempted this but almost certainly rolled back because duplicate
-- rows still existed at the time. Migrations 220–223 have since cleaned the data.
-- This migration completes what 219 intended:
--
--   1. Final dedup pass — keep the best row per (customer, service, zone)
--   2. Drop the old four-column constraint if it still exists
--   3. Add the correct two-column constraint (customer_id, service_id, zone_name)
--
-- After this lands, it is impossible to create duplicate zone rows regardless of
-- weight_class_name — one rate per zone, period.

DO $$
DECLARE
  v_deleted INT := 0;
BEGIN
  -- Step 1: Final dedup — for any remaining duplicates, keep the best row
  DELETE FROM customer_rates
  WHERE id NOT IN (
    SELECT DISTINCT ON (customer_id, service_id, zone_name) id
    FROM customer_rates
    ORDER BY
      customer_id,
      service_id,
      zone_name,
      -- Prefer non-Parcel weight class
      CASE WHEN weight_class_name ILIKE 'Parcel' THEN 1 ELSE 0 END ASC,
      -- Prefer rows that have a price
      CASE WHEN price IS NULL OR price = 0 THEN 1 ELSE 0 END ASC,
      price DESC NULLS LAST
  );

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RAISE NOTICE 'Migration 224: removed % residual duplicate row(s).', v_deleted;

  -- Step 2: Drop the old constraint (whichever name it has)
  ALTER TABLE customer_rates
    DROP CONSTRAINT IF EXISTS customer_rates_unique_name;
  ALTER TABLE customer_rates
    DROP CONSTRAINT IF EXISTS customer_rates_unique_zone;

  -- Step 3: Add the correct constraint
  ALTER TABLE customer_rates
    ADD CONSTRAINT customer_rates_unique_zone
    UNIQUE (customer_id, service_id, zone_name);

  RAISE NOTICE 'Migration 224: unique constraint set to (customer_id, service_id, zone_name).';
END $$;
