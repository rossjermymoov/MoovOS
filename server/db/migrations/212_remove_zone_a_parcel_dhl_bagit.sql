-- ─── Migration 212 — Remove ONLY "Zone A / Parcel" from DHL Bag It ──────────
--
-- Migration 211 was too broad: it deleted ALL zone_name='Zone A' rows for
-- DHL Bag It services, including legitimate rows like:
--   zone_name='Zone A', weight_class_name='Large Bag'   ← valid, should exist
--   zone_name='Zone A', weight_class_name='Small Bag'   ← valid, should exist
--   zone_name='Zone A', weight_class_name='Medium Bag'  ← valid, should exist
--
-- If 211 already ran those valid rows are gone and affected customers will
-- need their rate cards re-imported to restore Zone A pricing.
--
-- The only row that should never have existed is:
--   zone_name='Zone A', weight_class_name='Parcel'
-- This was inserted by the AI onboarding prompt which used 'Parcel' instead
-- of the correct Bag It weight class name.
--
-- This migration does the correct targeted delete (idempotent if 211 already
-- removed everything).

DO $$
DECLARE
  v_deleted INT := 0;
BEGIN
  DELETE FROM customer_rates
  WHERE  service_code IN ('DHL-1KGC2C', 'DHL-2KGC2C', 'DHL-5KGC2C')
    AND  zone_name         ILIKE 'Zone A'
    AND  weight_class_name ILIKE 'Parcel';

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RAISE NOTICE 'Migration 212: deleted % "Zone A / Parcel" row(s) from DHL Bag It services.', v_deleted;
END $$;
