-- ─── Migration 185 — Add ship_to_name to reconciliation_lines ────────────────
--
-- Stores the recipient name extracted from the carrier CSV (e.g. DPD column A0,
-- first comma-delimited segment of the delivery address). Used in the preview
-- CSV export for external bookings that have no charge record in our system,
-- so the operator can identify the recipient without going back to the invoice.
--
-- For internal bookings (charge_id present), the export falls back to
-- charges.ship_to_name / shipments.ship_to_name. This column is the last resort
-- fallback for carrier-direct shipments.

ALTER TABLE reconciliation_lines
  ADD COLUMN IF NOT EXISTS ship_to_name VARCHAR(200) NULL;

COMMENT ON COLUMN reconciliation_lines.ship_to_name IS
  'Recipient name extracted from the carrier CSV (e.g. DPD delivery address column, '
  'text up to first comma). Populated at run time; used in preview CSV export as a '
  'fallback when no charge record exists for the line.';
