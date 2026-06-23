-- ─── Migration 206 — Fix mismatched zone names in customer_rates ─────────────
--
-- When rates were imported via AI onboarding the zone_name was taken verbatim
-- from the rate card PDF (e.g. "Republic of Ireland", "Scottish Highlands &
-- Islands") rather than from the actual carrier zone names in the zones table
-- (e.g. "Ireland", "Scottish Highlands & Islands"). The pricing engine does an
-- exact ILIKE match on zone_name, so mismatches mean the rate is never found.
--
-- This migration, for every customer_rates row where zone_name does NOT exactly
-- match any carrier zone for that service:
--
--   1. Tries a fuzzy match (one name is a substring of the other).
--   2. If a fuzzy match is found AND no rate already exists for the correct zone
--      name + weight class → UPDATE zone_name to the canonical carrier zone name.
--   3. If the correct zone already exists (duplicate) → DELETE the ghost row.
--   4. If no fuzzy match and carrier zones ARE defined → DELETE the ghost row.
--   5. If the service has no zones at all → leave the row alone (free-text zones
--      are valid for services without a zone table entry).

DO $$
DECLARE
  r               RECORD;
  v_carrier_zone  TEXT;
  v_updated       INT := 0;
  v_deleted       INT := 0;
  v_skipped       INT := 0;
BEGIN
  -- Find customer_rates rows where zone_name doesn't exactly match a carrier zone,
  -- but the service DOES have carrier zones defined.
  FOR r IN
    SELECT cr.id,
           cr.customer_id,
           cr.service_id,
           cr.service_code,
           cr.zone_name,
           cr.weight_class_name
    FROM   customer_rates cr
    WHERE  EXISTS (
             SELECT 1 FROM zones z WHERE z.courier_service_id = cr.service_id
           )
      AND  NOT EXISTS (
             SELECT 1 FROM zones z
             WHERE  z.courier_service_id = cr.service_id
               AND  LOWER(z.name)        = LOWER(cr.zone_name)
           )
  LOOP
    -- Fuzzy match: one name is a substring of the other
    SELECT z.name INTO v_carrier_zone
    FROM   zones z
    WHERE  z.courier_service_id = r.service_id
      AND  (
             LOWER(r.zone_name) LIKE '%' || LOWER(z.name) || '%'
             OR LOWER(z.name)   LIKE '%' || LOWER(r.zone_name) || '%'
           )
    ORDER  BY LENGTH(z.name) DESC   -- prefer longer (more specific) match
    LIMIT  1;

    IF v_carrier_zone IS NOT NULL THEN
      -- Check if the customer already has a rate for the correct zone + weight class
      IF EXISTS (
        SELECT 1 FROM customer_rates
        WHERE  customer_id      = r.customer_id
          AND  service_id       = r.service_id
          AND  LOWER(zone_name) = LOWER(v_carrier_zone)
          AND  weight_class_name = r.weight_class_name
      ) THEN
        -- Correct row already exists — delete this ghost duplicate
        DELETE FROM customer_rates WHERE id = r.id;
        v_deleted := v_deleted + 1;
        RAISE NOTICE 'Migration 206: deleted duplicate ghost zone "%" → "%" already exists for service % (id=%)',
          r.zone_name, v_carrier_zone, r.service_code, r.id;
      ELSE
        -- Rename to canonical zone name
        UPDATE customer_rates SET zone_name = v_carrier_zone WHERE id = r.id;
        v_updated := v_updated + 1;
        RAISE NOTICE 'Migration 206: renamed "%" → "%" for service % (id=%)',
          r.zone_name, v_carrier_zone, r.service_code, r.id;
      END IF;
    ELSE
      -- No fuzzy match — ghost zone that can't be mapped; remove it
      DELETE FROM customer_rates WHERE id = r.id;
      v_deleted := v_deleted + 1;
      RAISE NOTICE 'Migration 206: deleted unmappable ghost zone "%" for service % (id=%)',
        r.zone_name, r.service_code, r.id;
    END IF;

  END LOOP;

  RAISE NOTICE 'Migration 206 complete: % zone name(s) corrected, % ghost row(s) deleted, % skipped.',
    v_updated, v_deleted, v_skipped;
END $$;
