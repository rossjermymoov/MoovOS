-- Migration 092: Pricing — prospects, rate card templates, approvals
-- Supports the full prospect → quote → authorise → account form → customer flow.

-- ── 1. Rate card template categories ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rate_card_categories (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL UNIQUE,  -- e.g. 'Standard', 'High Volume', 'Drop to Shop'
  description TEXT,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO rate_card_categories (name, description, sort_order) VALUES
  ('Standard',     'General starting rates for new customers',          1),
  ('High Volume',  'Discounted rates for high-volume shippers',         2),
  ('Low Volume',   'Rates for low-volume or trial customers',           3),
  ('Drop to Shop', 'Rates for customers using DPD Drop to Shop',        4),
  ('International','Templates with international markup focus',         5),
  ('Bespoke',      'Custom rates built from scratch',                   6)
ON CONFLICT (name) DO NOTHING;

-- ── 2. Rate card templates ────────────────────────────────────────────────────
-- Each template is a starting point for a courier — editable at quote time.
CREATE TABLE IF NOT EXISTS rate_card_templates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            VARCHAR(150) NOT NULL,
  category_id     INTEGER REFERENCES rate_card_categories(id) ON DELETE SET NULL,
  courier_code    VARCHAR(20) NOT NULL,   -- 'DPD', 'DHL', 'EVRI', 'UPS' etc.
  description     TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  -- rates: JSONB array of { service_code, service_name, zone_name, price, price_sub, is_international }
  rates           JSONB NOT NULL DEFAULT '[]',
  -- surcharge overrides: JSONB array of { surcharge_name, markup_pct }
  surcharge_markups JSONB NOT NULL DEFAULT '[]',
  fuel_markup_pct NUMERIC(6,2),           -- sell fuel % override (null = use customer default)
  created_by      UUID REFERENCES staff(id) ON DELETE SET NULL,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rct_courier ON rate_card_templates(courier_code);
CREATE INDEX IF NOT EXISTS idx_rct_category ON rate_card_templates(category_id);

-- ── 3. Prospects ──────────────────────────────────────────────────────────────
CREATE TYPE prospect_status AS ENUM (
  'quote',           -- rate card being built
  'pending_approval',-- rate card sent for manager sign-off
  'approved',        -- manager approved, ready to send to prospect
  'sent',            -- rate card + account form sent to prospect
  'form_returned',   -- prospect has filled in and returned the account form
  'onboarding',      -- account form accepted, being onboarded
  'converted',       -- now a full customer (customers record created)
  'lost'             -- prospect did not convert
);

CREATE TABLE IF NOT EXISTS prospects (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name        VARCHAR(255) NOT NULL,
  contact_name        VARCHAR(150) NOT NULL,
  contact_email       VARCHAR(255),
  contact_phone       VARCHAR(50),
  status              prospect_status NOT NULL DEFAULT 'quote',
  assigned_to         UUID REFERENCES staff(id) ON DELETE SET NULL,  -- sales person
  converted_customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  account_form_token  VARCHAR(64) UNIQUE,   -- secret token for the self-hosted account form URL
  account_form_sent_at TIMESTAMP WITH TIME ZONE,
  account_form_returned_at TIMESTAMP WITH TIME ZONE,
  notes               TEXT,
  created_by          UUID REFERENCES staff(id) ON DELETE SET NULL,
  created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prospects_status     ON prospects(status);
CREATE INDEX IF NOT EXISTS idx_prospects_assigned   ON prospects(assigned_to);

-- ── 4. Prospect rate cards ────────────────────────────────────────────────────
CREATE TYPE rate_card_status AS ENUM (
  'draft',
  'pending_approval',
  'approved',
  'rejected',
  'sent'
);

CREATE TABLE IF NOT EXISTS prospect_rate_cards (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id      UUID NOT NULL REFERENCES prospects(id) ON DELETE CASCADE,
  template_id      UUID REFERENCES rate_card_templates(id) ON DELETE SET NULL,
  courier_code     VARCHAR(20) NOT NULL,
  courier_name     VARCHAR(100),
  status           rate_card_status NOT NULL DEFAULT 'draft',
  -- edited rates (copy of template rates, modified by sales)
  rates            JSONB NOT NULL DEFAULT '[]',
  surcharge_markups JSONB NOT NULL DEFAULT '[]',
  fuel_markup_pct  NUMERIC(6,2),
  intl_markup_pct  NUMERIC(6,2),   -- default international markup %
  -- volume / mix for projection
  weekly_parcels   INTEGER,
  volume_mix       JSONB NOT NULL DEFAULT '[]',  -- [{ service_code, pct }]
  -- projections (calculated server-side)
  projected_weekly_revenue NUMERIC(10,2),
  projected_weekly_cost    NUMERIC(10,2),
  projected_weekly_profit  NUMERIC(10,2),
  -- audit
  created_by       UUID REFERENCES staff(id) ON DELETE SET NULL,
  updated_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prc_prospect ON prospect_rate_cards(prospect_id);

-- ── 5. Rate card approvals ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rate_card_approvals (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rate_card_id    UUID NOT NULL REFERENCES prospect_rate_cards(id) ON DELETE CASCADE,
  requested_by    UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  reviewed_by     UUID REFERENCES staff(id) ON DELETE SET NULL,
  status          VARCHAR(20) NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','approved','rejected')),
  comment         TEXT,
  requested_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at     TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_approvals_rate_card ON rate_card_approvals(rate_card_id);
CREATE INDEX IF NOT EXISTS idx_approvals_pending   ON rate_card_approvals(status) WHERE status = 'pending';
