-- Migration 109: Ensure reconciliation_service_mappings table exists
-- Safety re-run of migration 108 using IF NOT EXISTS — harmless if the table
-- already exists, but guarantees the schema is present after a fresh deploy.

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
