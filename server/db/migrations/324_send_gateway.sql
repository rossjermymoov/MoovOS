-- 324_send_gateway.sql
-- WISMO Automation Phase 1: live email sending via Gmail from the approve
-- endpoints. rfc_message_id captures the email's own Message-Id header (never
-- stored before — only Gmail's internal gmail_message_id was) so a reply can
-- set In-Reply-To/References correctly. send_status/send_error/sent_by track
-- the outcome of an actual send attempt, distinct from the DB-only is_ai_draft
-- flip that existed before this migration.

ALTER TABLE query_emails
  ADD COLUMN IF NOT EXISTS rfc_message_id TEXT,
  ADD COLUMN IF NOT EXISTS send_status    TEXT CHECK (send_status IN ('sent','failed')),
  ADD COLUMN IF NOT EXISTS send_error     TEXT,
  ADD COLUMN IF NOT EXISTS sent_by        TEXT NOT NULL DEFAULT 'human' CHECK (sent_by IN ('human','autopilot'));
