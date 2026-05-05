-- ─── Migration 161 — DPD profile: separate_fuel_rows flag ────────────────────
--
-- Problem:
--   DPD invoices include carrier-level overhead charges (fuel, carriage, global
--   energy) as SEPARATE ROWS in the CSV, each sharing the same consignment
--   number as the base freight row but carrying a full-description service code
--   (e.g. "Fuel and Energy Charge", "Carriage Charge").
--
--   The reconciliation engine was comparing the base freight row's carrier_amount
--   (e.g. £3.76) against charges.total_cost_price which includes our internal
--   fuel/surcharge records (e.g. £4.56), causing a systematic £0.80 mismatch
--   on every DPD line.  The overhead rows themselves had no service mapping so
--   they were blocked as unknown_service_code.
--
-- Fix:
--   Add separate_fuel_rows: true to the DPD default CSV profile.
--   When this flag is set the engine:
--     1. Compares freight lines against charges.cost_price (base only).
--     2. Auto-accepts overhead rows (unknown service code) as carrier_overhead.
--
-- IDEMPOTENT: safe to re-run.

UPDATE carrier_csv_profiles
SET    column_map = column_map || '{"separate_fuel_rows": true}'::jsonb,
       updated_at = NOW()
WHERE  carrier_id = (
         SELECT id FROM couriers
         WHERE  code ILIKE 'DPD' OR name ILIKE 'DPD%'
         ORDER  BY id
         LIMIT  1
       )
  AND  is_default = true
  AND  NOT (column_map ? 'separate_fuel_rows');
