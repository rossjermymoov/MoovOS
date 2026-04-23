-- 070: Apply definitive status mapping (runs after enum values are committed)
-- 069 added the enum values; this migration applies the data updates now that
-- tracking_expired, cancelled and damaged are committed enum members.

UPDATE tracking_events
SET status = CASE dc_status_code
  WHEN 1  THEN 'booked'::parcel_status
  WHEN 2  THEN 'collected'::parcel_status
  WHEN 3  THEN 'at_depot'::parcel_status
  WHEN 4  THEN 'in_transit'::parcel_status
  WHEN 5  THEN 'out_for_delivery'::parcel_status
  WHEN 6  THEN 'failed_delivery'::parcel_status
  WHEN 7  THEN 'delivered'::parcel_status
  WHEN 8  THEN 'on_hold'::parcel_status
  WHEN 9  THEN 'exception'::parcel_status
  WHEN 10 THEN 'returned'::parcel_status
  WHEN 11 THEN 'tracking_expired'::parcel_status
  WHEN 12 THEN 'cancelled'::parcel_status
  WHEN 13 THEN 'awaiting_collection'::parcel_status
  WHEN 16 THEN 'damaged'::parcel_status
  WHEN 18 THEN 'customs_hold'::parcel_status
  ELSE status
END
WHERE dc_status_code IS NOT NULL;

UPDATE tracking_events
SET status = CASE (raw_payload->>'status_code')
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
  WHEN '11' THEN 'tracking_expired'::parcel_status
  WHEN '12' THEN 'cancelled'::parcel_status
  WHEN '13' THEN 'awaiting_collection'::parcel_status
  WHEN '16' THEN 'damaged'::parcel_status
  WHEN '18' THEN 'customs_hold'::parcel_status
  ELSE status
END
WHERE dc_status_code IS NULL
  AND raw_payload IS NOT NULL
  AND raw_payload ? 'status_code'
  AND raw_payload->>'status_code' IN ('1','2','3','4','5','6','7','8','9','10','11','12','13','16','18');

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
  WHERE status IS NOT NULL AND status != 'unknown'
  ORDER BY parcel_id, event_at DESC NULLS LAST, dc_status_code DESC NULLS LAST, id DESC
) latest
WHERE p.id = latest.parcel_id
  AND latest.status IS NOT NULL
  AND latest.status != 'unknown';
