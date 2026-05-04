-- ─── Migration 143 — Add shipment_date to reconciliation_lines ───────────────
--
-- Stores the per-shipment date extracted from the carrier CSV (e.g. DPD "Date"
-- column = consignment despatch/collection date). Distinct from invoice_date.
--
-- Use cases:
--   1. External bookings (source = 'external_booking'): customer books directly
--      with the carrier outside Moov OS, so there is no charge record and no
--      shipments.despatch_date to fall back on. shipment_date fills that gap
--      when the finalization service builds the billing snapshot.
--   2. Lines billed by the carrier that never came through the OMS: same gap —
--      no charge_id means despatch_date is otherwise unknown.
--
-- finalizationService.buildSnapshot() uses shipment_date as the initial
-- despatch_date value; it is overridden by shipments.despatch_date when a
-- charge record is found (charge_id IS NOT NULL).

ALTER TABLE reconciliation_lines
  ADD COLUMN IF NOT EXISTS shipment_date DATE NULL;

COMMENT ON COLUMN reconciliation_lines.shipment_date IS
  'Per-row shipment/despatch date from the carrier CSV (e.g. DPD "Date" column). '
  'Used as the despatch_date fallback during finalization when charge_id is null.';
