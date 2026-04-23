-- 068: Use status_code as ordering fallback when update_date is absent
--
-- Migration 067 rebuilt event_at from raw_payload->>'update_date' for events
-- that have that field. For events that don't, event_at is still the DB insert
-- time — nearly identical across all events in a bulk batch.
--
-- Dispatch Cloud's status_code is a monotonically increasing progression
-- (1=booked → 7=delivered → 13=awaiting_collection etc). We use it as an
-- explicit ordering field so we can always determine which event is terminal,
-- even when timestamps are identical.
--
-- Strategy:
--   - For events WHERE update_date IS present and was parsed correctly
--     (event_at differs from created_at), trust event_at ordering.
--   - For events WHERE event_at ≈ created_at (bulk import, no individual
--     timestamps), order by status_code instead using a terminal-status
--     priority ranking that reflects the real-world parcel lifecycle.
--
-- ─────────────────────────────────────────────────────────────────────────────
-- Step 1: Add a status_code column to tracking_events for ordering
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE tracking_events
  ADD COLUMN IF NOT EXISTS dc_status_code SMALLINT;

UPDATE tracking_events
SET dc_status_code = (raw_payload->>'status_code')::smallint
WHERE raw_payload IS NOT NULL
  AND raw_payload ? 'status_code'
  AND raw_payload->>'status_code' ~ '^\d+$';

-- ─────────────────────────────────────────────────────────────────────────────
-- Step 2: Re-derive parcel statuses using a two-level ordering strategy:
--   Primary:   event_at DESC (real timestamp where available)
--   Secondary: dc_status_code DESC (higher code = later in lifecycle)
--   Tertiary:  id DESC (last-inserted as final tiebreaker)
--
-- This handles both cases:
--   a) Events with real timestamps → event_at ordering wins
--   b) Bulk-imported events with identical timestamps → status_code ordering wins
-- ─────────────────────────────────────────────────────────────────────────────

UPDATE parcels p
SET
  status             = latest.status,
  status_description = latest.description,
  last_location      = latest.location,
  last_event_at      = latest.event_at,
  updated_at         = NOW()
FROM (
  SELECT DISTINCT ON (parcel_id)
    parcel_id,
    status,
    description,
    location,
    event_at
  FROM tracking_events
  WHERE status IS NOT NULL
    AND status != 'unknown'
  ORDER BY
    parcel_id,
    event_at       DESC NULLS LAST,
    dc_status_code DESC NULLS LAST,
    id             DESC
) latest
WHERE p.id = latest.parcel_id
  AND latest.status IS NOT NULL
  AND latest.status != 'unknown';
