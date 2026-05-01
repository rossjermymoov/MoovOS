-- Migration 136: pricing_logic_trace JSONB on charges
--
-- Stores the full calculation audit trail for every webhook-priced charge:
-- physical_kg, volumetric_kg, charged_kg, volumetric_divisor,
-- cost_pass (1 or 2), base_cost, fuel_cost_pct, fuel_cost,
-- sell_band, base_sell, fuel_sell_pct, fuel_sell, profit.
--
-- Written at charge-creation time by pricingEngine.js and can be used to
-- verify the math without re-running the engine.

ALTER TABLE charges
  ADD COLUMN IF NOT EXISTS pricing_logic_trace JSONB;
