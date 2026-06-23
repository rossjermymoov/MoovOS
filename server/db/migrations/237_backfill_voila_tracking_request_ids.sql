-- ─── Migration 237 ────────────────────────────────────────────────────────────
--
-- Backfill voila_tracking_request_id and voila_tracking_request_hash on all
-- existing shipments from the raw_payload column.
--
-- The tracking request credentials sit inside raw_payload.response, which is
-- stored as either:
--   a) a JSON string  → raw_payload->>'response' then ::jsonb
--   b) a JSONB object → raw_payload->'response' directly
--
-- Both cases are handled with a CASE on jsonb_typeof.

UPDATE shipments
SET
  voila_tracking_request_id = CASE
    WHEN jsonb_typeof(raw_payload->'response') = 'string'
      THEN ((raw_payload->>'response')::jsonb->>'tracking_request_id')::BIGINT
    WHEN jsonb_typeof(raw_payload->'response') = 'object'
      THEN (raw_payload->'response'->>'tracking_request_id')::BIGINT
    ELSE NULL
  END,
  voila_tracking_request_hash = CASE
    WHEN jsonb_typeof(raw_payload->'response') = 'string'
      THEN ((raw_payload->>'response')::jsonb->>'tracking_request_hash')::BIGINT
    WHEN jsonb_typeof(raw_payload->'response') = 'object'
      THEN (raw_payload->'response'->>'tracking_request_hash')::BIGINT
    ELSE NULL
  END
WHERE voila_tracking_request_id IS NULL
  AND raw_payload IS NOT NULL
  AND raw_payload ? 'response';

DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM shipments
  WHERE voila_tracking_request_id IS NOT NULL;

  RAISE NOTICE 'Migration 237: % shipment(s) now have voila_tracking_request_id populated.', v_count;

  SELECT COUNT(*) INTO v_count
  FROM shipments
  WHERE voila_tracking_request_id IS NULL
    AND raw_payload IS NOT NULL
    AND raw_payload ? 'response';

  IF v_count > 0 THEN
    RAISE NOTICE 'Migration 237: % shipment(s) still have NULL tracking_request_id despite having a response field — may be older webhooks without this field.', v_count;
  END IF;
END $$;
