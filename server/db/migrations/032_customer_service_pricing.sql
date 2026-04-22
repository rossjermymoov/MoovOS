-- 032: Customer service pricing — markup / fixed fee model
--
-- Replaces the old per-band sell-price approach with a clean two-mode model:
--   markup   — sell price = carrier cost price × (1 + markup_pct / 100)
--   fixed_fee — sell price = carrier cost price + fixed_fee
--
-- The customer is linked to a specific carrier rate card per service.
-- Zones and weight bands come from the carrier rate card; the customer
-- never needs to know about them — only their markup or fee matters.

CREATE TABLE IF NOT EXISTS customer_service_pricing (
  id                   SERIAL PRIMARY KEY,
  customer_id          UUID    NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  carrier_rate_card_id INTEGER NOT NULL REFERENCES carrier_rate_cards(id) ON DELETE RESTRICT,
  service_id           INTEGER NOT NULL REFERENCES courier_services(id) ON DELETE RESTRICT,
  pricing_type         VARCHAR(20) NOT NULL DEFAULT 'markup'
                         CHECK (pricing_type IN ('markup', 'fixed_fee')),
  markup_pct           NUMERIC(8,4),   -- e.g. 30.0000 = 30%
  fixed_fee            NUMERIC(10,2),  -- flat amount added to cost per shipment
  notes                TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (customer_id, service_id)
);

CREATE INDEX IF NOT EXISTS csp_customer_idx ON customer_service_pricing(customer_id);
CREATE INDEX IF NOT EXISTS csp_rate_card_idx ON customer_service_pricing(carrier_rate_card_id);
