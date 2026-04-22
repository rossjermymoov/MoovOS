-- 024_customer_rate_cards.sql
-- Named, cloneable sell-price rate cards per carrier.
-- Each courier gets a "Master" rate card populated from existing customer_rates.
-- Customers can be assigned to any rate card per carrier.

-- Named sell-price rate card templates (shared, not per-customer)
CREATE TABLE IF NOT EXISTS customer_rate_cards (
  id          SERIAL PRIMARY KEY,
  courier_id  INTEGER NOT NULL REFERENCES couriers(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  is_master   BOOLEAN NOT NULL DEFAULT false,
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS customer_rate_cards_one_master
  ON customer_rate_cards(courier_id) WHERE is_master = true;

CREATE INDEX IF NOT EXISTS customer_rate_cards_courier_idx ON customer_rate_cards(courier_id);

-- Entries in each rate card (mirrors customer_rates columns)
CREATE TABLE IF NOT EXISTS customer_rate_card_entries (
  id                SERIAL PRIMARY KEY,
  rate_card_id      INTEGER NOT NULL REFERENCES customer_rate_cards(id) ON DELETE CASCADE,
  service_id        INTEGER NOT NULL REFERENCES courier_services(id) ON DELETE CASCADE,
  zone_name         VARCHAR(200) NOT NULL,
  weight_class_name VARCHAR(200) NOT NULL DEFAULT 'Parcel',
  price             NUMERIC(10,4) NOT NULL,
  UNIQUE(rate_card_id, service_id, zone_name, weight_class_name)
);

CREATE INDEX IF NOT EXISTS crce_rate_card_idx ON customer_rate_card_entries(rate_card_id);

-- Which rate card a customer uses per carrier (omit row = use Master)
CREATE TABLE IF NOT EXISTS customer_rate_card_assignments (
  id           SERIAL PRIMARY KEY,
  customer_id  UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  courier_id   INTEGER NOT NULL REFERENCES couriers(id) ON DELETE CASCADE,
  rate_card_id INTEGER NOT NULL REFERENCES customer_rate_cards(id) ON DELETE RESTRICT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(customer_id, courier_id)
);

-- Create a Master rate card per courier from existing customer_rates data.
-- Uses courier_services to find the real courier FK.
DO $$
DECLARE
  rec   RECORD;
  rc_id INTEGER;
BEGIN
  FOR rec IN
    SELECT DISTINCT cs.courier_id
    FROM customer_rates cr
    JOIN courier_services cs ON cr.service_id = cs.id
  LOOP
    SELECT id INTO rc_id FROM customer_rate_cards
    WHERE courier_id = rec.courier_id AND is_master = true;

    IF rc_id IS NULL THEN
      INSERT INTO customer_rate_cards(courier_id, name, is_master)
      VALUES (rec.courier_id, 'Master', true)
      RETURNING id INTO rc_id;
    END IF;

    -- Populate entries: distinct prices per (service_id, zone_name, weight_class_name)
    -- Ties broken by taking the lowest rate id (first inserted / first seeded)
    INSERT INTO customer_rate_card_entries(rate_card_id, service_id, zone_name, weight_class_name, price)
    SELECT DISTINCT ON (cr.service_id, cr.zone_name, cr.weight_class_name)
      rc_id,
      cr.service_id,
      cr.zone_name,
      cr.weight_class_name,
      cr.price
    FROM customer_rates cr
    JOIN courier_services cs ON cr.service_id = cs.id
    WHERE cs.courier_id = rec.courier_id
    ORDER BY cr.service_id, cr.zone_name, cr.weight_class_name, cr.id
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;
