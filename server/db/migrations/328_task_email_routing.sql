-- Migration 328: Task email routing (Phase 0 of email-triage-automation-plan.md)
--
-- Dedup key for standalone (non-WISMO) tasks created from inbound support email —
-- lets a follow-up reply on the same Gmail thread find and comment on the existing
-- task instead of creating a duplicate. WISMO-linked companion tasks don't need this:
-- they're found via task_links(link_type='query', query_id=...) since the underlying
-- queries row already carries the thread's identity.

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS gmail_thread_id VARCHAR(100);
CREATE INDEX IF NOT EXISTS idx_tasks_gmail_thread ON tasks(gmail_thread_id)
  WHERE gmail_thread_id IS NOT NULL;
