-- ─── Migration 146 — DPD Profile: postcode, country, excluded surcharge cols ──
--
-- Updates the DPD Standard Invoice carrier_csv_profile to:
--
--   1. Add delivery_postcode mapping  → "Delivery Postcode" column
--      Enables zone resolution for external bookings (no OMS record).
--
--   2. Add ship_to_country mapping    → "Country" column
--      Needed for international routing and zone verification.
--
--   3. Mark Fuel/Energy, Carriage, and Global Energy Charge as excluded
--      surcharge columns.
--      These columns exist in the DPD invoice and must not be silently dropped.
--      They are captured in the line data but NOT added to expected_amount —
--      they are billed as part of DPD's agreed bundled rate which is reflected
--      in the carrier rate card (weight_bands). Comparing Revenue (base) against
--      rate-card price_first is the correct reconciliation approach; treating
--      fuel/carriage as additive surcharges would double-count them.
--
--   4. Update tracking_number mapping to 'consignment' if not already done
--      (idempotent — migration 142 may or may not have run first).
--
-- Uses ON CONFLICT DO UPDATE so this is fully idempotent and safe to re-run.

UPDATE carrier_csv_profiles
SET column_map = column_map
  -- ── Core field additions ──────────────────────────────────────────────────
  || jsonb_build_object(
      'delivery_postcode', 'delivery postcode',
      'ship_to_country',   'country'
  )
  -- ── Excluded surcharge columns ────────────────────────────────────────────
  -- Each entry has { col, surcharge_id, excluded: true }.
  -- excluded = true tells the engine: capture this column's value in the line
  -- data but do NOT add it to expected_amount and do NOT count it as an
  -- unmatched surcharge.  It exists purely for audit / display purposes.
  || jsonb_build_object(
      'excluded_columns', jsonb_build_array(
        jsonb_build_object(
          'col',      'fuel and energy charge',
          'label',    'Fuel and Energy Charge',
          'excluded', true
        ),
        jsonb_build_object(
          'col',      'carriage charge',
          'label',    'Carriage Charge',
          'excluded', true
        ),
        jsonb_build_object(
          'col',      'global energy charge',
          'label',    'Global Energy Charge',
          'excluded', true
        )
      )
  )
FROM couriers cu
WHERE carrier_csv_profiles.carrier_id = cu.id
  AND carrier_csv_profiles.profile_name = 'DPD Standard Invoice'
  AND (cu.code ILIKE 'DPD' OR cu.name ILIKE 'DPD');
