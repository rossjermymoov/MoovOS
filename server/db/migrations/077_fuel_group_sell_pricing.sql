-- 077: Fuel group sell pricing + ensure carrier link tables exist
--
-- Adds to fuel_groups:
--   standard_sell_pct          — default sell % applied to all customers
--   next_sell_pct              — future scheduled sell %
--   next_sell_effective_date   — date next_sell_pct takes effect
--
-- Creates (IF NOT EXISTS) the tables that may have been created directly:
--   customer_carrier_links
--   customer_fuel_group_pricing

ALTER TABLE fuel_groups
  ADD COLUMN IF NOT EXISTS standard_sell_pct           NUMERIC(6,2),
  ADD COLUMN IF NOT EXISTS next_sell_pct               NUMERIC(6,2),
  ADD COLUMN IF NOT EXISTS next_sell_effective_date    DATE;

CREATE TABLE IF NOT EXISTS customer_carrier_links (
  id                   SERIAL PRIMARY KEY,
  customer_id          UUID    NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  courier_id           INTEGER NOT NULL REFERENCES couriers(id)  ON DELETE CASCADE,
  carrier_rate_card_id INTEGER REFERENCES carrier_rate_cards(id) ON DELETE SET NULL,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (customer_id, courier_id)
);

CREATE TABLE IF NOT EXISTS customer_fuel_group_pricing (
  id             SERIAL PRIMARY KEY,
  customer_id    UUID    NOT NULL REFERENCES customers(id)   ON DELETE CASCADE,
  fuel_group_id  INTEGER NOT NULL REFERENCES fuel_groups(id) ON DELETE CASCADE,
  sell_pct       NUMERIC(6,2) NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (customer_id, fuel_group_id)
);
