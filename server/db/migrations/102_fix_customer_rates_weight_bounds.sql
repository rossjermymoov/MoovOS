-- -----------------------------------------------------------------------------
-- Migration 102 — Fix customer_rates weight bounds
--
-- Background:
--   customer_rates.min_weight_kg / max_weight_kg were originally backfilled
--   from dc_weight_classes (migration 031).  For services where dc_weight_classes
--   only had a catch-all 0–99999 band (e.g. DPD domestic services), every row
--   got max_weight_kg = 99999 — meaningless for numeric weight matching.
--   Migration 099 deleted those catch-all dc_weight_classes rows, but the bogus
--   99999 values remain in customer_rates.
--
-- Fix:
--   For every (service_code, weight_class_name) pair where min/max are either
--   NULL or where max_weight_kg >= 999 (i.e. bogus), re-derive the bounds by:
--
--     1. Extracting the numeric upper bound from the weight_class_name
--        (e.g. "20KG" → 20, "30KG" → 30)
--     2. Using LAG over bands ordered by that implied_max to assign the correct
--        lower bound (e.g. "10KG/20KG/30KG" → 0–10 / 10–20 / 20–30)
--
--   This ensures the billing engine can query customer_rates directly by
--   numeric weight without needing dc_weight_classes as a bridge.
--
-- The billing engine (lookupViaCustomerRates) now uses:
--   WHERE min_weight_kg < :weight AND max_weight_kg >= :weight
--   directly on customer_rates, so correct bounds here are critical.
--
-- Safe to re-run — only updates rows where max_weight_kg IS NULL or >= 999.
-- -----------------------------------------------------------------------------

BEGIN;

WITH
-- Step 1: distinct (service_code, weight_class_name) pairs where bounds are
-- missing or bogus, extract implied numeric upper bound from the name
bad_bands AS (
  SELECT DISTINCT
    service_code,
    weight_class_name,
    (regexp_replace(weight_class_name, '[^0-9.].*$', '', 'g'))::numeric AS implied_max
  FROM customer_rates
  WHERE weight_class_name ~ '^\d'
    AND (min_weight_kg IS NULL OR max_weight_kg IS NULL OR max_weight_kg >= 999)
),

-- Step 2: for each service, order bands by implied_max and compute implied_min
-- using LAG (the previous band's upper bound; 0 for the lowest band)
corrected AS (
  SELECT
    service_code,
    weight_class_name,
    implied_max                                                      AS new_max,
    COALESCE(
      LAG(implied_max) OVER (PARTITION BY service_code ORDER BY implied_max),
      0
    )                                                                AS new_min
  FROM bad_bands
)

UPDATE customer_rates cr
SET
  min_weight_kg = c.new_min,
  max_weight_kg = c.new_max
FROM corrected c
WHERE cr.service_code      = c.service_code
  AND cr.weight_class_name = c.weight_class_name
  AND (cr.min_weight_kg IS NULL OR cr.max_weight_kg IS NULL OR cr.max_weight_kg >= 999);

DO $$
DECLARE v INT;
BEGIN
  GET DIAGNOSTICS v = ROW_COUNT;
  RAISE NOTICE 'Migration 102 complete — % customer_rates row(s) had weight bounds corrected.', v;
END $$;

COMMIT;
