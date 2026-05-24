-- ─── Migration 211 — Remove "Zone A / Parcel" from DHL Bag It services ──────
--
-- The AI onboarding process incorrectly inserted a row with weight_class_name
-- = 'Parcel' into customer_rates for DHL Bag It services. The correct weight
-- class names for these services are 'Small Bag', 'Medium Bag', 'Large Bag'.
--
-- Only delete rows where zone_name = 'Zone A' AND weight_class = 'Parcel'.
-- Zone A with a correct Bag weight class is valid and must not be touched.
--
-- Affected services:
--   DHL-1KGC2C  (Small Bag It)
--   DHL-2KGC2C  (Medium Bag It)
--   DHL-5KGC2C  (Large Bag It)

DO $$
DECLARE
  v_deleted INT := 0;
BEGIN
  DELETE FROM customer_rates
  WHERE  service_code        IN ('DHL-1KGC2C', 'DHL-2KGC2C', 'DHL-5KGC2C')
    AND  zone_name         ILIKE 'Zone A'
    AND  weight_class_name ILIKE 'Parcel';

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RAISE NOTICE 'Migration 211: deleted % "Zone A / Parcel" row(s) from DHL Bag It services.', v_deleted;
END $$;
