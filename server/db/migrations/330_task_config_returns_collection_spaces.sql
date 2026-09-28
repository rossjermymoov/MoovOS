-- Migration 330: Add 'returns' and 'collection' Tasks-board spaces.
--
-- Follows 329_task_config_email_spaces.sql: the email-triage taxonomy widened
-- to 8 categories (added 'returns'/'collection', decided against folding them
-- into 'query' — real Freshdesk data showed both are frequent, distinct
-- patterns, see docs/email-triage-automation-plan.md). emailTaskRouter.js's
-- CATEGORY_SPACE now routes them into 'returns'/'collection' spaces that don't
-- exist yet.
--
-- Only appends if not already present, so a team that's customized task_config
-- via the UI (or already has these keys) is never clobbered.
UPDATE task_config
   SET data = jsonb_set(
     data,
     '{spaces}',
     data->'spaces' || '[
       {"key": "returns",    "label": "Returns",            "colour": "#0891B2"},
       {"key": "collection", "label": "Collection Issues",  "colour": "#B45309"}
     ]'::jsonb,
     true
   ),
   updated_at = NOW()
 WHERE id = 1
   AND data->'spaces' IS NOT NULL
   AND NOT (data->'spaces' @> '[{"key": "returns"}]'::jsonb)
   AND NOT (data->'spaces' @> '[{"key": "collection"}]'::jsonb);
