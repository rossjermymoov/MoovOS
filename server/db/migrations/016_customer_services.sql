-- 016_customer_services.sql
-- Tracks which carrier services are active / visible for each customer.
-- When a customer has rows here, the pricing tab only shows those services.
-- Customers with no rows (e.g. all imported customers) fall back to showing
-- every service they have rate data for.

CREATE TABLE IF NOT EXISTS customer_services (
  id                 SERIAL PRIMARY KEY,
  customer_id        UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  courier_service_id INT  NOT NULL REFERENCES courier_services(id) ON DELETE CASCADE,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (customer_id, courier_service_id)
);

CREATE INDEX IF NOT EXISTS idx_customer_services_customer
  ON customer_services(customer_id);
