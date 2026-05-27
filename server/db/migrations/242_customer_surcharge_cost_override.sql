-- Migration 242: add cost_price_override to customer_surcharge_overrides
-- Allows per-customer cost price overrides for surcharges, used by the
-- reconciliation engine when computing expected costs.
-- override_value continues to hold the sell price override (existing behaviour).
-- cost_price_override holds an optional carrier cost override for the same surcharge.

ALTER TABLE customer_surcharge_overrides
  ADD COLUMN IF NOT EXISTS cost_price_override NUMERIC DEFAULT NULL;

COMMENT ON COLUMN customer_surcharge_overrides.cost_price_override IS
  'Optional per-customer carrier cost price override for this surcharge. NULL = use surcharge.cost_price.';
