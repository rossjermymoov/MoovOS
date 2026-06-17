-- ──────────────────────────────────────────────────────────────────
-- 314 — Onboarding Template Engine (customer-record integrated)
--
-- Supersedes migration 313's standalone pipeline. Onboarding is now a
-- STATE of a real customer record, driven by reusable templates that are
-- snapshotted onto each customer when onboarding starts.
--
-- Definition side (reusable):
--   onboarding_templates              — one per customer type (standard API, DPD drop shop, non-API…)
--   onboarding_template_stages        — ordered stages within a template
--   onboarding_template_tasks         — tasks within a stage (supports sub-tasks via parent_task_id)
--   onboarding_template_task_deps     — task → blocks → task
--   onboarding_comms_templates        — email library; tasks may link one
--
-- Instance side (per customer, snapshotted):
--   customer_onboarding               — one active onboarding per customer
--   onboarding_stages                 — copied stages (+ started/completed)
--   onboarding_tasks                  — copied tasks (status, assignee, due, duration, timeline)
--   onboarding_task_deps              — copied dependencies
--   onboarding_task_checklist         — lightweight tick-box sub-items
--   onboarding_task_notes             — threaded notes per task
--   onboarding_task_attachments       — files per task
--   onboarding_task_events            — full timeline / audit of status changes
-- ──────────────────────────────────────────────────────────────────

-- ─── 0. Retire 313's standalone pipeline ────────────────────────────
DROP TABLE IF EXISTS onboarding_interactions CASCADE;
DROP TABLE IF EXISTS onboarding_addresses    CASCADE;
DROP TABLE IF EXISTS onboarding_contacts     CASCADE;
DROP TABLE IF EXISTS onboarding_sla_targets  CASCADE;
DROP TABLE IF EXISTS onboarding_customers    CASCADE;

-- ─── 1. Add 'onboarding' to account_status ──────────────────────────
-- Top-level statement (NOT wrapped in DO) so the migrate runner commits it
-- on its own — PostgreSQL forbids using a freshly-added enum value in the
-- same transaction that created it.
ALTER TYPE account_status ADD VALUE IF NOT EXISTS 'onboarding' BEFORE 'active';

