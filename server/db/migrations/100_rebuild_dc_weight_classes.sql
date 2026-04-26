-- -----------------------------------------------------------------------------
-- Migration 100 — Rebuild dc_weight_classes for all services
--
-- Problem:
--   Migration 099 deleted dc_weight_classes rows where max_weight_kg >= 999.
--   This was correct for the bogus DHL rows (inserted by migration 088 with
--   wrong iso/data), but it also removed catch-all bands for other services
--   (e.g. DPD-12) that had a 0–99999 band as their only weight class entry.
--   Those services now return "no matching weight band" in the billing engine.
--
-- Fix:
--   For every (service_code, weight_class_name) pair in customer_rates that
--   has NO matching entry in dc_weight_classes, derive numeric bounds by:
--
--     1. Extracting the implied numeric upper bound from the name
--        (e.g. "5KG" → 5,  "10KG" → 10,  "30KG" → 30)
--     2. Using a LAG window over bands ordered by implied_max to assign the
--        correct lower bound — so "5KG/10KG/15KG" becomes:
--          "5KG"  → 0–5
--          "10KG" → 5–10
--          "15KG" → 10–15
--        This ensures the billing lookup (min < weight <= max) resolves
--        correctly for every parcel weight.
--
--   Only rows whose weight_class_name starts with a digit are processed
--   (arbitrary text names like "Standard" are ignored).
--
-- Safe to re-run — ON CONFLICT on dc_weight_class_id is a no-op.
-- -----------------------------------------------------------------------------

BEGIN;

WITH
-- Step 1: all (service_code, weight_class_name) pairs in customer_rates
-- that are NOT already in dc_weight_classes
missing AS (
  SELECT DISTINCT
    cr.service_code,
    cr.courier_code,
    cr.service_name,
    cr.weight_class_name,
    (regexp_replace(cr.weight_class_name, '[^0-9.].*$', '', 'g'))::numeric AS implied_max
  FROM customer_rates cr
  WHERE cr.weight_class_name ~ '^\d'
    AND NOT EXISTS (
      SELECT 1
      FROM   dc_weight_classes wc
      WHERE  wc.service_code       ILIKE cr.service_code
        AND  wc.weight_class_name  =     cr.weight_class_name
    )
),

-- Step 2: order bands per service and compute implied_min from the
-- previous band's implied_max (0 for the first band in each service)
banded AS (
  SELECT
    service_code,
    courier_code,
    service_name,
    weight_class_name,
    COALESCE(
      LAG(implied_max) OVER (PARTITION BY service_code ORDER BY implied_max),
      0
    ) AS min_weight_kg,
    implied_max AS max_weight_kg
  FROM missing
),

-- Step 3: assign new dc_weight_class_ids above the current maximum
numbered AS (
  SELECT
    (SELECT COALESCE(MAX(dc_weight_class_id), 0) FROM dc_weight_classes)
      + ROW_NUMBER() OVER (ORDER BY service_code, max_weight_kg) AS new_id,
    *
  FROM banded
)

INSERT INTO dc_weight_classes
  (dc_weight_class_id, weight_class_name, courier_code, service_code, service_name,
   min_weight_kg, max_weight_kg)
SELECT
  new_id,
  weight_class_name,
  COALESCE(courier_code, ''),
  service_code,
  COALESCE(service_name, ''),
  min_weight_kg,
  max_weight_kg
FROM numbered
ON CONFLICT (dc_weight_class_id) DO NOTHING;

DO $$
DECLARE v INT;
BEGIN
  GET DIAGNOSTICS v = ROW_COUNT;
  RAISE NOTICE 'Migration 100 complete — % dc_weight_classes row(s) rebuilt from customer_rates.', v;
END $$;

COMMIT;
