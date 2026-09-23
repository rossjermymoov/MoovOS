-- Migration 331: Add 'supplies' Tasks-board space.
--
-- Follows 329/330: the email-triage taxonomy widened again to add 'supplies'
-- (physical shipping-supply requests — labels, mailing bags, printer rolls),
-- a clean, recurring pattern found in real Freshdesk history with no home in
-- the taxonomy so far. emailTaskRouter.js's CATEGORY_SPACE now routes it into
-- a 'supplies' space that doesn't exist yet.
--
-- Only appends if not already present, so a team that's customized task_config
-- via the UI is never clobbered.
UPDATE task_config
   SET data = jsonb_set(
     data,
     '{spaces}',
     data->'spaces' || '[
       {"key": "supplies", "label": "Supplies", "colour": "#7C3AED"}
     ]'::jsonb,
     true
   ),
   updated_at = NOW()
 WHERE id = 1
   AND data->'spaces' IS NOT NULL
   AND NOT (data->'spaces' @> '[{"key": "supplies"}]'::jsonb);
