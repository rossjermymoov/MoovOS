-- Migration 261: Update all Long Length Surcharge records from per-shipment to per-parcel
-- These surcharges are levied by DPD per parcel (not per shipment), so the
-- charge_per field must reflect that so the map_to_surcharge calculation
-- multiplies correctly by parcel count.

UPDATE surcharges
SET    charge_per  = 'parcel',
       updated_at  = NOW()
WHERE  name ILIKE '%long length%'
  AND  (charge_per IS NULL OR charge_per != 'parcel');
