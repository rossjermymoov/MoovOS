-- 038_surcharge_rules_v2.sql
-- Enhances surcharge_rules with:
--   logic        VARCHAR(3)  — 'AND' (all conditions must match) or 'OR' (any condition matches)
--   service_codes TEXT[]     — restrict rule to specific service codes (empty = all services)
--
-- Also relaxes the courier_id NOT NULL on surcharges so future global surcharges are possible.

ALTER TABLE surcharge_rules
  ADD COLUMN IF NOT EXISTS logic         VARCHAR(3)  NOT NULL DEFAULT 'AND',
  ADD COLUMN IF NOT EXISTS service_codes TEXT[]      NOT NULL DEFAULT '{}';
