-- 335: Agent-facing status groups
--
-- Agents now pick from five statuses (Open, In Progress, Pending, Claim In
-- Progress, Resolved) — see server/services/statusGroups.js. Open, Claim and
-- Resolved map onto existing values; In Progress and Pending need generic
-- values of their own for when an agent sets them by hand.

ALTER TYPE query_status ADD VALUE IF NOT EXISTS 'in_progress' AFTER 'open';
ALTER TYPE query_status ADD VALUE IF NOT EXISTS 'pending'     AFTER 'in_progress';
