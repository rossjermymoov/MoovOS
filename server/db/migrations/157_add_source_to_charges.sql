-- ─── Migration 157 — Add source column to charges ────────────────────────────
--
-- Purpose: tag charges that were auto-created by the reconciliation engine
-- when a carrier invoice line has no matching OMS charge record (Ghost Charge
-- Rule).  Existing rows get NULL (legacy / webhook-created charges), new ghost
-- charges get 'invoice_auto_create'.
--
-- Possible values:
--   NULL                  legacy row (webhook, billing.js, pricingEngine)
--   'invoice_auto_create' created by reconciliation engine Ghost Charge Rule
--
-- IDEMPOTENT: IF NOT EXISTS guards prevent errors on re-run.

ALTER TABLE charges ADD COLUMN IF NOT EXISTS source VARCHAR(50);
