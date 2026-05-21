-- Migration 184: add tracking_url column to parcels
-- Stores the courier's public tracking page URL, extracted from incoming
-- DC tracking webhooks. Client-side fallback by courier code handles
-- parcels created before this migration.

ALTER TABLE parcels ADD COLUMN IF NOT EXISTS tracking_url TEXT;
