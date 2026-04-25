-- Migration 091: Billing settings table
-- Stores the configurable billing run schedule.
-- Single-row table (id = 1 always).

CREATE TABLE IF NOT EXISTS billing_settings (
  id                     INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  billing_day_of_week    INTEGER NOT NULL DEFAULT 6      -- 0=Sun … 6=Sat
                           CHECK (billing_day_of_week BETWEEN 0 AND 6),
  billing_hour           INTEGER NOT NULL DEFAULT 0      -- 0–23
                           CHECK (billing_hour BETWEEN 0 AND 23),
  billing_minute         INTEGER NOT NULL DEFAULT 0      -- 0–59
                           CHECK (billing_minute BETWEEN 0 AND 59),
  fortnightly_parity     INTEGER NOT NULL DEFAULT 0      -- 0 or 1 (which week-mod-2 runs fortnightly)
                           CHECK (fortnightly_parity IN (0, 1)),
  monthly_billing_date   INTEGER NOT NULL DEFAULT 1      -- day of month 1–28
                           CHECK (monthly_billing_date BETWEEN 1 AND 28),
  last_run_at            TIMESTAMP WITH TIME ZONE,
  enabled                BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at             TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed default row
INSERT INTO billing_settings (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;
