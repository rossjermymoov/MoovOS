-- Migration 290: Remove all seeded/fake queries for live inbox use
-- query_emails, query_notifications, query_sla_assignments all CASCADE on DELETE.
-- Also clears ai_response_drafts and ai_response_feedback seeded in migration 287.

BEGIN;

-- Clear AI learning examples seeded in 287
DELETE FROM ai_response_drafts;
DELETE FROM ai_response_feedback;

-- Delete all queries — cascades to query_emails, query_notifications, query_sla_assignments
DELETE FROM queries;

-- Reset the ticket number sequence so live tickets start from #1
ALTER SEQUENCE IF EXISTS queries_ticket_number_seq RESTART WITH 1;

COMMIT;
