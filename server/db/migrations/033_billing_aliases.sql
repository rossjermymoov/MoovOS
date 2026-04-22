-- 033_billing_aliases.sql
-- Adds billing_aliases TEXT[] to customers table.
-- Billing engine checks aliases as last-resort when no other resolution works.

ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS billing_aliases TEXT[] NOT NULL DEFAULT '{}';

-- Index for fast alias lookups in billing
CREATE INDEX IF NOT EXISTS idx_customers_billing_aliases ON customers USING GIN (billing_aliases);
