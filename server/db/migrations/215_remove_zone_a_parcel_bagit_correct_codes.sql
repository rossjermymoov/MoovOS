-- ─── Migration 215 — Remove Zone A · Parcel from DHL Bagit (correct codes) ───
--
-- Previous migrations targeted wrong service codes (DHL-1KGC2C etc).
-- The actual Bagit services are:
--   DHLPCUK-260  DHL Parcel UK Large Bagit
--   DHLPCUK-250  DHL Parcel UK Medium Bagit
--   DHLPUKC-240  DHL Parcel UK Small Bagit
--
-- Each has a spurious 'Zone A · Parcel' row inserted by AI onboarding.
-- Valid rows use weight_class_name = 'Large Bagit', 'Medium Bagit', 'Small Bagit'.
--
-- Two passes: one by service_code, one by service_name on the rate row itself,
-- to catch any rows where service_id join might not resolve correctly.

DO $$
DECLARE
  v_deleted INT := 0;
BEGIN
  -- Pass 1: match by service_code stored on the customer_rates row
  DELETE FROM customer_rates
  WHERE  service_code IN ('DHLPCUK-260', 'DHLPCUK-250', 'DHLPUKC-240')
    AND  weight_class_name ILIKE 'Parcel';

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RAISE NOTICE 'Migration 215 pass 1 (by service_code): deleted % row(s).', v_deleted;

  -- Pass 2: belt-and-suspenders — match by service_name on the row
  DELETE FROM customer_rates
  WHERE  service_name ILIKE '%Bagit%'
    AND  weight_class_name ILIKE 'Parcel';

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RAISE NOTICE 'Migration 215 pass 2 (by service_name): deleted % additional row(s).', v_deleted;
END $$;
