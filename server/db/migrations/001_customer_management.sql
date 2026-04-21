-- ============================================================
-- Moov OS — Migration 001: Customer Management
-- Section 1 of the Parcel Reseller OS Specification
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE customer_tier AS ENUM ('bronze', 'silver', 'gold', 'enterprise');
CREATE TYPE account_status AS ENUM ('active', 'on_stop', 'suspended', 'churned');
CREATE TYPE health_score_status AS ENUM ('green', 'amber', 'red');
CREATE TYPE contact_flag AS ENUM ('main', 'finance', 'both', 'none');

-- ============================================================
-- STAFF / USERS (lightweight — full auth in a later migration)
-- ============================================================

CREATE TABLE staff (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name    VARCHAR(255) NOT NULL,
  email        VARCHAR(255) UNIQUE NOT NULL,
  role         VARCHAR(100) NOT NULL,  -- sales, account_management, onboarding, finance, cs, manager, director
  is_active    BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- CUSTOMERS  (Section 1.1 & 1.2)
-- ============================================================

CREATE TABLE customers (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Core fields (Section 1.2)
  business_name         VARCHAR(255) NOT NULL,
  account_number        VARCHAR(20) UNIQUE NOT NULL,   -- system-generated, e.g. MOS-00001
  registered_address    TEXT NOT NULL,
  postcode              VARCHAR(10) NOT NULL,
  phone_number          VARCHAR(30) NOT NULL,
  primary_email         VARCHAR(255) NOT NULL,
  company_reg_number    VARCHAR(50),                   -- optional

  -- Classification
  tier                  customer_tier NOT NULL DEFAULT 'bronze',
  account_status        account_status NOT NULL DEFAULT 'active',

  -- Assignments
  salesperson_id        UUID REFERENCES staff(id) ON DELETE SET NULL,
  account_manager_id    UUID REFERENCES staff(id) ON DELETE SET NULL,
  onboarding_person_id  UUID REFERENCES staff(id) ON DELETE SET NULL,

  -- Financial (Section 1.7)
  credit_limit          NUMERIC(12, 2) NOT NULL DEFAULT 0,
  payment_terms_days    SMALLINT NOT NULL DEFAULT 7,    -- 7, 14, 28, or 30
  outstanding_balance   NUMERIC(12, 2) NOT NULL DEFAULT 0,

  -- Flags
  is_on_stop            BOOLEAN NOT NULL DEFAULT false,
  on_stop_reason        TEXT,
  on_stop_applied_at    TIMESTAMPTZ,
  on_stop_applied_by    UUID REFERENCES staff(id) ON DELETE SET NULL,

  -- Health score (Section 1.6) — recalculated by AI job
  health_score          health_score_status NOT NULL DEFAULT 'green',
  health_score_summary  TEXT,
  health_score_updated  TIMESTAMPTZ,

  -- Timestamps
  date_onboarded        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-generate account number: MOS-00001, MOS-00002 …
CREATE SEQUENCE customer_account_seq START 1 INCREMENT 1;

CREATE OR REPLACE FUNCTION set_customer_account_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.account_number IS NULL OR NEW.account_number = '' THEN
    NEW.account_number := 'MOS-' || LPAD(nextval('customer_account_seq')::TEXT, 5, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_customer_account_number
  BEFORE INSERT ON customers
  FOR EACH ROW EXECUTE FUNCTION set_customer_account_number();

-- updated_at trigger
CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- ============================================================
-- CONTACTS  (Section 1.3)
-- One customer → many contacts
-- Only one 'main' contact and one 'finance' contact per customer
-- ============================================================

CREATE TABLE customer_contacts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id     UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  full_name       VARCHAR(255) NOT NULL,
  job_title       VARCHAR(255),
  phone_number    VARCHAR(30),
  email_address   VARCHAR(255) NOT NULL,
  is_main_contact    BOOLEAN NOT NULL DEFAULT false,
  is_finance_contact BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_contacts_updated_at
  BEFORE UPDATE ON customer_contacts
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- Enforce single main contact per customer
CREATE UNIQUE INDEX idx_one_main_contact
  ON customer_contacts(customer_id)
  WHERE is_main_contact = true;

-- Enforce single finance contact per customer
CREATE UNIQUE INDEX idx_one_finance_contact
  ON customer_contacts(customer_id)
  WHERE is_finance_contact = true;

-- ============================================================
-- COMMUNICATIONS HUB  (Section 1.4)
-- Unified log of all inbound/outbound communications
-- ============================================================

CREATE TYPE comm_channel AS ENUM ('email', 'whatsapp', 'ticket', 'internal_note');
CREATE TYPE comm_direction AS ENUM ('inbound', 'outbound', 'internal');

CREATE TABLE customer_communications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id     UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  channel         comm_channel NOT NULL,
  direction       comm_direction NOT NULL,
  subject         VARCHAR(500),
  body            TEXT NOT NULL,
  from_address    VARCHAR(255),      -- email address or phone number
  staff_id        UUID REFERENCES staff(id) ON DELETE SET NULL,  -- who sent it (if outbound/internal)
  external_ref    VARCHAR(255),      -- Freshdesk ticket ID, WhatsApp message ID, etc.
  is_ai_summary   BOOLEAN NOT NULL DEFAULT false,  -- true = AI-generated summary entry
  thread_id       UUID,              -- groups messages into threads
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_comms_customer ON customer_communications(customer_id, created_at DESC);

-- AI communication summary (Section 1.4) — latest per customer
CREATE TABLE customer_comm_summaries (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id     UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  summary_text    TEXT NOT NULL,
  generated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (customer_id)  -- one active summary per customer, replaced on refresh
);

-- ============================================================
-- VOLUME & PERFORMANCE DATA  (Section 1.5)
-- Daily snapshots for rolling averages. Real-time totals
-- are calculated from the parcels table (Section 3 migration).
-- This table stores pre-aggregated daily figures.
-- ============================================================

CREATE TABLE customer_volume_snapshots (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id     UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  snapshot_date   DATE NOT NULL,
  parcel_count    INTEGER NOT NULL DEFAULT 0,
  revenue         NUMERIC(12, 2) NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (customer_id, snapshot_date)
);

CREATE INDEX idx_volume_customer_date ON customer_volume_snapshots(customer_id, snapshot_date DESC);

-- Volume drop alerts (Section 1.5) — active alerts per customer
CREATE TABLE customer_volume_alerts (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id           UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  baseline_daily_avg    NUMERIC(8, 2) NOT NULL,   -- 13-week rolling average at alert time
  actual_daily_count    INTEGER NOT NULL,
  drop_percentage       NUMERIC(5, 2) NOT NULL,
  is_dismissed          BOOLEAN NOT NULL DEFAULT false,
  dismissed_by          UUID REFERENCES staff(id) ON DELETE SET NULL,
  dismissed_at          TIMESTAMPTZ,
  dismissal_note        TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- HEALTH SCORE LOG  (Section 1.6)
-- Full history of AI health score calculations
-- ============================================================

CREATE TABLE customer_health_score_log (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id           UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  score                 health_score_status NOT NULL,
  -- Signal breakdown
  sentiment_score       NUMERIC(4, 2),     -- -1.0 to 1.0
  volume_trend          VARCHAR(20),       -- growing, stable, declining
  open_queries_count    INTEGER,
  open_claims_count     INTEGER,
  payment_behaviour     VARCHAR(20),       -- on_time, late, persistent_offender
  ticket_velocity       VARCHAR(20),       -- stable, increasing, spiking
  summary               TEXT,
  calculated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_health_log_customer ON customer_health_score_log(customer_id, calculated_at DESC);

-- ============================================================
-- ON STOP AUDIT LOG  (Section 1.11)
-- Full immutable audit trail of every On Stop event
-- ============================================================

CREATE TYPE on_stop_action AS ENUM ('applied', 'removed');

CREATE TABLE customer_on_stop_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id     UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  action          on_stop_action NOT NULL,
  reason          TEXT NOT NULL,       -- mandatory for both apply and remove
  actioned_by     UUID NOT NULL REFERENCES staff(id) ON DELETE RESTRICT,
  actioned_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  moveninja_synced BOOLEAN NOT NULL DEFAULT false,  -- did the MoveNinja API call succeed?
  moveninja_error  TEXT                              -- error message if sync failed
);

CREATE INDEX idx_on_stop_customer ON customer_on_stop_log(customer_id, actioned_at DESC);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_customers_status       ON customers(account_status);
CREATE INDEX idx_customers_health       ON customers(health_score);
CREATE INDEX idx_customers_tier         ON customers(tier);
CREATE INDEX idx_customers_am           ON customers(account_manager_id);
CREATE INDEX idx_customers_salesperson  ON customers(salesperson_id);
CREATE INDEX idx_customers_on_stop      ON customers(is_on_stop) WHERE is_on_stop = true;
CREATE INDEX idx_customers_search       ON customers USING GIN (to_tsvector('english', business_name || ' ' || account_number || ' ' || primary_email));
