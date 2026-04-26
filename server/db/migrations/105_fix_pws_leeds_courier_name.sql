-- Migration 105: Fix courier name on PWS Leeds DHL test shipments
--
-- Voila's API returns courier = 'MoovParcel' (the platform name) rather than
-- the actual carrier. For the 28 PWS Leeds DHL test shipments ingested via
-- the Voila reconciliation ingestion script, update the courier field to the
-- correct DHL carrier identifier.
--
-- Only targets shipments where:
--   - customer account = MOOV-0164 (PWS Leeds Ltd)
--   - courier is currently 'MoovParcel'
--   - service_name contains 'DHL'

BEGIN;

UPDATE shipments
SET courier = 'DHLParcelUKCloud',
    updated_at = NOW()
WHERE customer_account = 'MOOV-0164'
  AND courier = 'MoovParcel'
  AND service_name ILIKE '%DHL%';

DO $$
DECLARE v INT;
BEGIN
  GET DIAGNOSTICS v = ROW_COUNT;
  RAISE NOTICE 'Migration 105 — % shipment(s) updated from MoovParcel to DHLParcelUKCloud.', v;
END $$;

COMMIT;
