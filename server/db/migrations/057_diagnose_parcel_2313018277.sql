-- 057: Diagnostic — inspect stored data for parcel 2313018277
-- Output will appear in Railway deploy logs via RAISE NOTICE

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT
      te.id,
      te.event_code,
      te.status,
      te.description,
      te.event_at,
      raw_payload->>'status'        AS rp_status,
      raw_payload->>'update_code'   AS rp_update_code,
      raw_payload->>'statusCode'    AS rp_statusCode,
      raw_payload->>'status_code'   AS rp_status_code,
      raw_payload->>'parcel_status' AS rp_parcel_status,
      jsonb_typeof(raw_payload)     AS rp_type,
      LEFT(raw_payload::text, 200)  AS rp_preview
    FROM tracking_events te
    WHERE te.consignment_number = '2313018277'
    ORDER BY te.event_at DESC
  LOOP
    RAISE NOTICE '--- event id=% at=%', r.id, r.event_at;
    RAISE NOTICE '    event_code=% | stored_status=%', r.event_code, r.status;
    RAISE NOTICE '    description=%', r.description;
    RAISE NOTICE '    rp_type=% | rp_status=% | rp_update_code=% | rp_statusCode=%',
      r.rp_type, r.rp_status, r.rp_update_code, r.rp_statusCode;
    RAISE NOTICE '    rp_preview=%', r.rp_preview;
  END LOOP;

  -- Also show the parcel row
  FOR r IN
    SELECT id, status, status_description, last_event_at
    FROM parcels
    WHERE consignment_number = '2313018277'
  LOOP
    RAISE NOTICE '=== PARCEL: status=% | description=% | last_event=%',
      r.status, r.status_description, r.last_event_at;
  END LOOP;
END $$;
