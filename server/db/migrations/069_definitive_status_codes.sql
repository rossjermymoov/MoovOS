-- 069: Definitive status code mapping — authoritative list from Dispatch Cloud
--
-- Status code → internal status → display label:
--   1  → booked              → Booked
--   2  → collected           → Collected
--   3  → at_depot            → At Hub
--   4  → in_transit          → In Transit
--   5  → out_for_delivery    → Out for Delivery
--   6  → failed_delivery     → Failed Attempt
--   7  → delivered           → Delivered
--   8  → on_hold             → On Hold
--   9  → exception           → Address Issue
--  10  → returned            → Return to Sender
--  11  → tracking_expired    → Tracking Expired  (NEW)
--  12  → cancelled           → Cancelled         (NEW)
--  13  → awaiting_collection → Awaiting Customer Collection
--  16  → damaged             → Damaged           (NEW)
--  18  → customs_hold        → Customs Hold
--
-- ─────────────────────────────────────────────────────────────────────────────
-- Step 1: Add new enum values
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TYPE parcel_status ADD VALUE IF NOT EXISTS 'tracking_expired';
ALTER TYPE parcel_status ADD VALUE IF NOT EXISTS 'cancelled';
ALTER TYPE parcel_status ADD VALUE IF NOT EXISTS 'damaged';

-- ─────────────────────────────────────────────────────────────────────────────
-- Step 2: Re-map all tracking_events.status from dc_status_code
--         (populated in migration 068 from raw_payload->>'status_code')
-- ─────────────────────────────────────────────────────────────────────────────

UPDATE tracking_events
SET status = CASE dc_status_code
  WHEN 1  THEN 'booked'
  WHEN 2  THEN 'collected'
  WHEN 3  THEN 'at_depot'
  WHEN 4  THEN 'in_transit'
  WHEN 5  THEN 'out_for_delivery'
  WHEN 6  THEN 'failed_delivery'
  WHEN 7  THEN 'delivered'
  WHEN 8  THEN 'on_hold'
  WHEN 9  THEN 'exception'
  WHEN 10 THEN 'returned'
  WHEN 11 THEN 'tracking_expired'
  WHEN 12 THEN 'cancelled'
  WHEN 13 THEN 'awaiting_collection'
  WHEN 16 THEN 'damaged'
  WHEN 18 THEN 'customs_hold'
  ELSE status
END::parcel_status
WHERE dc_status_code IS NOT NULL;

-- ─────────────────────────────────────────────────────────────────────────────
-- Step 3: Also re-map from raw_payload for any rows where dc_status_code
--         wasn't populated (belt-and-braces)
-- ─────────────────────────────────────────────────────────────────────────────

UPDATE tracking_events
SET status = CASE (raw_payload->>'status_code')
  WHEN '1'  THEN 'booked'
  WHEN '2'  THEN 'collected'
  WHEN '3'  THEN 'at_depot'
  WHEN '4'  THEN 'in_transit'
  WHEN '5'  THEN 'out_for_delivery'
  WHEN '6'  THEN 'failed_delivery'
  WHEN '7'  THEN 'delivered'
  WHEN '8'  THEN 'on_hold'
  WHEN '9'  THEN 'exception'
  WHEN '10' THEN 'returned'
  WHEN '11' THEN 'tracking_expired'
  WHEN '12' THEN 'cancelled'
  WHEN '13' THEN 'awaiting_collection'
  WHEN '16' THEN 'damaged'
  WHEN '18' THEN 'customs_hold'
  ELSE status::text
END::parcel_status
WHERE dc_status_code IS NULL
  AND raw_payload IS NOT NULL
  AND raw_payload ? 'status_code'
  AND raw_payload->>'status_code' IN ('1','2','3','4','5','6','7','8','9','10','11','12','13','16','18');

-- ─────────────────────────────────────────────────────────────────────────────
-- Step 4: Re-derive all parcel statuses from most recent tracking event
-- ─────────────────────────────────────────────────────────────────────────────

UPDATE parcels p
SET
  status             = latest.status,
  status_description = latest.description,
  last_location      = latest.location,
  last_event_at      = latest.event_at,
  updated_at         = NOW()
FROM (
  SELECT DISTINCT ON (parcel_id)
    parcel_id,
    status,
    description,
    location,
    event_at
  FROM tracking_events
  WHERE status IS NOT NULL
    AND status != 'unknown'
  ORDER BY
    parcel_id,
    event_at       DESC NULLS LAST,
    dc_status_code DESC NULLS LAST,
    id             DESC
) latest
WHERE p.id = latest.parcel_id
  AND latest.status IS NOT NULL
  AND latest.status != 'unknown';
