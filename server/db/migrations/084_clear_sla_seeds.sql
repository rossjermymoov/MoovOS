-- 084: Clear all seeded SLA data
--
-- Removes all SLA assignments from tickets, all rules, and all policies
-- so the rules engine can be configured fresh from the UI.
-- Also clears attention/requires_attention flags set by the AI seeder
-- so the demo inbox is clean.

-- 1. Remove all SLA assignments from tickets
DELETE FROM query_sla_assignments;

-- 2. Remove all SLA rules
DELETE FROM sla_rules;

-- 3. Remove all SLA policies
DELETE FROM sla_policies;

-- 4. Clear attention flags on seeded/demo tickets
UPDATE queries
SET requires_attention = false,
    attention_reason   = NULL
WHERE requires_attention = true;
