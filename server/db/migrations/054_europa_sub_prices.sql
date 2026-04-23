-- 054_europa_sub_prices.sql
-- Adds sub-box prices to Europa's UK Mainland DPD rates.
-- Source: Moov Parcel Rates - Europa - 22.12.2025.pdf, top table (UK Mainland Sub Boxes column).
-- Only Mainland rows have sub prices; off-mainland zones are flat per-box.

UPDATE customer_rates cr
SET price_sub = vals.sub
FROM (VALUES
  ('DPD-12', 'Mainland',  3.32),   -- DPD Next Day
  ('DPD-14', 'Mainland',  9.60),   -- DPD 10.30
  ('DPD-13', 'Mainland',  6.47),   -- DPD 12.00
  ('DPD-18', 'Mainland', 11.21),   -- DPD Saturday 10.30
  ('DPD-17', 'Mainland',  8.15),   -- DPD Saturday 12.00
  ('DPD-16', 'Mainland',  5.25),   -- DPD Saturday
  ('DPD-01', 'Mainland',  5.75)    -- DPD Sunday
) AS vals(svc_code, zone, sub)
WHERE cr.customer_id = (
  SELECT id FROM customers WHERE LOWER(business_name) ILIKE '%europa%' LIMIT 1
)
  AND cr.service_code ILIKE vals.svc_code
  AND LOWER(cr.zone_name) = LOWER(vals.zone);
