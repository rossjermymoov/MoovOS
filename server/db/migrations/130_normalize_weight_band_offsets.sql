-- Migration 130: Normalize .01 legacy weight-band offsets
--
-- Background
-- ----------
-- Weight bands were historically entered with .01 offsets (e.g. 0.01, 5.01,
-- 10.01, 30.01) to work around a bug in the old billing system that used
-- inclusive lower bounds. The current engine uses exclusive lower / inclusive
-- upper bounds:
--
--   Pass 1 (normal):  weight > min  AND  weight <= max
--   Pass 2 (top-out): weight > max  (overage per kg)
--
-- With .01 offsets still in place:
--   • A 30.00kg parcel against a band with max = 30.01 matches Pass 1 and is
--     charged the flat rate — correct by accident.
--   • A 30.01kg parcel against the same band ALSO matches Pass 1 (30.01 <=
--     30.01), preventing Pass 2 from ever running → no overage applied.
--   • After removing old COALESCE(max, 99999) guard, a 5.01 min band leaves
--     a 0.01kg gap between adjacent bands that can swallow fractional weights.
--
-- Fix: strip all .01 fractional offsets from min_weight_kg and max_weight_kg
-- across every band table. Values are rounded down to the nearest integer
-- (FLOOR), keeping the band semantics intact under the exclusive-lower /
-- inclusive-upper convention.
--
-- Tables affected
-- ---------------
--   weight_bands            — carrier rate card bands
--   custom_cost_rate_cards  — carrier override cards (same structure)
--   customer_pricing        — customer sell-price bands
--
-- Safety: the UPDATE is predicated on the fractional part being between 0.005
-- and 0.015, so only genuine .01 offsets are touched. Values like 0.5, 2.5
-- (half-kg bands) are left alone.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. weight_bands
-- ─────────────────────────────────────────────────────────────────────────────

-- Audit: log how many rows will change (available in Railway migration logs)
DO $$
DECLARE
  min_count INT;
  max_count INT;
BEGIN
  SELECT COUNT(*) INTO min_count
  FROM weight_bands
  WHERE min_weight_kg IS NOT NULL
    AND (min_weight_kg - FLOOR(min_weight_kg)) BETWEEN 0.005 AND 0.015;

  SELECT COUNT(*) INTO max_count
  FROM weight_bands
  WHERE max_weight_kg IS NOT NULL
    AND (max_weight_kg - FLOOR(max_weight_kg)) BETWEEN 0.005 AND 0.015;

  RAISE NOTICE 'weight_bands: % min_weight_kg rows and % max_weight_kg rows have .01 offsets',
    min_count, max_count;
END $$;

UPDATE weight_bands
SET    min_weight_kg = FLOOR(min_weight_kg)
WHERE  min_weight_kg IS NOT NULL
  AND  (min_weight_kg - FLOOR(min_weight_kg)) BETWEEN 0.005 AND 0.015;

UPDATE weight_bands
SET    max_weight_kg = FLOOR(max_weight_kg)
WHERE  max_weight_kg IS NOT NULL
  AND  (max_weight_kg - FLOOR(max_weight_kg)) BETWEEN 0.005 AND 0.015;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. custom_cost_rate_cards
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
DECLARE
  min_count INT;
  max_count INT;
BEGIN
  SELECT COUNT(*) INTO min_count
  FROM custom_cost_rate_cards
  WHERE min_weight_kg IS NOT NULL
    AND (min_weight_kg - FLOOR(min_weight_kg)) BETWEEN 0.005 AND 0.015;

  SELECT COUNT(*) INTO max_count
  FROM custom_cost_rate_cards
  WHERE max_weight_kg IS NOT NULL
    AND (max_weight_kg - FLOOR(max_weight_kg)) BETWEEN 0.005 AND 0.015;

  RAISE NOTICE 'custom_cost_rate_cards: % min and % max rows have .01 offsets',
    min_count, max_count;
END $$;

UPDATE custom_cost_rate_cards
SET    min_weight_kg = FLOOR(min_weight_kg)
WHERE  min_weight_kg IS NOT NULL
  AND  (min_weight_kg - FLOOR(min_weight_kg)) BETWEEN 0.005 AND 0.015;

UPDATE custom_cost_rate_cards
SET    max_weight_kg = FLOOR(max_weight_kg)
WHERE  max_weight_kg IS NOT NULL
  AND  (max_weight_kg - FLOOR(max_weight_kg)) BETWEEN 0.005 AND 0.015;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. customer_pricing
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
DECLARE
  min_count INT;
  max_count INT;
BEGIN
  SELECT COUNT(*) INTO min_count
  FROM customer_pricing
  WHERE min_weight_kg IS NOT NULL
    AND (min_weight_kg - FLOOR(min_weight_kg)) BETWEEN 0.005 AND 0.015;

  SELECT COUNT(*) INTO max_count
  FROM customer_pricing
  WHERE max_weight_kg IS NOT NULL
    AND (max_weight_kg - FLOOR(max_weight_kg)) BETWEEN 0.005 AND 0.015;

  RAISE NOTICE 'customer_pricing: % min and % max rows have .01 offsets',
    min_count, max_count;
