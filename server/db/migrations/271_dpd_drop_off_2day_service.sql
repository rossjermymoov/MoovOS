-- Migration 271: DPD Drop Off 2-day service (DPD-11DROP)
--
-- Background
-- ──────────
-- Migration 269 added an account-specific service code mapping for DPD Drop
-- Off (Drop Shop) Next Day parcels: service_code '2' + account 118909 →
-- DPD12-DROP.  Drop Off invoices can also contain 2-day lines (service_code
-- '1' + account 118909) but no matching internal service existed, causing
-- those lines to fall through as unmatched.
--
-- Additionally, when Ross uses the "Change Service" resolve option to reclassify
-- an unmatched Drop Off line as 2-day, the engine needs a named service with a
-- rate card to price it correctly.
--
-- Fix
-- ───
-- 1. Seed courier_service DPD-11DROP ("DPD Drop Off 2-day") for DPD.
-- 2. Seed zone "Mainland" for the new service.
-- 3. Seed 5 sequential weight bands (0-2, 2-5, 5-10, 10-15, 15-20 kg).
--    price_first = 0.00 as placeholder — actual DPD 2-day Drop Off carrier
--    cost is taken directly from the invoice (carrier_amount on the recon
--    line); weight_bands.price_first is a reference rate only.
--    Ross sets customer sell rates via the rate card UI once this runs.
-- 4. Add account-specific service code mapping:
--    service_code '1' + carrier_account_no '118909' → DPD-11DROP.
--    The engine checks account-specific rules BEFORE the generic fallback
--    (service_code '1' → DPD-11, the regular collected 2-day service).

-- ── 1. Courier service ────────────────────────────────────────────────────────
INSERT INTO courier_services (courier_id, service_code, name)
SELECT c.id, 'DPD-11DROP', 'DPD Drop Off 2-day'
FROM couriers c
WHERE c.code ILIKE 'DPD'
   OR c.name ILIKE 'DPD%'
ORDER BY c.id
LIMIT 1
ON CONFLICT (service_code) DO NOTHING;

-- ── 2. Zone ───────────────────────────────────────────────────────────────────
INSERT INTO zones (courier_service_id, name)
SELECT cs.id, 'Mainland'
FROM courier_services cs
WHERE cs.service_code = 'DPD-11DROP'
  AND NOT EXISTS (
    SELECT 1 FROM zones z
    WHERE z.courier_service_id = cs.id AND z.name = 'Mainland'
  );

-- ── 3. Weight bands (sequential, matching migration 266 pattern) ──────────────
-- price_first = 0.00 placeholder; actual carrier cost comes from the invoice.
-- The rate card UI will let Ross configure customer sell rates per band.
INSERT INTO weight_bands (zone_id, min_weight_kg, max_weight_kg, price_first)
SELECT z.id, v.mn, v.mx, 0.00
FROM (VALUES
  (0.0,   2.0),
  (2.0,   5.0),
  (5.0,  10.0),
  (10.0, 15.0),
  (15.0, 20.0)
) AS v(mn, mx)
JOIN courier_services cs ON cs.service_code = 'DPD-11DROP'
JOIN zones z ON z.courier_service_id = cs.id AND z.name = 'Mainland'
WHERE NOT EXISTS (
  SELECT 1 FROM weight_bands wb
  WHERE wb.zone_id = z.id
    AND wb.min_weight_kg = v.mn
    AND wb.max_weight_kg = v.mx
);

-- ── 4. Account-specific service code mapping ──────────────────────────────────
-- DPD invoice service_code '1' (2-day) + account 118909 = Drop Off 2-day.
-- Covered by the cscm_unique_account partial index from migration 269:
--   (carrier_id, courier_code, carrier_account_no) WHERE carrier_account_no IS NOT NULL
--   AND product_code IS NULL
INSERT INTO courier_service_code_mappings
  (carrier_id, courier_code, carrier_account_no, service_id, is_active, notes)
SELECT
  cu.id,
  '1',
  '118909',
  cs.id,
  true,
  'DPD invoice code 1 + account 118909 = Drop Off (Drop Shop) 2-day -> DPD-11DROP. Seeded by migration 271.'
FROM couriers cu
JOIN courier_services cs ON cs.service_code = 'DPD-11DROP'
WHERE (cu.code ILIKE 'DPD' OR cu.name ILIKE 'DPD%')
ORDER BY cu.id
LIMIT 1
ON CONFLICT DO NOTHING;
