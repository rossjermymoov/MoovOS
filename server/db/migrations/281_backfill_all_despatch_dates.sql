-- Migration 281: Backfill despatch_date on ALL courier charges from shipments.collection_date
--
-- The booking engine never populated charges.despatch_date for any customer.
-- The reconciliation pool uses despatch_date for date-matching; without it
-- charges can only be matched by tracking code, causing pool misses and
-- carrier_direct fallthrough on every DHL reconciliation run.
--
-- Migration 280 fixed Boori specifically. This migration fixes all customers
-- in one pass: any courier/fuel/surcharge charge where despatch_date IS NULL
-- but the linked shipment has a collection_date gets backfilled.
--
-- Safe to re-run — the WHERE clause only touches NULL rows.

UPDATE charges c
SET    despatch_date = s.collection_date
FROM   shipments s
WHERE  c.shipment_id     = s.id
  AND  c.despatch_date  IS NULL
  AND  s.collection_date IS NOT NULL;
