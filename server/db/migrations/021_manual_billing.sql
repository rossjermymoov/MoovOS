-- 021_manual_billing.sql
-- Adds manual_billing flag to customers.
-- When true: customer shipments never come through the webhook (e.g. they don't
-- use the platform). The system expects courier charges for them without a
-- matching shipment, so no aged-unbilled alert fires for them.

ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS manual_billing BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN customers.manual_billing IS
  'true = customer is billed via manual invoice, not webhook shipments. Suppresses aged-unbilled alerts.';
