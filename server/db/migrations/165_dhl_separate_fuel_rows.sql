-- ─── Migration 165 — DHL profile: separate_fuel_rows flag ────────────────────
--
-- Problem:
--   DHL invoices bill HGV surcharge and fuel surcharge as two aggregate rows
--   at the BOTTOM of the invoice CSV, each with a blank consignment number.
--   These rows are already discarded by the reconciliation engine (the
--   reconcilableLines filter drops any line with no tracking number).
--
--   However, billing.js stores HGV and fuel charges with a cost_price at
--   booking time. The pool query sums these into total_cost_price:
--
--     total_cost_price = cost_price (base) + SUM(fuel + HGV cost_prices)
--
--   The engine (without separate_fuel_rows) compares:
--     carrier_amount  = base freight only  (e.g. £3.76)
--     expectedBase    = total_cost_price   (e.g. £4.23 = £3.76 + £0.13 HGV + £0.34 fuel)
--     delta           = −£0.47 → price_mismatch on EVERY freight line
--
-- Fix:
--   Add separate_fuel_rows: true to the DHL default CSV profile.
--   When this flag is set the engine compares freight lines against
--   charges.cost_price (base only), not total_cost_price.
--   The aggregate HGV and fuel rows are already discarded, so no further
--   changes are needed.
--
-- If no DHL default profile exists yet, a minimal one is created so the
-- flag takes effect immediately without breaking any existing column_map
-- settings configured via the UI.
--
-- IDEMPOTENT: safe to re-run.

DO $$
DECLARE
  v_carrier_id INTEGER;
BEGIN
  SELECT id INTO v_carrier_id
  FROM   couriers
  WHERE  code ILIKE 'DHL' OR name ILIKE 'DHL%'
  ORDER  BY id
  LIMIT  1;

  IF v_carrier_id IS NULL THEN
    RAISE NOTICE 'DHL carrier not found — skipping migration 165';
    RETURN;
  END IF;

  -- Create a minimal default profile if one does not exist yet
  INSERT INTO carrier_csv_profiles (carrier_id, name, is_default, column_map, preamble_rows)
  SELECT v_carrier_id, 'Default', true, '{"separate_fuel_rows": true}'::jsonb, 0
  WHERE  NOT EXISTS (
    SELECT 1 FROM carrier_csv_profiles
    WHERE  carrier_id = v_carrier_id AND is_default = true
  );

  -- Add the flag to an existing default profile (preserve all other settings)
  UPDATE carrier_csv_profiles
  SET    column_map = column_map || '{"separate_fuel_rows": true}'::jsonb,
         updated_at = NOW()
  WHERE  carrier_id  = v_carrier_id
    AND  is_default  = true
    AND  NOT (column_map ? 'separate_fuel_rows');

  RAISE NOTICE 'Migration 165 complete: separate_fuel_rows=true set for DHL carrier_id=%', v_carrier_id;
END;
$$;
