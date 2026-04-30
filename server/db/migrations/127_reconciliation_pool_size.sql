-- Migration 127: Add pool_size column to reconciliation_runs
-- Stores the number of unique keys in the Verified Pool so it can be
-- surfaced in the UI before a user wastes time on a run with pool = 0.

ALTER TABLE reconciliation_runs
  ADD COLUMN IF NOT EXISTS pool_size INTEGER;
