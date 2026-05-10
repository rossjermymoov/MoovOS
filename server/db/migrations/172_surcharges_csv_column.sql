-- ─── Migration 172 — csv_column on surcharges ────────────────────────────────
--
-- WHY:
--   The surcharges table is the single source of truth for what a surcharge
--   costs us and what we charge the customer.  But there has been no way to
--   tell the system WHERE to find that surcharge's amount in a carrier's
--   invoice CSV.
--
--   Previously this was stored separately in the carrier profile's
--   surcharge_columns JSON array, decoupled from the surcharge definition.
--   That meant the cost/sell prices and the column location lived in two
--   different places, and the reconciliation engine couldn't easily join them.
--
-- COLUMN:
--   csv_column — nullable TEXT.
--   The exact column header (case-insensitive) in the carrier's invoice CSV
--   where the amount for this surcharge appears on the freight row.
--
--   Examples:
--     DPD "Global Energy Charge" surcharge → csv_column = 'Global Energy Charge'
--     DPD "Peak Surcharge"                 → csv_column = 'Peak Surcharge'
--     DHL surcharges arrive as separate invoice rows, not columns → csv_column NULL
--
--   NULL means the surcharge is NOT found in a named CSV column — it will
--   arrive either as a separate invoice row (matched by service code mapping)
--   or be triggered by rules at booking time.
--
-- IDEMPOTENT: ADD COLUMN IF NOT EXISTS.

ALTER TABLE surcharges
  ADD COLUMN IF NOT EXISTS csv_column TEXT;

COMMENT ON COLUMN surcharges.csv_column IS
  'Exact CSV column header in the carrier invoice where this surcharge amount appears on the freight row. NULL = surcharge arrives as a separate invoice row or is booking-time only.';
