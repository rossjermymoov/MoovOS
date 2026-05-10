-- ─── Migration 173 — surcharge_id on reconciliation_lines ────────────────────
--
-- WHY:
--   The reconciliation engine now produces a separate reconciliation_line for
--   each surcharge found in a carrier invoice CSV column (instead of baking
--   the amount into the freight line's carrier_amount).
--
--   Each surcharge line needs to reference the surcharge definition so that:
--     1. The billing preview can show per-surcharge cost and sell breakdowns.
--     2. Finalization can create a charge row with surcharge_id set, which the
--        invoicing engine picks up to produce line-item surcharge charges for
--        customer invoices.
--     3. Operators can identify which surcharge a line belongs to in RunDetailPage.
--
-- COLUMN:
--   surcharge_id — nullable UUID FK → surcharges(id) ON DELETE SET NULL.
--   NULL for freight base lines and any line that isn't a named CSV-column
--   surcharge (e.g. carrier_direct lines, fuel rows, unmatched lines).
--
-- IDEMPOTENT: ADD COLUMN IF NOT EXISTS.

ALTER TABLE reconciliation_lines
  ADD COLUMN IF NOT EXISTS surcharge_id UUID REFERENCES surcharges(id) ON DELETE SET NULL;

COMMENT ON COLUMN reconciliation_lines.surcharge_id IS
  'References the surcharge definition (surcharges.id) for lines produced by CSV-column surcharge extraction. NULL for freight base lines and non-surcharge rows.';

CREATE INDEX IF NOT EXISTS idx_recon_lines_surcharge ON reconciliation_lines (surcharge_id)
  WHERE surcharge_id IS NOT NULL;
