-- 040_customer_carrier_links.sql
--
-- customer_carrier_links: which carriers a customer uses + which rate card.
--   Defaults to the master carrier_rate_card for that courier.
--   This drives the carrier logo grid on the customer record.
--
-- fuel_groups.standard_sell_pct: the default price we charge customers
--   (everyone gets this unless a bespoke override exists).
--
-- customer_fuel_group_pricing: per-customer fuel % override.
--   If absent, standard_sell_pct is used as the sell price.

-- ── customer_carrier_links ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS customer_carrier_links (
  id                   SERIAL PRIMARY KEY,
  customer_id          UUID    NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  courier_id           INTEGER NOT NULL REFERENCES couriers(id) ON DELETE RESTRICT,
  carrier_rate_card_id INTEGER NOT NULL REFERENCES carrier_rate_cards(id) ON DELETE RESTRICT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (customer_id, courier_id)
);

CREATE INDEX IF NOT EXISTS ccl_customer_idx ON customer_carrier_links(customer_id);
CREATE INDEX IF NOT EXISTS ccl_courier_idx  ON customer_carrier_links(courier_id);

-- ── fuel_groups: add standard sell price ─────────────────────────────────────

ALTER TABLE fuel_groups
  ADD COLUMN IF NOT EXISTS standard_sell_pct NUMERIC(6,2);

-- ── customer_fuel_group_pricing ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS customer_fuel_group_pricing (
  id            SERIAL PRIMARY KEY,
  customer_id   UUID    NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  fuel_group_id INTEGER NOT NULL REFERENCES fuel_groups(id) ON DELETE CASCADE,
  sell_pct      NUMERIC(6,2) NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (customer_id, fuel_group_id)
);

CREATE INDEX IF NOT EXISTS cfgp_customer_idx      ON customer_fuel_group_pricing(customer_id);
CREATE INDEX IF NOT EXISTS cfgp_fuel_group_idx    ON customer_fuel_group_pricing(fuel_group_id);
