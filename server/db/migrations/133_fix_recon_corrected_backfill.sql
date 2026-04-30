-- Migration 133: fix recon_corrected backfill
--
-- Migration 132 used cost_price > price_first as the backfill condition,
-- which incorrectly flagged multi-parcel shipments where the extra cost is
-- price_sub (expected billing, not a correction). Reset and re-backfill
-- using the correct signal: shipment weight exceeded the band ceiling,
-- meaning per-kg overage was actually applied.

-- Step 1: clear all flags set by the bad backfill
UPDATE charges SET recon_corrected = FALSE WHERE recon_corrected = TRUE;

-- Step 2: re-backfill using total_weight_kg > max_weight_kg
UPDATE charges
SET    recon_corrected = TRUE
FROM   shipments        s,
       couriers         co,
       courier_services cs,
       zones            z,
       weight_bands     wb
WHERE  charges.shipment_id      = s.id
  AND  charges.charge_type      = 'courier'
  AND  charges.verified         = TRUE
  AND  charges.cancelled        = FALSE
  AND  charges.cost_price       IS NOT NULL
  AND  (
         s.courier ILIKE co.code
         OR s.courier ILIKE co.name
         OR s.courier ILIKE '%' || co.code || '%'
         OR co.code   ILIKE '%' || s.courier || '%'
       )
  AND  cs.courier_id            = co.id
  AND  z.courier_service_id     = cs.id
  AND  z.name                   = charges.zone_name
  AND  wb.zone_id               = z.id
  AND  wb.cost_per_kg           > 0
  AND  wb.max_weight_kg         IS NOT NULL
  AND  s.total_weight_kg        > wb.max_weight_kg;
