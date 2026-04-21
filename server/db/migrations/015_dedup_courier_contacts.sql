-- 015_dedup_courier_contacts.sql
-- Remove duplicate courier_contacts, keeping the earliest (lowest id)
-- per courier + name combination.
-- Cleans up contacts accidentally created multiple times (e.g. Gemma @ DPD).

DELETE FROM courier_contacts
WHERE id NOT IN (
  SELECT MIN(id)
  FROM courier_contacts
  GROUP BY courier_id, name
);
