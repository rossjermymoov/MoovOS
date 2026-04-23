-- 063: Full status re-normalisation pass
--
-- Previous migrations (055, 056) only matched numeric DPD codes in
-- raw_payload->>'status'. If DPD sent text descriptions (e.g. "Dispatch Guide",
-- "In Dispatch Guide") they were missed. This migration normalises ALL
-- tracking_events rows using both fields: numeric status code AND
-- status_description text, then re-derives all parcel statuses from the
-- most recent event.

-- ─────────────────────────────────────────────────────────────────────────────
-- Step 1: Re-normalise tracking_events.status
-- Priority order:
--   1. raw_payload->>'status' is a known numeric DPD code → map directly
--   2. raw_payload->>'status_description' contains a recognised text pattern
--   3. raw_payload->>'status' itself is a recognisable text pattern
-- ─────────────────────────────────────────────────────────────────────────────

UPDATE tracking_events
SET status = CASE

  -- ── Numeric DPD codes from raw_payload->>'status' ──────────────────────────
  WHEN raw_payload->>'status' = '1'  THEN 'booked'
  WHEN raw_payload->>'status' = '2'  THEN 'collected'
  WHEN raw_payload->>'status' = '3'  THEN 'at_depot'
  WHEN raw_payload->>'status' = '4'  THEN 'in_transit'
  WHEN raw_payload->>'status' = '5'  THEN 'out_for_delivery'
  WHEN raw_payload->>'status' = '6'  THEN 'failed_delivery'
  WHEN raw_payload->>'status' = '7'  THEN 'delivered'
  WHEN raw_payload->>'status' = '8'  THEN 'on_hold'
  WHEN raw_payload->>'status' = '9'  THEN 'exception'
  WHEN raw_payload->>'status' = '10' THEN 'returned'
  WHEN raw_payload->>'status' = '11' THEN 'exception'
  WHEN raw_payload->>'status' = '12' THEN 'exception'
  WHEN raw_payload->>'status' = '13' THEN 'awaiting_collection'
  WHEN raw_payload->>'status' = '16' THEN 'exception'
  WHEN raw_payload->>'status' = '18' THEN 'customs_hold'

  -- ── On hold — by status_description text ───────────────────────────────────
  WHEN LOWER(raw_payload->>'status_description') LIKE '%dispatch guide%'    THEN 'on_hold'
  WHEN LOWER(raw_payload->>'status_description') LIKE '%in dispatch%'       THEN 'on_hold'
  WHEN LOWER(raw_payload->>'status_description') LIKE '%on hold%'           THEN 'on_hold'
  WHEN LOWER(raw_payload->>'status_description') LIKE '%held%'              THEN 'on_hold'

  -- ── Delivered ───────────────────────────────────────────────────────────────
  WHEN LOWER(raw_payload->>'status_description') LIKE '%delivered%'         THEN 'delivered'

  -- ── Out for delivery ────────────────────────────────────────────────────────
  WHEN LOWER(raw_payload->>'status_description') LIKE '%out for delivery%'  THEN 'out_for_delivery'
  WHEN LOWER(raw_payload->>'status_description') LIKE '%with driver%'       THEN 'out_for_delivery'
  WHEN LOWER(raw_payload->>'status_description') LIKE '%on vehicle%'        THEN 'out_for_delivery'

  -- ── Failed delivery ─────────────────────────────────────────────────────────
  WHEN LOWER(raw_payload->>'status_description') LIKE '%not home%'          THEN 'failed_delivery'
  WHEN LOWER(raw_payload->>'status_description') LIKE '%carded%'            THEN 'failed_delivery'
  WHEN LOWER(raw_payload->>'status_description') LIKE '%attempted%'         THEN 'failed_delivery'
  WHEN LOWER(raw_payload->>'status_description') LIKE '%unable to deliver%' THEN 'failed_delivery'
  WHEN LOWER(raw_payload->>'status_description') LIKE '%missed%'            THEN 'failed_delivery'

  -- ── At depot / in transit ───────────────────────────────────────────────────
  WHEN LOWER(raw_payload->>'status_description') LIKE '%at depot%'          THEN 'at_depot'
  WHEN LOWER(raw_payload->>'status_description') LIKE '%depot%'             THEN 'at_depot'
  WHEN LOWER(raw_payload->>'status_description') LIKE '%in transit%'        THEN 'in_transit'
  WHEN LOWER(raw_payload->>'status_description') LIKE '%in the network%'    THEN 'in_transit'

  -- ── Returned ────────────────────────────────────────────────────────────────
  WHEN LOWER(raw_payload->>'status_description') LIKE '%return%'            THEN 'returned'
  WHEN LOWER(raw_payload->>'status_description') LIKE '%rts%'               THEN 'returned'

  -- ── Awaiting collection ─────────────────────────────────────────────────────
  WHEN LOWER(raw_payload->>'status_description') LIKE '%collection point%'  THEN 'awaiting_collection'
  WHEN LOWER(raw_payload->>'status_description') LIKE '%parcel shop%'       THEN 'awaiting_collection'
  WHEN LOWER(raw_payload->>'status_description') LIKE '%parcelshop%'        THEN 'awaiting_collection'
  WHEN LOWER(raw_payload->>'status_description') LIKE '%ready for collection%' THEN 'awaiting_collection'

  -- ── Customs ─────────────────────────────────────────────────────────────────
  WHEN LOWER(raw_payload->>'status_description') LIKE '%customs%'           THEN 'customs_hold'

  -- ── Collected ───────────────────────────────────────────────────────────────
  WHEN LOWER(raw_payload->>'status_description') LIKE '%collected%'         THEN 'collected'
  WHEN LOWER(raw_payload->>'status_description') LIKE '%picked up%'         THEN 'collected'

  -- ── On hold — by raw status text field itself ───────────────────────────────
  WHEN LOWER(raw_payload->>'status') LIKE '%dispatch guide%'                THEN 'on_hold'
  WHEN LOWER(raw_payload->>'status') LIKE '%on hold%'                       THEN 'on_hold'
  WHEN LOWER(raw_payload->>'status') = 'dispatch_guide'                     THEN 'on_hold'
  WHEN LOWER(raw_payload->>'status') = 'in_dispatch_guide'                  THEN 'on_hold'

  ELSE status  -- leave unchanged if nothing matched
END
WHERE raw_payload IS NOT NULL
  AND raw_payload::text != 'null';

-- ─────────────────────────────────────────────────────────────────────────────
-- Step 2: Re-derive parcel status from most recent tracking event
-- Parcels currently showing a status that exists in the event history
-- are updated to their latest corrected event status.
-- ─────────────────────────────────────────────────────────────────────────────

UPDATE parcels p
SET
  status       = latest.status,
  updated_at   = NOW()
FROM (
  SELECT DISTINCT ON (consignment_number)
    consignment_number,
    status
  FROM tracking_events
  WHERE status IS NOT NULL
    AND status != 'unknown'
  ORDER BY consignment_number, created_at DESC
) latest
WHERE p.consignment_number = latest.consignment_number
  AND latest.status IS NOT NULL
  AND latest.status != 'unknown';
