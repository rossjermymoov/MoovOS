-- ─── Migration 123 — Finalized Billing Lines ─────────────────────────────────
-- Immutable snapshot table. Created when a Reconciliation Run is marked
-- 'finalized'. Only Matched and Corrected lines are copied in.
--
-- Immutability is enforced at the application layer (no UPDATE/DELETE routes
-- exist for this table). The data here is the authoritative record of what
-- was charged for each shipment in a given carrier invoice run.
--
-- Xero push state and CSV export timestamps are tracked here.

CREATE TABLE IF NOT EXISTS finalized_billing_lines (
  id                       SERIAL PRIMARY KEY,

  -- Run context
  run_id                   INTEGER      NOT NULL REFERENCES reconciliation_runs(id),
  reconciliation_line_id   INTEGER      NOT NULL REFERENCES reconciliation_lines(id),
  charge_id                INTEGER,     -- our charges.id (NULL for external bookings)

  -- Customer
  customer_id              UUID         NOT NULL REFERENCES customers(id),
  customer_name            VARCHAR(200),

  -- Shipment metadata snapshot (values at point of finalization)
  tracking_number          VARCHAR(100),
  order_reference          VARCHAR(100),
  recipient_name           VARCHAR(200),
  recipient_postcode       VARCHAR(20),
  weight_kg                NUMERIC(8,3),
  service_name             VARCHAR(100),
  service_code             VARCHAR(60),
  despatch_date            DATE,

  -- Carrier cost snapshot (what we paid the carrier — from carrier invoice)
  carrier_base_amount      NUMERIC(10,4) NOT NULL DEFAULT 0,
  carrier_fuel_amount      NUMERIC(10,4) NOT NULL DEFAULT 0,
  carrier_surcharge_amount NUMERIC(10,4) NOT NULL DEFAULT 0,
  carrier_total_amount     NUMERIC(10,4) NOT NULL DEFAULT 0,

  -- Customer sell snapshot (what we bill the customer — from our charges table)
  sell_base_amount         NUMERIC(10,4) NOT NULL DEFAULT 0,
  sell_fuel_amount         NUMERIC(10,4) NOT NULL DEFAULT 0,
  sell_surcharge_amount    NUMERIC(10,4) NOT NULL DEFAULT 0,
  sell_total_amount        NUMERIC(10,4) NOT NULL DEFAULT 0,

  -- Margin snapshot
  margin_amount            NUMERIC(10,4) GENERATED ALWAYS AS (sell_total_amount - carrier_total_amount) STORED,

  -- Reconciliation outcome
  recon_status             VARCHAR(20)   NOT NULL,  -- matched | corrected
  corrected_by             VARCHAR(30),
  source                   VARCHAR(30)   NOT NULL DEFAULT 'internal',

  -- Xero push state
  xero_invoice_id          VARCHAR(100),
  xero_pushed_at           TIMESTAMPTZ,
  xero_push_error          TEXT,

  -- CSV export tracking
  csv_exported_at          TIMESTAMPTZ,

  -- Immutable — set once, never changed
  finalized_at             TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  UNIQUE (reconciliation_line_id)   -- one finalized snapshot per recon line
);

-- Index by run + customer for the invoice aggregation query
CREATE INDEX IF NOT EXISTS idx_fbl_run_customer ON finalized_billing_lines (run_id, customer_id);
CREATE INDEX IF NOT EXISTS idx_fbl_tracking      ON finalized_billing_lines (tracking_number);
CREATE INDEX IF NOT EXISTS idx_fbl_xero          ON finalized_billing_lines (xero_invoice_id) WHERE xero_invoice_id IS NOT NULL;

-- Track finalization state on the run itself
ALTER TABLE reconciliation_runs
  ADD COLUMN IF NOT EXISTS finalized       BOOLEAN     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS finalized_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS finalized_by    UUID        REFERENCES staff(id);
