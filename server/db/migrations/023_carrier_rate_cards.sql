-- 023_carrier_rate_cards.sql
-- Introduces named, versioned rate cards for carrier cost pricing.
-- Each carrier now has a "Master" rate card (active immediately) and can have
-- future-dated cards (e.g. annual rate increases).
-- Existing weight_bands are linked to the carrier's Master rate card.

CREATE TABLE IF NOT EXISTS carrier_rate_cards (
  id             SERIAL PRIMARY KEY,
  courier_id     INTEGER NOT NULL REFERENCES couriers(id) ON DELETE CASCADE,
  name           TEXT NOT NULL DEFAULT 'Master',
  is_master      BOOLEAN NOT NULL DEFAULT false,
  is_active      BOOLEAN NOT NULL DEFAULT true,
  effective_date DATE,          -- NULL = takes effect immediately on creation
  notes          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enforce one master per carrier
CREATE UNIQUE INDEX IF NOT EXISTS carrier_rate_cards_one_master
  ON carrier_rate_cards(courier_id) WHERE is_master = true;

CREATE INDEX IF NOT EXISTS carrier_rate_cards_courier_idx ON carrier_rate_cards(courier_id);

-- Link weight_bands to a rate card version
ALTER TABLE weight_bands
  ADD COLUMN IF NOT EXISTS carrier_rate_card_id INTEGER
  REFERENCES carrier_rate_cards(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS weight_bands_rate_card_idx
  ON weight_bands(carrier_rate_card_id);

-- Create a Master rate card for each courier that has weight bands,
-- then link all existing weight_bands to it.
DO $$
DECLARE
  rec   RECORD;
  rc_id INTEGER;
BEGIN
  FOR rec IN
    SELECT DISTINCT cs.courier_id
    FROM courier_services cs
    JOIN zones z ON z.courier_service_id = cs.id
    JOIN weight_bands wb ON wb.zone_id = z.id
    WHERE wb.carrier_rate_card_id IS NULL
  LOOP
    -- Only create if not already present (idempotent)
    SELECT id INTO rc_id FROM carrier_rate_cards
    WHERE courier_id = rec.courier_id AND is_master = true;

    IF rc_id IS NULL THEN
      INSERT INTO carrier_rate_cards(courier_id, name, is_master, is_active)
      VALUES (rec.courier_id, 'Master', true, true)
      RETURNING id INTO rc_id;
    END IF;

    -- Link unassigned weight_bands for this courier
    UPDATE weight_bands wb
    SET carrier_rate_card_id = rc_id
    FROM zones z
    JOIN courier_services cs ON z.courier_service_id = cs.id
    WHERE wb.zone_id = z.id
      AND cs.courier_id = rec.courier_id
      AND wb.carrier_rate_card_id IS NULL;
  END LOOP;
END $$;
