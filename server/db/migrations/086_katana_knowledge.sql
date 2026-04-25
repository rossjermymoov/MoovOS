-- ============================================================
-- Migration 086: Katana AI Agent — Knowledge Sources
-- ============================================================

CREATE TABLE IF NOT EXISTS katana_knowledge_sources (
  id              SERIAL PRIMARY KEY,
  title           TEXT NOT NULL,
  source_type     TEXT NOT NULL CHECK (source_type IN ('url', 'text')),
  url             TEXT,
  raw_content     TEXT,
  category        TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_synced_at  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_katana_sources_active ON katana_knowledge_sources(is_active);
