-- ─── Migration 163 — DPD domestic zone_country_codes (GB) ─────────────────────
--
-- Problem: DPD UK domestic services (DPD-11 2Day, DPD-12 NXTDAY and any other
-- domestic services such as DPD-19 Classic, DPD-80 Express) were configured
-- in carrier management before strict zone matching was enforced (migration 138).
--
-- The strict matchZone function (pricingEngine.js) requires every candidate zone
-- to have at least one zone_country_codes entry for the destination country.
-- Zones with NO country code entries are excluded from matching:
--
--   const compatZones = zones.rows.filter(z =>
--     (z.countries || []).includes(countryIso)
--   );
--
-- Migration 119 added zone_country_codes for DPD *international* services
-- (DPD-10, DPD-19DDP, DPD-60, DPD-60DDP, DPD-80, DPD-20) but deliberately
-- skipped UK domestic services. As a result:
--
--   matchZone(DPD-12, 'GB', postcode) → null → carrier_direct_error_no_zone_matched
--
-- This means any DPD shipment that is a pool miss (booked externally, e.g. Europa
-- account 122837) shows expected_amount = null in reconciliation, even though the
-- rate card exists and pricing would succeed if the zone were found.
--
-- Fix: insert zone_country_codes rows for 'GB' on ALL zones belonging to DPD
-- domestic services. Safe to re-run (ON CONFLICT DO NOTHING).
--
-- Domestic services covered (all DPD UK-only services):
--   DPD-11  (2 Day)
--   DPD-12  (Next Day)
--   DPD-19  (Classic — UK variant, not DPD-19DDP which is already fixed)
--   DPD-80  (Express — UK only, not international)
--
-- We use a broad filter: any DPD courier_service whose zones have NO country
-- codes yet, plus explicitly named service codes. This is fully idempotent.
-- ─────────────────────────────────────────────────────────────────────────────

BEGIN;

-- ── Step 1: Add GB to all zones of explicitly named DPD domestic services ──────

INSERT INTO zone_country_codes (zone_id, country_iso)
SELECT z.id, 'GB'
FROM   zones            z
JOIN   courier_services cs ON cs.id = z.courier_service_id
JOIN   couriers         c  ON c.id  = cs.courier_id
WHERE  (c.code ILIKE 'DPD' OR c.name ILIKE 'DPD%')
  AND  cs.service_code IN ('DPD-11', 'DPD-12', 'DPD-19', 'DPD-80')
ON CONFLICT (zone_id, country_iso) DO NOTHING;

-- ── Step 2: Also cover any DPD zones that currently have NO country codes ────────
-- Belt-and-braces: catches any other domestic service that was misconfigured.
-- Excludes zones that already have at least one country code (international ones).

INSERT INTO zone_country_codes (zone_id, country_iso)
SELECT z.id, 'GB'
FROM   zones            z
JOIN   courier_services cs ON cs.id = z.courier_service_id
JOIN   couriers         c  ON c.id  = cs.courier_id
WHERE  (c.code ILIKE 'DPD' OR c.name ILIKE 'DPD%')
  AND  NOT EXISTS (
    SELECT 1 FROM zone_country_codes zcc WHERE zcc.zone_id = z.id
  )
ON CONFLICT (zone_id, country_iso) DO NOTHING;

-- ── Verify ────────────────────────────────────────────────────────────────────

DO $$
DECLARE
  v_domestic_zones INT;
  v_gb_entries     INT;
BEGIN
  SELECT COUNT(DISTINCT z.id) INTO v_domestic_zones
  FROM   zones z
  JOIN   courier_services cs ON cs.id = z.courier_service_id
  JOIN   couriers c ON c.id = cs.courier_id
  WHERE  (c.code ILIKE 'DPD' OR c.name ILIKE 'DPD%')
    AND  cs.service_code IN ('DPD-11','DPD-12','DPD-19','DPD-80');

  SELECT COUNT(*) INTO v_gb_entries
  FROM   zone_country_codes zcc
  JOIN   zones z ON z.id = zcc.zone_id
  JOIN   courier_services cs ON cs.id = z.courier_service_id
  JOIN   couriers c ON c.id = cs.courier_id
  WHERE  (c.code ILIKE 'DPD' OR c.name ILIKE 'DPD%')
    AND  cs.service_code IN ('DPD-11','DPD-12','DPD-19','DPD-80')
    AND  zcc.country_iso = 'GB';

  RAISE NOTICE 'Migration 163 complete — DPD domestic zones: % | GB country code entries: %',
    v_domestic_zones, v_gb_entries;
END $$;

COMMIT;
