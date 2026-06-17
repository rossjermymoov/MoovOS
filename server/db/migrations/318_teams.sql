-- ──────────────────────────────────────────────────────────────────
-- 318 — Teams
--
-- Onboarding work is assigned to a TEAM (onboarding / service / finance),
-- each with a shared inbox email. People are members of a team. When a
-- client goes live you pick the specific person per team; their tasks are
-- assigned to that person.
-- ──────────────────────────────────────────────────────────────────

-- ─── 1. Teams ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS teams (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key         TEXT UNIQUE NOT NULL,           -- onboarding / service / finance
  name        TEXT NOT NULL,
  inbox_email TEXT,                            -- shared inbox e.g. accounts@…
  position    INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO teams (key, name, inbox_email, position) VALUES
  ('onboarding', 'Onboarding', 'onboarding@yourdomain.com', 0),
  ('service',    'Service',    'service@yourdomain.com',    1),
  ('finance',    'Finance',    'accounts@yourdomain.com',   2)
ON CONFLICT (key) DO NOTHING;

-- ─── 2. Staff membership ────────────────────────────────────────────
ALTER TABLE staff
  ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id) ON DELETE SET NULL;

-- Best-effort backfill from existing role.
UPDATE staff SET team_id = (SELECT id FROM teams WHERE key = 'onboarding') WHERE role = 'onboarding'       AND team_id IS NULL;
UPDATE staff SET team_id = (SELECT id FROM teams WHERE key = 'finance')    WHERE role = 'finance'          AND team_id IS NULL;
UPDATE staff SET team_id = (SELECT id FROM teams WHERE key = 'service')    WHERE role = 'customer_service' AND team_id IS NULL;

-- ─── 3. Tasks assign to a team ──────────────────────────────────────
ALTER TABLE onboarding_template_tasks
  ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id) ON DELETE SET NULL;
ALTER TABLE onboarding_tasks
  ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id) ON DELETE SET NULL;

-- ─── 4. Per-onboarding team → person mapping ────────────────────────
CREATE TABLE IF NOT EXISTS customer_onboarding_team_members (
  onboarding_id UUID NOT NULL REFERENCES customer_onboarding(id) ON DELETE CASCADE,
  team_id       UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  staff_id      UUID REFERENCES staff(id) ON DELETE SET NULL,
  PRIMARY KEY (onboarding_id, team_id)
);
