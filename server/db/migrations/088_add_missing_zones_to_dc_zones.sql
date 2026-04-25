-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 088 — Add missing zones from customer_rates into dc_zones
--
-- Background:
--   The billing team sometimes adds customer pricing for zones that are not
--   on the courier's official rate card (e.g. Highlands & Islands on a
--   Mainland-only service).  This is intentional — it catches accidental
--   bookings and ensures the shipment can still be priced rather than failing.
--
--   However, zone resolution (zoneForPostcode) uses dc_zones as its source of
--   truth.  Any zone that exists in customer_rates but not in dc_zones is
--   invisible to the resolver, so shipments that should hit the catch-all
--   Mainland zone can fail with 'no matching zone'.
--
-- This migration:
--   1. Finds every (service_code, zone_name) pair in customer_rates that has
--      no corresponding row in dc_zones.
--   2. Inserts those pairs into dc_zones with NULL postcode arrays — meaning
--      the zone is treated as a custom/manual zone.  Ross can then configure
--      included/excluded postcode rules as needed.
--   3. Reports how many zones were added.
--
-- Safe to re-run — the ON CONFLICT clause is a no-op if the row already exists.
-- ─────────────────────────────────────────────────────────────────────────────

BEGIN;

-- Synthetic dc_zone_id values start above the current maximum so they never
-- clash with IDs imported from DespatchCloud.
WITH missing AS (
  SELECT DISTINCT
    cr.zone_name,
    COALESCE(cr.courier_code, '')   AS courier_code,
    cr.service_code,
    COALESCE(cr.service_name, '')   AS service_name
  FROM customer_rates cr
  WHERE NOT EXISTS (
    SELECT 1
    FROM   dc_zones dz
    WHERE  dz.service_code ILIKE cr.service_code
      AND  dz.zone_name    =     cr.zone_name
  )
),
numbered AS (
  SELECT
    (SELECT COALESCE(MAX(dc_zone_id), 0) FROM dc_zones) + ROW_NUMBER() OVER () AS new_id,
    zone_name, courier_code, service_code, service_name
  FROM missing
)
INSERT INTO dc_zones
  (dc_zone_id, zone_name, courier_code, service_code, service_name, iso,
   included_postcodes, excluded_postcodes)
SELECT
  new_id, zone_name, courier_code, service_code, service_name,
  'GBR',   -- default to GB; update manually for international services
  NULL,    -- included_postcodes: NULL = not an explicit-include zone
  NULL     -- excluded_postcodes: NULL = no exclusions configured yet
FROM numbered
ON CONFLICT (dc_zone_id, iso) DO NOTHING;

DO $$
DECLARE
  v_added INT;
BEGIN
  GET DIAGNOSTICS v_added = ROW_COUNT;
  RAISE NOTICE 'Zones added to dc_zones from customer_rates: %', v_added;
  IF v_added > 0 THEN
    RAISE NOTICE 'ACTION: Review newly added zones in dc_zones and configure postcode rules where needed.';
  END IF;
END $$;

COMMIT;
