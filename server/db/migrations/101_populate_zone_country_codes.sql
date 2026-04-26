-- -----------------------------------------------------------------------------
-- Migration 101 — Populate zone_country_codes for DHL zones
--
-- All DHL domestic service zones were showing "0 countries" in the carrier
-- management UI because zone_country_codes had never been populated for the
-- new carrier model zones.
--
-- This migration inserts:
--   • GB (United Kingdom) for EVERY zone on every DHL domestic service
--   • GG (Guernsey) and JE (Jersey) additionally for any zone whose name
--     contains "Zone D" or "D" — these Channel Island zones are priced at
--     DHL's Zone D rate and must also be tagged to their ISO codes so that
--     international shipments to GG/JE resolve correctly.
--
-- Carrier identification: couriers.code ILIKE 'DHL%' covers both DHL and
-- DHLC2C courier records.
--
-- Safe to re-run — ON CONFLICT on (zone_id, country_iso) is a no-op.
-- -----------------------------------------------------------------------------

BEGIN;

-- ── GB for every DHL zone ─────────────────────────────────────────────────────
INSERT INTO zone_country_codes (zone_id, country_iso)
SELECT z.id, 'GB'
FROM   zones           z
JOIN   courier_services cs ON cs.id  = z.courier_service_id
JOIN   couriers         c  ON c.id   = cs.courier_id
WHERE  c.code ILIKE 'DHL%'
ON CONFLICT (zone_id, country_iso) DO NOTHING;

-- ── GG (Guernsey) for DHL Zone D zones ───────────────────────────────────────
INSERT INTO zone_country_codes (zone_id, country_iso)
SELECT z.id, 'GG'
FROM   zones           z
JOIN   courier_services cs ON cs.id  = z.courier_service_id
JOIN   couriers         c  ON c.id   = cs.courier_id
WHERE  c.code ILIKE 'DHL%'
  AND  (z.name ILIKE 'Zone D%' OR z.name ILIKE '%Zone D' OR z.name = 'D')
ON CONFLICT (zone_id, country_iso) DO NOTHING;

-- ── JE (Jersey) for DHL Zone D zones ─────────────────────────────────────────
INSERT INTO zone_country_codes (zone_id, country_iso)
SELECT z.id, 'JE'
FROM   zones           z
JOIN   courier_services cs ON cs.id  = z.courier_service_id
JOIN   couriers         c  ON c.id   = cs.courier_id
WHERE  c.code ILIKE 'DHL%'
  AND  (z.name ILIKE 'Zone D%' OR z.name ILIKE '%Zone D' OR z.name = 'D')
ON CONFLICT (zone_id, country_iso) DO NOTHING;

DO $$
DECLARE
  v_gb INT;
  v_gg INT;
  v_je INT;
BEGIN
  SELECT COUNT(*) INTO v_gb FROM zone_country_codes zcc
    JOIN zones z ON z.id = zcc.zone_id
    JOIN courier_services cs ON cs.id = z.courier_service_id
    JOIN couriers c ON c.id = cs.courier_id
    WHERE c.code ILIKE 'DHL%' AND zcc.country_iso = 'GB';

  SELECT COUNT(*) INTO v_gg FROM zone_country_codes zcc
    JOIN zones z ON z.id = zcc.zone_id
    JOIN courier_services cs ON cs.id = z.courier_service_id
    JOIN couriers c ON c.id = cs.courier_id
    WHERE c.code ILIKE 'DHL%' AND zcc.country_iso = 'GG';

  SELECT COUNT(*) INTO v_je FROM zone_country_codes zcc
    JOIN zones z ON z.id = zcc.zone_id
    JOIN courier_services cs ON cs.id = z.courier_service_id
    JOIN couriers c ON c.id = cs.courier_id
    WHERE c.code ILIKE 'DHL%' AND zcc.country_iso = 'JE';

  RAISE NOTICE 'Migration 101 complete — DHL zone_country_codes: % GB, % GG, % JE', v_gb, v_gg, v_je;
END $$;

COMMIT;
