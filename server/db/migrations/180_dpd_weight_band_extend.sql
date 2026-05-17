-- ─── Migration 180 — DPD carrier weight band ceiling: 30.01 → 999 kg ─────────
--
-- Problem:
--   Migration 006 capped every DPD-11 and DPD-12 carrier weight band at
--   max_weight_kg = 30.01.  DPD Two Day and Next Day are flat-rate services —
--   the carrier charges the same price regardless of parcel weight up to 30 kg,
--   and shipments above 30 kg that are still invoiced under the standard service
--   code (rather than the Out-of-Gauge code) should be priced identically.
--
--   With the 30.01 cap in place:
--     Pass 1  (weight ≤ max_weight_kg):  no match for any parcel > 30.01 kg
--     Pass 2  (overage × cost_per_kg):   returns NULL because DPD flat-rate
--             bands have no cost_per_kg set
--   Result: lookupCarrierBandCost returns NULL → carrier_direct_error_no_cost_band
--
--   Observed on tracking 1548908643: 2-parcel DPD Two Day Northern Ireland
--   shipment where the per-parcel weight exceeds 30 kg.
--
-- Fix:
--   Extend max_weight_kg from 30.01 → 999.0 on all DPD-11 and DPD-12 carrier
--   weight bands that are currently capped at 30.01.  Bands already set to 999
--   (e.g. Isle of Man bands added by migration 178) are left unchanged.
--
-- IDEMPOTENT: WHERE max_weight_kg = 30.01 means a re-run is a no-op once
--             the bands have been updated.
-- ─────────────────────────────────────────────────────────────────────────────

UPDATE weight_bands
SET    max_weight_kg = 999.0,
       updated_at    = NOW()
WHERE  zone_id IN (
         SELECT z.id
         FROM   zones z
         JOIN   courier_services cs ON cs.id = z.courier_service_id
         WHERE  cs.service_code IN ('DPD-11', 'DPD-12')
       )
  AND  max_weight_kg = 30.01;

DO $$
DECLARE v_count INTEGER;
BEGIN
  GET DIAGNOSTICS v_count = ROW_COUNT;
  IF v_count > 0 THEN
    RAISE NOTICE 'Migration 180: extended % DPD-11/DPD-12 weight band(s) from 30.01 kg → 999 kg', v_count;
  ELSE
    RAISE NOTICE 'Migration 180: no bands at 30.01 kg found — already applied or not needed';
  END IF;
END;
$$;
