-- ─── Migration 177 — Clear csv_column on DPD overhead surcharges ───────────────
--
-- Problem:
--   Migration 176's safety block tried to clear csv_column on Fuel/Carriage/GEC
--   surcharges by matching the surcharge NAME (ILIKE patterns).  If those
--   surcharges have non-standard names (e.g. "DPD Carriage" rather than
--   "Carriage Charge") the pattern fails to match and the values remain set.
--
--   With csv_column still set, the GET /csv-profiles auto-derive includes these
--   surcharges in surcharge_columns.  mapToInvoiceLine then captures their H-row
--   column amounts in surcharge_amounts, and buildSurchargeRollup adds those
--   amounts to carrier_amount — producing e.g. £9.57 (= £9.20 base + £0.37
--   GEC + Carriage) where the reconciliation should only show £9.20.
--
-- Fix:
--   Clear csv_column by matching the VALUE of csv_column against the known DPD
--   overhead column headers.  This is independent of surcharge name and will
--   catch any surcharge definition mapped to these columns regardless of how it
--   was named.
--
--   These three columns must never appear in surcharge_columns for DPD:
--     'Fuel and Energy Charge' — separate invoice row; handled via carrier_overhead
--     'Carriage Charge'        — separate invoice row; handled via carrier_overhead
--     'Global Energy Charge'   — separate invoice row; handled via carrier_overhead
--   (migration 161: separate_fuel_rows = true auto-accepts them; migration 146/166
--   adds them to excluded_columns so they don't appear as unexplained raw deltas)
--
-- IDEMPOTENT: safe to re-run — only updates rows where csv_column IS NOT NULL
--   and matches one of the three overhead column headers.

DO $$
DECLARE
  v_carrier_id INTEGER;
  v_updated    INTEGER := 0;
BEGIN
  SELECT id INTO v_carrier_id
  FROM   couriers
  WHERE  code ILIKE 'DPD' OR name ILIKE 'DPD%'
  ORDER  BY id
  LIMIT  1;

  IF v_carrier_id IS NULL THEN
    RAISE NOTICE 'Migration 177: DPD carrier not found — skipping';
    RETURN;
  END IF;

  UPDATE surcharges
  SET    csv_column  = NULL,
         updated_at = NOW()
  WHERE  courier_id = v_carrier_id
    AND  LOWER(TRIM(csv_column)) IN (
           'fuel and energy charge',
           'carriage charge',
           'global energy charge'
         );

  GET DIAGNOSTICS v_updated = ROW_COUNT;

  IF v_updated > 0 THEN
    RAISE NOTICE 'Migration 177: cleared csv_column on % DPD overhead surcharge(s) — '
                 'Fuel/Carriage/GEC columns must not appear in surcharge_columns',
                 v_updated;
  ELSE
    RAISE NOTICE 'Migration 177: no overhead surcharges with csv_column set found — already clean';
  END IF;
END;
$$;
