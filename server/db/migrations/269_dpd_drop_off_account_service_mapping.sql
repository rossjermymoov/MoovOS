-- Migration 269: Account-based service code mapping for DPD Drop Off
--
-- Problem
-- ───────
-- DPD Drop Off (Drop Shop) parcels use the same invoice service_code ('2' =
-- Next Day) and product_code as regular DPD Next Day collections.  There is
-- no product-level distinction — the ONLY reliable identifier is the carrier
-- account number: ALL Drop Off shipments are billed under account 118909.
--
-- Fix
-- ───
-- 1. Add carrier_account_no column to courier_service_code_mappings.
--    When set, the mapping applies ONLY to invoice lines from that account.
--    The engine checks account-specific rules BEFORE the generic fallback.
--
-- 2. Fix the cscm_unique_generic partial unique index to exclude account-
--    specific rows (previously: WHERE product_code IS NULL — without also
--    filtering carrier_account_no IS NULL, inserting an account-specific row
--    with product_code=NULL would collide with the generic catch-all row for
--    the same service code).
--
-- 3. Create a new cscm_unique_account partial unique index for account-
--    specific rows.
--
-- 4. Seed: DPD, service_code '2', account 118909 → DPD12-DROP.

-- ── 1. Add carrier_account_no column ─────────────────────────────────────────
ALTER TABLE courier_service_code_mappings
  ADD COLUMN IF NOT EXISTS carrier_account_no VARCHAR(60);

-- ── 2. Fix cscm_unique_generic to exclude account-specific rows ───────────────
-- Drop old index (product_code IS NULL) and recreate with the tighter condition
-- (product_code IS NULL AND carrier_account_no IS NULL).
DROP INDEX IF EXISTS cscm_unique_generic;

CREATE UNIQUE INDEX IF NOT EXISTS cscm_unique_generic
  ON courier_service_code_mappings (carrier_id, courier_code)
  WHERE product_code IS NULL AND carrier_account_no IS NULL;

-- ── 3. New partial unique index for account-specific rows ────────────────────
CREATE UNIQUE INDEX IF NOT EXISTS cscm_unique_account
  ON courier_service_code_mappings (carrier_id, courier_code, carrier_account_no)
  WHERE carrier_account_no IS NOT NULL AND product_code IS NULL;

-- ── 4. Seed: account 118909 → DPD12-DROP ────────────────────────────────────
-- All DPD Drop Off (Drop Shop) consignments are billed under account 118909.
-- Mapping service_code '2' + account '118909' to DPD12-DROP causes the engine
-- to route these lines to the correct internal service instead of the generic
-- '2' → DPD-12 (Next Day) catch-all.
INSERT INTO courier_service_code_mappings
  (carrier_id, courier_code, carrier_account_no, service_id, is_active, notes)
SELECT
  cu.id,
  '2',
  '118909',
  cs.id,
  true,
  'DPD invoice code 2 + account 118909 = Drop Off (Drop Shop) -> DPD12-DROP. Seeded by migration 269.'
FROM couriers cu
JOIN courier_services cs ON cs.service_code = 'DPD12-DROP'
WHERE (cu.code ILIKE 'DPD' OR cu.name ILIKE 'DPD')
ON CONFLICT DO NOTHING;
