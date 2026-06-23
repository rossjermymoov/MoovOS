-- ─── Migration 218 — Remove Parcel rows where service uses a real weight class ─
--
-- Migration 217 was too narrow: it only deleted a Parcel row if a non-Parcel
-- row existed for the SAME zone. But weight class is a property of the service,
-- not individual zones. If AGL Yodel Mini 48 uses 'Packet', then ALL zones for
-- that service use 'Packet' — there should never be a Parcel row for any zone.
--
-- Rule: For each (customer_id, service_id) pair, if ANY non-Parcel weight class
-- row exists → delete ALL Parcel rows for that customer+service, across all zones.

DO $$
DECLARE
  v_deleted INT := 0;
BEGIN
  DELETE FROM customer_rates
  WHERE  weight_class_name ILIKE 'Parcel'
    AND  EXISTS (
           SELECT 1 FROM customer_rates cr2
           WHERE  cr2.customer_id = customer_rates.customer_id
             AND  cr2.service_id  = customer_rates.service_id
             AND  cr2.weight_class_name NOT ILIKE 'Parcel'
         );

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RAISE NOTICE 'Migration 218: deleted % Parcel row(s) where service uses a real weight class.', v_deleted;
END $$;
