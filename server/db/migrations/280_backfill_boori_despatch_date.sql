-- Migration 280: Backfill despatch_date on Boori (Europe) LTD courier charges
--
-- All 316 courier charges for Boori have despatch_date = NULL because the
-- booking process never populated it.  The reconciliation pool uses despatch_date
-- for date-matching; without it, only tracking code matching is possible.
--
-- This backfill sets despatch_date = shipments.collection_date for all Boori
-- courier charges where despatch_date IS NULL and the shipment has a collection_date.
-- Also backfills fuel and surcharge charges for completeness.
--
-- Customer: Boori (Europe) Ltd — id 1b42c791-27e5-4f7d-9d6a-8f524bcad6b3

UPDATE charges c
SET    despatch_date = s.collection_date
FROM   shipments s
WHERE  c.shipment_id     = s.id
  AND  c.customer_id     = '1b42c791-27e5-4f7d-9d6a-8f524bcad6b3'
  AND  c.despatch_date  IS NULL
  AND  s.collection_date IS NOT NULL;
