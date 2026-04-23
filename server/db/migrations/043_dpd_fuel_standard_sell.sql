-- 043_dpd_fuel_standard_sell.sql
-- Sets standard_sell_pct on DPD fuel groups.
-- These are the default sell rates charged to all customers unless a
-- per-customer override exists in customer_fuel_group_pricing.

UPDATE fuel_groups
SET standard_sell_pct = vals.pct
FROM (VALUES
  ('Classic Road',          12.0),
  ('Domestic',               7.9),
  ('International Express', 18.0),
  ('International Postal',  12.0)
) AS vals(name, pct)
WHERE fuel_groups.name    = vals.name
  AND fuel_groups.courier_id = (SELECT id FROM couriers WHERE LOWER(code) = 'dpd' LIMIT 1);
