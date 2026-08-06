-- 319_tasks.sql
-- Moov OS — Tasks module
-- A task-management workspace with real foreign-key links into the rest of Moov:
-- staff (assignee/author), customers, parcels (tracking), queries and couriers (carriers).

CREATE TABLE IF NOT EXISTS tasks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title        TEXT        NOT NULL,
  description  TEXT,
  status       VARCHAR(20) NOT NULL DEFAULT 'todo',    -- todo | progress | review | done
  priority     VARCHAR(20) NOT NULL DEFAULT 'medium',  -- urgent | high | medium | low
  space        VARCHAR(40) NOT NULL DEFAULT 'cs',       -- cs | sales | ops | product
  assignee_id  UUID REFERENCES staff(id) ON DELETE SET NULL,
  created_by   UUID REFERENCES staff(id) ON DELETE SET NULL,
  start_date   DATE,
  due_date     DATE,
  progress     INT         NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_space    ON tasks(space);
CREATE INDEX IF NOT EXISTS idx_tasks_status   ON tasks(status);

-- Real relational links from a task to other Moov records. Exactly one typed
-- FK column is set per row, chosen by link_type. ON DELETE CASCADE keeps links
-- consistent if the underlying record is removed.
CREATE TABLE IF NOT EXISTS task_links (
  id          SERIAL PRIMARY KEY,
  task_id     UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  link_type   VARCHAR(20) NOT NULL,                            -- customer | carrier | query | tracking
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  courier_id  INT  REFERENCES couriers(id)  ON DELETE CASCADE,
  query_id    UUID REFERENCES queries(id)   ON DELETE CASCADE,
  parcel_id   UUID REFERENCES parcels(id)   ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_task_links_task ON task_links(task_id);

CREATE TABLE IF NOT EXISTS task_comments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id    UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  author_id  UUID REFERENCES staff(id) ON DELETE SET NULL,
  body       TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_task_comments_task ON task_comments(task_id);

CREATE TABLE IF NOT EXISTS task_attachments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id    UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  kind       VARCHAR(20) NOT NULL DEFAULT 'link',  -- link | drive | file
  name       TEXT NOT NULL,
  url        TEXT,
  size_bytes BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_task_attachments_task ON task_attachments(task_id);
