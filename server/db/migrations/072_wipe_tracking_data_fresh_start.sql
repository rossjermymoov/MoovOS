-- 072: Wipe all tracking data for a clean fresh start
--
-- Previous data accumulated under an imperfect webhook setup where:
--   - DC's tracking_request_id / tracking_request_hash were unknown
--   - Some delivered events were missed entirely (webhook gap)
--   - Some delivered statuses were overwritten by stale post-delivery OFD scans
--
-- Going forward: every parcel is tracked from creation. Each DC webhook
-- includes the full event history, so if the first event we receive is
-- "in transit" we automatically backfill all earlier events (booked,
-- collected, etc.) from the same payload using their original timestamps.
--
-- tracking_events is cascade-deleted when parcels rows are deleted.

TRUNCATE tracking_events, parcels RESTART IDENTITY CASCADE;
