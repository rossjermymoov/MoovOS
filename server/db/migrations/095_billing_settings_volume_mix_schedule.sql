-- Migration 095: Add volume mix refresh schedule to billing_settings
-- Controls when the weekly volume mix snapshot refreshes for rate card projections.

ALTER TABLE billing_settings
  ADD COLUMN IF NOT EXISTS volume_mix_refresh_day  INTEGER NOT NULL DEFAULT 6
    CHECK (volume_mix_refresh_day BETWEEN 0 AND 6),
  ADD COLUMN IF NOT EXISTS volume_mix_refresh_hour INTEGER NOT NULL DEFAULT 8
    CHECK (volume_mix_refresh_hour BETWEEN 0 AND 23);

COMMENT ON COLUMN billing_settings.volume_mix_refresh_day  IS '0=Sun … 6=Sat — day of week the volume mix snapshot auto-refreshes';
COMMENT ON COLUMN billing_settings.volume_mix_refresh_hour IS '0–23 — hour of day the snapshot refreshes (local server time)';
