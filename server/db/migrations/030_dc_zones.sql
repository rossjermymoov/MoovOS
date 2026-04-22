-- 030: DC zone reference data
--
-- Stores the courier platform's zone definitions, imported from the DC
-- zones CSV export.  Each zone is defined per service + ISO country code.
-- The same dc_zone_id can appear multiple times (once per ISO it covers).
--
-- included_postcodes: if set, only these postcode areas are in this zone.
-- excluded_postcodes: if set (and included is null), this zone covers ALL
--   postcodes for that ISO EXCEPT the excluded ones (e.g. Mainland = GB
--   minus all Highlands/Islands postcodes).
--
-- Zone lookup priority: match included-list zones first, then fall back
-- to the catch-all excluded-list zone (Mainland).

CREATE TABLE IF NOT EXISTS dc_zones (
  id                  SERIAL PRIMARY KEY,
  dc_zone_id          INTEGER       NOT NULL,
  zone_name           VARCHAR(100)  NOT NULL,
  courier_code        VARCHAR(20)   NOT NULL,
  service_code        VARCHAR(30)   NOT NULL,
  service_name        VARCHAR(100),
  iso                 CHAR(3)       NOT NULL,
  included_postcodes  TEXT[],
  excluded_postcodes  TEXT[],
  created_at          TIMESTAMPTZ   DEFAULT NOW(),
  updated_at          TIMESTAMPTZ   DEFAULT NOW(),

  UNIQUE (dc_zone_id, iso)
);

CREATE INDEX IF NOT EXISTS dc_zones_service_iso_idx
  ON dc_zones(courier_code, service_code, iso);
