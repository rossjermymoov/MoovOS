-- ─── Migration 233 — Backfill min/max_weight_kg on customer_rates ────────────
--
-- Rates entered via the new weight-band UI have weight_class_name labels in
-- bandLabel() format: "0-2KG", "2-5KG", "10KG+".  The POST endpoint previously
-- tried to resolve numeric bounds from dc_weight_classes, which uses different
-- naming conventions — so the lookup missed and both bounds landed as NULL.
--
-- With NULL bounds, rateCoversWeight() treats every row as a flat-rate catch-all,
-- causing the billing engine to pick whichever band the DB returns first — often
-- the wrong (more expensive) one.
--
-- This migration:
--   1. Parses the bandLabel name directly to extract bounds wherever both are NULL.
--   2. Falls back to weight_bands (via zones → courier_services) for exact matches.
--
-- Strategy for each NULL-bounds row (tried in order):
--   A) Parse "MIN-MAXKG" format  → min = MIN, max = MAX
--   B) Parse "MINKG+" format     → min = MIN, max = NULL  (open-ended top band)
--   C) Join to weight_bands on service_code + zone_name + matching bounds label
--      (catches cases where the label doesn't perfectly match A/B but the band exists)

DO $$
DECLARE
  v_parsed  INT := 0;
  v_wb      INT := 0;
BEGIN

  -- ── A+B: Parse bandLabel format directly ────────────────────────────────────
  UPDATE customer_rates cr
  SET
    min_weight_kg = CASE
      WHEN cr.weight_class_name ~* '^(\d+(\.\d+)?)-(\d+(\.\d+)?)KG$'
        THEN (regexp_match(cr.weight_class_name, '^(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)KG$', 'i'))[1]::numeric
      WHEN cr.weight_class_name ~* '^(\d+(\.\d+)?)KG\+$'
        THEN (regexp_match(cr.weight_class_name, '^(\d+(?:\.\d+)?)KG\+$', 'i'))[1]::numeric
      ELSE cr.min_weight_kg
    END,
    max_weight_kg = CASE
      WHEN cr.weight_class_name ~* '^(\d+(\.\d+)?)-(\d+(\.\d+)?)KG$'
        THEN (regexp_match(cr.weight_class_name, '^(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)KG$', 'i'))[2]::numeric
      WHEN cr.weight_class_name ~* '^(\d+(\.\d+)?)KG\+$'
        THEN NULL  -- open-ended: no upper limit
      ELSE cr.max_weight_kg
    END
  WHERE cr.min_weight_kg IS NULL
    AND (
      cr.weight_class_name ~* '^(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)KG$'
      OR cr.weight_class_name ~* '^(\d+(?:\.\d+)?)KG\+$'
    );

  GET DIAGNOSTICS v_parsed = ROW_COUNT;

  -- ── C: Join to weight_bands for any still-NULL rows ─────────────────────────
  -- Matches on service_code + zone_name + the bandLabel string generated from
  -- wb.min/max_weight_kg (same logic as GET /zones/:serviceCode).
  UPDATE customer_rates cr
  SET
    min_weight_kg = wb.min_weight_kg,
    max_weight_kg = wb.max_weight_kg
  FROM weight_bands wb
  JOIN zones             z  ON z.id  = wb.zone_id
  JOIN courier_services  cs ON cs.id = z.courier_service_id
  WHERE cr.min_weight_kg IS NULL
    AND cs.service_code ILIKE cr.service_code
    AND z.name          ILIKE cr.zone_name
    AND (
      (wb.max_weight_kg IS NOT NULL AND
       CONCAT(
         CASE WHEN wb.min_weight_kg = floor(wb.min_weight_kg)
              THEN floor(wb.min_weight_kg)::int::text
              ELSE round(wb.min_weight_kg::numeric,1)::text END,
         '-',
         CASE WHEN wb.max_weight_kg = floor(wb.max_weight_kg)
              THEN floor(wb.max_weight_kg)::int::text
              ELSE round(wb.max_weight_kg::numeric,1)::text END,
         'KG'
       ) ILIKE cr.weight_class_name)
      OR
      (wb.max_weight_kg IS NULL AND
       CONCAT(
         CASE WHEN wb.min_weight_kg = floor(wb.min_weight_kg)
              THEN floor(wb.min_weight_kg)::int::text
              ELSE round(wb.min_weight_kg::numeric,1)::text END,
         'KG+'
       ) ILIKE cr.weight_class_name)
    );

  GET DIAGNOSTICS v_wb = ROW_COUNT;

  RAISE NOTICE 'Migration 233: backfilled % row(s) from label parsing, % row(s) from weight_bands join.',
    v_parsed, v_wb;

END $$;
