-- ─── Migration 178 — DPD Isle of Man zone fix ────────────────────────────────
--
-- Problem (two related defects):
--
-- A) DPD-11 Isle of Man carrier weight band is stale.
--    The seed in migration 004 set the Isle of Man carrier rate at £10.45 for
--    DPD Two Day (DPD-11). The current DPD rate card prices Isle of Man deliveries
--    at £9.20. Reconciliation will show a carrier_amount vs expected mismatch for
--    every DPD-11 Isle of Man shipment until the band is corrected.
--
-- B) DPD-12 (Next Day) has no Isle of Man zone at all.
--    Migration 004 defined an 'Isle of Man' zone for DPD-11 with postcode include
--    rule 'IM', but DPD-12 was set up with only three zones: Mainland, Highlands
--    and Islands, and Northern Ireland. Neither the Highlands zone nor the Mainland
--    zone includes an 'IM' postcode rule.
--
--    The matchZone lookup therefore returns Mainland for any DPD-12 consignment
--    delivered to an IM postcode, giving a cost_price of ~£3.76 (Mainland rate)
--    instead of the correct £9.20 — a substantial reconciliation delta.
--
-- C) Historical charges to IM postcodes have the wrong zone and cost_price.
--    For DPD-11: charges created before migration 163 (which added GB to Isle of
--    Man zone_country_codes) were also zoned as Mainland because matchZone only
--    found the Isle of Man zone when countryIso = 'IM', but DPD invoices always
--    carry 'GB' as the country code for domestic deliveries.
--    For DPD-12: ALL historical IM charges are affected (no zone existed).
--    These charges need cost_price corrected to £9.20 so reconciliation can match.
--
-- Fix:
--   1. Update DPD-11 Isle of Man weight band: £10.45 → £9.20.
--   2. Create DPD-12 Isle of Man zone with GB country code, IM postcode include
--      rule, and carrier weight band at £9.20.
--   3. Data correction: update cost_price on DPD charges
--      where ship_to_postcode starts with 'IM' and the stored zone is incorrect
--      (Mainland, Highlands and Islands, or NULL).
--      Total_cost_price = cost_price for DPD (fuel is handled via separate rows).
--
-- IDEMPOTENT: all steps guard against re-application.
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
DECLARE
  v_carrier_id         INTEGER;
  v_dpd11_svc_id       INTEGER;
  v_dpd12_svc_id       INTEGER;
  v_dpd11_iom_zone_id  INTEGER;
  v_dpd12_iom_zone_id  INTEGER;
  v_updated_bands      INTEGER := 0;
  v_updated_charges    INTEGER := 0;
