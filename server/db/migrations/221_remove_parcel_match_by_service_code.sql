-- ─── Migration 221 — Remove Parcel rows, matching on service_code not service_id
--
-- All previous migrations used service_id (integer) to correlate Parcel rows
-- with non-Parcel rows for the same service. They deleted 0 rows every time.
-- Hypothesis: the Packet row (old UI import) and the Parcel row (AI onboarding)
-- have different service_id values for the same logical service, so the
-- EXISTS check never finds a match.
--
-- This migration uses service_code (text) to correlate rows instead.
-- If a customer has any non-Parcel row for the same service_code, all their
-- Parcel rows for that service_code are deleted.

DO $$
DECLARE
  v_deleted INT := 0;
BEGIN
  -- Diagnostic: count what we expect to delete
  RAISE NOTICE 'Migration 221: scanning for Parcel rows where service_code also has non-Parcel rows for same customer...';

  DELETE FROM customer_rates
  WHERE  weight_class_name ILIKE 'Parcel'
    AND  EXISTS (
           SELECT 1 FROM customer_rates cr2
           WHERE  cr2.customer_id              = customer_rates.customer_id
             AND  LOWER(cr2.service_code)      = LOWER(customer_rates.service_code)
             AND  cr2.weight_class_name NOT ILIKE 'Parcel'
             AND  cr2.id != customer_rates.id
         );

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RAISE NOTICE 'Migration 221: deleted % Parcel row(s) matched by service_code.', v_deleted;

  -- Second pass: also delete by service_name in case service_code differs too
  DELETE FROM customer_rates
  WHERE  weight_class_name ILIKE 'Parcel'
    AND  EXISTS (
           SELECT 1 FROM customer_rates cr2
           WHERE  cr2.customer_id              = customer_rates.customer_id
             AND  LOWER(cr2.service_name)      = LOWER(customer_rates.service_name)
             AND  cr2.weight_class_name NOT ILIKE 'Parcel'
             AND  cr2.id != customer_rates.id
         );

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RAISE NOTICE 'Migration 221 pass2: deleted % additional Parcel row(s) matched by service_name.', v_deleted;
END $$;
