-- Migration 097: Xero OAuth token storage
-- Stores the OAuth2 access/refresh tokens for the Xero connection.
-- Single-row table — one Xero tenant connected per MoovOS instance.

CREATE TABLE IF NOT EXISTS xero_tokens (
  id             SERIAL PRIMARY KEY,
  access_token   TEXT NOT NULL,
  refresh_token  TEXT NOT NULL,
  tenant_id      VARCHAR(100),
  tenant_name    VARCHAR(255),
  expires_at     TIMESTAMPTZ NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
