-- ─── Migration 157 — Add source column to charges ────────────────────────────
--
-- Purpose: tag charges that were created directly from a carrier invoice
-- (i.e. the customer shipped a parcel via our carrier account but did NOT
-- book through the Moov OS platform).  These are real-world shipments — returns,
-- ad-hoc sends, or manual bookings — reconciled and priced so we know our
-- exact margin on them.
--
-- Possible values:
--   NULL             legacy row (webhook / billing.js / pricingEngine)
--   'carrier_direct' created by reconciliation engine from carrier invoice data
--                    (pool MISS with a known customer account).
--
-- Filterable via GET /api/billing/charges?source=carrier_direct
--
-- IDEMPOTENT: IF NOT EXISTS prevents errors on re-run.

ALTER TABLE charges ADD COLUMN IF NOT EXISTS source VARCHAR(50);
