-- ─── Migration 122 — Reconciliation Engine ───────────────────────────────────
-- Adds the four tables needed by the automated reconciliation engine:
--   courier_service_code_mappings  — Phase 1b normalisation: carrier CSV code → service_id
--   reconciliation_mappings        — Mapping Engine: saved human resolutions
--   reconciliation_runs            — One row per reconciliation job
--   reconciliation_lines           — One row per carrier invoice line per run

-- ─── 1. Service code normalisation ───────────────────────────────────────────
-- Translates raw codes from carrier CSVs (e.g. "220", "1") to our courier_services.id.
-- Built up over time as humans resolve unknown_service_code Unmatched lines.

CREATE TABLE IF NOT EXISTS courier_service_code_mappings (
  id                   SERIAL PRIMARY KEY,
  carrier_id           INTEGER      NOT NULL REFERENCES couriers(id) ON DELETE CASCADE,
  courier_code         VARCHAR(60)  NOT NULL,  -- raw code from carrier CSV
  service_id           INTEGER      NOT NULL REFERENCES courier_services(id) ON DELETE CASCADE,
  notes                TEXT,
  created_by           UUID         REFERENCES staff(id) ON DELETE SET NULL,
  created_from_run_id  INTEGER,               -- reconciliation_runs.id that surfaced this
  is_active            BOOLEAN      NOT NULL DEFAULT true,
  applied_count        INTEGER      NOT NULL DEFAULT 0,
  created_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (carrier_id, courier_code)
);

CREATE INDEX IF NOT EXISTS idx_cscm_carrier_code ON courier_service_code_mappings (carrier_id, courier_code);

-- ─── 2. Learned mappings (Mapping Engine) ────────────────────────────────────
-- Human resolutions that auto-apply on future runs.
-- mapping_type controls what field is matched and what resolution is applied.

CREATE TABLE IF NOT EXISTS reconciliation_mappings (
  id                        SERIAL PRIMARY KEY,
  mapping_type              VARCHAR(30)  NOT NULL,
    -- surcharge_code | service_code | account_number | delta_acceptance | weight_adjustment
  carrier_id                INTEGER      NOT NULL REFERENCES couriers(id) ON DELETE CASCADE,
  match_field               VARCHAR(60)  NOT NULL,   -- field name from the invoice line to match on
  match_value               VARCHAR(255) NOT NULL,   -- exact value to compare
  resolution_type           VARCHAR(30)  NOT NULL,   -- what the resolution does
  resolution_value          VARCHAR(255) NOT NULL,   -- target value (code, customer_id, pct, kg offset)
  customer_id               UUID         REFERENCES customers(id) ON DELETE SET NULL, -- NULL = applies to all
  created_from_line_id      INTEGER,                 -- reconciliation_lines.id that triggered this
  created_by                INTEGER      REFERENCES staff(id) ON DELETE SET NULL,
  is_active                 BOOLEAN      NOT NULL DEFAULT true,
  applied_count             INTEGER      NOT NULL DEFAULT 0,
  last_applied_at           TIMESTAMPTZ,
  created_at                TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recon_mappings_carrier ON reconciliation_mappings (carrier_id, mapping_type, is_active);

-- ─── 3. Reconciliation runs ───────────────────────────────────────────────────
-- One row per job. Tracks progress and final stats.

CREATE TABLE IF NOT EXISTS reconciliation_runs (
  id               SERIAL PRIMARY KEY,
  carrier_id       INTEGER      NOT NULL REFERENCES couriers(id),
  invoice_ref      VARCHAR(100),                  -- carrier's invoice reference number
  invoice_date     DATE,
  status           VARCHAR(20)  NOT NULL DEFAULT 'processing',
    -- processing | complete | needs_review | failed
  total_lines      INTEGER      NOT NULL DEFAULT 0,
  matched_count    INTEGER      NOT NULL DEFAULT 0,
  corrected_count  INTEGER      NOT NULL DEFAULT 0,
  unmatched_count  INTEGER      NOT NULL DEFAULT 0,
  ignored_count    INTEGER      NOT NULL DEFAULT 0,
  automation_rate  NUMERIC(5,2),                  -- % auto-resolved (no human needed)
  created_by       INTEGER      REFERENCES staff(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  completed_at     TIMESTAMPTZ,
  notes            TEXT
);

CREATE INDEX IF NOT EXISTS idx_recon_runs_carrier ON reconciliation_runs (carrier_id, created_at DESC);

-- ─── 4. Reconciliation lines ──────────────────────────────────────────────────
-- One row per carrier invoice line per run.

CREATE TABLE IF NOT EXISTS reconciliation_lines (
  id                       SERIAL PRIMARY KEY,
  run_id                   INTEGER      NOT NULL REFERENCES reconciliation_runs(id) ON DELETE CASCADE,

  -- From carrier CSV
  tracking_number          VARCHAR(100),
  carrier_account_no       VARCHAR(100),
  raw_service_code         VARCHAR(60),           -- carrier's original code, pre-normalisation
  charge_type              VARCHAR(30),           -- base | fuel | surcharge | adjustment
  carrier_amount           NUMERIC(10,4),         -- what carrier billed
  carrier_billed_weight_kg NUMERIC(8,3),          -- weight as billed by carrier

  -- After normalisation
  service_id               INTEGER REFERENCES courier_services(id),  -- resolved via courier_service_code_mappings
  customer_id              UUID REFERENCES customers(id),

  -- Matched against our system
  charge_id                INTEGER,               -- our charges.id if matched
  expected_amount          NUMERIC(10,4),         -- our cost_price for this shipment
  delta                    NUMERIC(10,4),         -- carrier_amount - expected_amount

  -- Outcome
  status                   VARCHAR(20)  NOT NULL DEFAULT 'processing',
    -- matched | corrected | unmatched | ignored
  corrected_by             VARCHAR(30),           -- mapping | pricing_rules
  unmatched_reason         VARCHAR(60),
    -- unknown_service_code | no_account_mapping | not_in_verified_pool
    -- no_pricing_rules | unexplained_delta | no_charge_found
  source                   VARCHAR(30)  NOT NULL DEFAULT 'internal',
    -- internal | external_booking
  is_fuel                  BOOLEAN      NOT NULL DEFAULT false,  -- handled by aggregate check

  -- Mapping Engine
  mapping_id               INTEGER REFERENCES reconciliation_mappings(id),

  -- Human resolution
  aged                     BOOLEAN      NOT NULL DEFAULT false,
  reconciliation_run_count INTEGER      NOT NULL DEFAULT 1,
  resolved_by              UUID         REFERENCES staff(id),
  resolved_at              TIMESTAMPTZ,
  resolution_notes         TEXT,

  created_at               TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recon_lines_run     ON reconciliation_lines (run_id, status);
CREATE INDEX IF NOT EXISTS idx_recon_lines_tracking ON reconciliation_lines (tracking_number);
CREATE INDEX IF NOT EXISTS idx_recon_lines_unmatched ON reconciliation_lines (run_id, status, aged)
  WHERE status = 'unmatched';
