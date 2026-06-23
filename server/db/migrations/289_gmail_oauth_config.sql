-- Migration 289: Gmail OAuth config for read-only inbox sync

CREATE TABLE IF NOT EXISTS gmail_oauth_config (
  id              SERIAL PRIMARY KEY,
  email_address   VARCHAR(255),
  access_token    TEXT,
  refresh_token   TEXT,
  token_expiry    TIMESTAMPTZ,
  connected_at    TIMESTAMPTZ,
  last_sync_at    TIMESTAMPTZ,
  last_history_id VARCHAR(100),
  enabled         BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO gmail_oauth_config (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
