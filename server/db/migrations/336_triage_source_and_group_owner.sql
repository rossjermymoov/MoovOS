-- 336: Trace group routing
--
-- triage_source  — which classifier chose a new ticket's group: the Gemini model
--                  name, or 'regex_fallback' when Gemini was unavailable/failed.
--                  Testing found tickets in the wrong group with no way to tell
--                  which path put them there.
-- group_set_by   — 'triage' (automatic) or 'agent' (changed by hand). A ticket
--                  still in the catch-all group by triage can be re-routed when a
--                  follow-up makes its topic clear; an agent's choice is never
--                  overridden.

ALTER TABLE inbox_classifications ADD COLUMN IF NOT EXISTS triage_source TEXT;
ALTER TABLE queries ADD COLUMN IF NOT EXISTS group_set_by TEXT NOT NULL DEFAULT 'triage';
