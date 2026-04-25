-- Migration 096: add domestic_pct to prospect_rate_cards
-- Stores the domestic/international split used in the rate card projection panel.
-- Defaults to 95 (95% domestic, 5% international).

ALTER TABLE prospect_rate_cards
  ADD COLUMN IF NOT EXISTS domestic_pct INTEGER NOT NULL DEFAULT 95
    CHECK (domestic_pct BETWEEN 50 AND 100);
