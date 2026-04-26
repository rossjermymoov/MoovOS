-- Migration 110: Add per-kg rate support to customer_rates (sell-side pricing)
--
-- Mirrors the per-kg columns added to weight_bands (carrier cost) in migration 107,
-- but for the customer sell price side.
--
-- per_kg_rate         — the per-kg sell rate above the threshold (NULL = flat rate band only)
-- per_kg_threshold_kg — weight above which per_kg_rate kicks in (default 30 kg)
--
-- Example: PWS DHL service, 32p/kg above 30 kg.
--   UPDATE customer_rates
--   SET per_kg_rate = 0.32, per_kg_threshold_kg = 30
--   WHERE customer_id = <pws_id> AND service_code ILIKE 'DHLPCUK%';

BEGIN;

ALTER TABLE customer_rates
  ADD COLUMN IF NOT EXISTS per_kg_rate         NUMERIC(10,4) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS per_kg_threshold_kg NUMERIC(8,3)  DEFAULT 30;

COMMENT ON COLUMN customer_rates.per_kg_rate IS
  'Per-kg sell rate charged for every kg (or part thereof) above per_kg_threshold_kg. NULL = flat band price only.';
COMMENT ON COLUMN customer_rates.per_kg_threshold_kg IS
  'Weight threshold in kg above which per_kg_rate applies. Default 30 kg.';

COMMIT;
