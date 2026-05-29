-- Migration 266: Fix DPD Drop Off weight bands and expand collapsed customer_rates
--
-- Problem 1 — overlapping weight band ranges
-- ──────────────────────────────────────────
-- Migration 004 seeded 5 weight bands per DPD Drop Off service (DPD12-DROP,
-- DPD-12DROPQR, DPD-DROP5KND) with min_weight_kg = 0.0 for ALL bands:
--
--   min=0, max=2   ("0-2kg")
--   min=0, max=5   ("0-5kg")   ← should be min=2 ("2-5kg")
--   min=0, max=10  ("0-10kg")  ← should be min=5 ("5-10kg")
--   min=0, max=15  ("0-15kg")  ← should be min=10 ("10-15kg")
--   min=0, max=20  ("0-20kg")  ← should be min=15 ("15-20kg")
--
-- Overlapping ranges cause the pricing engine to match the wrong (larger) band
-- for parcels above 2kg.  Fix: make ranges sequential.
--
-- Problem 2 — all weight chips collapsed to one customer_rates row
-- ────────────────────────────────────────────────────────────────
-- When a carrier rate card imported these services the weight_band rows received
-- name = 'Parcel'.  The GET /zones/:serviceCode template query used MAX(wb.name),
-- which returned 'Parcel' for all five (zone, min, max) groups, making
-- multiWeight = false in the UI so all five chips shared a single customer_rates
-- row with weight_class_name = 'parcel'.
--
-- The server fix (GET /zones/:serviceCode CTE) corrects this going forward.
-- This migration repairs the data:
--   • Step 1 — fix min_weight_kg to produce sequential label ranges
--   • Step 2 — expand any collapsed 'parcel' customer_rates row to all five bands
--   • Step 3 — delete the old collapsed 'parcel' rows
--
-- Safe to re-run: all three steps are idempotent.

-- ── Step 1: fix min_weight_kg to sequential values ───────────────────────────
UPDATE weight_bands wb
SET    min_weight_kg = v.new_min
FROM   zones z
JOIN   courier_services cs ON cs.id = z.courier_service_id
CROSS JOIN (VALUES
  (2.0,   0.0),    -- 0-2   → stays 0-2
  (5.0,   2.0),    -- 0-5   → 2-5
  (10.0,  5.0),    -- 0-10  → 5-10
  (15.0,  10.0),   -- 0-15  → 10-15
  (20.0,  15.0)    -- 0-20  → 15-20
) AS v(old_max, new_min)
WHERE  wb.zone_id        = z.id
  AND  wb.max_weight_kg  = v.old_max
  AND  wb.min_weight_kg != v.new_min   -- skip rows that are already correct
  AND  cs.service_code IN ('DPD12-DROP', 'DPD-12DROPQR', 'DPD-DROP5KND');

-- ── Step 2: expand collapsed 'parcel' customer_rates to all five bands ────────
-- For any customer who had a single 'parcel' rate for a DPD Drop Off service,
-- copy that price to each of the five weight bands so no prices are lost.
INSERT INTO customer_rates (
  customer_id, courier_id, courier_code, courier_name,
  service_id, service_code, service_name,
  zone_name, weight_class_name,
  min_weight_kg, max_weight_kg,
  price, price_sub
)
SELECT
  cr.customer_id, cr.courier_id, cr.courier_code, cr.courier_name,
  cr.service_id,  cr.service_code, cr.service_name,
  cr.zone_name,   bands.wcn,
  bands.wmin,     bands.wmax,
  cr.price,       cr.price_sub
FROM   customer_rates cr
CROSS  JOIN (VALUES
  ('0-2kg',   0.0,  2.0),
  ('2-5kg',   2.0,  5.0),
  ('5-10kg',  5.0,  10.0),
  ('10-15kg', 10.0, 15.0),
  ('15-20kg', 15.0, 20.0)
) AS bands(wcn, wmin, wmax)
WHERE  cr.service_code        IN ('DPD12-DROP', 'DPD-12DROPQR', 'DPD-DROP5KND')
  AND  cr.weight_class_name   = 'parcel'
ON CONFLICT (customer_id, service_id, zone_name, weight_class_name) DO NOTHING;

-- ── Step 3: delete the old collapsed 'parcel' row ────────────────────────────
-- Now that the price has been propagated to the five correct band rows, the
-- generic 'parcel' row is no longer needed and would be orphaned (the zone
-- template no longer produces a chip with that label).
DELETE FROM customer_rates
WHERE  service_code      IN ('DPD12-DROP', 'DPD-12DROPQR', 'DPD-DROP5KND')
  AND  weight_class_name  = 'parcel';
