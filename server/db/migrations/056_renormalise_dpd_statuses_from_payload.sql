-- 056: Re-normalise DPD tracking statuses from raw_payload
--
-- Migration 055 used event_code, but for DPD webhooks event_code stores
-- ev.update_id (a sequential event identifier), NOT the numeric DPD status
-- code. The actual DPD status code (1–18) lives in raw_payload->>'status'.
--
-- This migration re-derives status for all tracking_events where
-- raw_payload->>'status' is a known numeric DPD code, then rolls each
-- parcel's current status forward from its most recent corrected event.

-- ─────────────────────────────────────────────────────────────────────────────
-- Step 1: Re-map tracking_events using raw_payload->>'status'
-- ─────────────────────────────────────────────────────────────────────────────
UPDATE tracking_events
SET status = CASE raw_payload->>'status'
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
WHERE raw_payload->>'status' IN ('1','2','3','4','5','6','7','8','9','10','11','12','13','16','18');

-- ─────────────────────────────────────────────────────────────────────────────
-- Step 2: Re-derive each parcel's status from its most recent event
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
  SELECT 1 FROM tracking_events te WHERE te.parcel_id = p.id
);
