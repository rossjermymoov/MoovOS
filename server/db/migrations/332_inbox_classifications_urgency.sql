-- Migration 332: Phase 0 completion — inbox_classifications + urgency scorer
-- (email-triage-automation-plan.md Section 6.1 item 4, Section 6.3).
--
-- inbox_classifications is a per-email audit record of what MoovOS decided this
-- message was — separate from `tasks`/`queries`, which hold the operational
-- record. This is what a manual comparison against Freshdesk tickets reads from
-- (Phase 1 automated comparison was explicitly deferred in favour of a manual
-- check, so no freshdesk_* columns are added here — add them later if that
-- changes). Only the hashed subject is stored, never the raw subject or body,
-- to limit PII retention (per Section 8's open retention question — this is
-- the conservative default the plan's own schema draft already specified).
CREATE TABLE IF NOT EXISTS inbox_classifications (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gmail_message_id     VARCHAR(100) NOT NULL UNIQUE,
  gmail_thread_id      VARCHAR(100),
  raw_subject_hash     TEXT,
  moovos_category      VARCHAR(20) NOT NULL,
  moovos_space         VARCHAR(40),
  moovos_urgency       BOOLEAN NOT NULL DEFAULT false,
  moovos_urgency_reason TEXT,
  task_id              UUID REFERENCES tasks(id) ON DELETE SET NULL,
  query_id             UUID REFERENCES queries(id) ON DELETE SET NULL,
  classified_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_inbox_classifications_query  ON inbox_classifications(query_id);
CREATE INDEX IF NOT EXISTS idx_inbox_classifications_thread ON inbox_classifications(gmail_thread_id);

-- The urgency scorer flags a ticket via the same requires_attention/
-- attention_reason/escalation_source columns dissatisfactionEngine.js already
-- uses (a broadcast-style flag visible on QueriesPage regardless of viewer) —
-- NOT the per-user notifications/NotificationBell table, which requires a
-- specific assignee that a brand-new unassigned ticket doesn't have yet.
-- escalation_source has a fixed CHECK list (migration 326); widen it.
ALTER TABLE queries DROP CONSTRAINT IF EXISTS queries_escalation_source_check;
ALTER TABLE queries ADD CONSTRAINT queries_escalation_source_check
  CHECK (escalation_source IN
    ('sla_breach','whole_case_sla_breach','ambiguous_reply','dissatisfaction','inconsistent_reply','urgency_signal'));
