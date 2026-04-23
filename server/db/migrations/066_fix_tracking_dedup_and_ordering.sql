-- 066: Fix tracking event deduplication and parcel status ordering
--
-- Root causes fixed here:
--
-- 1. tracking_events had no unique constraint, so ON CONFLICT DO NOTHING was
--    silently doing nothing and every webhook replay created duplicate rows.
--
-- 2. The parcel upsert used `status = EXCLUDED.status` unconditionally, meaning
--    a replayed or out-of-order webhook could regress a delivered parcel back
--    to an earlier status.
--
-- 3. Migration 065 Step 2 ordered by `created_at DESC` to find the most recent
--    event, but bulk-imported events all arrive with nearly identical created_at
--    timestamps (milliseconds apart), making that ordering essentially random.
--    The correct field to order by is `event_at` — the actual courier timestamp.
--
-- ─────────────────────────────────────────────────────────────────────────────
-- Step 1: Remove duplicate tracking_events
--   Keep the earliest-inserted row for each (parcel_id, event_at, status)
--   combination. This is the closest we can get to idempotent deduplication
--   without an event_code (which can be null).
-- ─────────────────────────────────────────────────────────────────────────────

DELETE FROM tracking_events
WHERE id NOT IN (
  SELECT DISTINCT ON (parcel_id, event_at, status) id
  FROM tracking_events
  ORDER BY parcel_id, event_at, status, id ASC
);

-- ─────────────────────────────────────────────────────────────────────────────
-- Step 2: Add unique constraint to prevent future duplicates
-- ─────────────────────────────────────────────────────────────────────────────

CREATE UNIQUE INDEX IF NOT EXISTS uq_tracking_events_parcel_at_status
  ON tracking_events (parcel_id, event_at, status);

-- ─────────────────────────────────────────────────────────────────────────────
-- Step 3: Re-derive all parcel statuses using event_at (actual courier
--         timestamp) instead of created_at (DB insert time).
--         This fixes the bulk-import ordering problem where all events landed
--         within milliseconds of each other.
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
