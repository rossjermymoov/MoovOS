-- 065: Definitive tracking renormalisation using Dispatch Cloud status_code
--
-- Diagnostic (migration 064) confirmed the Dispatch Cloud webhook payload structure:
--   status_code        — numeric code 1-18 (the authoritative Dispatch Cloud status)
--   status_description — verbatim courier description text (for display)
--   status             — short courier text status (e.g. "Returned To Sender")
--   update_date        — event timestamp
--
-- All previous renormalisation attempts (055, 056, 063) used raw_payload->>'status'
-- which contains the verbatim text, not the numeric code. This migration uses
-- raw_payload->>'status_code' which is the definitive source.

-- ─────────────────────────────────────────────────────────────────────────────
-- Step 1: Re-normalise tracking_events.status from status_code
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
  ELSE status  -- leave unchanged if no numeric code in payload
END
WHERE raw_payload IS NOT NULL
  AND raw_payload ? 'status_code'
  AND raw_payload->>'status_code' IN ('1','2','3','4','5','6','7','8','9','10','11','12','13','16','18');

-- ─────────────────────────────────────────────────────────────────────────────
-- Step 2: Re-derive all parcel statuses from their most recent tracking event
-- ─────────────────────────────────────────────────────────────────────────────

UPDATE parcels p
SET
  status     = latest.status,
  updated_at = NOW()
FROM (
  SELECT DISTINCT ON (consignment_number)
    consignment_number,
    status
  FROM tracking_events
  WHERE status IS NOT NULL
    AND status != 'unknown'
  ORDER BY consignment_number, created_at DESC
) latest
WHERE p.consignment_number = latest.consignment_number
  AND latest.status IS NOT NULL
  AND latest.status != 'unknown';
