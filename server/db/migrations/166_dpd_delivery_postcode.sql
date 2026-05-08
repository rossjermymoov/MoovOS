-- ─── Migration 166 — DPD profile: delivery_postcode + excluded fuel columns ───
--
-- Problem:
--   The DPD default CSV profile had no mapping for the delivery postcode or
--   country code columns. This meant:
--
--   1. carrier_direct shipments (pool misses — shipments booked outside the OMS
--      or with a tracking-number format mismatch) could not resolve a zone from
--      the invoice and were always priced as 'no_zone_matched' → unmatched.
--
--   2. Pool hits where zone_id was NULL on the charge (older shipments before
--      zone storage was reliable) fell back to stored cost_price. For multi-parcel
--      all_sub shipments this is wrong if billing.js stored price_first instead of
--      N × price_sub. The engine could not do the rate-card recompute without a
--      zone, so these lines were stuck unmatched even after the task-#242 fixes.
--
--   3. Fuel and Energy Charge, Carriage Charge, and Global Energy Charge appear
--      as separate numeric columns on every DPD H-row. They are NOT part of the
--      reconciliation comparison (the carrier bills them separately and they are
--      already included in our total_cost_price; with separate_fuel_rows=true the
--      engine compares against cost_price/base only). Without excluded_columns they
--      appeared as unexplained monetary amounts on unmatched lines (raw_col_values),
--      making the diagnostic view confusing for operators.
--
-- Fix:
--   1. Map delivery_postcode → 'delivery' (CSV col 10)
--      Map ship_to_country  → 'country code' (CSV col 36, always 'GB' for domestic)
--      These flow into line.delivery_postcode / line.ship_to_country in the engine.
--
--   2. Add excluded_columns for the three carrier-level overhead columns.
--      The engine's mapToInvoiceLine() already uses this list to skip these
--      columns when building raw_col_values, so they no longer appear as
--      unexplained deltas on price_mismatch lines.
--
-- No existing column_map keys are removed or modified — this is an additive patch.
--
-- IDEMPOTENT: safe to re-run.
--   Guards on NOT (column_map ? 'delivery_postcode') so a second run is a no-op.

DO $$
DECLARE
  v_carrier_id INTEGER;
BEGIN
  SELECT id INTO v_carrier_id
  FROM   couriers
  WHERE  code ILIKE 'DPD' OR name ILIKE 'DPD%'
  ORDER  BY id
  LIMIT  1;

  IF v_carrier_id IS NULL THEN
    RAISE NOTICE 'DPD carrier not found — skipping migration 166';
    RETURN;
  END IF;

  UPDATE carrier_csv_profiles
  SET    column_map = column_map || jsonb_build_object(
           -- Delivery postcode from CSV col 10 ("Delivery").
           -- Enables zone resolution for carrier_direct lines and as a fallback
           -- when zone_id is null on pool-hit charges.
           'delivery_postcode', 'delivery',
           -- Country code from CSV col 36 ("Country Code").
           -- Always "GB" for domestic DPD; used as countryIso in zone lookup.
           'ship_to_country', 'country code',
           -- Carrier-level overhead columns that are already accounted for in
           -- our cost_price/total_cost_price and must not be treated as
           -- unexplained surcharges on reconciliation lines.
           'excluded_columns', jsonb_build_array(
             jsonb_build_object('col', 'Fuel and Energy Charge'),
             jsonb_build_object('col', 'Carriage Charge'),
             jsonb_build_object('col', 'Global Energy Charge')
           )
         ),
         updated_at = NOW()
  WHERE  carrier_id  = v_carrier_id
    AND  is_default  = true
    AND  NOT (column_map ? 'delivery_postcode');

  IF FOUND THEN
    RAISE NOTICE 'Migration 166 complete: delivery_postcode + excluded_columns added for DPD carrier_id=%', v_carrier_id;
  ELSE
    RAISE NOTICE 'Migration 166: DPD profile already has delivery_postcode — skipped (idempotent)';
  END IF;
END;
$$;
