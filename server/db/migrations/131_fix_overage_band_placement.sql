-- Migration 131: Move cost_per_kg from "overage reference bands" to ceiling bands
--
-- Problem
-- -------
-- Rate cards were entered with two bands per service/zone:
--
--   Band A (ceiling): min=0,  max=30, price_first=£4.36, cost_per_kg=NULL
--   Band B (overage): min=30, max=100, price_first=£0.00, cost_per_kg=£0.30
--
-- Pass 1 of lookupCarrierBandCost does:
--   weight > COALESCE(min,0) AND weight <= max
--
-- For 43kg this matches Band B (43 > 30 AND 43 <= 100 = true), returns
-- price_first=0 and exits. Pass 2 (top-out overage) never runs.
-- Result: expected_cost=£0.00 vs DHL invoice £8.26 → unexplained_delta.
--
-- Correct architecture
-- --------------------
-- The ceiling band (max=30) should carry cost_per_kg=£0.30.
-- Pass 2 then calculates: £4.36 + (43−30) × £0.30 = £8.26.
--
-- Fix
-- ---
-- 1. For every zone: find "overage reference bands" (price_first=0, cost_per_kg>0)
--    and copy their cost_per_kg onto the ceiling band in the same zone
--    (the band whose max_weight_kg equals the overage band's min_weight_kg).
-- 2. Set cost_per_kg_threshold_kg on the ceiling band to match the overage threshold.
-- 3. Delete the overage reference bands — they are now redundant.
--
-- Scope: weight_bands only. custom_cost_rate_cards uses the same structure
-- but is carrier-override data; a separate pass handles that below.

-- ─────────────────────────────────────────────────────────────────────────────
-- Audit: show what will be changed before touching anything
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
DECLARE
  rec RECORD;
BEGIN
  RAISE NOTICE '--- Overage reference bands found in weight_bands ---';
  FOR rec IN
    SELECT
      overage.id              AS overage_id,
      overage.min_weight_kg   AS overage_min,
      overage.max_weight_kg   AS overage_max,
      overage.cost_per_kg     AS overage_rate,
      ceiling.id              AS ceiling_id,
      ceiling.min_weight_kg   AS ceiling_min,
      ceiling.max_weight_kg   AS ceiling_max,
      ceiling.price_first     AS ceiling_price,
      ceiling.cost_per_kg     AS ceiling_current_rate,
      cs.service_code,
      z.name                  AS zone_name
    FROM   weight_bands     overage
    JOIN   weight_bands     ceiling
           ON  ceiling.zone_id      = overage.zone_id
           AND ceiling.max_weight_kg = overage.min_weight_kg   -- ceiling max = overage min
    JOIN   zones            z  ON z.id  = overage.zone_id
    JOIN   courier_services cs ON cs.id = z.courier_service_id
    WHERE  overage.price_first  = 0
      AND  overage.cost_per_kg IS NOT NULL
      AND  overage.cost_per_kg  > 0
    ORDER  BY cs.service_code, z.name, overage.min_weight_kg
  LOOP
    RAISE NOTICE 'service=% zone=% | overage band (id=%) %.%-% per_kg=£% → ceiling band (id=%) max=% price=£% (current per_kg=%)',
      rec.service_code, rec.zone_name,
      rec.overage_id, rec.overage_min, '–', rec.overage_max, rec.overage_rate,
      rec.ceiling_id, rec.ceiling_max, rec.ceiling_price,
      COALESCE(rec.ceiling_current_rate::TEXT, 'NULL');
  END LOOP;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1a. Copy cost_per_kg from overage band onto the matching ceiling band
--     (only if ceiling band doesn't already have one set)
-- ─────────────────────────────────────────────────────────────────────────────
UPDATE weight_bands ceiling
SET
  cost_per_kg               = overage.cost_per_kg,
  cost_per_kg_threshold_kg  = overage.min_weight_kg,  -- threshold = where overage begins
  updated_at                = NOW()
FROM  weight_bands overage
WHERE overage.zone_id        = ceiling.zone_id
  AND overage.max_weight_kg  = ceiling.max_weight_kg + 0  -- silence type ambiguity
  AND overage.price_first    = 0
  AND overage.cost_per_kg   IS NOT NULL
  AND overage.cost_per_kg    > 0
  AND ceiling.max_weight_kg  = overage.min_weight_kg
  AND ceiling.cost_per_kg   IS NULL;    -- only update if ceiling has no rate yet

-- ─────────────────────────────────────────────────────────────────────────────
-- 1b. Same for ceiling bands that already have a cost_per_kg (overwrite if the
--     overage band's rate is different — the overage band is the authoritative source)
-- ─────────────────────────────────────────────────────────────────────────────
UPDATE weight_bands ceiling
SET
  cost_per_kg               = overage.cost_per_kg,
  cost_per_kg_threshold_kg  = overage.min_weight_kg,
  updated_at                = NOW()
FROM  weight_bands overage
WHERE overage.zone_id        = ceiling.zone_id
  AND overage.price_first    = 0
  AND overage.cost_per_kg   IS NOT NULL
  AND overage.cost_per_kg    > 0
  AND ceiling.max_weight_kg  = overage.min_weight_kg
  AND ceiling.cost_per_kg   IS NOT NULL
  AND ceiling.cost_per_kg   <> overage.cost_per_kg;  -- only if different

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Delete the now-redundant overage reference bands from weight_bands
-- ─────────────────────────────────────────────────────────────────────────────
DELETE FROM weight_bands
WHERE price_first  = 0
  AND cost_per_kg IS NOT NULL
  AND cost_per_kg  > 0
  AND EXISTS (
    SELECT 1 FROM weight_bands ceiling2
    WHERE  ceiling2.zone_id       = weight_bands.zone_id
      AND  ceiling2.max_weight_kg = weight_bands.min_weight_kg
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Same treatment for custom_cost_rate_cards (carrier override cards)
-- ─────────────────────────────────────────────────────────────────────────────
UPDATE custom_cost_rate_cards ceiling
SET
  cost_per_kg               = overage.cost_per_kg,
  cost_per_kg_threshold_kg  = overage.min_weight_kg,
  updated_at                = NOW()
FROM  custom_cost_rate_cards overage
WHERE overage.courier_service_id = ceiling.courier_service_id
  AND overage.zone_id             = ceiling.zone_id
  AND overage.price_first         = 0
  AND overage.cost_per_kg        IS NOT NULL
  AND overage.cost_per_kg         > 0
  AND ceiling.max_weight_kg       = overage.min_weight_kg
  AND ceiling.cost_per_kg        IS NULL;

DELETE FROM custom_cost_rate_cards
WHERE price_first  = 0
  AND cost_per_kg IS NOT NULL
  AND cost_per_kg  > 0
  AND EXISTS (
    SELECT 1 FROM custom_cost_rate_cards c2
    WHERE  c2.courier_service_id = custom_cost_rate_cards.courier_service_id
      AND  c2.zone_id            = custom_cost_rate_cards.zone_id
      AND  c2.max_weight_kg      = custom_cost_rate_cards.min_weight_kg
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Verify DHL-220 ceiling band now has cost_per_kg set correctly
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
DECLARE
  rec RECORD;
BEGIN
  RAISE NOTICE '--- DHL-220 weight bands after migration ---';
  FOR rec IN
    SELECT
      wb.id,
      wb.min_weight_kg,
      wb.max_weight_kg,
      wb.price_first,
      wb.cost_per_kg,
      wb.cost_per_kg_threshold_kg,
      z.name AS zone_name
    FROM   weight_bands     wb
    JOIN   zones            z  ON z.id  = wb.zone_id
    JOIN   courier_services cs ON cs.id = z.courier_service_id
    WHERE  cs.service_code = '220'
    ORDER  BY wb.min_weight_kg, z.name
  LOOP
    RAISE NOTICE 'zone=% | min=% max=% | price=£% per_kg=£% threshold=%kg',
      rec.zone_name,
      rec.min_weight_kg,
      COALESCE(rec.max_weight_kg::TEXT, 'NULL'),
      rec.price_first,
      COALESCE(rec.cost_per_kg::TEXT, 'NULL (PROBLEM — per-kg rate missing)'),
      COALESCE(rec.cost_per_kg_threshold_kg::TEXT, 'NULL');
  END LOOP;

  -- Boundary test: 43kg against DHL-220 Zone A (or first zone found)
  FOR rec IN
    SELECT
      wb.price_first,
      wb.cost_per_kg,
      wb.max_weight_kg,
      z.id AS zone_id,
      z.name AS zone_name
    FROM   weight_bands     wb
    JOIN   zones            z  ON z.id  = wb.zone_id
    JOIN   courier_services cs ON cs.id = z.courier_service_id
    WHERE  cs.service_code = '220'
      AND  wb.max_weight_kg IS NOT NULL
      AND  43 > wb.max_weight_kg
    ORDER  BY wb.max_weight_kg DESC
    LIMIT  1
  LOOP
    DECLARE
      base_price NUMERIC;
      overage_kg NUMERIC;
      total      NUMERIC;
    BEGIN
      base_price := rec.price_first;
      overage_kg := ROUND((43 - rec.max_weight_kg)::NUMERIC, 2);
      total      := ROUND(base_price + overage_kg * rec.cost_per_kg, 2);
      RAISE NOTICE '43kg test on zone=%: £% + (%kg × £%) = £% (expect £8.26)',
        rec.zone_name, base_price, overage_kg, rec.cost_per_kg, total;
      IF total = 8.26 THEN
        RAISE NOTICE 'RESULT: PASS';
      ELSE
        RAISE NOTICE 'RESULT: FAIL — check DHL-220 rate card data';
      END IF;
    END;
  END LOOP;
END $$;
