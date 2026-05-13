-- ─── Migration 176 — Populate csv_column for DPD surcharges ───────────────────
--
-- Problem:
--   Migration 172 added csv_column TEXT to the surcharges table but did not
--   populate any values.  The GET /api/reconciliation/csv-profiles endpoint
--   now auto-derives surcharge_columns by reading surcharges WHERE csv_column
--   IS NOT NULL — replacing the previously hand-maintained surcharge_columns
--   JSON in the profile.  With all DPD surcharges at csv_column = NULL the
--   auto-derive returns [] and the UI shows "No surcharges configured", making
--   every DPD reconciliation run produce zero surcharge lines.
--
-- Fix:
--   Set csv_column to the exact DPD invoice CSV column header for each
--   non-overhead DPD surcharge.  Column headers are case-insensitive in the
--   engine (findRowKey lowercases both sides), but the value stored here is
--   the canonical mixed-case form shown in the DPD invoice.
--
-- IMPORTANT — overhead surcharges left at NULL:
--   Fuel and Energy Charge, Carriage Charge, and Global Energy Charge must NOT
--   get csv_column set.  For DPD (separate_fuel_rows = true) these charges
--   arrive as SEPARATE INVOICE ROWS and are auto-accepted as carrier_overhead
--   by the engine.  They also appear as columns on every H-row but are
--   handled via profile.excluded_columns (migrations 146 and 166) which
--   prevents them appearing as unexplained deltas in raw_col_values.
--
--   Setting csv_column on them would put them in surcharge_columns AND keep
--   them as separate carrier_overhead rows — the carrier amount would be
--   counted twice (once on the freight line via buildSurchargeRollup, once on
--   the separate carrier_overhead reconciliation line).  Migration 146 is
--   explicit: "treating fuel/carriage as additive surcharges would double-count them."
--
-- IDEMPOTENT: WHERE csv_column IS NULL guard — safe to re-run; will not
--   overwrite values set by the user via the UI after this migration runs.
--
-- Surcharge → CSV column mappings (all confirmed against DPD invoice format):
--   Third Party Collection      → 'Third Party Collection'
--   Congestion Charge           → 'Congestion Charge'
--   Clearance Charge (NI/Int)   → 'Clearance Charge'
--   Oversized/Overweight Charge → 'Oversized/Overweight Charge'
--   Relabel Charge              → 'Relabel Charge'
--   Peak Surcharge              → 'Peak Surcharge'

DO $$
DECLARE
  v_carrier_id INTEGER;
  v_updated    INTEGER := 0;
  v_skipped    INTEGER := 0;
