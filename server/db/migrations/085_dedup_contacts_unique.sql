-- 085: Clean up duplicate courier_contacts and add unique constraint
--
-- Removes all duplicate contacts for the same courier+name, keeping the
-- earliest (lowest id) record. Then adds a unique index so this can never
-- accumulate again regardless of how the form fires.

-- 1. Delete dupes — keep the earliest (lowest id) per courier + normalised name
DELETE FROM courier_contacts
WHERE id NOT IN (
  SELECT MIN(id)
  FROM courier_contacts
  GROUP BY courier_id, LOWER(TRIM(name))
);

-- 2. Unique index so the DB rejects any future duplicate on insert
CREATE UNIQUE INDEX IF NOT EXISTS courier_contacts_courier_name_uq
  ON courier_contacts (courier_id, LOWER(TRIM(name)));
