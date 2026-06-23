-- Migration 253: DHL Long Length Surcharge tiers
--
-- DHL applies different long length surcharges depending on the longest
-- dimension of the parcel. These cannot be auto-detected as dimension data
-- is not included in the carrier invoice, so applies_when = 'reconciliation'.
--
-- Removes the generic LONG_LENGTH entry added in migration 252 and replaces
-- it with 8 tiered placeholders. Edit names, descriptions, cost_price, and
-- default_value in Carriers → DHL → Surcharges once you have the rate card.

-- Remove the generic single-tier placeholder from migration 252
DELETE FROM surcharges
WHERE code = 'LONG_LENGTH'
  AND courier_id IN (SELECT id FROM couriers WHERE LOWER(code) LIKE '%dhl%' OR LOWER(name) LIKE '%dhl%');

-- Insert 8 tiered placeholders
INSERT INTO surcharges (
  courier_id,
  code,
  name,
  description,
  calc_type,
  calc_base,
  default_value,
  cost_price,
  applies_when,
  charge_per,
  active
)
SELECT
  c.id,
  tier.code,
  tier.name,
  tier.description,
  'flat',
  'fixed',
  0.00,   -- set sell price in Carriers → DHL → Surcharges
  0.00,   -- set cost price in Carriers → DHL → Surcharges
  'reconciliation',
  'shipment',
  true
FROM couriers c
CROSS JOIN (VALUES
  ('LONG_LEN_1', 'Long Length Tier 1', 'Long length surcharge — Tier 1 (edit name/price to match DHL rate card)'),
  ('LONG_LEN_2', 'Long Length Tier 2', 'Long length surcharge — Tier 2 (edit name/price to match DHL rate card)'),
  ('LONG_LEN_3', 'Long Length Tier 3', 'Long length surcharge — Tier 3 (edit name/price to match DHL rate card)'),
  ('LONG_LEN_4', 'Long Length Tier 4', 'Long length surcharge — Tier 4 (edit name/price to match DHL rate card)'),
  ('LONG_LEN_5', 'Long Length Tier 5', 'Long length surcharge — Tier 5 (edit name/price to match DHL rate card)'),
  ('LONG_LEN_6', 'Long Length Tier 6', 'Long length surcharge — Tier 6 (edit name/price to match DHL rate card)'),
  ('LONG_LEN_7', 'Long Length Tier 7', 'Long length surcharge — Tier 7 (edit name/price to match DHL rate card)'),
  ('LONG_LEN_8', 'Long Length Tier 8', 'Long length surcharge — Tier 8 (edit name/price to match DHL rate card)')
) AS tier(code, name, description)
WHERE LOWER(c.code) IN ('dhl', 'dhlexp', 'dhl_express')
   OR LOWER(c.name) LIKE '%dhl%'
ON CONFLICT (courier_id, code) DO NOTHING;
