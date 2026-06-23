-- 296_gmail_sync_after.sql
-- A floor timestamp for the Gmail sync. When set, the poller only ingests
-- messages received after this moment — used to start from a clean baseline
-- after wiping ticket data. NULL = no floor (normal rolling 7-day window).

ALTER TABLE gmail_oauth_config
  ADD COLUMN IF NOT EXISTS sync_after TIMESTAMPTZ;
