-- Migration 258: Add archived flag to reconciliation_runs
--
-- Allows completed reconciliation runs to be archived once the weekly
-- billing cycle is done (finalized + pushed to Xero). Archived runs are
-- hidden from the default runs list view; a toggle reveals them.

ALTER TABLE reconciliation_runs
  ADD COLUMN IF NOT EXISTS archived BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_recon_runs_archived ON reconciliation_runs (archived);
