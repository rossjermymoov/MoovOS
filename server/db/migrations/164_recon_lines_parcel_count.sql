-- ─── Migration 164 — add parcel_count to reconciliation_lines ────────────────
--
-- Problem:
--   reconciliation_lines had no parcel_count column.  The reconciliation engine
--   reads line.parcel_count in reprocessMappedLines to compute the correct
--   expected cost for multi-parcel all_sub shipments (DPD), but the value was
--   never stored so it always read NULL → defaulted to 1 → wrong expected.
--
-- Fix:
--   Add parcel_count INTEGER to reconciliation_lines.
--   The engine now writes this on every insertLine call from the invoice's
--   parsed parcel_count (items column from the DPD CSV profile).
--
-- IDEMPOTENT: safe to re-run.

ALTER TABLE reconciliation_lines
  ADD COLUMN IF NOT EXISTS parcel_count INTEGER;

COMMENT ON COLUMN reconciliation_lines.parcel_count IS
  'Number of parcels in this consignment as reported on the carrier invoice (items column). '
  'Used by the reconciliation engine to compute the correct expected cost for multi-parcel '
  'all_sub carriers (DPD) where every parcel including the first is billed at price_sub.';
