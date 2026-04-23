-- 067: Full reprocess of all tracking events from stored raw_payload
--
-- Previous migrations ordered by event_at but event_at itself was wrong —
-- the bulk catch-up processed all events within the same second so event_at
-- ended up nearly identical across every event for a parcel, making ordering
-- by it useless.
--
-- The raw_payload JSONB stored against each tracking_events row contains
-- the original Dispatch Cloud fields including update_date (the real courier
-- event timestamp) and status_code (the authoritative numeric status).
-- This migration rebuilds both fields from that source of truth.
--
-- ─────────────────────────────────────────────────────────────────────────────
-- Step 1: Drop the unique index added in 066 so we can safely clean up first
-- ─────────────────────────────────────────────────────────────────────────────

DROP INDEX IF EXISTS uq_tracking_events_parcel_at_status;

-- ─────────────────────────────────────────────────────────────────────────────
-- Step 2: Re-populate event_at from raw_payload->>'update_date'
--         Only updates rows that have a parseable update_date in the payload.
-- ─────────────────────────────────────────────────────────────────────────────

UPDATE tracking_events
SET event_at = (raw_payload->>'update_date')::timestamptz
WHERE raw_payload IS NOT NULL
  AND raw_payload ? 'update_date'
  AND raw_payload->>'update_date' IS NOT NULL
  AND raw_payload->>'update_date' != ''
  AND (raw_payload->>'update_date')::text ~ '^\d{4}-\d{2}-\d{2}';

-- ─────────────────────────────────────────────────────────────────────────────
-- Step 3: Re-populate status from raw_payload->>'status_code'
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
  WHEN '11' THEN 'exception'
  WHEN '12' THEN 'exception'
  WHEN '13' THEN 'awaiting_collection'
  WHEN '16' THEN 'exception'
  WHEN '18' THEN 'customs_hold'
  ELSE status
END
WHERE raw_payload IS NOT NULL
  AND raw_payload ? 'status_code'
  AND raw_payload->>'status_code' IN ('1','2','3','4','5','6','7','8','9','10','11','12','13','16','18');

-- ─────────────────────────────────────────────────────────────────────────────
-- Step 4: Remove duplicates — keep earliest id per (parcel_id, event_at, status)
-- ─────────────────────────────────────────────────────────────────────────────

DELETE FROM tracking_events
WHERE id NOT IN (
  SELECT DISTINCT ON (parcel_id, event_at, status) id
  FROM tracking_events
  ORDER BY parcel_id, event_at, status, id ASC
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Step 5: Re-add the unique constraint now that duplicates are gone
-- ─────────────────────────────────────────────────────────────────────────────

CREATE UNIQUE INDEX IF NOT EXISTS uq_tracking_events_parcel_at_status
  ON tracking_events (parcel_id, event_at, status);

-- ─────────────────────────────────────────────────────────────────────────────
-- Step 6: Re-derive all parcel statuses from the corrected event_at ordering
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
  ORDER BY parcel_id, event_at DESC NULLS LAST, id DESC
) latest
WHERE p.id = latest.parcel_id
  AND latest.status IS NOT NULL
  AND latest.status != 'unknown';
