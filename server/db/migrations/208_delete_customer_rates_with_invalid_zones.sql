-- ─── Migration 208 — Delete customer rates whose zone doesn't exist at carrier level ──
--
-- Rule: customer_rates.zone_name MUST exactly match (case-insensitive) a zone
-- defined in the zones table for that courier_service.
-- If the service has carrier zones defined and the customer rate's zone_name
-- doesn't match any of them, the row is invalid and must be removed.
-- Services with no zones at all in the zones table are left untouched.

DO $$
DECLARE
  v_deleted INT;
BEGIN
  DELETE FROM customer_rates cr
  WHERE EXISTS (
    -- The service has at least one zone defined
    SELECT 1 FROM zones z WHERE z.courier_service_id = cr.service_id
  )
  AND NOT EXISTS (
    -- But none of them match this row's zone_name
    SELECT 1 FROM zones z
    WHERE  z.courier_service_id = cr.service_id
      AND  LOWER(z.name) = LOWER(cr.zone_name)
  );

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RAISE NOTICE 'Migration 208: deleted % customer rate row(s) with zone names not present in carrier zones.', v_deleted;
END $$;
