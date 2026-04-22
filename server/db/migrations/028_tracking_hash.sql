-- 028: tracking_hash on billing shipments
--
-- Couriers recycle tracking numbers every 6–12 months.
-- To ensure a tracking event in month 13 doesn't accidentally verify
-- an old charge, we store a hash of (tracking_code + collection_date)
-- at ingest time and use a 400-day date window in auto-verify queries.
--
-- The hash formula (computed in Node):
--   SHA256(lower(tracking_code) || ':' || collection_date_YYYYMMDD)
--
-- If collection_date is unknown, the date portion is '' so the hash
-- is still unique per tracking code (just without date disambiguation).

ALTER TABLE shipments
  ADD COLUMN IF NOT EXISTS tracking_hash VARCHAR(64);

-- Index for fast hash lookups in future
CREATE INDEX IF NOT EXISTS shipments_tracking_hash_idx
  ON shipments(tracking_hash)
  WHERE tracking_hash IS NOT NULL;

-- Back-fill hashes for existing shipments using Postgres's encode+sha256.
-- We use the first element of tracking_codes + collection_date.
-- (This is a best-effort back-fill; new rows are hashed in application code
-- where we have access to all tracking codes, not just the first.)
UPDATE shipments
SET tracking_hash = encode(
  sha256(
    convert_to(
      lower(tracking_codes[1]) || ':' ||
      COALESCE(TO_CHAR(collection_date, 'YYYY-MM-DD'), ''),
      'UTF8'
    )
  ),
  'hex'
)
WHERE tracking_codes IS NOT NULL
  AND tracking_codes[1] IS NOT NULL
  AND tracking_hash IS NULL;
