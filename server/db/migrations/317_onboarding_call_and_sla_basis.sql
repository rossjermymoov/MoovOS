-- ──────────────────────────────────────────────────────────────────
-- 317 — Onboarding call booking + per-task SLA basis + clean slate
--
-- 1. The onboarding call can be marked as booked with a date. Tasks whose
--    SLA basis is 'post_call' have their due dates calculated from that call
--    date instead of from the onboarding start.
-- 2. Each task carries an sla_basis: 'onboarding_start' (default) or
--    'post_call'.
-- 3. Clears the seeded starter templates and the test customers' onboarding
--    plans so you can build your own milestones from a clean slate. The
--    (TEST) customers themselves are kept (status onboarding) so you can
--    re-run them through your new template.
-- ──────────────────────────────────────────────────────────────────

-- ─── 1. Call booking on the onboarding header ───────────────────────
ALTER TABLE customer_onboarding
  ADD COLUMN IF NOT EXISTS call_booked     BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS call_booked_for TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS call_completed  BOOLEAN NOT NULL DEFAULT FALSE;

-- ─── 2. SLA basis on template + instance tasks ──────────────────────
ALTER TABLE onboarding_template_tasks
  ADD COLUMN IF NOT EXISTS sla_basis TEXT NOT NULL DEFAULT 'onboarding_start';
ALTER TABLE onboarding_tasks
  ADD COLUMN IF NOT EXISTS sla_basis TEXT NOT NULL DEFAULT 'onboarding_start';

DO $$ BEGIN
  ALTER TABLE onboarding_template_tasks
    ADD CONSTRAINT chk_tmpl_task_sla_basis CHECK (sla_basis IN ('onboarding_start','post_call'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE onboarding_tasks
    ADD CONSTRAINT chk_task_sla_basis CHECK (sla_basis IN ('onboarding_start','post_call'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── 3. Clean slate: remove seeded starter data ─────────────────────
-- Remove the test customers' onboarding plans (cascades to stages/tasks/etc).
DELETE FROM customer_onboarding
  WHERE customer_id IN (SELECT id FROM customers WHERE business_name LIKE '%(TEST)');

-- Remove the three seeded starter templates (cascades to their stages/tasks).
DELETE FROM onboarding_templates WHERE code IN ('standard_api', 'dpd_drop_shop', 'non_api');
