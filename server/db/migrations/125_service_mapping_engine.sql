-- ─── Migration 125 — Service Mapping Engine ──────────────────────────────────
--
-- 1. reconciliation_lines
--      • suggested_service_id — when Phase 1b hits an unknown service code but
--        the tracking number IS in the Verified Pool, the engine stores the
--        pool's dc_service_id here as a smart suggestion for the human reviewer.
--
-- 2. courier_service_code_mappings
--      • customer_id (nullable UUID) — allows customer-specific mappings:
--          NULL  = global rule (applies to every customer for this carrier)
--          UUID  = applies only to that customer (unique contract codes)
--      • Old UNIQUE (carrier_id, courier_code) constraint replaced by two
--        partial unique indexes:
--          - Global:            unique per (carrier_id, courier_code) WHERE customer_id IS NULL
--          - Customer-specific: unique per (carrier_id, courier_code, customer_id) WHERE customer_id IS NOT NULL
--
-- 3. Seed: DHL service code "1" → DHL-1 (return service, global)
--

-- ── reconciliation_lines: suggested_service_id ────────────────────────────────

ALTER TABLE reconciliation_lines
  ADD COLUMN IF NOT EXISTS suggested_service_id INTEGER REFERENCES courier_services(id) ON DELETE SET NULL;

COMMENT ON COLUMN reconciliation_lines.suggested_service_id IS
  'When unmatched_reason = ''unknown_service_code'' and the tracking number
   was found in the Verified Pool, this holds the service_id the engine
   recommends mapping the raw code to. Pre-populates the resolve UI dropdown.';

-- ── courier_service_code_mappings: customer_id ────────────────────────────────

ALTER TABLE courier_service_code_mappings
  ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id) ON DELETE SET NULL;

COMMENT ON COLUMN courier_service_code_mappings.customer_id IS
  'NULL = global mapping (applies to all customers for this carrier/code).
   Set to a specific customer_id for carriers where a customer has a unique
   contract code that differs from the standard mapping.';

-- Drop the old single-column unique constraint (carrier_id, courier_code).
-- It will be replaced by the two partial indexes below.
ALTER TABLE courier_service_code_mappings
  DROP CONSTRAINT IF EXISTS courier_service_code_mappings_carrier_id_courier_code_key;

-- Global mappings: at most one per (carrier_id, courier_code) with no customer
CREATE UNIQUE INDEX IF NOT EXISTS idx_cscm_global
  ON courier_service_code_mappings (carrier_id, courier_code)
  WHERE customer_id IS NULL;

-- Customer-specific mappings: at most one per (carrier_id, courier_code, customer_id)
CREATE UNIQUE INDEX IF NOT EXISTS idx_cscm_customer_specific
  ON courier_service_code_mappings (carrier_id, courier_code, customer_id)
  WHERE customer_id IS NOT NULL;

-- ── Seed: DHL code "1" → DHL-1 (return service) ──────────────────────────────
-- Uses a subquery so it's idempotent — safe to run even if IDs change.
-- Only inserts if both the DHL carrier and a DHL-1 service exist.

INSERT INTO courier_service_code_mappings
  (carrier_id, courier_code, service_id, notes, is_active, customer_id)
SELECT
  cu.id,
  '1',
  cs.id,
  'DHL return service — raw carrier code "1" maps to DHL-1',
  true,
  NULL   -- global: applies to all customers
FROM   couriers cu
JOIN   courier_services cs ON cs.courier_id = cu.id
WHERE  (cu.code ILIKE 'DHL' OR cu.name ILIKE '%DHL%')
  AND  (cs.service_code ILIKE 'DHL-1' OR cs.service_code ILIKE 'DHL1')
ON CONFLICT DO NOTHING;
