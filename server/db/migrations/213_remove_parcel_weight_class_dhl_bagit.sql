-- ─── Migration 213 — Remove all Parcel weight class rows from DHL Bag It ─────
--
-- Migration 211 was already recorded as complete before the correct SQL
-- landed, so it never ran. This migration does the work.
--
-- DHL Bag It services use weight classes 'Small Bag', 'Medium Bag', 'Large Bag'.
-- 'Parcel' is not a valid weight class for these services. AI onboarding
-- incorrectly inserted weight_class_name='Parcel' rows for all zones
-- (Zone A, Zone B, Zone C, Zone D, etc.) across all three Bag It services.
--
-- Delete every customer_rates row for DHL Bag It where weight_class_name='Parcel'.
-- Valid rows (Large Bag, Small Bag, Medium Bag) are untouched.

DO $$
DECLARE
  v_deleted INT := 0;
BEGIN
  DELETE FROM customer_rates
  WHERE  service_code        IN ('DHL-1KGC2C', 'DHL-2KGC2C', 'DHL-5KGC2C')
    AND  weight_class_name ILIKE 'Parcel';

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RAISE NOTICE 'Migration 213: deleted % Parcel row(s) from DHL Bag It services.', v_deleted;
END $$;
