-- Migration 241: Set Insurance Liability surcharge cost_price to 0
--
-- The "Insurance Liability" / "Contractual Liability" surcharge was set to
-- cost_price=7.50, meaning the reconciliation engine was adding £7.50 to the
-- expected amount for every shipment on the DPD Next Day 5k Insurance service.
--
-- This is wrong: the base cost_price for those shipments (e.g. £11.76 for Beacons)
-- ALREADY includes the insurance premium.  DPD bills the insurance as a separate
-- "Contractual Liability" column on the invoice, so it was being double-counted:
--   totalExpected = base (£11.76) + insurance expected (£7.50) = £19.26  ← wrong
--
-- With cost_price=0 the surcharge still contributes to totalCarrier (DPD did bill it)
-- but adds nothing to totalExpected, so:
--   totalExpected = base (£11.76) + 0 = £11.76
--   totalCarrier  = base (£3.76)  + £7.50 = £11.26
--   delta = -£0.50  ← correct (minor carrier undercharge)

UPDATE surcharges
SET cost_price  = 0,
    updated_at  = NOW()
WHERE id = '7adfd550-e5f8-4b64-b632-f0fb7b5b55af';
