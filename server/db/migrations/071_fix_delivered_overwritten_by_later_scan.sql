-- 071: Fix parcels whose delivered status was overwritten by a later DC scan
--
-- DC occasionally sends a stale out_for_delivery (or other) event with a
-- timestamp AFTER the delivered event for multi-parcel shipments.
-- Our upsert advanced the parcel status to the later event, overwriting delivered.
--
-- This migration finds any parcel that:
--   (a) has a delivered event in tracking_events
--   (b) currently has a non-delivered status
-- and resets it back to delivered using the most recent delivered event.

UPDATE parcels p
SET
  status             = 'delivered',
  status_description = latest_delivered.description,
  last_event_at      = latest_delivered.event_at,
  delivered_at       = COALESCE(p.delivered_at, latest_delivered.event_at),
  updated_at         = NOW()
FROM (
  SELECT DISTINCT ON (parcel_id)
    parcel_id,
    description,
    event_at
  FROM tracking_events
  WHERE status = 'delivered'
  ORDER BY parcel_id, event_at DESC
) latest_delivered
WHERE p.id = latest_delivered.parcel_id
  AND p.status != 'delivered';
