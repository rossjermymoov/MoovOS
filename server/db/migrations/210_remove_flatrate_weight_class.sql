-- ─── Migration 210 — Remove FlatRate weight class from customer_rates ────────
--
-- 'FlatRate' as a weight_class_name was invented by the AI extraction prompt.
-- It does not exist in the carrier zone/weight-band structure. The correct
-- weight class for single-price zones is 'Parcel'.
--
-- Rules:
--   1. Where a group (customer_id, service_id, zone_name) has BOTH a 'FlatRate'
--      row AND a non-FlatRate row (e.g. 'Parcel') → DELETE the FlatRate row.
--      The real row already exists.
--
--   2. Where a group has ONLY a 'FlatRate' row (no other weight class) →
--      RENAME weight_class_name to 'Parcel' so the customer retains their rate.
--
-- After this migration 'FlatRate' will not exist anywhere in customer_rates.

DO $$
DECLARE
  v_deleted INT := 0;
  v_renamed INT := 0;
BEGIN
  -- Step 1: Delete FlatRate rows where another weight class already exists
  DELETE FROM customer_rates
  WHERE  weight_class_name = 'FlatRate'
    AND  EXISTS (
           SELECT 1 FROM customer_rates cr2
           WHERE  cr2.customer_id       = customer_rates.customer_id
             AND  cr2.service_id        = customer_rates.service_id
             AND  cr2.zone_name         = customer_rates.zone_name
             AND  cr2.weight_class_name != 'FlatRate'
         );

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RAISE NOTICE 'Migration 210 step1: deleted % FlatRate row(s) where a real weight class already existed.', v_deleted;

  -- Step 2: Rename remaining FlatRate rows (no sibling) to 'Parcel'
  UPDATE customer_rates
  SET    weight_class_name = 'Parcel'
  WHERE  weight_class_name = 'FlatRate'
    AND  NOT EXISTS (
           SELECT 1 FROM customer_rates cr2
           WHERE  cr2.customer_id = customer_rates.customer_id
             AND  cr2.service_id  = customer_rates.service_id
             AND  cr2.zone_name   = customer_rates.zone_name
             AND  cr2.id         != customer_rates.id
         );

  GET DIAGNOSTICS v_renamed = ROW_COUNT;
  RAISE NOTICE 'Migration 210 step2: renamed % lone FlatRate row(s) to Parcel.', v_renamed;

  RAISE NOTICE 'Migration 210 complete: FlatRate eliminated from customer_rates.';
END $$;
