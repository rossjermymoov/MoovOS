-- Migration 283: Scope idx_charges_carrier_direct_tracking to courier charges only
--
-- Problem: the index covers ALL charge types, so when createCarrierDirectSurcharges
-- tries to insert fuel/EFS/HGV charges with the same tracking_code as the existing
-- courier charge, every insert conflicts and fails.
--
-- Fix: scope the index to charge_type = 'courier' only, which was always the intent
-- (prevent duplicate courier charges per tracking). Fuel and surcharge sub-charges
-- for the same tracking are valid and must not conflict.

DROP INDEX IF EXISTS idx_charges_carrier_direct_tracking;

CREATE UNIQUE INDEX IF NOT EXISTS idx_charges_carrier_direct_tracking
ON charges (tracking_code)
WHERE source        = 'carrier_direct'
  AND cancelled     = false
  AND charge_type   = 'courier'
  AND tracking_code IS NOT NULL;
