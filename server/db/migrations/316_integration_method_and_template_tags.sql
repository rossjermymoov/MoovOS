-- ──────────────────────────────────────────────────────────────────
-- 316 — Integration method, third-party software, template tagging
--
-- Separates three previously-tangled concepts:
--   • tier              — segment (now includes 'platinum')
--   • integration_method— how the customer connects: Moov Ninja (default),
--                         Moov API, or third-party software
--   • onboarding plan   — a freely-named template, chosen on the customer
--                         record, tagged with the tiers/methods it suits
--
-- Third-party software names are captured in a reusable list so they appear
-- in dropdowns for future customers.
-- ──────────────────────────────────────────────────────────────────

-- ─── 1. Add 'platinum' tier (top-level — enum value add) ────────────
ALTER TYPE customer_tier ADD VALUE IF NOT EXISTS 'platinum' AFTER 'gold';

-- ─── 2. Integration method enum ─────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE integration_method AS ENUM ('moov_ninja', 'moov_api', 'third_party');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── 3. Customer columns ────────────────────────────────────────────
ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS integration_method   integration_method NOT NULL DEFAULT 'moov_ninja',
  ADD COLUMN IF NOT EXISTS third_party_software TEXT,
  ADD COLUMN IF NOT EXISTS onboarding_template_id UUID REFERENCES onboarding_templates(id) ON DELETE SET NULL;

-- ─── 4. Reusable third-party software list ──────────────────────────
CREATE TABLE IF NOT EXISTS integration_software (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  is_active  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- Case-insensitive uniqueness so "ShipStation" and "shipstation" don't both appear.
CREATE UNIQUE INDEX IF NOT EXISTS uniq_integration_software_name ON integration_software (LOWER(name));

INSERT INTO integration_software (name) VALUES
  ('ShipStation'), ('Linnworks'), ('Mintsoft'), ('Veeqo')
ON CONFLICT DO NOTHING;

-- ─── 5. Template tagging (which tiers / methods a template suits) ────
ALTER TABLE onboarding_templates
  ADD COLUMN IF NOT EXISTS applicable_tiers   TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS applicable_methods TEXT[] NOT NULL DEFAULT '{}';

-- Light defaults on the seeded templates so auto-suggest has something to match.
UPDATE onboarding_templates SET applicable_methods = ARRAY['moov_api'],   applicable_tiers = ARRAY['gold','platinum']
  WHERE code = 'standard_api'  AND applicable_methods = '{}';
UPDATE onboarding_templates SET applicable_methods = ARRAY['third_party'], applicable_tiers = ARRAY['bronze','silver']
  WHERE code = 'dpd_drop_shop' AND applicable_methods = '{}';
UPDATE onboarding_templates SET applicable_methods = ARRAY['moov_ninja'],  applicable_tiers = ARRAY['bronze']
  WHERE code = 'non_api'       AND applicable_methods = '{}';
