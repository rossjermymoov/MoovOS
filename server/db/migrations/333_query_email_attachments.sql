-- Migration 333: Capture Gmail attachment metadata on import (Phase 2 of
-- email-triage-automation-plan.md).
--
-- gmailSync.js previously only fetched attachments that are inline body parts
-- (for rendering) — a genuinely attached file (e.g. a PDF commercial invoice)
-- was never recorded anywhere. This is a real prerequisite for claim-evidence
-- automation: identifying "the invoice the customer attached" needs to know an
-- attachment exists at all first. Metadata only (filename/type/size/Gmail's
-- attachment id) — the file content itself is fetched on demand via the Gmail
-- API when actually needed, not duplicated into this table.
CREATE TABLE IF NOT EXISTS query_email_attachments (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query_email_id      UUID NOT NULL REFERENCES query_emails(id) ON DELETE CASCADE,
  filename            VARCHAR(255),
  mime_type           VARCHAR(100),
  gmail_message_id    VARCHAR(100),
  gmail_attachment_id TEXT,
  size_bytes          INTEGER,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_query_email_attachments_email ON query_email_attachments(query_email_id);
