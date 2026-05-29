-- Migration 267: DPD Drop Off invoice service code mapping
--
-- Problem
-- ───────
-- DPD Drop Off (Drop Shop) parcels are being reconciled as "DPD Next Day"
-- (DPD-12) instead of the correct internal service (DPD12-DROP, DPD-12DROPQR,
-- or DPD-DROP5KND).
--
-- Root cause
-- ──────────
-- DPD's invoice CSV distinguishes services via two columns:
--   Column G — Service Code  (e.g. 2 = Next Day delivery)
--   Column E — Product Code  (e.g. 1 = Parcel, 3 = Express Pack)
--
-- DPD Drop Off parcels share service_code = '2' (Next Day) with regular
-- collected parcels but carry a different product_code on the invoice.
-- Because no composite mapping for that product_code exists, the engine
-- falls back to the generic '2' → DPD-12 (Next Day) catch-all.
--
-- Fix
-- ───
-- Add a composite mapping for the DPD Drop Off product code so the engine
-- resolves it to DPD12-DROP before falling back to the generic mapping.
--
-- ⚠️  ACTION REQUIRED BEFORE RUNNING THIS MIGRATION ⚠️
-- ──────────────────────────────────────────────────────
-- The product code used by DPD for Drop Off (Drop Shop) parcels must be
-- confirmed from an actual DPD Drop Off invoice before this migration runs.
--
-- To find it:
--   1. Open a DPD invoice that includes Drop Off / Drop Shop consignments.
--   2. Look at Column E (Product Code) for those rows.
--   3. Replace FILL_IN_PRODUCT_CODE below with that value (e.g. '28').
--
-- Once confirmed, uncomment the INSERT below and run the migration.
--
-- Current mappings for reference:
--   courier_code='2', product_code=NULL  → service DPD-12  (Next Day — catch-all)
--   courier_code='3', product_code=NULL  → service DPD-12  (Next Day)
--
-- After adding the composite mapping the resolution order becomes:
--   courier_code='2', product_code='FILL_IN' → DPD12-DROP  ✓ (new)
--   courier_code='2', product_code=NULL      → DPD-12      (fallback for non-Drop-Off)

/*
INSERT INTO courier_service_code_mappings
  (carrier_id, courier_code, product_code, service_id, is_active, notes)
SELECT
  cu.id,
  '2',
  'FILL_IN_PRODUCT_CODE',   -- ← replace with actual DPD Drop Off product code
  cs.id,
  true,
  'DPD invoice code 2 + product FILL_IN = Drop Off / Drop Shop → DPD12-DROP. Seeded by migration 267.'
FROM couriers cu
JOIN courier_services cs ON cs.service_code = 'DPD12-DROP'
WHERE (cu.code ILIKE 'DPD' OR cu.name ILIKE 'DPD')
ON CONFLICT DO NOTHING;
*/

-- Once the product code is confirmed, also consider whether DPD-12DROPQR and
-- DPD-DROP5KND need their own composite mappings (they may share the same
-- product code but differ by account — in that case a customer-specific
-- override via the Reconciliation → Service Code Mappings UI is the right path).
