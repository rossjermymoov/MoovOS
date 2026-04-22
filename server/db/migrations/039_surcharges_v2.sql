-- 039_surcharges_v2.sql
-- Extends surcharges with applies_when, charge_per, effective_date.
-- Extends shipments with additional fields needed for surcharge rule evaluation:
--   ship_from_country_iso, dimensions, per-parcel weight, declared values, hs_codes.

-- ── surcharges ────────────────────────────────────────────────────────────────
-- applies_when: 'always' = auto-apply on every matching shipment
--               'reconciliation' = code-only, added manually when invoice arrives
-- charge_per:   'shipment' = flat per shipment
--               'parcel'   = flat × parcel_count
--               (percentage surcharges always apply to base rate — not affected by this)
-- effective_date: the date from which this surcharge rate is active

ALTER TABLE surcharges
  ADD COLUMN IF NOT EXISTS applies_when   VARCHAR(20) NOT NULL DEFAULT 'reconciliation',
  ADD COLUMN IF NOT EXISTS charge_per     VARCHAR(20) NOT NULL DEFAULT 'shipment',
  ADD COLUMN IF NOT EXISTS effective_date DATE        DEFAULT CURRENT_DATE;

-- ── shipments — additional filterable fields ──────────────────────────────────
ALTER TABLE shipments
  ADD COLUMN IF NOT EXISTS ship_from_country_iso  VARCHAR(5),
  ADD COLUMN IF NOT EXISTS dim_length_cm          NUMERIC(8,2),
  ADD COLUMN IF NOT EXISTS dim_width_cm           NUMERIC(8,2),
  ADD COLUMN IF NOT EXISTS dim_height_cm          NUMERIC(8,2),
  ADD COLUMN IF NOT EXISTS parcel_weight_kg       NUMERIC(10,3),
  ADD COLUMN IF NOT EXISTS total_declared_value   NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS parcel_declared_value  NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS hs_codes               TEXT[];
