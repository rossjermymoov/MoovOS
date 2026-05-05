-- ─── Migration 158 — Unique index: carrier_direct tracking codes ─────────────
--
-- Problem:
--   carrier_direct charges have voila_shipment_id = NULL, so the existing
--   unique constraint on voila_shipment_id (migration 154) never fires.
--   Re-processing the same carrier invoice twice, or resubmitting a crashed
--   reconciliation run, would silently create a second charge for the same
--   tracking number.
--
-- Fix:
--   Partial unique index on (tracking_code) scoped to active carrier_direct
--   charges only.  The ON CONFLICT DO NOTHING in insertCharges will now catch
--   the duplicate and skip the insert, leaving the reconciliation line linked
--   to the existing charge.
--
-- Scope:
--   Only applies where source = 'carrier_direct' AND cancelled = false.
--   Does not affect platform-booked charges (source IS NULL or other values),
--   which may legitimately share a tracking_code across different shipments
--   (e.g. re-used return labels on some carriers).
--
-- IDEMPOTENT: IF NOT EXISTS prevents errors on re-run.

CREATE UNIQUE INDEX IF NOT EXISTS idx_charges_carrier_direct_tracking
ON charges (tracking_code)
WHERE source       = 'carrier_direct'
  AND cancelled    = false
  AND tracking_code IS NOT NULL;
