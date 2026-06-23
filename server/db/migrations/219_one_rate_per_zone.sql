-- ─── Migration 219 — One rate per zone: fix unique constraint ────────────────
--
-- The fundamental rule: a customer has exactly ONE price per (service, zone).
-- weight_class_name is a display label only — it cannot create separate rows.
--
-- The existing unique constraint (customer_id, service_id, zone_name, weight_class_name)
-- wrongly allows e.g. "Mainland · Packet" AND "Mainland · Parcel" to coexist.
-- The correct constraint is (customer_id, service_id, zone_name).
--
-- Step 1: Deduplicate — for each group with multiple rows, keep the best:
--         non-Parcel weight class preferred; then highest price.
-- Step 2: Drop old constraint, add new one.

DO $$
DECLARE
  v_deleted INT := 0;
BEGIN
  -- Step 1: Delete all duplicate rows, keeping the best per (customer, service, zone)
  DELETE FROM customer_rates
  WHERE id NOT IN (
    SELECT DISTINCT ON (customer_id, service_id, zone_name) id
    FROM customer_rates
    ORDER BY
      customer_id,
      service_id,
      zone_name,
      -- Prefer non-Parcel weight class (Packet, Large Bagit, etc.)
      CASE WHEN weight_class_name ILIKE 'Parcel' THEN 1 ELSE 0 END ASC,
      -- Then prefer rows that have a price set
      CASE WHEN price IS NULL OR price = 0 THEN 1 ELSE 0 END ASC,
      -- Then prefer highest price (most specific)
      price DESC NULLS LAST
  );

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RAISE NOTICE 'Migration 219: deleted % duplicate zone rate row(s).', v_deleted;

  -- Step 2: Drop the old four-column unique constraint
  ALTER TABLE customer_rates
    DROP CONSTRAINT IF EXISTS customer_rates_unique_name;

  -- Step 3: Add the correct two-column unique constraint
  ALTER TABLE customer_rates
    ADD CONSTRAINT customer_rates_unique_zone
    UNIQUE (customer_id, service_id, zone_name);

  RAISE NOTICE 'Migration 219: unique constraint changed to (customer_id, service_id, zone_name).';
END $$;
