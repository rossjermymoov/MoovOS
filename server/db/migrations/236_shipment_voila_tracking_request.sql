-- ─── Migration 236 ────────────────────────────────────────────────────────────
--
-- Add Voila tracking request fields to shipments.
--
-- When a shipment.created webhook arrives, the response JSON contains:
--   "tracking_request_id":  925179379    (numeric, Voila's ID for this tracking req)
--   "tracking_request_hash": 3189106388  (numeric, auth hash for the tracking API)
--
-- These two values are required to call the Voila tracking request API to
-- retrieve parcel tracking events on demand (instead of waiting for a webhook).
-- Previously we were discarding them — this migration adds the columns so they
-- can be captured and used for bulk tracking backfills.

ALTER TABLE shipments
  ADD COLUMN IF NOT EXISTS voila_tracking_request_id   BIGINT,
  ADD COLUMN IF NOT EXISTS voila_tracking_request_hash BIGINT;

CREATE INDEX IF NOT EXISTS shipments_voila_track_req_idx
  ON shipments(voila_tracking_request_id)
  WHERE voila_tracking_request_id IS NOT NULL;

COMMENT ON COLUMN shipments.voila_tracking_request_id
  IS 'Voila tracking_request_id from shipment.created response — required for on-demand tracking API calls';

COMMENT ON COLUMN shipments.voila_tracking_request_hash
  IS 'Voila tracking_request_hash from shipment.created response — auth hash for tracking API calls';
