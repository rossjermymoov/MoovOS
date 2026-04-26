-- Migration 108: Reconciliation service name mappings
--
-- Carrier invoices use their own internal service names (e.g. DHL's "HomeServe Sign Mand",
-- "Premier 24") which never match our internal service names.
-- This table stores the mapping so the reconciliation tab can translate them.
--
-- courier           — our internal courier identifier (e.g. 'DHL', 'DPD')
-- invoice_name      — the service name as it appears on the carrier's invoice CSV
-- internal_name     — our human-readable name for that service
-- notes             — optional context

BEGIN;

CREATE TABLE IF NOT EXISTS reconciliation_service_mappings (
  id            SERIAL PRIMARY KEY,
  courier       TEXT NOT NULL,
  invoice_name  TEXT NOT NULL,
  internal_name TEXT NOT NULL,
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (courier, invoice_name)
);

CREATE INDEX IF NOT EXISTS recon_svc_map_courier_idx
  ON reconciliation_service_mappings (courier);

COMMIT;
