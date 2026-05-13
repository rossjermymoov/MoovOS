-- Migration 174: Fix Fuel and Energy Surcharge cost_price
--
-- The "Fuel and Energy Surcharge" had cost_price = £3.72, which is a DPD base
-- freight rate accidentally entered into the surcharge cost field. Because the
-- surcharge is percentage-based (sell = 9.5% of freight), there is no single
-- fixed carrier cost — it varies per shipment. Setting cost_price = 0 is the
-- correct configuration: the engine will record what the carrier actually
-- charged without flagging a spurious -£3.39 delta against a made-up expected.
--
-- Effect before fix:  delta = £0.33 - £3.72 = -£3.39  → corrected (every shipment)
-- Effect after fix:   delta = £0.33 - £0.00 = +£0.33  → corrected (expected, variable)

UPDATE surcharges
SET    cost_price = 0,
       updated_at = NOW()
WHERE  name = 'Fuel and Energy Surcharge'
  AND  csv_column = 'Fuel and Energy Charge';
