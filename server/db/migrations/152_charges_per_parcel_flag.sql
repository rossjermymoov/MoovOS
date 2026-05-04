-- ─── Migration 152 — Add charges_per_parcel flag to courier_services ─────────
--
-- PROBLEM:
--   pricingEngine.js iterates create_label_parcels and creates ONE courier
--   charge (+ one fuel charge) per physical parcel. For a 6-parcel DPD
--   shipment this produces 6 courier rows + 6 fuel rows.
--
--   DPD invoices ONE line per consignment (all parcels combined). The
--   reconciliation pool picks the first matching charge and compares its
--   total_cost_price against the full consignment amount → price_mismatch.
--
-- FIX:
--   Add charges_per_parcel BOOLEAN to courier_services:
--     FALSE (default) = consolidate all parcel charges into ONE courier
--                       charge + ONE fuel charge per shipment. The per-parcel
--                       band lookups still run (correct for weight-banded
--                       pricing), but results are summed before insertion.
--     TRUE            = keep one charge row per parcel (legacy DHL-style
--                       invoicing where each parcel appears as a separate
--                       invoice line).
--
-- IDEMPOTENT: ADD COLUMN IF NOT EXISTS is safe to re-run.

ALTER TABLE courier_services
  ADD COLUMN IF NOT EXISTS charges_per_parcel BOOLEAN NOT NULL DEFAULT FALSE;

-- DPD services should remain FALSE (default — consolidate).
-- Set TRUE only for any service that genuinely invoices per parcel.
-- No UPDATE needed: the default is already correct for all existing services.

-- Verify
DO $$
BEGIN
  RAISE NOTICE 'Migration 152 complete — charges_per_parcel column added to courier_services (default = false)';
END $$;
