-- Migration 128: Fix charge_id column type in reconciliation_lines
--
-- charges.id is UUID (see migration 020_billing.sql: "id UUID PRIMARY KEY DEFAULT gen_random_uuid()")
-- but reconciliation_lines.charge_id was created as INTEGER in migration 122.
-- This caused a "invalid input syntax for type integer: UUID" error for every
-- pool-hit line — the engine was finding the right charge but crashing when it
-- tried to store the UUID charge ID into an integer column.
--
-- No data loss: existing charge_id values are all NULL or 0 (no successful
-- matches have been stored yet due to this bug).

ALTER TABLE reconciliation_lines
  DROP COLUMN IF EXISTS charge_id;

ALTER TABLE reconciliation_lines
  ADD COLUMN charge_id UUID REFERENCES charges(id) ON DELETE SET NULL;
