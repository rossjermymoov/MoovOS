-- 033: Europa — DPD Domestic Mainland sub-parcel (2nd+ box) sell rates
--
-- Source: Moov Parcel Rates - Europa - 22.12.2025.pdf
-- Sub rates apply to Mainland zone only (flat-rate out-of-area zones
-- like NI, Highlands, Channel Islands, IoM, ROI do not carry a sub rate).
--
-- Run after migration 032 (price_sub column must exist).
-- Europa customer_id: 4fedcf79-69c7-46c7-9d56-4e3c21ae5ce4

UPDATE customer_rates
SET price_sub = sub.price_sub
FROM (VALUES
  ('DPD-12', 'Mainland', 3.32),   -- Next Day
  ('DPD-14', 'Mainland', 9.60),   -- 10:30
  ('DPD-13', 'Mainland', 6.47),   -- 12:00
  ('DPD-18', 'Mainland', 11.21),  -- Saturday 10:30
  ('DPD-17', 'Mainland', 8.15),   -- Saturday 12:00
  ('DPD-16', 'Mainland', 5.25),   -- Saturday
  ('DPD-01', 'Mainland', 5.75)    -- Sunday
) AS sub(service_code, zone_name, price_sub)
WHERE customer_rates.customer_id = '4fedcf79-69c7-46c7-9d56-4e3c21ae5ce4'
  AND customer_rates.service_code = sub.service_code
  AND customer_rates.zone_name    = sub.zone_name;
