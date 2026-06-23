-- 298_ai_adaptive_learning.sql
-- Adaptive learning store: each row is a refinement instruction an agent gave
-- the AI when revising a draft. These are fed back into future draft revisions
-- so the model learns the team's preferences per courier / issue type.

CREATE TABLE IF NOT EXISTS ai_learning_rules (
  id            SERIAL PRIMARY KEY,
  courier_code  VARCHAR(50),       -- 'dpd', 'dhl', etc. (nullable)
  issue_type    VARCHAR(50),       -- e.g. 'NO_SCAN_24H' (nullable)
  user_feedback TEXT NOT NULL,     -- the refinement prompt given by the agent
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_learning_courier ON ai_learning_rules(courier_code);
