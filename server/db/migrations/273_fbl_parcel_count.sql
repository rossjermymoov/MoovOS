-- Migration 273: Add parcel_count to finalized_billing_lines
--
-- Problem
-- ───────
-- The customer-facing CSV export had no parcel count column, making it
-- impossible to see how many parcels a billing line covered.
-- parcel_count already exists on reconciliation_lines (migration 164) and
-- is populated from the carrier invoice items column — it just wasn't being
-- carried forward into the finalized snapshot.
--
-- Fix
-- ───
-- Add parcel_count INTEGER to finalized_billing_lines.
-- buildSnapshot() now writes line.parcel_count into the snapshot so every
-- new finalization captures the count.  Existing rows stay NULL and will
-- read as blank in the CSV (historically correct — we didn't have the data).

ALTER TABLE finalized_billing_lines
  ADD COLUMN IF NOT EXISTS parcel_count INTEGER;

COMMENT ON COLUMN finalized_billing_lines.parcel_count IS
  'Number of parcels in this consignment as reported on the carrier invoice. '
  'Carried forward from reconciliation_lines.parcel_count at finalization time. '
  'NULL for rows finalized before migration 273.';
