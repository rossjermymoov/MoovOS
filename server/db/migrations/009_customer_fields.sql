-- 009_customer_fields.sql
-- Extend customers table with structured address, company type,
-- billing period/terms, VAT, EORI, IOSS, accounts email fields.
-- Also update search index to cover postcode, city, contact name.

-- ── New ENUM: company_type ────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE company_type AS ENUM ('limited_company', 'partnership', 'sole_trader');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Add 'fortnightly' to billing_cycle enum ──────────────────────────────────

DO $$ BEGIN
  ALTER TYPE billing_cycle ADD VALUE IF NOT EXISTS 'fortnightly';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Extend customers ──────────────────────────────────────────────────────────

ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS company_type      company_type,
  ADD COLUMN IF NOT EXISTS address_line_1    VARCHAR(255),
  ADD COLUMN IF NOT EXISTS address_line_2    VARCHAR(255),
  ADD COLUMN IF NOT EXISTS city              VARCHAR(100),
  ADD COLUMN IF NOT EXISTS county            VARCHAR(100),
  ADD COLUMN IF NOT EXISTS country           VARCHAR(100) NOT NULL DEFAULT 'United Kingdom',
  ADD COLUMN IF NOT EXISTS vat_number        VARCHAR(50),
  ADD COLUMN IF NOT EXISTS accounts_email    VARCHAR(255),
  ADD COLUMN IF NOT EXISTS eori_number       VARCHAR(100),
  ADD COLUMN IF NOT EXISTS ioss_number       VARCHAR(100);

-- ── Update search index to include postcode, city ─────────────────────────────

DROP INDEX IF EXISTS idx_customers_search;

CREATE INDEX idx_customers_search ON customers USING GIN (
  to_tsvector('english',
    business_name || ' ' ||
    account_number || ' ' ||
    primary_email || ' ' ||
    COALESCE(postcode, '') || ' ' ||
    COALESCE(city, '')
  )
);

-- Separate index on postcode for ILIKE prefix searches
CREATE INDEX IF NOT EXISTS idx_customers_postcode ON customers(postcode);
