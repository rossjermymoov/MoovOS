-- 026: add dc_customer_id to customers
-- Stores the identifier used by API-connected customers when they send webhooks.
-- These customers do not use Moov account numbers (e.g. MOOV-0110) — instead
-- their DC platform identifies them by a short name or code (e.g. "Europa").
-- Billing uses this as a fallback when account_number lookup returns no match.

ALTER TABLE customers ADD COLUMN IF NOT EXISTS dc_customer_id VARCHAR(100);
CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_dc_customer_id ON customers(dc_customer_id) WHERE dc_customer_id IS NOT NULL;
