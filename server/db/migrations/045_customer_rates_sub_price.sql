-- 045_customer_rates_sub_price.sql
-- Adds price_sub to customer_rates — the sell price for each parcel
-- after the first in a multi-parcel shipment.
-- NULL means no sub pricing; total = price × parcel_count as before.
-- When set: total = price + (parcel_count - 1) × price_sub

ALTER TABLE customer_rates
  ADD COLUMN IF NOT EXISTS price_sub NUMERIC(10,4);
