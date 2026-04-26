-- Migration 106: Fix courier name on PWS Leeds DHL test shipments (corrected)
--
-- Migration 105 used customer_account = 'MOOV-0164' but Voila-ingested shipments
-- have customer_account = NULL (no account number in the webhook payload).
-- This migration uses customer_id directly instead.

BEGIN;

UPDATE shipments
SET    courier    = 'DHLParcelUKCloud',
       updated_at = NOW()
WHERE  customer_id = 'c0abd53b-6a1d-40da-b494-bf71c5d210d9'
  AND  courier     = 'MoovParcel';

DO $$
DECLARE v INT;
BEGIN
  GET DIAGNOSTICS v = ROW_COUNT;
  RAISE NOTICE 'Migration 106 — % shipment(s) updated from MoovParcel to DHLParcelUKCloud.', v;
END $$;

COMMIT;
