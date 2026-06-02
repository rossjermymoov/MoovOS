-- Migration 285: Clear all billing and webhook shipment data
--
-- Part of Moov OS 2.4 Declared-Ledger redesign.
-- Wipes all runtime billing data in preparation for a clean rebuild.
--
-- REMOVED (data only — table structures remain):
--   finalized_billing_lines   — reconciliation output ledger
--   reconciliation_lines      — individual carrier invoice lines
--   reconciliation_runs       — carrier CSV upload jobs
--   charges                   — all courier / fuel / surcharge charge rows
--   invoices                  — all invoice stubs
--   shipments                 — all webhook-created OMS booking records
--
-- UNTOUCHED:
--   parcels / tracking_events — tracking data continues independently
--   customers                 — customer records stay
--   customer_rates            — 142,610 rate card rows stay
--   queries / query_evidence  — support queries stay
--   couriers / courier_services / zones / weight_bands — config stays
--   staff                     — user accounts stay
--   reconciliation_mappings   — learned service/surcharge mappings stay (config)
--   courier_service_code_mappings — ditto
--   courier_query_config      — per-courier chase settings stay
--   email_templates           — comms templates stay
--
-- IDEMPOTENT: TRUNCATE ... RESTART IDENTITY CASCADE is safe to re-run on empty tables.

BEGIN;

-- ── Reconciliation layer ───────────────────────────────────────────────────────
TRUNCATE TABLE finalized_billing_lines RESTART IDENTITY CASCADE;
TRUNCATE TABLE reconciliation_lines    RESTART IDENTITY CASCADE;
TRUNCATE TABLE reconciliation_runs     RESTART IDENTITY CASCADE;

-- ── Billing core ──────────────────────────────────────────────────────────────
TRUNCATE TABLE charges  CASCADE;
TRUNCATE TABLE invoices RESTART IDENTITY CASCADE;

-- ── OMS booking records (shipment.created webhook output) ─────────────────────
TRUNCATE TABLE shipments CASCADE;

-- ── Reset invoice sequence counters for all customers back to 1 ───────────────
UPDATE invoice_sequences SET next_seq = 1;

COMMIT;

DO $$
BEGIN
  RAISE NOTICE 'Migration 285 complete — all billing, charges, invoices, shipments, and reconciliation data cleared. Tracking, customers, rate cards, and queries untouched.';
END $$;
