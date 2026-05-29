-- Migration 268: Remove rate_fallback_service_id from DPD Drop Off services
--
-- Problem (Saturn Display phantom pricing)
-- ────────────────────────────────────────
-- Saturn Display has no DPD Drop Off rates configured — only DPD Next Day
-- (DPD-12) rates.  If any of the DPD Drop Off services (DPD12-DROP,
-- DPD-12DROPQR, DPD-DROP5KND) has rate_fallback_service_id pointing to
-- DPD-12, the billing / pricing engine would fall back to DPD-12 rates when
-- looking up a Drop Off charge for Saturn Display.  This makes the charge
-- appear correctly priced when it should be unpriced (or flagged), masking the
-- missing rate configuration.
--
-- Fix: NULL out rate_fallback_service_id on all three Drop Off services.
-- The pricing engine will then correctly return "no rate found" for customers
-- without Drop Off rates, rather than silently using Next Day prices.
--
-- Safe to re-run: WHERE clause only touches rows where the column is non-null,
-- so re-running is a no-op.
--
-- NOTE: migration 170 added rate_fallback_service_id to courier_services and
-- seeded only the DPD International Express DDP → International Express fallback.
-- If a fallback was subsequently set on the Drop Off services via the UI or a
-- manual DB update, this migration removes it.

UPDATE courier_services
SET    rate_fallback_service_id = NULL
WHERE  service_code IN ('DPD12-DROP', 'DPD-12DROPQR', 'DPD-DROP5KND')
  AND  rate_fallback_service_id IS NOT NULL;
