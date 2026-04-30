-- Migration 134: correction_metadata on reconciliation_lines
--
-- Stores structured audit data whenever the correction engine fires,
-- distinguishing clean matched lines from auto-corrected ones and
-- capturing exactly what changed (original cost, new cost, reason, weight delta).

ALTER TABLE reconciliation_lines
  ADD COLUMN IF NOT EXISTS correction_metadata JSONB;