END $$;

UPDATE customer_pricing
SET    min_weight_kg = FLOOR(min_weight_kg)
WHERE  min_weight_kg IS NOT NULL
  AND  (min_weight_kg - FLOOR(min_weight_kg)) BETWEEN 0.005 AND 0.015;

UPDATE customer_pricing
SET    max_weight_kg = FLOOR(max_weight_kg)
WHERE  max_weight_kg IS NOT NULL
  AND  (max_weight_kg - FLOOR(max_weight_kg)) BETWEEN 0.005 AND 0.015;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Spot-check: DHL service-code-220 ceiling must be exactly 30.00
-- ─────────────────────────────────────────────────────────────────────────────
-- Readable verification in migration logs — not a hard failure, just a notice.

DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN
    SELECT wb.id,
           wb.min_weight_kg,
           wb.max_weight_kg,
           wb.price_first,
           wb.cost_per_kg,
           cs.service_code,
           z.name AS zone_name
    FROM   weight_bands     wb
    JOIN   zones            z  ON z.id  = wb.zone_id
    JOIN   courier_services cs ON cs.id = z.courier_service_id
    WHERE  cs.service_code = '220'
    ORDER  BY wb.min_weight_kg
  LOOP
    RAISE NOTICE 'DHL-220 band | zone=% | min=% max=% | price=£% per_kg=£%',
      rec.zone_name,
      rec.min_weight_kg,
      COALESCE(rec.max_weight_kg::TEXT, 'NULL (open-ended)'),
      rec.price_first,
      COALESCE(rec.cost_per_kg::TEXT, '—');
  END LOOP;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. Verify boundary logic for 30.00 and 30.01 against DHL-220
--
--    Expected after normalization:
--      30.00 kg → Pass 1 hits (30.00 > 0 AND 30.00 <= 30.00) → flat rate £4.36
--      30.01 kg → Pass 1 misses (30.01 > 30.00 fails <=), falls to Pass 2
--               → overage: £4.36 + (0.01 × £0.30) = £4.363 → rounds to £4.36
--      43.00 kg → Pass 2: £4.36 + (13 × £0.30) = £8.26
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
DECLARE
  pass1_30  INT;
  pass1_3001 INT;
  pass2_30  INT;
  pass2_3001 INT;
  svc_id    INT;
BEGIN
  -- Resolve DHL-220 service ID
  SELECT cs.id INTO svc_id
  FROM courier_services cs
  WHERE cs.service_code = '220'
  LIMIT 1;

  IF svc_id IS NULL THEN
    RAISE NOTICE 'DHL-220 service not found — skipping boundary verification';
    RETURN;
  END IF;

  -- Pass 1 check for 30.00
  SELECT COUNT(*) INTO pass1_30
  FROM weight_bands wb
  JOIN zones z ON z.id = wb.zone_id
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.id = svc_id
    AND wb.max_weight_kg IS NOT NULL
    AND 30.00 > COALESCE(wb.min_weight_kg, 0)
    AND 30.00 <= wb.max_weight_kg;

  -- Pass 1 check for 30.01
  SELECT COUNT(*) INTO pass1_3001
  FROM weight_bands wb
  JOIN zones z ON z.id = wb.zone_id
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.id = svc_id
    AND wb.max_weight_kg IS NOT NULL
    AND 30.01 > COALESCE(wb.min_weight_kg, 0)
    AND 30.01 <= wb.max_weight_kg;

  -- Pass 2 check for 30.00 (should be 0 — 30.00 is at ceiling, NOT above it)
  SELECT COUNT(*) INTO pass2_30
  FROM weight_bands wb
  JOIN zones z ON z.id = wb.zone_id
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.id = svc_id
    AND wb.max_weight_kg IS NOT NULL
    AND 30.00 > wb.max_weight_kg;

  -- Pass 2 check for 30.01 (should be >= 1)
  SELECT COUNT(*) INTO pass2_3001
  FROM weight_bands wb
  JOIN zones z ON z.id = wb.zone_id
  JOIN courier_services cs ON cs.id = z.courier_service_id
  WHERE cs.id = svc_id
    AND wb.max_weight_kg IS NOT NULL
    AND 30.01 > wb.max_weight_kg;

  RAISE NOTICE '--- Boundary verification for DHL-220 (service_id=%) ---', svc_id;
  RAISE NOTICE '30.00 kg → Pass 1 match count: % (expect 1)', pass1_30;
  RAISE NOTICE '30.01 kg → Pass 1 match count: % (expect 0)', pass1_3001;
  RAISE NOTICE '30.00 kg → Pass 2 match count: % (expect 0)', pass2_30;
  RAISE NOTICE '30.01 kg → Pass 2 match count: % (expect 1)', pass2_3001;

  IF pass1_30 = 1 AND pass1_3001 = 0 AND pass2_30 = 0 AND pass2_3001 >= 1 THEN
    RAISE NOTICE 'RESULT: PASS — boundary logic is clean';
  ELSE
    RAISE NOTICE 'RESULT: FAIL — check weight bands for DHL-220';
  END IF;
END $$;
