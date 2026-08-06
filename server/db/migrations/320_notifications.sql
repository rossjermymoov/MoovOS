-- 320_notifications.sql
-- Moov OS — universal notifications feed.
-- Generic across modules: any feature can insert a row addressed to a staff member.

CREATE TABLE IF NOT EXISTS notifications (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,   -- recipient
  actor_id     UUID REFERENCES staff(id) ON DELETE SET NULL,           -- who caused it
  type         VARCHAR(30) NOT NULL,        -- assigned | comment | mention | system | ...
  severity     VARCHAR(10) NOT NULL DEFAULT 'info',  -- red | amber | green | info
  title        TEXT NOT NULL,
  body         TEXT,
  entity_type  VARCHAR(30),                 -- task | query | customer | ...
  entity_id    TEXT,                        -- id of the linked entity (text: ids vary by table)
  route        TEXT,                        -- in-app deep link
  read_at      TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user    ON notifications (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread  ON notifications (user_id) WHERE read_at IS NULL;
