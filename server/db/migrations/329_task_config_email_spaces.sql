-- Migration 329: Seed Tasks-board spaces for email-triage routing (Phase 0 of
-- email-triage-automation-plan.md).
--
-- emailTaskRouter.js routes claim/billing/technical email into 'claims'/
-- 'accounts'/'technical' spaces that don't exist in TasksPage.jsx's
-- DEFAULT_SPACES fallback. task_config is the editable, no-deploy-needed
-- source of truth for spaces (same pattern as the classifier taxonomy itself —
-- see the plan's Taxonomy Drift risk), so seed it here instead of only in the
-- client fallback.
--
-- Only fills in spaces if none are configured yet, so a team that has already
-- customized task_config via the UI is never clobbered.
UPDATE task_config
   SET data = jsonb_set(
     data,
     '{spaces}',
     '[
       {"key": "cs",        "label": "Customer Service", "colour": "#276E93"},
       {"key": "sales",     "label": "Sales",             "colour": "#CD1D69"},
       {"key": "ops",       "label": "Operations",        "colour": "#D97706"},
       {"key": "product",   "label": "Product & Data",    "colour": "#0F7A46"},
       {"key": "claims",    "label": "Claims",            "colour": "#8A6200"},
       {"key": "accounts",  "label": "Accounts",          "colour": "#5B21B6"},
       {"key": "technical", "label": "Technical",         "colour": "#1D4ED8"}
     ]'::jsonb,
     true
   ),
   updated_at = NOW()
 WHERE id = 1
   AND (data->'spaces' IS NULL OR jsonb_array_length(data->'spaces') = 0);
