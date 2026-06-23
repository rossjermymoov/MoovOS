-- ─── Migration 189 — Add warning_count to reconciliation_runs ────────────────
--
-- Introduces a 'warning' status for reconciliation_lines where a carrier has
-- billed a surcharge (e.g. NI Clearance Charge) but no corresponding sell-side
-- surcharge charge was created on the shipment (the customer was not billed).
--
-- warning_count tracks how many such lines exist per run so the UI can surface
-- them in a dedicated amber "Warnings" tab, distinct from red "Needs Review" lines.

ALTER TABLE reconciliation_runs
  ADD COLUMN IF NOT EXISTS warning_count INTEGER NOT NULL DEFAULT 0;

COMMENT ON COLUMN reconciliation_runs.warning_count IS
  'Number of reconciliation_lines with status=warning in this run. '
  'A warning means the carrier billed a surcharge that has no corresponding '
  'sell-side surcharge charge on the shipment (customer was not billed for it).';
