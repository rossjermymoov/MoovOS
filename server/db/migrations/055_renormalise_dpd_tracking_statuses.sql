-- 055: Re-normalise DPD tracking statuses using authoritative numeric codes
--
-- Background: prior to the tracking.js fix (Apr 2026), unknown DPD status codes
-- fell through to the 'in_transit' default rather than mapping correctly.
-- This migration backfills all existing tracking_events and parcels so the live
-- DB matches what the corrected normaliseStatus() function would produce.
--
-- DPD numeric code → parcel_status mapping:
--   1  → booked              6  → failed_delivery    11 → exception
--   2  → collected           7  → delivered          12 → exception
--   3  → at_depot            8  → on_hold            13 → awaiting_collection
--   4  → in_transit          9  → exception          16 → exception
--   5  → out_for_delivery   10  → returned           18 → customs_hold

-- ─────────────────────────────────────────────────────────────────────────────
-- Step 1: Re-map tracking_events.status for any event where event_code is a
--         known DPD numeric code (stored as text in the event_code column)
-- ─────────────────────────────────────────────────────────────────────────────
UPDATE tracking_events
SET status = CASE event_code
               WHEN '1'  THEN 'booked'::parcel_status
               WHEN '2'  THEN 'collected'::parcel_status
               WHEN '3'  THEN 'at_depot'::parcel_status
               WHEN '4'  THEN 'in_transit'::parcel_status
               WHEN '5'  THEN 'out_for_delivery'::parcel_status
               WHEN '6'  THEN 'failed_delivery'::parcel_status
               WHEN '7'  THEN 'delivered'::parcel_status
               WHEN '8'  THEN 'on_hold'::parcel_status
               WHEN '9'  THEN 'exception'::parcel_status
               WHEN '10' THEN 'returned'::parcel_status
               WHEN '11' THEN 'exception'::parcel_status
               WHEN '12' THEN 'exception'::parcel_status
               WHEN '13' THEN 'awaiting_collection'::parcel_status
               WHEN '16' THEN 'exception'::parcel_status
               WHEN '18' THEN 'customs_hold'::parcel_status
             END
WHERE event_code IN ('1','2','3','4','5','6','7','8','9','10','11','12','13','16','18');

-- ─────────────────────────────────────────────────────────────────────────────
-- Step 2: Update each parcel's current status to match its most recent
--         tracking event (by event_at desc, then id desc as tiebreaker)
-- ─────────────────────────────────────────────────────────────────────────────
UPDATE parcels p
SET
  status     = (
    SELECT te.status
    FROM   tracking_events te
    WHERE  te.parcel_id = p.id
    ORDER  BY te.event_at DESC, te.id DESC
    LIMIT  1
  ),
  updated_at = NOW()
WHERE EXISTS (
  SELECT 1
  FROM   tracking_events te
  WHERE  te.parcel_id = p.id
);
