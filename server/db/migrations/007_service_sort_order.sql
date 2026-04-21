-- 007_service_sort_order.sql
-- Adds sort_order to courier_services so users can define their own display order

ALTER TABLE courier_services
  ADD COLUMN IF NOT EXISTS sort_order INTEGER;

-- Seed initial sort_order within each carrier using current alphabetical order
-- so existing data has a defined starting point
WITH ranked AS (
  SELECT id,
         ROW_NUMBER() OVER (PARTITION BY courier_id ORDER BY name) AS rn
  FROM courier_services
)
UPDATE courier_services cs
SET    sort_order = r.rn
FROM   ranked r
WHERE  cs.id = r.id
AND    cs.sort_order IS NULL;
