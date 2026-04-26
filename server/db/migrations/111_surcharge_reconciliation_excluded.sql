-- Migration 111: add reconciliation_excluded flag to surcharges
-- When true, charges of this surcharge type are excluded from carrier cost
-- reconciliation totals — used for surcharges charged to the customer but
-- not billed by the carrier (e.g. admin fees, handling charges).
ALTER TABLE surcharges
  ADD COLUMN IF NOT EXISTS reconciliation_excluded BOOLEAN NOT NULL DEFAULT false;
