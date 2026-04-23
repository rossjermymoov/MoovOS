-- 032: Add price_sub to customer sell-rate tables
--
-- Mirrors the first/sub parcel pricing already on weight_bands (carrier cost side).
-- price_sub is the sell price for 2nd+ parcels on the same order.
-- NULL = service does not offer a sub/multi-parcel rate.

ALTER TABLE customer_rates
  ADD COLUMN IF NOT EXISTS price_sub NUMERIC(10,4);

ALTER TABLE customer_rate_card_entries
  ADD COLUMN IF NOT EXISTS price_sub NUMERIC(10,4);

CREATE INDEX IF NOT EXISTS customer_rates_sub_price_idx
  ON customer_rates(customer_id, service_code)
  WHERE price_sub IS NOT NULL;
