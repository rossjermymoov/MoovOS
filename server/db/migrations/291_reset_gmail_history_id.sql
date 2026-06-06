-- Migration 291: Reset Gmail historyId so next sync does a full 7-day resync.
-- Needed because early broken syncs saved a historyId without importing anything.
UPDATE gmail_oauth_config SET last_history_id = NULL, last_sync_at = NULL WHERE id = 1;
