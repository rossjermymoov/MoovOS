-- Migration 107: Add per-kg rate support to weight_bands and custom_cost_rate_cards
--
-- Some carriers (e.g. DHL) charge a fixed base rate up to a threshold weight,
-- then a per-kg (or per-kg-part-thereof) rate for every kg above that threshold.
-- e.g. DHL: fixed price up to 30 kg, then £0.30/kg or part thereof above 30 kg.
--
-- cost_per_kg              — the per-kg rate above the threshold (NULL = not applicable)
-- cost_per_kg_threshold_kg — the weight above which per-kg billing kicks in (default 30 kg)

BEGIN;

ALTER TABLE weight_bands
  ADD COLUMN IF NOT EXISTS cost_per_kg              NUMERIC(10,4) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS cost_per_kg_threshold_kg NUMERIC(8,3)  DEFAULT 30;

ALTER TABLE custom_cost_rate_cards
  ADD COLUMN IF NOT EXISTS cost_per_kg              NUMERIC(10,4) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS cost_per_kg_threshold_kg NUMERIC(8,3)  DEFAULT 30;

COMMENT ON COLUMN weight_bands.cost_per_kg IS
  'Per-kg rate charged for every kg (or part thereof) above cost_per_kg_threshold_kg. NULL = flat rate only.';
COMMENT ON COLUMN weight_bands.cost_per_kg_threshold_kg IS
  'Weight threshold in kg above which cost_per_kg applies. Default 30 kg.';

COMMENT ON COLUMN custom_cost_rate_cards.cost_per_kg IS
  'Per-kg rate charged for every kg (or part thereof) above cost_per_kg_threshold_kg. NULL = flat rate only.';
COMMENT ON COLUMN custom_cost_rate_cards.cost_per_kg_threshold_kg IS
  'Weight threshold in kg above which cost_per_kg applies. Default 30 kg.';

COMMIT;