BEGIN

  -- ── 0. Locate DPD carrier ────────────────────────────────────────────────
  SELECT id INTO v_carrier_id
  FROM   couriers
  WHERE  code ILIKE 'DPD' OR name ILIKE 'DPD%'
  ORDER  BY id LIMIT 1;

  IF v_carrier_id IS NULL THEN
    RAISE NOTICE 'Migration 178: DPD carrier not found — skipping';
    RETURN;
  END IF;

  -- ── 1. Locate service IDs ────────────────────────────────────────────────
  SELECT id INTO v_dpd11_svc_id
  FROM   courier_services
  WHERE  courier_id = v_carrier_id AND service_code ILIKE 'DPD-11'
  LIMIT  1;

  SELECT id INTO v_dpd12_svc_id
  FROM   courier_services
  WHERE  courier_id = v_carrier_id AND service_code ILIKE 'DPD-12'
  LIMIT  1;

  IF v_dpd11_svc_id IS NULL THEN
    RAISE NOTICE 'Migration 178: DPD-11 service not found — step A/C-11 skipped';
  END IF;

  IF v_dpd12_svc_id IS NULL THEN
    RAISE NOTICE 'Migration 178: DPD-12 service not found — step B/C-12 skipped';
  END IF;

  -- ────────────────────────────────────────────────────────────────────────
  -- STEP A: Update DPD-11 Isle of Man carrier weight band to £9.20
  -- ────────────────────────────────────────────────────────────────────────
  IF v_dpd11_svc_id IS NOT NULL THEN
    SELECT z.id INTO v_dpd11_iom_zone_id
    FROM   zones z
    WHERE  z.courier_service_id = v_dpd11_svc_id
      AND  LOWER(z.name) = 'isle of man'
    LIMIT  1;

    IF v_dpd11_iom_zone_id IS NOT NULL THEN
      UPDATE weight_bands
      SET    price_first = 9.20
      WHERE  zone_id     = v_dpd11_iom_zone_id
        AND  price_first <> 9.20;

      GET DIAGNOSTICS v_updated_bands = ROW_COUNT;

      IF v_updated_bands > 0 THEN
        RAISE NOTICE 'Migration 178 Step A: Updated % DPD-11 Isle of Man weight band(s) → £9.20', v_updated_bands;
      ELSE
        RAISE NOTICE 'Migration 178 Step A: DPD-11 Isle of Man band already at £9.20 — skipped';
      END IF;
    ELSE
      RAISE NOTICE 'Migration 178 Step A: DPD-11 Isle of Man zone not found — band update skipped';
    END IF;
  END IF;

  -- ────────────────────────────────────────────────────────────────────────
  -- STEP B: Add Isle of Man zone to DPD-12
  -- ────────────────────────────────────────────────────────────────────────
  IF v_dpd12_svc_id IS NOT NULL THEN
    SELECT z.id INTO v_dpd12_iom_zone_id
    FROM   zones z
    WHERE  z.courier_service_id = v_dpd12_svc_id
      AND  LOWER(z.name) = 'isle of man'
    LIMIT  1;

    IF v_dpd12_iom_zone_id IS NULL THEN
      -- Create the zone
      INSERT INTO zones (courier_service_id, name)
      VALUES (v_dpd12_svc_id, 'Isle of Man')
      RETURNING id INTO v_dpd12_iom_zone_id;

      RAISE NOTICE 'Migration 178 Step B: Created DPD-12 Isle of Man zone id=%', v_dpd12_iom_zone_id;

      -- Add GB country code (domestic DPD invoice always carries GB as country)
      INSERT INTO zone_country_codes (zone_id, country_iso)
      VALUES (v_dpd12_iom_zone_id, 'GB')
      ON CONFLICT (zone_id, country_iso) DO NOTHING;

      -- Add IM postcode include rule (matches all IM1, IM2, IM4, etc.)
      INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      VALUES (v_dpd12_iom_zone_id, 'IM', 'include')
      ON CONFLICT DO NOTHING;

      -- Carrier weight band: DPD charges £9.20 for Isle of Man Next Day regardless of weight.
      -- Single band covering 0–999 kg mirrors the pattern used for DPD-11 Isle of Man.
      INSERT INTO weight_bands (zone_id, min_weight_kg, max_weight_kg, price_first)
      VALUES (v_dpd12_iom_zone_id, 0.0, 999.0, 9.20)
      ON CONFLICT DO NOTHING;

      RAISE NOTICE 'Migration 178 Step B: DPD-12 Isle of Man zone fully configured (GB country, IM postcode rule, £9.20 band)';
    ELSE
      RAISE NOTICE 'Migration 178 Step B: DPD-12 Isle of Man zone already exists (id=%) — skipped', v_dpd12_iom_zone_id;

      -- Still ensure GB country code and postcode rule are present (belt-and-braces)
      INSERT INTO zone_country_codes (zone_id, country_iso)
      VALUES (v_dpd12_iom_zone_id, 'GB')
      ON CONFLICT (zone_id, country_iso) DO NOTHING;

      INSERT INTO zone_postcode_rules (zone_id, postcode_prefix, rule_type)
      VALUES (v_dpd12_iom_zone_id, 'IM', 'include')
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  -- ────────────────────────────────────────────────────────────────────────
  -- STEP C: Correct historical charges to IM postcodes
  --
  -- Find all DPD-11 and DPD-12 charges where:
  --   • ship_to_postcode starts with 'IM'
  --   • cost_price does not equal £9.20 (or is NULL)
  --   • zone_id is not the Isle of Man zone for that service
  --
  -- Update: cost_price → £9.20, zone_id → Isle of Man zone for the respective service.
  -- ────────────────────────────────────────────────────────────────────────

  IF v_dpd11_svc_id IS NOT NULL AND v_dpd11_iom_zone_id IS NOT NULL THEN
    UPDATE charges c
    SET    cost_price  = 9.20,
           zone_id     = v_dpd11_iom_zone_id,
           updated_at  = NOW()
    WHERE  c.courier_service_id = v_dpd11_svc_id
      AND  c.ship_to_postcode   ILIKE 'IM%'
      AND  c.cancelled          = false
      AND  (c.cost_price <> 9.20 OR c.zone_id IS DISTINCT FROM v_dpd11_iom_zone_id);

    GET DIAGNOSTICS v_updated_charges = ROW_COUNT;
    IF v_updated_charges > 0 THEN
      RAISE NOTICE 'Migration 178 Step C (DPD-11): corrected cost_price + zone on % Isle of Man charge(s) → £9.20', v_updated_charges;
    ELSE
      RAISE NOTICE 'Migration 178 Step C (DPD-11): no mis-zoned Isle of Man charges found';
    END IF;
  END IF;

  IF v_dpd12_svc_id IS NOT NULL AND v_dpd12_iom_zone_id IS NOT NULL THEN
    v_updated_charges := 0;

    UPDATE charges c
    SET    cost_price  = 9.20,
           zone_id     = v_dpd12_iom_zone_id,
           updated_at  = NOW()
    WHERE  c.courier_service_id = v_dpd12_svc_id
      AND  c.ship_to_postcode   ILIKE 'IM%'
      AND  c.cancelled          = false
      AND  (c.cost_price <> 9.20 OR c.zone_id IS DISTINCT FROM v_dpd12_iom_zone_id);

    GET DIAGNOSTICS v_updated_charges = ROW_COUNT;
    IF v_updated_charges > 0 THEN
      RAISE NOTICE 'Migration 178 Step C (DPD-12): corrected cost_price + zone on % Isle of Man charge(s) → £9.20', v_updated_charges;
    ELSE
      RAISE NOTICE 'Migration 178 Step C (DPD-12): no mis-zoned Isle of Man charges found';
    END IF;
  END IF;

END;
$$;
