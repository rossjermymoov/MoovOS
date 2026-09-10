-- 326_loop_controller.sql
-- WISMO Phase 3 (MOS-6): Loop Controller + Autonomy Gate.
--
-- whole_case_sla_deadline is a SEPARATE clock from the existing courier_sla_expires_at
-- (per-hop courier response window) — set once from ticket creation, never reset by
-- subsequent exchanges. Backfilled from NOW(), not created_at, so existing open
-- tickets don't all breach the instant this deploys.

ALTER TABLE queries
  ADD COLUMN IF NOT EXISTS whole_case_sla_deadline TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS chase_stage             SMALLINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_chase_sent_at      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS escalation_source       TEXT
    CHECK (escalation_source IN ('sla_breach','whole_case_sla_breach','ambiguous_reply','dissatisfaction','inconsistent_reply'));

UPDATE queries SET whole_case_sla_deadline = NOW() + INTERVAL '48 hours'
 WHERE whole_case_sla_deadline IS NULL
   AND status NOT IN ('resolved','resolved_claim_approved','resolved_claim_rejected');

-- Consistency-check outcome, alongside Phase 2's reply_classification. Null = not
-- checked (e.g. classified via a hard rule before the Gemini call ran).
ALTER TABLE query_emails
  ADD COLUMN IF NOT EXISTS is_consistent BOOLEAN;

-- Round 3 decision #5: claims/complaints lockout is now a per-category setting
-- instead of a hardcoded rule. full_lockout matches today's behaviour exactly.
ALTER TABLE workflow_trust
  ADD COLUMN IF NOT EXISTS claims_lockout_scope TEXT NOT NULL DEFAULT 'full_lockout'
    CHECK (claims_lockout_scope IN ('full_lockout','final_step_only'));

CREATE TABLE IF NOT EXISTS spot_check_samples (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query_id     UUID NOT NULL REFERENCES queries(id),
  courier_code VARCHAR(50),
  intent       VARCHAR(50),
  sampled_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at  TIMESTAMPTZ,
  reviewer_id  UUID,               -- nullable FK to staff; supports rotation later
  outcome      TEXT CHECK (outcome IN ('ok','issue_found')),
  notes        TEXT
);
CREATE INDEX IF NOT EXISTS idx_spot_check_reviewed ON spot_check_samples(reviewed_at);

-- Singleton settings row for whole-case SLA / chase cadence / spot-check sizing —
-- ops-editable in one place rather than hardcoded thresholds.
CREATE TABLE IF NOT EXISTS automation_settings (
  id                      SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  whole_case_sla_hours    INT NOT NULL DEFAULT 48,
  chase_first_hours       INT NOT NULL DEFAULT 48,
  chase_second_hours      INT NOT NULL DEFAULT 120,
  chase_escalate_hours    INT NOT NULL DEFAULT 48,
  spot_check_daily_target INT NOT NULL DEFAULT 12,
  spot_check_last_run_on  DATE,
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
INSERT INTO automation_settings (id) VALUES (1) ON CONFLICT DO NOTHING;
