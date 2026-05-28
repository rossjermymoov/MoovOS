-- ─── Migration 246 — Add DPD Fourth Party Collection surcharge ───────────────
--
-- Problem:
--   DPD invoices contain a "Fourth Party Collection" column that is charged when
--   DPD collects from a fourth-party sender on behalf of the account holder.
--   Migration 176 mapped the closely-related "Third Party Collection" column to
--   a surcharge record, but "Fourth Party Collection" was never added.
--
--   Without a surcharge record with csv_column = 'Fourth Party Collection':
--     1. The profile's surcharge_columns (auto-derived from surcharges WHERE
--        csv_column IS NOT NULL) never includes this column.
--     2. The engine's CSV parser never captures the amount.
--     3. The column value silently disappears into raw_col_values and never
--        appears in reconciliation line metadata or customer invoicing.
--
-- Fix:
--   INSERT a new DPD surcharge "Fourth Party Collection" with:
--     • csv_column = 'Fourth Party Collection'   — maps the CSV column
--     • reconciliation_excluded = true            — variable pass-through:
--         DPD charges us whatever the 4th party charges them; there is no fixed
--         cost_price to reconcile against.  reconciliation_excluded = true tells
--         the engine to treat expectedCost = carrierAmt (absorbed) so no spurious
--         delta is created.  The surcharge still appears in correction_metadata.
--     • charge_per = 'shipment'                  — one charge per consignment
--     • cost_price = 0, default_value = 0        — variable, set per-customer override
--
-- Also:
--   Verify Third Party Collection has reconciliation_excluded = true so it is
--   treated consistently as a variable pass-through.
--
-- IDEMPOTENT: INSERT ... ON CONFLICT (courier_id, code) DO NOTHING — safe to re-run.

DO $$
DECLARE
  v_carrier_id  INTEGER;
  v_inserted    INTEGER := 0;
  v_updated     INTEGER := 0;
BEGIN

  SELECT id INTO v_carrier_id
  FROM   couriers
  WHERE  code ILIKE 'DPD' OR name ILIKE 'DPD%'
  ORDER  BY id
  LIMIT  1;

  IF v_carrier_id IS NULL THEN
    RAISE NOTICE 'Migration 246: DPD carrier not found — skipping';
    RETURN;
  END IF;

  RAISE NOTICE 'Migration 246: found DPD carrier_id = %', v_carrier_id;

  -- ── Insert Fourth Party Collection ─────────────────────────────────────────
  INSERT INTO surcharges (
    courier_id, code, name, description,
    calc_type, calc_base,
    cost_price, default_value,
    charge_per,
    csv_column,
    reconciliation_excluded,
    active
  ) VALUES (
    v_carrier_id,
    'DPD-4PC',
    'Fourth Party Collection',
    'DPD surcharge for collecting a parcel from a fourth-party sender on behalf of the account. Amount is variable and passed through at carrier cost.',
    'flat',
    'fixed',
    0,      -- cost_price: variable, engine absorbs actual carrier amount
    0,      -- default_value: override per customer if a fixed margin is desired
    'shipment',
    'Fourth Party Collection',
    true,   -- reconciliation_excluded: absorbed pass-through (variable cost, no fixed rate)
    true
  )
  ON CONFLICT (courier_id, code) DO NOTHING;

  GET DIAGNOSTICS v_inserted = ROW_COUNT;
  IF v_inserted > 0 THEN
    RAISE NOTICE 'Migration 246: inserted Fourth Party Collection surcharge (DPD-4PC) for carrier_id=%', v_carrier_id;
  ELSE
    RAISE NOTICE 'Migration 246: Fourth Party Collection (DPD-4PC) already exists — skipped insert';
  END IF;

  -- ── Ensure csv_column is set on the new record (handles DO NOTHING case) ───
  UPDATE surcharges
  SET    csv_column           = 'Fourth Party Collection',
         reconciliation_excluded = true,
         updated_at           = NOW()
  WHERE  courier_id = v_carrier_id
    AND  code = 'DPD-4PC'
    AND  (csv_column IS NULL OR csv_column <> 'Fourth Party Collection');

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  IF v_updated > 0 THEN
    RAISE NOTICE 'Migration 246: updated csv_column/reconciliation_excluded on existing DPD-4PC record';
  END IF;

  -- ── Align Third Party Collection: set reconciliation_excluded = true ────────
  --   Third Party Collection is the same pattern: DPD charges a variable amount
  --   for collecting from a third-party sender.  Without reconciliation_excluded,
  --   the engine compares the carrier amount against a static cost_price and
  --   flags every line with a 3PC charge as price_mismatch.
  UPDATE surcharges
  SET    reconciliation_excluded = true,
         updated_at              = NOW()
  WHERE  courier_id = v_carrier_id
    AND  name ILIKE '%third party%collection%'
    AND  reconciliation_excluded = false;

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  IF v_updated > 0 THEN
    RAISE NOTICE 'Migration 246: set reconciliation_excluded=true on Third Party Collection surcharge (was false — would have caused price_mismatch on every 3PC line)';
  ELSE
    RAISE NOTICE 'Migration 246: Third Party Collection already has reconciliation_excluded=true or not found';
  END IF;

  RAISE NOTICE 'Migration 246 complete.';
END $$;
