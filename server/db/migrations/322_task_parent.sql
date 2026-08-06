-- 322_task_parent.sql
-- Moov OS — subtasks. A subtask is just a task with a parent, so it inherits
-- status, assignee, comments, @mentions, attachments, links and notifications.

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES tasks(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_tasks_parent ON tasks(parent_id);
