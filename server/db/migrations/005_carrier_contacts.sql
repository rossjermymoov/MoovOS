-- 005_carrier_contacts.sql
-- Adds primary contact fields to couriers + a courier_contacts table for additional contacts

ALTER TABLE couriers
  ADD COLUMN IF NOT EXISTS account_number        VARCHAR(100),
  ADD COLUMN IF NOT EXISTS primary_contact_name  VARCHAR(100),
  ADD COLUMN IF NOT EXISTS primary_contact_phone VARCHAR(50),
  ADD COLUMN IF NOT EXISTS primary_contact_email VARCHAR(150),
  ADD COLUMN IF NOT EXISTS notes                 TEXT;

CREATE TABLE IF NOT EXISTS courier_contacts (
  id          SERIAL PRIMARY KEY,
  courier_id  INTEGER NOT NULL REFERENCES couriers(id) ON DELETE CASCADE,
  name        VARCHAR(100) NOT NULL,
  phone       VARCHAR(50),
  email       VARCHAR(150),
  department  VARCHAR(100),
  role        VARCHAR(100),
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS courier_contacts_courier_idx ON courier_contacts(courier_id);
