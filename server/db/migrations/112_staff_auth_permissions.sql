-- Migration 112: Add authentication and page permissions to staff table
-- Adds password_hash for bcrypt login, is_admin flag, and page_permissions array

ALTER TABLE staff
  ADD COLUMN IF NOT EXISTS password_hash    TEXT,
  ADD COLUMN IF NOT EXISTS is_admin         BOOLEAN  NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS page_permissions TEXT[]   NOT NULL DEFAULT '{}';

-- Index for fast login lookup
CREATE INDEX IF NOT EXISTS idx_staff_email ON staff (email);
