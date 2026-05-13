-- Migration 175: Restore Fuel and Energy Surcharge cost_price to 3.72
--
-- Migration 174 incorrectly set cost_price = 0, misunderstanding the field.
-- For percentage-based surcharges, cost_price is a CARRIER COST RATE (%)
-- not a flat £ amount — matching how billing.js applySurcharges interprets it:
--
--   carrierSurchargeCost = basePrice × cost_price / 100
--
-- So cost_price = 3.72 means "DPD charges us 3.72% of the freight base as fuel".
-- For a £3.76 base shipment: £3.76 × 3.72% = £0.14 — exactly what DPD bills.
--
-- With cost_price = 0, billing.js would store £0.00 carrier cost on every new
-- fuel surcharge charge, breaking profitability figures from the webhook forward.
--
-- The reconciliation engine has also been updated (same deploy) to interpret
-- cost_price as a % for percentage surcharges, computing:
--   expectedCost = freightCarrierAmount × cost_price / 100
-- so the 14p carrier charge now matches the 14p expected → status: matched.

UPDATE surcharges
SET    cost_price = 3.72,
       updated_at = NOW()
WHERE  name = 'Fuel and Energy Surcharge'
  AND  csv_column = 'Fuel and Energy Charge';
