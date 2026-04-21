-- ─────────────────────────────────────────────────────────────────────────────
-- 003_billing_system.sql
-- Moov OS Billing System — full schema
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Enums ────────────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE billing_cycle      AS ENUM ('weekly', 'biweekly', 'monthly');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE charge_status      AS ENUM ('unverified', 'verified', 'invoiced', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE invoice_status     AS ENUM ('draft', 'sent', 'paid');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE pricing_method     AS ENUM ('fixed', 'markup_pct', 'margin_pct');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE volume_tier_type   AS ENUM ('flat', 'graduated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE postcode_rule_type AS ENUM ('include', 'exclude');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE rule_charge_method AS ENUM ('fixed', 'percentage', 'per_kg', 'per_parcel');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE logic_operator     AS ENUM ('AND', 'OR');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE condition_operator AS ENUM (
    'equals', 'not_equals',
    'greater_than', 'less_than',
    'greater_than_or_equal', 'less_than_or_equal',
    'in', 'not_in',
    'starts_with', 'contains'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Extend customers table ────────────────────────────────────────────────────

ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS dc_id           VARCHAR(50)  UNIQUE,
  ADD COLUMN IF NOT EXISTS billing_cycle   billing_cycle NOT NULL DEFAULT 'monthly',
  ADD COLUMN IF NOT EXISTS vat_enabled     BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS xero_contact_id VARCHAR(100),
  ADD COLUMN IF NOT EXISTS multi_box_pricing BOOLEAN NOT NULL DEFAULT FALSE;

-- ── couriers ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS couriers (
  id         SERIAL PRIMARY KEY,
  code       VARCHAR(50) UNIQUE NOT NULL,
  name       VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── courier_services ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS courier_services (
  id                  SERIAL PRIMARY KEY,
  courier_id          INTEGER NOT NULL REFERENCES couriers(id) ON DELETE CASCADE,
  service_code        VARCHAR(50) UNIQUE NOT NULL,
  name                VARCHAR(100) NOT NULL,
  fuel_surcharge_pct  NUMERIC(6,2),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── zones ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS zones (
  id                  SERIAL PRIMARY KEY,
  courier_service_id  INTEGER NOT NULL REFERENCES courier_services(id) ON DELETE CASCADE,
  name                VARCHAR(100) NOT NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── zone_country_codes ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS zone_country_codes (
  id         SERIAL PRIMARY KEY,
  zone_id    INTEGER NOT NULL REFERENCES zones(id) ON DELETE CASCADE,
  country_iso VARCHAR(3) NOT NULL,
  UNIQUE (zone_id, country_iso)
);

-- ── zone_postcode_rules ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS zone_postcode_rules (
  id              SERIAL PRIMARY KEY,
  zone_id         INTEGER NOT NULL REFERENCES zones(id) ON DELETE CASCADE,
  postcode_prefix VARCHAR(10) NOT NULL,
  rule_type       postcode_rule_type NOT NULL
);

-- ── weight_bands ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS weight_bands (
  id             SERIAL PRIMARY KEY,
  zone_id        INTEGER NOT NULL REFERENCES zones(id) ON DELETE CASCADE,
  min_weight_kg  NUMERIC(8,3) NOT NULL,
  max_weight_kg  NUMERIC(8,3) NOT NULL,
  price_first    NUMERIC(10,4) NOT NULL,
  price_sub      NUMERIC(10,4),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── custom_cost_rate_cards ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS custom_cost_rate_cards (
  id                  SERIAL PRIMARY KEY,
  courier_service_id  INTEGER NOT NULL REFERENCES courier_services(id) ON DELETE CASCADE,
  zone_id             INTEGER NOT NULL REFERENCES zones(id) ON DELETE CASCADE,
  name                VARCHAR(100),
  min_weight_kg       NUMERIC(8,3) NOT NULL,
  max_weight_kg       NUMERIC(8,3) NOT NULL,
  price_first         NUMERIC(10,4) NOT NULL,
  price_sub           NUMERIC(10,4),
  active_from         DATE,
  active_to           DATE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── customer_pricing ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS customer_pricing (
  id                  SERIAL PRIMARY KEY,
  customer_id         INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  courier_service_id  INTEGER NOT NULL REFERENCES courier_services(id) ON DELETE CASCADE,
  zone_id             INTEGER NOT NULL REFERENCES zones(id) ON DELETE CASCADE,
  min_weight_kg       NUMERIC(8,3) NOT NULL,
  max_weight_kg       NUMERIC(8,3) NOT NULL,
  pricing_method      pricing_method NOT NULL,
  fixed_price         NUMERIC(10,4),
  markup_pct          NUMERIC(6,2),
  margin_pct          NUMERIC(6,2),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── volume_tiers ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS volume_tiers (
  id                  SERIAL PRIMARY KEY,
  customer_id         INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  courier_service_id  INTEGER NOT NULL REFERENCES courier_services(id) ON DELETE CASCADE,
  zone_id             INTEGER REFERENCES zones(id) ON DELETE SET NULL,
  min_parcels         INTEGER NOT NULL,
  max_parcels         INTEGER,
  tier_type           volume_tier_type NOT NULL,
  price               NUMERIC(10,4) NOT NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── dimensional_weight_rules ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS dimensional_weight_rules (
  id                  SERIAL PRIMARY KEY,
  courier_service_id  INTEGER NOT NULL REFERENCES courier_services(id) ON DELETE CASCADE,
  name                VARCHAR(100) NOT NULL,
  divisor             INTEGER NOT NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── congestion_surcharges ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS congestion_surcharges (
  id                  SERIAL PRIMARY KEY,
  courier_service_id  INTEGER NOT NULL REFERENCES courier_services(id) ON DELETE CASCADE,
  postcode_prefix     VARCHAR(10) NOT NULL,
  fee                 NUMERIC(10,4) NOT NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── rules_engine_rules ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS rules_engine_rules (
  id                  SERIAL PRIMARY KEY,
  name                VARCHAR(100) NOT NULL,
  courier_service_id  INTEGER REFERENCES courier_services(id) ON DELETE CASCADE,
  charge_method       rule_charge_method NOT NULL,
  charge_value        NUMERIC(10,4) NOT NULL,
  charge_base         VARCHAR(50),
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── rules_engine_conditions ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS rules_engine_conditions (
  id              SERIAL PRIMARY KEY,
  rule_id         INTEGER NOT NULL REFERENCES rules_engine_rules(id) ON DELETE CASCADE,
  logic_operator  logic_operator NOT NULL DEFAULT 'AND',
  json_field_path VARCHAR(200) NOT NULL,
  operator        condition_operator NOT NULL,
  value           TEXT NOT NULL
);

-- ── charges ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS charges (
  id                    SERIAL PRIMARY KEY,
  customer_id           INTEGER NOT NULL REFERENCES customers(id),
  voila_shipment_id     BIGINT NOT NULL,
  order_id              VARCHAR(100) NOT NULL,
  tracking_code         VARCHAR(100),
  courier_service_id    INTEGER NOT NULL REFERENCES courier_services(id),
  zone_id               INTEGER NOT NULL REFERENCES zones(id),
  charge_type           VARCHAR(100) NOT NULL,
  parcel_number         INTEGER,
  weight_actual_kg      NUMERIC(8,3),
  weight_dimensional_kg NUMERIC(8,3),
  weight_charged_kg     NUMERIC(8,3),
  cost_price            NUMERIC(10,4) NOT NULL,
  sell_price            NUMERIC(10,4) NOT NULL,
  margin                NUMERIC(10,4) GENERATED ALWAYS AS (sell_price - cost_price) STORED,
  status                charge_status NOT NULL DEFAULT 'unverified',
  despatch_date         TIMESTAMPTZ,
  ship_to_postcode      VARCHAR(20),
  ship_to_country_iso   VARCHAR(3),
  ship_to_name          VARCHAR(100),
  parcel_count          INTEGER,
  invoice_id            INTEGER,
  raw_payload           JSONB,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS charges_voila_shipment_idx ON charges(voila_shipment_id);
CREATE INDEX IF NOT EXISTS charges_customer_status_idx ON charges(customer_id, status);
CREATE INDEX IF NOT EXISTS charges_order_id_idx ON charges(order_id);

-- ── invoices ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS invoices (
  id                   SERIAL PRIMARY KEY,
  customer_id          INTEGER NOT NULL REFERENCES customers(id),
  invoice_number       VARCHAR(50) UNIQUE NOT NULL,
  billing_period_start DATE NOT NULL,
  billing_period_end   DATE NOT NULL,
  subtotal             NUMERIC(12,4) NOT NULL DEFAULT 0,
  vat_amount           NUMERIC(12,4) NOT NULL DEFAULT 0,
  total                NUMERIC(12,4) NOT NULL DEFAULT 0,
  status               invoice_status NOT NULL DEFAULT 'draft',
  xero_invoice_id      VARCHAR(100),
  generated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- FK from charges.invoice_id → invoices.id (added after invoices table exists)
ALTER TABLE charges
  ADD CONSTRAINT IF NOT EXISTS charges_invoice_fk
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL;

-- ── invoice_line_items ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS invoice_line_items (
  id          SERIAL PRIMARY KEY,
  invoice_id  INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  charge_id   INTEGER REFERENCES charges(id) ON DELETE SET NULL,
  description VARCHAR(255) NOT NULL,
  charge_type VARCHAR(100) NOT NULL,
  quantity    INTEGER NOT NULL DEFAULT 1,
  unit_price  NUMERIC(10,4) NOT NULL,
  total       NUMERIC(12,4) NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── price_increases ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS price_increases (
  id                  SERIAL PRIMARY KEY,
  name                VARCHAR(100) NOT NULL,
  increase_pct        NUMERIC(6,2) NOT NULL,
  courier_service_id  INTEGER REFERENCES courier_services(id) ON DELETE SET NULL,
  active_from         DATE NOT NULL,
  applied             BOOLEAN NOT NULL DEFAULT FALSE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── price_increase_exclusions ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS price_increase_exclusions (
  id                SERIAL PRIMARY KEY,
  price_increase_id INTEGER NOT NULL REFERENCES price_increases(id) ON DELETE CASCADE,
  customer_id       INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  UNIQUE (price_increase_id, customer_id)
);

-- ── invoice number sequence ───────────────────────────────────────────────────
CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START 1000;
