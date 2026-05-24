-- ─── Migration 217 — Remove 'Parcel' weight class rows where a real weight ────
--                     class already exists for the same zone
--
-- AI onboarding defaults to weight_class_name='Parcel' for all rates.
-- Services like AGL Yodel Mini 48 already have rates with the correct carrier
-- weight class (e.g. 'Packet'). This leaves duplicate rows per zone:
--   Mainland · Packet  ← correct, manually imported
--   Mainland · Parcel  ← wrong, created by AI
--
-- Rules (mirrors migration 210 logic for FlatRate):
--   1. Where a group (customer_id, service_id, zone_name) has BOTH a 'Parcel'
--      row AND at least one non-Parcel row → DELETE the 'Parcel' row.
--      The real row already exists.
--
--   2. Where a group has ONLY a 'Parcel' row → leave it alone.
--      'Parcel' is the best label available.

DO $$
DECLARE
  v_deleted INT := 0;
BEGIN
  DELETE FROM customer_rates
  WHERE  weight_class_name ILIKE 'Parcel'
    AND  EXISTS (
           SELECT 1 FROM customer_rates cr2
           WHERE  cr2.customer_id       = customer_rates.customer_id
             AND  cr2.service_id        = customer_rates.service_id
             AND  cr2.zone_name         = customer_rates.zone_name
             AND  cr2.weight_class_name NOT ILIKE 'Parcel'
         );

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RAISE NOTICE 'Migration 217: deleted % duplicate Parcel row(s) where a real weight class existed.', v_deleted;
END $$;
