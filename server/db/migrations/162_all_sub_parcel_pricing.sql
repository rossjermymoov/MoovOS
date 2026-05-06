-- ─── Migration 162 — courier_services: all_sub_parcel_pricing flag ───────────
--
-- Problem:
--   DPD (and some other carriers) bill ALL parcels in a multi-parcel shipment
--   at the sub-parcel rate (price_sub), INCLUDING the first parcel.  This is
--   the opposite of the standard model where parcel 1 uses price_first and
--   subsequent parcels use price_sub.
--
--   pricingEngine.js was using:
--     const useFirstParcel = isFirst || !multi_box_pricing;
--   which always applies price_first to parcel 1 regardless of carrier.
--
--   Result: every DPD multi-parcel shipment had an inflated cost_price stored
--   in the DB (e.g. price_first £9.56 + price_sub £3.26 = £12.82 instead of
--   the correct 2 × price_sub £3.26 = £6.52), corrupting profit calculations.
--
-- Fix:
--   1. Add all_sub_parcel_pricing BOOLEAN to courier_services.
--   2. Seed true for all DPD services.
--   3. pricingEngine.js reads the flag and forces useFirstParcel = false for
--      ALL parcels when it is set AND totalParcels > 1.
--
-- IDEMPOTENT: safe to re-run.

ALTER TABLE courier_services
  ADD COLUMN IF NOT EXISTS all_sub_parcel_pricing BOOLEAN NOT NULL DEFAULT false;

-- Seed: mark all services belonging to any DPD carrier as all_sub
UPDATE courier_services cs
SET    all_sub_parcel_pricing = true
FROM   couriers c
WHERE  cs.courier_id = c.id
  AND  (c.code ILIKE 'DPD' OR c.name ILIKE 'DPD%');
