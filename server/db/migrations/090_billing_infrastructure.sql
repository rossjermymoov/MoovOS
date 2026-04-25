-- Migration 090: Billing infrastructure
-- Adds awaiting_reconciliation status to charges,
-- enhances invoices table, and creates invoice_sequences for per-customer numbering.

-- ── 1. charges: add awaiting_reconciliation flag ──────────────────────────────
ALTER TABLE charges
  ADD COLUMN IF NOT EXISTS awaiting_reconciliation BOOLEAN NOT NULL DEFAULT FALSE;

-- Index for the billing run query (find verified, unbilled, not yet queued)
CREATE INDEX IF NOT EXISTS idx_charges_billing_run
  ON charges (customer_id, verified, billed, awaiting_reconciliation, cancelled)
  WHERE verified = TRUE AND billed = FALSE AND cancelled = FALSE;

-- ── 2. invoices: add cost and profit columns ──────────────────────────────────
ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS cost_total   NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS profit       NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS profit_pct   NUMERIC(6,2),
  ADD COLUMN IF NOT EXISTS billing_cycle VARCHAR(20),
  ADD COLUMN IF NOT EXISTS period_label  VARCHAR(50);

-- Update status check constraint to include awaiting_reconciliation
-- (invoices can be: draft → awaiting_reconciliation → sent → paid)
-- We just use a varchar with a check constraint
ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_status_check;
ALTER TABLE invoices ADD CONSTRAINT invoices_status_check
  CHECK (status IN ('draft', 'awaiting_reconciliation', 'sent', 'paid', 'void'));

-- ── 3. invoice_sequences: per-customer sequential invoice numbering ───────────
-- Format: {account_number}-{zero-padded 5-digit sequence}
-- e.g. MOOV-0176-00001
CREATE TABLE IF NOT EXISTS invoice_sequences (
  customer_id  UUID        NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  next_seq     INTEGER     NOT NULL DEFAULT 1,
  PRIMARY KEY (customer_id)
);

-- Seed a row for every existing customer so the first INSERT just does an UPDATE
INSERT INTO invoice_sequences (customer_id, next_seq)
SELECT id, 1 FROM customers
ON CONFLICT (customer_id) DO NOTHING;

-- ── 4. invoices: add account_number denormalised for easy display ─────────────
ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS account_number VARCHAR(20),
  ADD COLUMN IF NOT EXISTS customer_name  VARCHAR(255);
