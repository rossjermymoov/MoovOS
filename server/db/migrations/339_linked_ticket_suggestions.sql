-- 339_linked_ticket_suggestions.sql
-- Tickets a ticket may relate to, for a person to look over ("Possibly linked:
-- #1420"). Set when a new conversation with a courier names a parcel that
-- already has a ticket but isn't attached to it — because it names more than
-- one consignment, or that ticket is resolved or has had no email for 30 days.
-- Array of { query_id, ticket_number, consignment, reason }.
ALTER TABLE queries
  ADD COLUMN IF NOT EXISTS linked_ticket_suggestions JSONB;

CREATE INDEX IF NOT EXISTS idx_queries_linked_suggestions
  ON queries USING GIN (linked_ticket_suggestions jsonb_path_ops)
  WHERE linked_ticket_suggestions IS NOT NULL;
