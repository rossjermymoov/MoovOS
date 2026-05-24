-- ─── Migration 205 — Delete spurious "UK Mainland" zones ────────────────────
--
-- When importing customer rate cards the route was auto-creating zones that
-- didn't exist at the carrier level. This left orphaned zones named
-- "UK Mainland" in the zones table. Zones must only be defined via the
-- Carriers admin UI; the import route has been patched (no more auto-creation).
--
-- This migration removes any zone named "UK Mainland" (case-insensitive) that:
--   - has no associated weight_bands, AND
--   - has no associated charges
--
-- Zones that are genuinely in use (have weight_bands or charges) are left
-- untouched so no live pricing data is lost. A NOTICE is raised for each
-- zone deleted and for each zone skipped due to active references.

DO $$
DECLARE
  r           RECORD;
  v_deleted   INT := 0;
  v_skipped   INT := 0;
BEGIN
  FOR r IN
    SELECT z.id, z.name, cs.name AS service_name
    FROM   zones z
    JOIN   courier_services cs ON cs.id = z.courier_service_id
    WHERE  LOWER(z.name) = 'uk mainland'
  LOOP
    -- Check for any weight_bands referencing this zone
    IF EXISTS (SELECT 1 FROM weight_bands WHERE zone_id = r.id LIMIT 1) THEN
      RAISE NOTICE 'Migration 205: skipping zone "%" (id=%) on service "%" — has weight_bands.',
        r.name, r.id, r.service_name;
      v_skipped := v_skipped + 1;
      CONTINUE;
    END IF;

    -- Check for any charges referencing this zone
    IF EXISTS (SELECT 1 FROM charges WHERE zone_id = r.id LIMIT 1) THEN
      RAISE NOTICE 'Migration 205: skipping zone "%" (id=%) on service "%" — has charges.',
        r.name, r.id, r.service_name;
      v_skipped := v_skipped + 1;
      CONTINUE;
    END IF;

    DELETE FROM zones WHERE id = r.id;
    RAISE NOTICE 'Migration 205: deleted zone "%" (id=%) from service "%".',
      r.name, r.id, r.service_name;
    v_deleted := v_deleted + 1;
  END LOOP;

  RAISE NOTICE 'Migration 205 complete: % zone(s) deleted, % zone(s) skipped (in use).',
    v_deleted, v_skipped;
END $$;
