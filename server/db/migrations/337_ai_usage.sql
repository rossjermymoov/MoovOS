-- 337: AI usage tracking and limits (Settings → AI usage)
--
-- Gemini ran out of prepaid credits for weeks and nobody could tell: every AI
-- feature quietly fell back to keyword rules. These tables record every AI call
-- (tokens, success/failure) so the team can see what uses tokens, how much is
-- left, and whether AI is actually working — and set limits on it.

-- One row per AI API call.
CREATE TABLE IF NOT EXISTS ai_usage_events (
  id             BIGSERIAL PRIMARY KEY,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  feature        TEXT NOT NULL,              -- see server/services/aiUsage.js FEATURES
  provider       TEXT NOT NULL DEFAULT 'gemini',
  model          TEXT,
  input_tokens   INTEGER NOT NULL DEFAULT 0,
  output_tokens  INTEGER NOT NULL DEFAULT 0, -- includes "thinking" tokens, billed as output
  ok             BOOLEAN NOT NULL,
  blocked        BOOLEAN NOT NULL DEFAULT false, -- not sent: feature switched off or limit reached
  http_status    INTEGER,
  error          TEXT,
  duration_ms    INTEGER
);
CREATE INDEX IF NOT EXISTS idx_ai_usage_events_created ON ai_usage_events (created_at);
CREATE INDEX IF NOT EXISTS idx_ai_usage_events_feature_created ON ai_usage_events (feature, created_at);

-- Single-row settings.
CREATE TABLE IF NOT EXISTS ai_usage_settings (
  id                    INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  monthly_token_limit   BIGINT,                      -- NULL = no limit
  warn_percent          INTEGER NOT NULL DEFAULT 80,
  pause_at_limit        BOOLEAN NOT NULL DEFAULT true, -- false = warn only
  price_input_per_m     NUMERIC(12,4),               -- price per 1M input tokens; NULL = costs not shown
  price_output_per_m    NUMERIC(12,4),
  currency              TEXT NOT NULL DEFAULT 'GBP',
  credit_balance        NUMERIC(12,2),               -- prepaid balance as last seen in AI Studio
  credit_balance_set_at TIMESTAMPTZ,
  disabled_features     TEXT[] NOT NULL DEFAULT '{}',
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
INSERT INTO ai_usage_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
