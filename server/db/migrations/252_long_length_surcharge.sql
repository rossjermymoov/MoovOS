-- Migration 252: Long Length surcharge for DHL (and optionally other carriers)
--
-- Long length parcels attract a carrier surcharge that cannot be auto-detected
-- because the dimension data is not included in the carrier invoice. These are
-- resolved manually via the reconciliation resolve modal (map_to_surcharge).
-- applies_when = 'reconciliation' means the surcharge is never auto-fired.
--
-- cost_price  = what DHL charges us (current standard rate)
-- default_value = what we charge customers by default (can be overridden per customer
--                 in customer_surcharge_overrides)

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
  'LONG_LENGTH',
  'Long Length Surcharge',
  'Applied to parcels exceeding the standard maximum length. Billed by carrier on invoice only — cannot be auto-detected as length data is not included in invoice files.',
  'flat',
  'fixed',
  5.00,   -- default sell price; override per customer in customer_surcharge_overrides
  5.00,   -- DHL cost price (current standard rate)
  'reconciliation',
  'shipment',
  true
FROM couriers c
WHERE LOWER(c.code) IN ('dhl', 'dhlexp', 'dhl_express')
   OR LOWER(c.name) LIKE '%dhl%'
ON CONFLICT (courier_id, code) DO NOTHING;
