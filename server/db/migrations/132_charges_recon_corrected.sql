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
--
-- Note: PostgreSQL UPDATE...FROM does not allow the target table to be
-- referenced inside JOIN ON clauses. Using comma-style FROM so all
-- cross-table conditions live in WHERE where the target table is accessible.
-- Only flag charges where the shipment weight actually exceeded the band
-- ceiling (total_weight_kg > max_weight_kg) — this is the definitive signal
-- that per-kg overage was applied. Using cost_price > price_first is too
-- broad and incorrectly catches multi-parcel shipments where the extra cost
-- is price_sub (which was always the expected billing, not a correction).
UPDATE charges
SET    recon_corrected = TRUE
FROM   shipments        s,
       couriers         co,
       courier_services cs,
       zones            z,
       weight_bands     wb
WHERE  charges.shipment_id          = s.id
  AND  charges.charge_type          = 'courier'
  AND  charges.verified             = TRUE
  AND  charges.cancelled            = FALSE
  AND  charges.cost_price           IS NOT NULL
  AND  (
         s.courier ILIKE co.code
         OR s.courier ILIKE co.name
         OR s.courier ILIKE '%' || co.code || '%'
         OR co.code   ILIKE '%' || s.courier || '%'
       )
  AND  cs.courier_id                = co.id
  AND  z.courier_service_id         = cs.id
  AND  z.name                       = charges.zone_name
  AND  wb.zone_id                   = z.id
  AND  wb.cost_per_kg               > 0
  AND  wb.max_weight_kg             IS NOT NULL
  AND  s.total_weight_kg            > wb.max_weight_kg;
