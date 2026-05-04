-- Migration 141: Email infrastructure
-- email_config (single row), email_alert_types (seeded), email_alert_recipients

-- ── Provider config ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS email_config (
  id           SERIAL PRIMARY KEY,
  provider     VARCHAR(50)  NOT NULL DEFAULT 'sendgrid',
  api_key      TEXT,
  from_address VARCHAR(255) NOT NULL DEFAULT 'alerts@moovparcel.com',
  from_name    VARCHAR(255) NOT NULL DEFAULT 'Moov OS',
  enabled      BOOLEAN      NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Ensure exactly one row exists
INSERT INTO email_config (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;

-- ── Alert type definitions ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS email_alert_types (
  id              SERIAL PRIMARY KEY,
  code            VARCHAR(100) NOT NULL UNIQUE,
  name            VARCHAR(255) NOT NULL,
  description     TEXT,
  enabled         BOOLEAN      NOT NULL DEFAULT false,
  settings        JSONB        NOT NULL DEFAULT '{}',
  last_alerted_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

INSERT INTO email_alert_types (code, name, description, settings) VALUES
  (
    'webhook_gap',
    'Webhook Gap Alert',
    'Fires when no tracking webhooks have been received during business hours for longer than the configured threshold. Indicates the webhook feed may have gone down.',
    '{"threshold_minutes": 10, "business_hours_start": 8, "business_hours_end": 17, "cooldown_minutes": 30}'
  ),
  (
    'backfill_triggered',
    'API Backfill Triggered',
    'Fires when the Layer 1 Voila API backfill activates because a shipment-created webhook was missed. Useful for spotting systemic webhook gaps.',
    '{"cooldown_minutes": 60}'
  ),
  (
    'billing_run_complete',
    'Billing Run Complete',
    'Fires when an automated billing cycle completes, summarising charges queued and customers processed.',
    '{}'
  )
ON CONFLICT (code) DO NOTHING;

-- ── Recipients per alert type ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS email_alert_recipients (
  id            SERIAL PRIMARY KEY,
  alert_type_id INTEGER      NOT NULL REFERENCES email_alert_types(id) ON DELETE CASCADE,
  email         VARCHAR(255) NOT NULL,
  name          VARCHAR(255),
  enabled       BOOLEAN      NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (alert_type_id, email)
);
