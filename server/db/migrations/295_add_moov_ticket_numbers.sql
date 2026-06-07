-- ──────────────────────────────────────────────────────────────────
-- 295 — Moov OS ticket numbers
-- Generates MOOV-001, MOOV-002 … MOOV-1000, MOOV-10000 etc.
-- Minimum 3 digits, expands naturally (no truncation ever).
-- ──────────────────────────────────────────────────────────────────

-- 1. Sequence (starts at 1)
CREATE SEQUENCE IF NOT EXISTS moov_ticket_seq START 1;

-- 2. Column on queries table
ALTER TABLE queries
  ADD COLUMN IF NOT EXISTS ticket_number TEXT;

-- 3. Back-fill existing rows in creation order
WITH numbered AS (
  SELECT id,
         ROW_NUMBER() OVER (ORDER BY created_at, id) AS rn
  FROM   queries
  WHERE  ticket_number IS NULL
)
UPDATE queries q
SET    ticket_number = 'MOOV-' || LPAD(
         (SELECT last_value FROM moov_ticket_seq) + n.rn - 1,
         3, '0'
       )::text
FROM   numbered n
WHERE  q.id = n.id;

-- Advance the sequence past however many rows we just filled
SELECT setval(
  'moov_ticket_seq',
  COALESCE((SELECT COUNT(*) FROM queries WHERE ticket_number IS NOT NULL), 0),
  true
);

-- 4. Auto-assign on every future INSERT
CREATE OR REPLACE FUNCTION assign_moov_ticket_number()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  seq_val BIGINT;
BEGIN
  IF NEW.ticket_number IS NULL THEN
    seq_val          := nextval('moov_ticket_seq');
    NEW.ticket_number := 'MOOV-' || LPAD(seq_val::text, 3, '0');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_moov_ticket_number ON queries;
CREATE TRIGGER trg_moov_ticket_number
  BEFORE INSERT ON queries
  FOR EACH ROW EXECUTE FUNCTION assign_moov_ticket_number();

-- 5. Index for search
CREATE INDEX IF NOT EXISTS idx_queries_ticket_number ON queries (ticket_number);
