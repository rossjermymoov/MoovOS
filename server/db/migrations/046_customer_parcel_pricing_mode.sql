-- 046_customer_parcel_pricing_mode.sql
-- Controls how multi-parcel shipments are billed for this customer.
--   'sub'   — first parcel at price, subsequent at price_sub (default)
--   'multi' — all parcels at price_sub (customer sends enough volume to
--             get the cheaper rate on every box)

ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS parcel_pricing_mode VARCHAR(10) NOT NULL DEFAULT 'sub'
  CHECK (parcel_pricing_mode IN ('sub', 'multi'));
