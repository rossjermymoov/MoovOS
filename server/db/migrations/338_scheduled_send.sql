-- 338_scheduled_send.sql
-- Scheduled emails: a reply (typed or an approved AI draft) can be queued to go
-- out at a chosen time. The scheduler in server/services/scheduledSend.js sends
-- every row whose scheduled_send_at has passed, through the same Gmail send
-- gateway as an immediate send.
--
-- send_status gains two states:
--   scheduled — queued, waiting for scheduled_send_at
--   sending   — claimed for sending (send_claimed_at), Gmail call in flight
-- 'failed' keeps scheduled_send_at so the ticket shows a scheduled send that
-- did not go out (with send_error) instead of it silently disappearing.

ALTER TABLE query_emails
  ADD COLUMN IF NOT EXISTS scheduled_send_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS scheduled_by      TEXT,
  ADD COLUMN IF NOT EXISTS send_claimed_at   TIMESTAMPTZ;

DO $$
DECLARE c TEXT;
BEGIN
  FOR c IN
    SELECT con.conname FROM pg_constraint con
      JOIN pg_class rel ON rel.oid = con.conrelid
     WHERE rel.relname = 'query_emails' AND con.contype = 'c'
       AND pg_get_constraintdef(con.oid) ILIKE '%send_status%'
  LOOP
    EXECUTE format('ALTER TABLE query_emails DROP CONSTRAINT %I', c);
  END LOOP;
END $$;

ALTER TABLE query_emails
  ADD CONSTRAINT query_emails_send_status_check
  CHECK (send_status IN ('scheduled', 'sending', 'sent', 'failed'));

CREATE INDEX IF NOT EXISTS idx_query_emails_scheduled_due
  ON query_emails (scheduled_send_at)
  WHERE send_status = 'scheduled' AND sent_at IS NULL;
