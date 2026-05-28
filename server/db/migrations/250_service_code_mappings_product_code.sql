-- ─── Migration 250 — Add product_code to courier_service_code_mappings ────────
--
-- Problem: DPD invoices have two disambiguation columns:
--   Column E  — Product Code  (e.g. 1 = Parcel, 3 = Express Pack)
--   Column G  — Service Code  (e.g. 2 = Next Day)
--
-- Multiple product types can share the same service code.  The current mappings
-- table only stores courier_code (= service code from col G), so when product 1
-- and product 3 both have service code 2, the engine cannot distinguish them and
-- inserts duplicate/conflicting lines for the same tracking number.
--
-- Fix: add an optional product_code column to courier_service_code_mappings.
-- When populated, the engine uses a composite key (service_code:product_code) for
-- the lookup, falling back to the generic service_code key if no composite match
-- is found.  This is fully backwards-compatible — all existing rows with
-- product_code = NULL continue to work as catch-alls.
--
-- Unique constraint change:
--   Old: UNIQUE (carrier_id, courier_code)
--   New: two partial unique indexes —
--     • (carrier_id, courier_code)                WHERE product_code IS NULL
--     • (carrier_id, courier_code, product_code)  WHERE product_code IS NOT NULL
--
-- The partial indexes handle NULL correctly (PostgreSQL treats two NULLs as
-- distinct in a standard UNIQUE index, which would allow unlimited NULL rows per
-- carrier+code pair — the WHERE product_code IS NULL partial index prevents that).

-- ── 1. Add the column ─────────────────────────────────────────────────────────
ALTER TABLE courier_service_code_mappings
  ADD COLUMN IF NOT EXISTS product_code VARCHAR(60);

-- ── 2. Drop the old unique constraint ────────────────────────────────────────
-- The old constraint name from migration 122 is the auto-generated name.
ALTER TABLE courier_service_code_mappings
  DROP CONSTRAINT IF EXISTS courier_service_code_mappings_carrier_id_courier_code_key;

-- ── 3. Create replacement partial unique indexes ──────────────────────────────
-- Generic mapping (no product code specified — acts as catch-all)
CREATE UNIQUE INDEX IF NOT EXISTS cscm_unique_generic
  ON courier_service_code_mappings (carrier_id, courier_code)
  WHERE product_code IS NULL;

-- Specific mapping (service code + product code together)
CREATE UNIQUE INDEX IF NOT EXISTS cscm_unique_composite
  ON courier_service_code_mappings (carrier_id, courier_code, product_code)
  WHERE product_code IS NOT NULL;

-- ── 4. Index for the new column ───────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS cscm_product_code_idx
  ON courier_service_code_mappings (product_code)
  WHERE product_code IS NOT NULL;
