-- 321_task_config.sql
-- Moov OS — Tasks board configuration (editable spaces & status columns).
-- Single-row JSON blob shared by the whole team.

CREATE TABLE IF NOT EXISTS task_config (
  id          INT PRIMARY KEY DEFAULT 1,
  data        JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT task_config_singleton CHECK (id = 1)
);

INSERT INTO task_config (id, data) VALUES (1, '{}'::jsonb) ON CONFLICT (id) DO NOTHING;
