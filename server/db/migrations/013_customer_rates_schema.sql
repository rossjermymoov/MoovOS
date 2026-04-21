-- 013_customer_rates_schema.sql
-- Customer rate cards imported from billing system export (prices.csv)

CREATE TABLE IF NOT EXISTS customer_rates (
  id               SERIAL PRIMARY KEY,
  customer_id      UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  courier_id       INT NOT NULL,
  courier_code     VARCHAR(50),
  courier_name     VARCHAR(100),
  service_id       INT NOT NULL,
  service_code     VARCHAR(100),
  service_name     VARCHAR(200),
  zone_id          INT NOT NULL,
  zone_name        VARCHAR(200),
  weight_class_id  INT NOT NULL,
  weight_class_name VARCHAR(200),
  price            NUMERIC(10,4) NOT NULL,
  UNIQUE (customer_id, service_id, zone_id, weight_class_id)
);

CREATE INDEX IF NOT EXISTS idx_customer_rates_customer ON customer_rates(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_rates_service  ON customer_rates(customer_id, service_id);
