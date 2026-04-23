-- 070: Re-derive parcel statuses from tracking_events
-- Migration 069 already updated tracking_events.status from dc_status_code.
-- This migration copies those statuses to the parcels table.
-- No string literal enum values are used here — status is copied column-to-column
-- to avoid any connection-level type cache issues with newly added enum values.

UPDATE parcels p
SET
  status             = latest.status,
  status_description = latest.description,
  last_location      = latest.location,
  last_event_at      = latest.event_at,
  updated_at         = NOW()
FROM (
  SELECT DISTINCT ON (parcel_id)
    parcel_id, status, description, location, event_at
  FROM tracking_events
  WHERE status IS NOT NULL
    AND status::text != 'unknown'
  ORDER BY parcel_id, event_at DESC NULLS LAST, dc_status_code DESC NULLS LAST, id DESC
) latest
WHERE p.id = latest.parcel_id
  AND latest.status IS NOT NULL
  AND latest.status::text != 'unknown';