-- ─── 2. Enums ───────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE onboarding_customer_type AS ENUM ('standard_api', 'dpd_drop_shop', 'non_api', 'custom');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Task lifecycle drives the RAG colour in the UI.
DO $$ BEGIN
  CREATE TYPE onboarding_task_status AS ENUM ('not_started', 'in_progress', 'blocked', 'complete', 'skipped');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE customer_onboarding_status AS ENUM ('active', 'paused', 'complete', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ════════════════════════════════════════════════════════════════════
-- DEFINITION SIDE
-- ════════════════════════════════════════════════════════════════════

-- ─── 3. Comms template library ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS onboarding_comms_templates (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  description TEXT,
  subject     TEXT NOT NULL,
  body_html   TEXT NOT NULL,
  body_text   TEXT,
  -- Declared placeholders, e.g. ["customer_name","moov_id","rate_file_url"]
  variables   JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 4. Templates ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS onboarding_templates (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  code          TEXT UNIQUE,                 -- machine key e.g. 'standard_api'
  description   TEXT,
  customer_type onboarding_customer_type NOT NULL DEFAULT 'custom',
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  is_default    BOOLEAN NOT NULL DEFAULT FALSE,
  created_by    UUID REFERENCES staff(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS onboarding_template_stages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES onboarding_templates(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT,
  position    INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tmpl_stages_template ON onboarding_template_stages (template_id, position);

CREATE TABLE IF NOT EXISTS onboarding_template_tasks (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id         UUID NOT NULL REFERENCES onboarding_templates(id) ON DELETE CASCADE,
  stage_id            UUID NOT NULL REFERENCES onboarding_template_stages(id) ON DELETE CASCADE,
  parent_task_id      UUID REFERENCES onboarding_template_tasks(id) ON DELETE CASCADE, -- sub-task
  title               TEXT NOT NULL,
  description         TEXT,
  position            INT NOT NULL DEFAULT 0,
  default_assignee_id UUID REFERENCES staff(id) ON DELETE SET NULL,
  target_duration_hours INT,                  -- SLA target for the task
  is_required         BOOLEAN NOT NULL DEFAULT TRUE,
  comms_template_id   UUID REFERENCES onboarding_comms_templates(id) ON DELETE SET NULL,
  auto_send_comms     BOOLEAN NOT NULL DEFAULT FALSE, -- fire email when task completes
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tmpl_tasks_stage ON onboarding_template_tasks (stage_id, position);

CREATE TABLE IF NOT EXISTS onboarding_template_task_deps (
  task_id         UUID NOT NULL REFERENCES onboarding_template_tasks(id) ON DELETE CASCADE,
  depends_on_id   UUID NOT NULL REFERENCES onboarding_template_tasks(id) ON DELETE CASCADE,
  PRIMARY KEY (task_id, depends_on_id),
  CHECK (task_id <> depends_on_id)
);

-- ════════════════════════════════════════════════════════════════════
-- INSTANCE SIDE  (snapshotted onto a customer)
-- ════════════════════════════════════════════════════════════════════

-- ─── 5. customer_onboarding ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS customer_onboarding (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id     UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  template_id     UUID REFERENCES onboarding_templates(id) ON DELETE SET NULL, -- provenance only
  template_name   TEXT,                       -- snapshot of the name used
  status          customer_onboarding_status NOT NULL DEFAULT 'active',
  owner_id        UUID REFERENCES staff(id) ON DELETE SET NULL,
  started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at    TIMESTAMPTZ,
  target_go_live  DATE,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- At most one ACTIVE onboarding per customer.
CREATE UNIQUE INDEX IF NOT EXISTS uniq_active_onboarding_per_customer
  ON customer_onboarding (customer_id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_customer_onboarding_customer ON customer_onboarding (customer_id);

CREATE TABLE IF NOT EXISTS onboarding_stages (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  onboarding_id UUID NOT NULL REFERENCES customer_onboarding(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  description   TEXT,
  position      INT NOT NULL DEFAULT 0,
  started_at    TIMESTAMPTZ,
  completed_at  TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_onb_stages_onboarding ON onboarding_stages (onboarding_id, position);

CREATE TABLE IF NOT EXISTS onboarding_tasks (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  onboarding_id       UUID NOT NULL REFERENCES customer_onboarding(id) ON DELETE CASCADE,
  stage_id            UUID NOT NULL REFERENCES onboarding_stages(id) ON DELETE CASCADE,
  parent_task_id      UUID REFERENCES onboarding_tasks(id) ON DELETE CASCADE,
  template_task_id    UUID,                   -- provenance back to definition
  title               TEXT NOT NULL,
  description         TEXT,
  position            INT NOT NULL DEFAULT 0,
  status              onboarding_task_status NOT NULL DEFAULT 'not_started',
  assignee_id         UUID REFERENCES staff(id) ON DELETE SET NULL,
  is_required         BOOLEAN NOT NULL DEFAULT TRUE,
  target_duration_hours INT,
  due_at              TIMESTAMPTZ,
  started_at          TIMESTAMPTZ,            -- set when → in_progress
  completed_at        TIMESTAMPTZ,            -- set when → complete
  comms_template_id   UUID REFERENCES onboarding_comms_templates(id) ON DELETE SET NULL,
  auto_send_comms     BOOLEAN NOT NULL DEFAULT FALSE,
  comms_sent_at       TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_onb_tasks_onboarding ON onboarding_tasks (onboarding_id);
CREATE INDEX IF NOT EXISTS idx_onb_tasks_stage      ON onboarding_tasks (stage_id, position);
CREATE INDEX IF NOT EXISTS idx_onb_tasks_assignee   ON onboarding_tasks (assignee_id) WHERE status <> 'complete';

CREATE TABLE IF NOT EXISTS onboarding_task_deps (
  task_id       UUID NOT NULL REFERENCES onboarding_tasks(id) ON DELETE CASCADE,
  depends_on_id UUID NOT NULL REFERENCES onboarding_tasks(id) ON DELETE CASCADE,
  PRIMARY KEY (task_id, depends_on_id),
  CHECK (task_id <> depends_on_id)
);

CREATE TABLE IF NOT EXISTS onboarding_task_checklist (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id    UUID NOT NULL REFERENCES onboarding_tasks(id) ON DELETE CASCADE,
  label      TEXT NOT NULL,
  is_done    BOOLEAN NOT NULL DEFAULT FALSE,
  position   INT NOT NULL DEFAULT 0,
  done_at    TIMESTAMPTZ,
  done_by    UUID REFERENCES staff(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_onb_checklist_task ON onboarding_task_checklist (task_id, position);

CREATE TABLE IF NOT EXISTS onboarding_task_notes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id    UUID NOT NULL REFERENCES onboarding_tasks(id) ON DELETE CASCADE,
  author_id  UUID REFERENCES staff(id) ON DELETE SET NULL,
  body       TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_onb_notes_task ON onboarding_task_notes (task_id, created_at);

CREATE TABLE IF NOT EXISTS onboarding_task_attachments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id      UUID NOT NULL REFERENCES onboarding_tasks(id) ON DELETE CASCADE,
  filename     TEXT NOT NULL,
  url          TEXT,
  content_type TEXT,
  size_bytes   BIGINT,
  uploaded_by  UUID REFERENCES staff(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_onb_attach_task ON onboarding_task_attachments (task_id);

-- ─── 6. Timeline / audit ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS onboarding_task_events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id       UUID NOT NULL REFERENCES onboarding_tasks(id) ON DELETE CASCADE,
  onboarding_id UUID NOT NULL REFERENCES customer_onboarding(id) ON DELETE CASCADE,
  event_type    TEXT NOT NULL,               -- created / status_change / assigned / comms_sent / note / attachment
  from_status   onboarding_task_status,
  to_status     onboarding_task_status,
  actor_id      UUID REFERENCES staff(id) ON DELETE SET NULL,
  detail        JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_onb_events_task       ON onboarding_task_events (task_id, created_at);
CREATE INDEX IF NOT EXISTS idx_onb_events_onboarding ON onboarding_task_events (onboarding_id, created_at);

-- ─── 7. updated_at touch triggers ───────────────────────────────────
CREATE OR REPLACE FUNCTION touch_onboarding_v2_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_touch_onb_templates ON onboarding_templates;
CREATE TRIGGER trg_touch_onb_templates BEFORE UPDATE ON onboarding_templates
  FOR EACH ROW EXECUTE FUNCTION touch_onboarding_v2_updated_at();

DROP TRIGGER IF EXISTS trg_touch_onb_comms ON onboarding_comms_templates;
CREATE TRIGGER trg_touch_onb_comms BEFORE UPDATE ON onboarding_comms_templates
  FOR EACH ROW EXECUTE FUNCTION touch_onboarding_v2_updated_at();

DROP TRIGGER IF EXISTS trg_touch_customer_onboarding ON customer_onboarding;
CREATE TRIGGER trg_touch_customer_onboarding BEFORE UPDATE ON customer_onboarding
  FOR EACH ROW EXECUTE FUNCTION touch_onboarding_v2_updated_at();

DROP TRIGGER IF EXISTS trg_touch_onb_tasks ON onboarding_tasks;
CREATE TRIGGER trg_touch_onb_tasks BEFORE UPDATE ON onboarding_tasks
  FOR EACH ROW EXECUTE FUNCTION touch_onboarding_v2_updated_at();

-- ─── 8. Seed three starter templates (idempotent by code) ───────────
DO $$
DECLARE
  t_std  UUID; t_dpd UUID; t_non UUID;
  s_id   UUID;
BEGIN
  -- ===== Standard API integration =====
  IF NOT EXISTS (SELECT 1 FROM onboarding_templates WHERE code = 'standard_api') THEN
    INSERT INTO onboarding_templates (name, code, description, customer_type, is_default)
    VALUES ('Standard API Integration', 'standard_api',
            'Full onboarding for customers integrating via the Moov API.', 'standard_api', TRUE)
    RETURNING id INTO t_std;

    INSERT INTO onboarding_template_stages (template_id, name, position) VALUES (t_std, 'Verification', 0) RETURNING id INTO s_id;
    INSERT INTO onboarding_template_tasks (template_id, stage_id, title, position, target_duration_hours) VALUES
      (t_std, s_id, 'Verify company details & Companies House reg', 0, 24),
      (t_std, s_id, 'Collect & verify VAT number', 1, 24),
      (t_std, s_id, 'Confirm trading and billing addresses', 2, 24);

    INSERT INTO onboarding_template_stages (template_id, name, position) VALUES (t_std, 'Carrier Provisioning', 1) RETURNING id INTO s_id;
    INSERT INTO onboarding_template_tasks (template_id, stage_id, title, position, target_duration_hours) VALUES
      (t_std, s_id, 'Create carrier accounts', 0, 72),
      (t_std, s_id, 'Load agreed rate file', 1, 48),
      (t_std, s_id, 'Set up Direct Debit mandate', 2, 72);

    INSERT INTO onboarding_template_stages (template_id, name, position) VALUES (t_std, 'Tech Integration', 2) RETURNING id INTO s_id;
    INSERT INTO onboarding_template_tasks (template_id, stage_id, title, position, target_duration_hours) VALUES
      (t_std, s_id, 'Issue API credentials', 0, 24),
      (t_std, s_id, 'Customer completes API integration', 1, 168),
      (t_std, s_id, 'Run end-to-end test shipment', 2, 48);

    INSERT INTO onboarding_template_stages (template_id, name, position) VALUES (t_std, 'Go-Live Ready', 3) RETURNING id INTO s_id;
    INSERT INTO onboarding_template_tasks (template_id, stage_id, title, position, target_duration_hours) VALUES
      (t_std, s_id, 'Final sign-off & switch account to Active', 0, 24);
  END IF;

  -- ===== DPD Drop Shop =====
  IF NOT EXISTS (SELECT 1 FROM onboarding_templates WHERE code = 'dpd_drop_shop') THEN
    INSERT INTO onboarding_templates (name, code, description, customer_type)
    VALUES ('DPD Drop Shop', 'dpd_drop_shop',
            'Lightweight onboarding for DPD drop-shop customers (no API integration).', 'dpd_drop_shop')
    RETURNING id INTO t_dpd;

    INSERT INTO onboarding_template_stages (template_id, name, position) VALUES (t_dpd, 'Verification', 0) RETURNING id INTO s_id;
    INSERT INTO onboarding_template_tasks (template_id, stage_id, title, position, target_duration_hours) VALUES
      (t_dpd, s_id, 'Verify company details', 0, 24),
      (t_dpd, s_id, 'Confirm drop-shop location & opening hours', 1, 24);

    INSERT INTO onboarding_template_stages (template_id, name, position) VALUES (t_dpd, 'Setup', 1) RETURNING id INTO s_id;
    INSERT INTO onboarding_template_tasks (template_id, stage_id, title, position, target_duration_hours) VALUES
      (t_dpd, s_id, 'Provision DPD drop-shop account', 0, 48),
      (t_dpd, s_id, 'Set up Direct Debit mandate', 1, 72),
      (t_dpd, s_id, 'Ship hardware / scanner kit', 2, 72);

    INSERT INTO onboarding_template_stages (template_id, name, position) VALUES (t_dpd, 'Go-Live Ready', 2) RETURNING id INTO s_id;
    INSERT INTO onboarding_template_tasks (template_id, stage_id, title, position, target_duration_hours) VALUES
      (t_dpd, s_id, 'Confirm first drop & switch to Active', 0, 24);
  END IF;

  -- ===== Non-API customer =====
  IF NOT EXISTS (SELECT 1 FROM onboarding_templates WHERE code = 'non_api') THEN
    INSERT INTO onboarding_templates (name, code, description, customer_type)
    VALUES ('Non-API Customer', 'non_api',
            'Manual / portal-only customers with no technical integration.', 'non_api')
    RETURNING id INTO t_non;

    INSERT INTO onboarding_template_stages (template_id, name, position) VALUES (t_non, 'Verification', 0) RETURNING id INTO s_id;
    INSERT INTO onboarding_template_tasks (template_id, stage_id, title, position, target_duration_hours) VALUES
      (t_non, s_id, 'Verify company details', 0, 24),
      (t_non, s_id, 'Confirm billing address & VAT', 1, 24);

    INSERT INTO onboarding_template_stages (template_id, name, position) VALUES (t_non, 'Setup', 1) RETURNING id INTO s_id;
    INSERT INTO onboarding_template_tasks (template_id, stage_id, title, position, target_duration_hours) VALUES
      (t_non, s_id, 'Load agreed rate file', 0, 48),
      (t_non, s_id, 'Set up Direct Debit mandate', 1, 72),
      (t_non, s_id, 'Create portal login & send welcome pack', 2, 24);

    INSERT INTO onboarding_template_stages (template_id, name, position) VALUES (t_non, 'Go-Live Ready', 2) RETURNING id INTO s_id;
    INSERT INTO onboarding_template_tasks (template_id, stage_id, title, position, target_duration_hours) VALUES
      (t_non, s_id, 'Final sign-off & switch to Active', 0, 24);
  END IF;
END $$;
