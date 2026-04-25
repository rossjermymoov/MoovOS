-- Migration 094: Add is_bespoke flag to courier_services
-- Bespoke services are excluded from standard rate card template loading.
-- They can still be added manually to individual prospect rate cards when needed.

ALTER TABLE courier_services
  ADD COLUMN IF NOT EXISTS is_bespoke BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN courier_services.is_bespoke IS
  'When true, this service is excluded from the carrier-services endpoint by default '
  'and will not appear when auto-loading services into rate card templates. '
  'Use for services that are always priced on a bespoke basis per customer.';
