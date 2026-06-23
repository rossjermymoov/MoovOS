-- 314_automation_rules.sql
-- Unify the SLA Rules Engine + SLA/Autopilot Switchboard into ONE customizable
-- "Automation Rules" engine. One ordered list; first matching rule wins.
--
--   WHEN  (all provided conditions must match — AND):
--           cond_subject_contains  — substring of subject OR body (case-insensitive)
--           cond_courier_code      — exact courier (dpd, dhl, evri, yodel, …)
--           cond_query_type        — matches the ticket's query_type OR triage_intent
--           cond_customer_tier     — bronze | silver | gold | enterprise
--   THEN  set_priority, SLA response/resolution minutes, scream-on-breach toggle,
--         and autopilot_mode (off | draft | full). 'full' still respects the
--         workflow_trust 20-clean-approval gate before anything auto-sends.

CREATE TABLE IF NOT EXISTS automation_rules (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                   VARCHAR(120) NOT NULL,
  position               INT NOT NULL DEFAULT 100,        -- lower = evaluated first
  is_active              BOOLEAN NOT NULL DEFAULT TRUE,

  -- WHEN — any NULL condition is ignored; all non-NULL must match.
  cond_subject_contains  TEXT,
  cond_courier_code      VARCHAR(50),
  cond_query_type        VARCHAR(50),
  cond_customer_tier     VARCHAR(20),

  -- THEN
  set_priority           ticket_priority,                 -- NULL = leave triage priority
  response_minutes       INT,                             -- SLA response target
  resolution_minutes     INT,                             -- SLA resolution target
  scream_to_google_chat  BOOLEAN NOT NULL DEFAULT TRUE,
  autopilot_mode         VARCHAR(10) NOT NULL DEFAULT 'draft'
                           CHECK (autopilot_mode IN ('off', 'draft', 'full')),

  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_automation_rules_active_pos
  ON automation_rules(is_active, position);

-- Per-ticket: which rule matched + the response window it set (drives the monitor).
ALTER TABLE queries
  ADD COLUMN IF NOT EXISTS sla_response_minutes INT,
  ADD COLUMN IF NOT EXISTS matched_rule_id      UUID;

-- Seed sensible starter rules (first match wins, ascending position).
INSERT INTO automation_rules
  (name, position, cond_subject_contains, cond_courier_code, cond_query_type, cond_customer_tier,
   set_priority, response_minutes, resolution_minutes, scream_to_google_chat, autopilot_mode)
VALUES
  ('Account on stop — no courier', 20, 'on stop', NULL, NULL, NULL,
     'high', 240, 1440, TRUE, 'off'),
  ('DPD queries', 30, NULL, 'dpd', NULL, NULL,
     NULL, 120, 1440, TRUE, 'draft'),
  ('DHL chases', 40, NULL, 'dhl', NULL, NULL,
     NULL, 240, 1440, TRUE, 'draft'),
  ('Default', 1000, NULL, NULL, NULL, NULL,
     NULL, 240, 1440, TRUE, 'draft')
ON CONFLICT DO NOTHING;
