-- Migration 132: add recon_corrected flag to charges
--
-- When the reconciliation correction engine validates that a carrier's charge
-- matches the rate card (but differs from the stored cost_price), the line is
-- marked 'corrected'. This flag persists on the charge so that future
-- reconciliation runs surface the same line as 'corrected' rather than
-- 'matched', preserving the audit trail even after cost_price is aligned.

ALTER TABLE charges
  ADD COLUMN IF NOT EXISTS recon_corrected BOOLEAN NOT NULL DEFAULT FALSE;

-- Backfill: flag charges where cost_price already has an overage component
-- applied (i.e. cost_price > price_first of the matching ceiling band with
-- a cost_per_kg rate). These were silently updated by the correction engine
-- in an earlier run and would otherwise appear as matched forever.
UPDATE charges c
SET    recon_corrected = TRUE
FROM   shipments        s
JOIN   couriers         co ON (
         s.courier ILIKE co.code
         OR s.courier ILIKE co.name
         OR s.courier ILIKE '%' || co.code || '%'
         OR co.code   ILIKE '%' || s.courier || '%'
       )
JOIN   courier_services cs ON cs.courier_id = co.id
JOIN   zones            z  ON z.courier_service_id = cs.id
                           AND z.name = c.zone_name
JOIN   weight_bands     wb ON wb.zone_id    = z.id
                           AND wb.cost_per_kg > 0
                           AND c.cost_price  > wb.price_first
WHERE  c.shipment_id = s.id
  AND  c.charge_type = 'courier'
  AND  c.verified    = TRUE
  AND  c.cancelled   = FALSE
  AND  c.cost_price  IS NOT NULL;
