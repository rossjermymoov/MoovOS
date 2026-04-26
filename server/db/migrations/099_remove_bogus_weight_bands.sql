-- -----------------------------------------------------------------------------
-- Migration 099 — Remove bogus weight bands with max_weight_kg >= 999
--
-- Migration 089 backfilled dc_weight_classes from customer_rates.  Where no
-- matching weight_bands carrier row existed for a given service, some entries
-- were created with nonsensical upper bounds (e.g. 0–99999 kg).  These rows
-- are meaningless and should not appear in the carrier management UI or be
-- used in any billing lookup.
--
-- This migration deletes any dc_weight_classes rows where max_weight_kg >= 999,
-- and any weight_bands rows in the new carrier model with the same condition.
-- The legitimate DHL domestic Parcel band is 0–30.01 kg and was correctly
-- inserted by migration 098.
-- -----------------------------------------------------------------------------

BEGIN;

-- Remove bogus dc_weight_classes rows
DELETE FROM dc_weight_classes
WHERE max_weight_kg >= 999;

-- Remove bogus weight_bands rows in the new carrier model
DELETE FROM weight_bands
WHERE max_weight_kg >= 999;

DO $$
DECLARE v INT;
BEGIN
  GET DIAGNOSTICS v = ROW_COUNT;
  RAISE NOTICE 'Migration 099 complete — % bogus weight band row(s) removed.', v;
END $$;

COMMIT;
