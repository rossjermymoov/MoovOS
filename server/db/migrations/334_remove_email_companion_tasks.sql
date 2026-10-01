-- Migration 334: Stop routing support email onto the Tasks board.
--
-- Every inbound email is handled as a ticket on QueriesPage (which replaces
-- Freshdesk's ticket list); the per-email "companion task" added in Phase 0 of
-- email-triage-automation-plan.md is removed from gmailSync.js. This deletes the
-- tasks it already created.
--
-- Identifying them: tasks.gmail_thread_id (migration 328) is only ever written by
-- the email router, plus the router's claim fallback task, which had no thread id
-- but a fixed title/description and a link to its ticket. Comments, links and
-- subtasks cascade (migrations 319, 322); inbox_classifications.task_id is
-- ON DELETE SET NULL (332). Manually created tasks are untouched.
DELETE FROM tasks
 WHERE gmail_thread_id IS NOT NULL
    OR (title = 'Claim requested'
        AND description = 'Claim requested on an existing ticket.'
        AND EXISTS (SELECT 1 FROM task_links tl
                     WHERE tl.task_id = tasks.id AND tl.link_type = 'query'));

-- The classification record now stores the QueriesPage group the email was
-- filed under, not a Tasks-board space. Rename the column and backfill existing
-- rows from their category (same mapping as gmailSync.js GROUP_BY_TICKET_TYPE).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
              WHERE table_name = 'inbox_classifications' AND column_name = 'moovos_space') THEN
    ALTER TABLE inbox_classifications RENAME COLUMN moovos_space TO moovos_group;
  END IF;
END $$;

UPDATE inbox_classifications
   SET moovos_group = CASE moovos_category
         WHEN 'query'      THEN 'Queries'
         WHEN 'claim'      THEN 'Claims'
         WHEN 'billing'    THEN 'Billing'
         WHEN 'technical'  THEN 'Technical'
         WHEN 'sales'      THEN 'Sales'
         WHEN 'returns'    THEN 'Returns'
         WHEN 'collection' THEN 'Collection Issues'
         WHEN 'supplies'   THEN 'Supplies Request'
         ELSE 'Customer Service'
       END;
