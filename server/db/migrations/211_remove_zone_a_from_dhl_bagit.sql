-- ─── Migration 211 — Remove spurious "Zone A" from DHL Bag It services ─────
--
-- The AI onboarding process incorrectly inserted a "Zone A" row into
-- customer_rates for every customer across all three DHL Bag It services:
--   DHL-1KGC2C  (Small Bag It)
--   DHL-2KGC2C  (Medium Bag It)
--   DHL-5KGC2C  (Large Bag It)
--
-- "Zone A" does not exist in the carrier zone structure for these services.
-- DHL Bag It only has "Zone B". All Zone A rows are deleted for all customers.

DO $$
DECLARE
  v_deleted INT := 0;
BEGIN
  DELETE FROM customer_rates
  WHERE  service_code IN ('DHL-1KGC2C', 'DHL-2KGC2C', 'DHL-5KGC2C')
    AND  zone_name ILIKE 'Zone A';

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RAISE NOTICE 'Migration 211: deleted % Zone A row(s) from DHL Bag It services.', v_deleted;
END $$;
