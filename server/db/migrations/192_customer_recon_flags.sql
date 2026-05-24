-- ─── Migration 192 — Customer reconciliation flags ───────────────────────────
--
-- Adds reconciliation_flexible_parcel_count to customers.
--
-- When true, the reconciliation engine skips the parcel-count mismatch gate
-- for this customer. Normally, if the carrier invoices MORE parcels than the
-- OMS booking recorded, the line is flagged RED so the operator can dispute.
-- This flag bypasses that check for customers where the carrier systematically
-- bills sub-parcel pricing on multi-piece shipments (e.g. Europa), causing an
-- apparent parcel count discrepancy that is NOT a billing dispute.
--
-- Europa-specific context:
--   When Europa books a second parcel after a cut-off point in the day, the
--   carrier bills it as a sub-parcel on the same consignment. The OMS records
--   it as a separate shipment. Moov charges Europa full price for every parcel
--   (intentional — this is Europa's arrangement); the carrier reconciliation
--   engine would otherwise flag this as a parcel count mismatch and reject it.
--   Setting reconciliation_flexible_parcel_count = true suppresses that gate
--   for Europa so the reconciliation can proceed normally.

ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS reconciliation_flexible_parcel_count BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN customers.reconciliation_flexible_parcel_count IS
  'When true, the reconciliation engine skips the parcel count mismatch gate '
  'for this customer. Use for customers where the carrier systematically invoices '
  'at sub-parcel rates on multi-piece consignments but Moov bills each parcel '
  'at full price (e.g. Europa).';

-- Set the flag for Europa
UPDATE customers
SET    reconciliation_flexible_parcel_count = true
WHERE  business_name ILIKE '%europa%';
