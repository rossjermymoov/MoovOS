-- -----------------------------------------------------------------------------
-- Migration 104 — Definitive customer_rates weight bounds fix
--
-- Background:
--   Migration 102 fixed rows where weight_class_name starts with a digit
--   (e.g. "5KG", "20KG") by extracting the upper bound and using LAG.
--   This handles DPD, Evri, and similar.
--
--   However, some services (e.g. DHL, certain intl services) have
--   weight_class_names that are descriptive strings without a leading digit
--   (e.g. "Zone B 0-5kg", "Light Packet", "EU Standard").
--   For these, migration 102 does nothing — bounds remain NULL.
--
-- Fix strategy (two passes, safe to re-run):
--
--   Pass A: Numeric weight_class_names (leading digit) — same LAG approach as
--           migration 102 but extended to catch any remaining NULL rows.
--           (Migration 102 skipped rows where max_weight_kg was already
--           a valid small number; this pass only targets NULL rows.)
--
--   Pass B: Non-numeric names — for each (service_code, zone_name) that has
--           exactly ONE distinct weight_class_name with NULL bounds, look up
--           the corresponding carrier weight_bands row for that zone and use
--           its min/max as a direct substitute.
--
--           For zones with MULTIPLE weight classes (all NULL bounds and all
--           non-numeric names), attempt to order by any embedded numeric token
--           in the name using regexp, falling back to alphabetical order, then
--           assign sequential bands from carrier weight_bands ordered by
--           min_weight_kg.
--
-- Safe to re-run — only updates rows where min_weight_kg IS NULL OR
-- max_weight_kg IS NULL.
-- -----------------------------------------------------------------------------

BEGIN;

-- ─── Pass A: Numeric names (leading digit) — fill remaining NULLs ─────────────

WITH
bad_numeric AS (
  SELECT DISTINCT
    service_code,
    weight_class_name,
    (regexp_replace(weight_class_name, '[^0-9.].*$', '', 'g'))::numeric AS implied_max
  FROM customer_rates
  WHERE weight_class_name ~ '^\d'
    AND (min_weight_kg IS NULL OR max_weight_kg IS NULL)
),
corrected_numeric AS (
  SELECT
    service_code,
    weight_class_name,
    implied_max                                                             AS new_max,
    COALESCE(
      LAG(implied_max) OVER (PARTITION BY service_code ORDER BY implied_max),
      0
    )                                                                       AS new_min
  FROM bad_numeric
)
UPDATE customer_rates cr
SET
  min_weight_kg = c.new_min,
  max_weight_kg = c.new_max
FROM corrected_numeric c
WHERE cr.service_code      = c.service_code
  AND cr.weight_class_name = c.weight_class_name
  AND (cr.min_weight_kg IS NULL OR cr.max_weight_kg IS NULL);

DO $$
DECLARE v INT;
BEGIN
  GET DIAGNOSTICS v = ROW_COUNT;
  RAISE NOTICE 'Migration 104 Pass A — % customer_rates row(s) updated from numeric weight_class_name.', v;
END $$;

-- ─── Pass B: Non-numeric names — derive bounds from carrier weight_bands ───────
--
-- For each (service_code, zone_name) group with NULL-bound non-numeric names,
-- rank both the customer_rates weight classes and the carrier weight_bands by
-- min_weight_kg, then match them positionally.
--
-- This handles DHL "Zone A 0-5kg" style names where the zone name contains
-- the bounds but the weight_class_name column doesn't start with a digit.

WITH
-- customer_rates rows still with NULL bounds, non-numeric names
null_non_numeric AS (
  SELECT
    cr.id,
    cr.service_code,
    cr.zone_name,
    cr.weight_class_name,
    ROW_NUMBER() OVER (
      PARTITION BY cr.service_code, cr.zone_name
      ORDER BY
        -- Try to extract a leading number from anywhere in the name
        NULLIF(regexp_replace(cr.weight_class_name, '^[^0-9]*([0-9]+(?:\.[0-9]+)?).*$', '\1', 'g'), cr.weight_class_name)::numeric NULLS LAST,
        cr.weight_class_name
    ) AS rn
  FROM customer_rates cr
  WHERE (cr.min_weight_kg IS NULL OR cr.max_weight_kg IS NULL)
    AND NOT (cr.weight_class_name ~ '^\d')
),
-- corresponding carrier bands ordered by min_weight_kg
carrier_bands_ranked AS (
  SELECT
    cs.service_code,
    z.name AS zone_name,
    wb.min_weight_kg,
    wb.max_weight_kg,
    ROW_NUMBER() OVER (
      PARTITION BY cs.service_code, z.name
      ORDER BY wb.min_weight_kg NULLS LAST
    ) AS rn
  FROM weight_bands wb
  JOIN zones z             ON z.id  = wb.zone_id
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE wb.min_weight_kg IS NOT NULL
    AND wb.max_weight_kg IS NOT NULL
)
UPDATE customer_rates cr
SET
  min_weight_kg = cbr.min_weight_kg,
  max_weight_kg = cbr.max_weight_kg
FROM null_non_numeric nn
JOIN carrier_bands_ranked cbr
  ON  cbr.service_code ILIKE nn.service_code
  AND cbr.zone_name    ILIKE nn.zone_name
  AND cbr.rn           = nn.rn
WHERE cr.id = nn.id
  AND (cr.min_weight_kg IS NULL OR cr.max_weight_kg IS NULL);

DO $$
DECLARE v INT;
BEGIN
  GET DIAGNOSTICS v = ROW_COUNT;
  RAISE NOTICE 'Migration 104 Pass B — % customer_rates row(s) updated from carrier weight_bands (positional match).', v;
END $$;

-- ─── Summary ──────────────────────────────────────────────────────────────────

DO $$
DECLARE remaining INT;
BEGIN
  SELECT COUNT(*) INTO remaining
  FROM customer_rates
  WHERE min_weight_kg IS NULL OR max_weight_kg IS NULL;
  RAISE NOTICE 'Migration 104 complete — % customer_rates rows still have NULL weight bounds (manual review required).', remaining;
END $$;

COMMIT;
