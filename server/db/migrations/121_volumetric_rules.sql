-- Migration 121: Volumetric Weight Rules
-- Creates a named volumetric rule table (name + divisor) so that rules
-- can be shared across multiple courier services (e.g. "Standard 4000"
-- applied to DPD Next Day, DPD Two Day, etc.).
--
-- replaces the ad-hoc dimensional_weight_rules approach (one row per service,
-- no sharing). The dimensional_weight_rules table is kept but no longer used
-- by the pricing engine — this new path is used instead.

-- ── Named volumetric rule templates ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS volumetric_rules (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  divisor     INTEGER      NOT NULL CHECK (divisor > 0),
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── Assign a volumetric rule to each courier service (nullable) ───────────────
ALTER TABLE courier_services
  ADD COLUMN IF NOT EXISTS volumetric_rule_id INTEGER
    REFERENCES volumetric_rules(id) ON DELETE SET NULL;

-- ── Backfill from existing dimensional_weight_rules data ─────────────────────
-- Insert one volumetric_rule row per distinct (name, divisor) combination.
INSERT INTO volumetric_rules (name, divisor)
SELECT DISTINCT name, divisor
FROM   dimensional_weight_rules
ON CONFLICT DO NOTHING;

-- Backfill courier_services.volumetric_rule_id from dimensional_weight_rules.
UPDATE courier_services cs
SET    volumetric_rule_id = vr.id
FROM   dimensional_weight_rules dwr
JOIN   volumetric_rules vr
       ON  vr.name    = dwr.name
       AND vr.divisor = dwr.divisor
WHERE  dwr.courier_service_id = cs.id
  AND  cs.volumetric_rule_id IS NULL;
