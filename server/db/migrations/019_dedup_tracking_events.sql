-- 019_dedup_tracking_events.sql
-- Remove duplicate tracking events: for each parcel+status combination,
-- keep only the earliest event and delete the rest.

DELETE FROM tracking_events
WHERE id NOT IN (
  SELECT DISTINCT ON (parcel_id, status) id
  FROM tracking_events
  ORDER BY parcel_id, status, event_at ASC, id ASC
);