BEGIN
  SELECT id INTO v_carrier_id
  FROM   couriers
  WHERE  code ILIKE 'DPD' OR name ILIKE 'DPD%'
  ORDER  BY id
  LIMIT  1;

  IF v_carrier_id IS NULL THEN
    RAISE NOTICE 'Migration 176: DPD carrier not found — skipping';
    RETURN;
  END IF;

  -- ── Third Party Collection ──────────────────────────────────────────────────
  UPDATE surcharges
  SET    csv_column  = 'Third Party Collection',
         updated_at = NOW()
  WHERE  courier_id = v_carrier_id
    AND  name ILIKE '%third party%'
    AND  csv_column IS NULL;
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  IF v_updated > 0 THEN
    RAISE NOTICE 'Migration 176: set csv_column=''Third Party Collection'' on % row(s)', v_updated;
  ELSE
    RAISE NOTICE 'Migration 176: Third Party Collection — no matching surcharge found (already set or surcharge not created yet)';
    v_skipped := v_skipped + 1;
  END IF;

  -- ── Congestion Charge ───────────────────────────────────────────────────────
  UPDATE surcharges
  SET    csv_column  = 'Congestion Charge',
         updated_at = NOW()
  WHERE  courier_id = v_carrier_id
    AND  name ILIKE '%congestion%'
    AND  csv_column IS NULL;
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  IF v_updated > 0 THEN
    RAISE NOTICE 'Migration 176: set csv_column=''Congestion Charge'' on % row(s)', v_updated;
  ELSE
    RAISE NOTICE 'Migration 176: Congestion Charge — no matching surcharge found (already set or not created)';
    v_skipped := v_skipped + 1;
  END IF;

  -- ── Clearance Charge ────────────────────────────────────────────────────────
  -- Matches "Clearance Charge", "NI Clearance", "DPD Clearance" etc.
  -- Intentionally excludes names containing 'car parts' or other non-surcharge uses.
  UPDATE surcharges
  SET    csv_column  = 'Clearance Charge',
         updated_at = NOW()
  WHERE  courier_id = v_carrier_id
    AND  name ILIKE '%clearance%'
    AND  name NOT ILIKE '%car part%'
    AND  csv_column IS NULL;
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  IF v_updated > 0 THEN
    RAISE NOTICE 'Migration 176: set csv_column=''Clearance Charge'' on % row(s)', v_updated;
  ELSE
    RAISE NOTICE 'Migration 176: Clearance Charge — no matching surcharge found (already set or not created)';
    v_skipped := v_skipped + 1;
  END IF;

  -- ── Oversized/Overweight Charge ─────────────────────────────────────────────
  UPDATE surcharges
  SET    csv_column  = 'Oversized/Overweight Charge',
         updated_at = NOW()
  WHERE  courier_id = v_carrier_id
    AND  (name ILIKE '%oversize%' OR name ILIKE '%overweight%')
    AND  csv_column IS NULL;
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  IF v_updated > 0 THEN
    RAISE NOTICE 'Migration 176: set csv_column=''Oversized/Overweight Charge'' on % row(s)', v_updated;
  ELSE
    RAISE NOTICE 'Migration 176: Oversized/Overweight Charge — no matching surcharge found (already set or not created)';
    v_skipped := v_skipped + 1;
  END IF;

  -- ── Relabel Charge ──────────────────────────────────────────────────────────
  UPDATE surcharges
  SET    csv_column  = 'Relabel Charge',
         updated_at = NOW()
  WHERE  courier_id = v_carrier_id
    AND  name ILIKE '%relabel%'
    AND  csv_column IS NULL;
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  IF v_updated > 0 THEN
    RAISE NOTICE 'Migration 176: set csv_column=''Relabel Charge'' on % row(s)', v_updated;
  ELSE
    RAISE NOTICE 'Migration 176: Relabel Charge — no matching surcharge found (already set or not created)';
    v_skipped := v_skipped + 1;
  END IF;

  -- ── Peak Surcharge ──────────────────────────────────────────────────────────
  UPDATE surcharges
  SET    csv_column  = 'Peak Surcharge',
         updated_at = NOW()
  WHERE  courier_id = v_carrier_id
    AND  name ILIKE '%peak%'
    AND  csv_column IS NULL;
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  IF v_updated > 0 THEN
    RAISE NOTICE 'Migration 176: set csv_column=''Peak Surcharge'' on % row(s)', v_updated;
  ELSE
    RAISE NOTICE 'Migration 176: Peak Surcharge — no matching surcharge found (already set or not created)';
    v_skipped := v_skipped + 1;
  END IF;

  -- ── Safety check: ensure overhead surcharges remain at NULL ─────────────────
  -- Fuel/Carriage/Global Energy come as separate carrier_overhead rows for DPD.
  -- If any of these were set (e.g. by a previous migration attempt or manual UI
  -- edit), clear them now to prevent double-counting.
  UPDATE surcharges
  SET    csv_column  = NULL,
         updated_at = NOW()
  WHERE  courier_id = v_carrier_id
    AND  csv_column IS NOT NULL
    AND  (
           (name ILIKE '%fuel%' AND name ILIKE '%energy%')
        OR  name ILIKE '%carriage charge%'
        OR  name ILIKE '%global energy%'
    );
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  IF v_updated > 0 THEN
    RAISE NOTICE 'Migration 176: cleared csv_column on % overhead surcharge(s) to prevent double-counting', v_updated;
  END IF;

  IF v_skipped = 0 THEN
    RAISE NOTICE 'Migration 176 complete — all DPD surcharge csv_column values populated for carrier_id=%', v_carrier_id;
  ELSE
    RAISE NOTICE 'Migration 176 complete — % surcharge type(s) not found; check surcharge names in carrier management', v_skipped;
  END IF;
END;
$$;
