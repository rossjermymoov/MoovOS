-- 008_fuel_groups.sql
-- Fuel surcharge groups: carriers can have multiple named groups
-- (e.g. "Domestic Fuel", "International Fuel") each with their own %.
-- Services are assigned to a group; the group % overrides the service-level %.

-- ── Enums ─────────────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE service_type AS ENUM ('domestic', 'international');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── fuel_groups ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS fuel_groups (
  id                 SERIAL PRIMARY KEY,
  courier_id         INTEGER NOT NULL REFERENCES couriers(id) ON DELETE CASCADE,
  name               VARCHAR(100) NOT NULL,
  fuel_surcharge_pct NUMERIC(6,2) NOT NULL DEFAULT 0,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS fuel_groups_courier_idx ON fuel_groups(courier_id);

-- ── Extend courier_services ───────────────────────────────────────────────────

ALTER TABLE courier_services
  ADD COLUMN IF NOT EXISTS service_type  service_type,
  ADD COLUMN IF NOT EXISTS fuel_group_id INTEGER;

-- FK (safe conditional pattern — ADD CONSTRAINT IF NOT EXISTS is not valid PG syntax)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'courier_services_fuel_group_fk'
    AND   table_name      = 'courier_services'
  ) THEN
    ALTER TABLE courier_services
      ADD CONSTRAINT courier_services_fuel_group_fk
      FOREIGN KEY (fuel_group_id) REFERENCES fuel_groups(id) ON DELETE SET NULL;
  END IF;
END $$;
