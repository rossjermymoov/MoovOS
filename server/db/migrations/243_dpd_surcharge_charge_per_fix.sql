-- Migration 243: fix charge_per for DPD surcharges that DPD bills per shipment, not per parcel
-- Evidence: 4366432493 (2-parcel shipment) — DPD billed £5 Non Comms and £6 Out of Gauge once.
-- Engine was doubling expected because charge_per = 'parcel'.
-- Also re-applies Relabel fix (charge_per was 'parcel', should be 'shipment').

UPDATE surcharges
SET    charge_per = 'shipment', updated_at = NOW()
WHERE  courier_id = 1
  AND  name IN ('Non Comms Handling Charge', 'Out of Gauge', 'Relabel Surcharge');
