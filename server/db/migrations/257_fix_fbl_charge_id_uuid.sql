-- Migration 257: Fix finalized_billing_lines.charge_id column type
--
-- charges.id is UUID (migration 020) and reconciliation_lines.charge_id
-- was already fixed to UUID in migration 128, but finalized_billing_lines
-- was created in migration 123 with charge_id INTEGER — never updated.
-- This caused every finalization to silently fail with:
--   "invalid input syntax for type integer: <uuid>"
--
-- The column has no FK constraint and no existing data (all rows fail to
-- insert), so we can safely drop and re-add it as UUID.

ALTER TABLE finalized_billing_lines
  DROP COLUMN IF EXISTS charge_id;

ALTER TABLE finalized_billing_lines
  ADD COLUMN charge_id UUID REFERENCES charges(id) ON DELETE SET NULL;
