-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 089 — Backfill dc_weight_classes from weight_bands
--
-- Problem:
--   dc_weight_classes is the bridge between the weight_class_name used in
--   customer_rates ("5KG") and the numeric bounds held in weight_bands
--   (min=2.010, max=5.010).  The billing engine queries dc_weight_classes to
--   resolve which named band covers a parcel weight.  Where dc_weight_classes
--   has no entry for a service (e.g. DPD12-DROP), the engine returns
--   'no matching weight band' even though the data exists everywhere else.
--
-- Root cause:
--   weight_bands stores carrier costs with proper numeric bounds but uses
--   its own naming convention ("Up to 2.0kg", "2.0-5.0kg").  customer_rates
--   uses a different convention ("2KG", "5KG").  dc_weight_classes was never
--   populated to bridge them for all services.
--
-- Fix:
--   For every (service_code, weight_class_name) pair in customer_rates that
--   has no dc_weight_classes entry, find the matching weight_bands row by
--   comparing FLOOR(weight_bands.max_weight_kg) to the implied numeric max
--   extracted from the weight_class_name (e.g. "5KG" → 5, FLOOR(5.010) = 5).
--   Insert into dc_weight_classes using the customer_rates name with the
--   weight_bands numeric bounds.
--
-- After this migration every service in customer_rates will have matching
-- dc_weight_classes rows so the billing engine can resolve weight bands by name.
-- ─────────────────────────────────────────────────────────────────────────────

BEGIN;

WITH
-- Step 1: distinct weight_class_names from customer_rates that are missing
-- from dc_weight_classes.  Extract the implied numeric upper bound from the
-- name so we can match against weight_bands.
missing_names AS (
  SELECT DISTINCT
    cr.service_code,
    cr.courier_code,
    cr.service_name,
    cr.weight_class_name,
    -- implied max: strip everything after (and including) the first non-digit/dot
    -- e.g. "5KG" → "5" → 5.0,  "10KG" → "10" → 10.0,  "2KG" → "2" → 2.0
    (regexp_replace(cr.weight_class_name, '[^0-9.].*$', '', 'g'))::numeric AS implied_max
  FROM customer_rates cr
  WHERE cr.weight_class_name ~ '^\d'          -- starts with a digit
    AND NOT EXISTS (
      SELECT 1
      FROM   dc_weight_classes wc
      WHERE  wc.service_code ILIKE cr.service_code
        AND  wc.weight_class_name = cr.weight_class_name
    )
),

-- Step 2: get the authoritative numeric bounds from weight_bands.
-- weight_bands uses a +0.010 convention (max = round_kg + 0.010) so
-- FLOOR(max_weight_kg) gives the round-number upper bound to match against.
-- We take DISTINCT (service_code, min, max) to avoid duplicates across zones
-- and rate card versions — the bounds are the same regardless of zone/card.
carrier_bounds AS (
  SELECT DISTINCT
    cs.service_code,
    wb.min_weight_kg,
    wb.max_weight_kg,
    FLOOR(wb.max_weight_kg) AS max_floor
  FROM weight_bands      wb
  JOIN zones             z   ON z.id  = wb.zone_id
  JOIN courier_services  cs  ON cs.id = z.courier_service_id
),

-- Step 3: join missing names to carrier bounds on service + implied_max = max_floor.
matched AS (
  SELECT
    mn.service_code,
    mn.courier_code,
    mn.service_name,
    mn.weight_class_name,
    cb.min_weight_kg,
    cb.max_weight_kg
  FROM missing_names  mn
  JOIN carrier_bounds cb
    ON  cb.service_code ILIKE mn.service_code
    AND cb.max_floor           = mn.implied_max
),

-- Step 4: assign synthetic dc_weight_class_ids above the current maximum.
numbered AS (
  SELECT
    (SELECT COALESCE(MAX(dc_weight_class_id), 0) FROM dc_weight_classes)
      + ROW_NUMBER() OVER (ORDER BY service_code, max_weight_kg) AS new_id,
    *
  FROM matched
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
DECLARE
  v_added INT;
BEGIN
  GET DIAGNOSTICS v_added = ROW_COUNT;
  RAISE NOTICE 'dc_weight_classes rows added from weight_bands: %', v_added;
  IF v_added > 0 THEN
    RAISE NOTICE 'Weight band names in customer_rates now have matching carrier bounds in dc_weight_classes.';
  END IF;
END $$;

COMMIT;
