-- 041_cranswick_rates.sql
-- Inserts Cranswick's DPD sell rates (18 rows, all flat-rate "Parcel" bands).
-- Source: prices (3).csv, CSV customer_id 2257.
-- Looked up by business_name — safe to re-run (ON CONFLICT DO UPDATE).

DO $$
DECLARE
  v_customer_id UUID;
BEGIN
  SELECT id INTO v_customer_id
  FROM customers
  WHERE LOWER(business_name) ILIKE '%cranswick%'
  LIMIT 1;

  IF v_customer_id IS NULL THEN
    RAISE EXCEPTION 'Cranswick customer not found — ensure the customer record exists before running this migration.';
  END IF;

  INSERT INTO customer_rates
    (customer_id, courier_id, courier_code, courier_name,
     service_id,  service_code,  service_name,
     zone_id,     zone_name,
     weight_class_id, weight_class_name,
     price)
  VALUES
    -- DPD-12 Next Day
    (v_customer_id, 150, 'DPD', 'DPD', 764, 'DPD-12', 'DPD Next Day',  9527, 'Mainland',            17516, 'Parcel',  4.55),
    (v_customer_id, 150, 'DPD', 'DPD', 764, 'DPD-12', 'DPD Next Day', 11652, 'Northern Ireland',    17516, 'Parcel', 31.95),
    (v_customer_id, 150, 'DPD', 'DPD', 764, 'DPD-12', 'DPD Next Day', 14058, 'Highlands and Islands',17516,'Parcel', 10.89),
    -- DPD-11 Two Day
    (v_customer_id, 150, 'DPD', 'DPD', 765, 'DPD-11', 'DPD Two Day',  9533, 'Channel Islands',      17517, 'Parcel', 13.95),
    (v_customer_id, 150, 'DPD', 'DPD', 765, 'DPD-11', 'DPD Two Day',  9534, 'Isle of Man',          17517, 'Parcel', 12.50),
    (v_customer_id, 150, 'DPD', 'DPD', 765, 'DPD-11', 'DPD Two Day',  9708, 'Mainland',             17517, 'Parcel',  4.55),
    (v_customer_id, 150, 'DPD', 'DPD', 765, 'DPD-11', 'DPD Two Day',  9530, 'Northern Ireland',     17517, 'Parcel',  9.95),
    (v_customer_id, 150, 'DPD', 'DPD', 765, 'DPD-11', 'DPD Two Day', 12430, 'ROI',                  17517, 'Parcel',  9.50),
    (v_customer_id, 150, 'DPD', 'DPD', 765, 'DPD-11', 'DPD Two Day',  9529, 'Scottish Highlands',   17517, 'Parcel', 10.89),
    (v_customer_id, 150, 'DPD', 'DPD', 765, 'DPD-11', 'DPD Two Day',  9532, 'Scottish Islands',     17517, 'Parcel', 10.89),
    -- DPD-16 Saturday
    (v_customer_id, 150, 'DPD', 'DPD', 766, 'DPD-16', 'DPD Saturday',     9535, 'Mainland', 17519, 'Parcel',  6.95),
    -- DPD-01 Sunday
    (v_customer_id, 150, 'DPD', 'DPD', 767, 'DPD-01', 'DPD Sunday',       9536, 'Mainland', 17520, 'Parcel',  7.95),
    -- DPD-14 Next Day 10.30
    (v_customer_id, 150, 'DPD', 'DPD', 772, 'DPD-14', 'DPD Next Day 10.30', 9548, 'Mainland', 17522, 'Parcel', 14.85),
    -- DPD-13 Next Day 12.00
    (v_customer_id, 150, 'DPD', 'DPD', 773, 'DPD-13', 'DPD Next Day 12.00', 9549, 'Mainland', 17523, 'Parcel',  7.95),
    -- DPD-18 Saturday 10.30
    (v_customer_id, 150, 'DPD', 'DPD', 774, 'DPD-18', 'DPD Saturday 10.30', 9550, 'Mainland', 17524, 'Parcel', 18.25),
    -- DPD-17 Saturday 12.00
    (v_customer_id, 150, 'DPD', 'DPD', 775, 'DPD-17', 'DPD Saturday 12.00', 9551, 'Mainland', 17525, 'Parcel', 14.85),
    -- DPD-5000 Next Day 5k Insurance
    (v_customer_id, 150, 'DPD', 'DPD', 937, 'DPD-5000', 'DPD Next Day 5k Insurance', 11465, 'Mainland', 19694, 'Parcel', 12.10),
    -- DPD-12OOG Next Day Out of Gauge
    (v_customer_id, 150, 'DPD', 'DPD', 1026, 'DPD-12OOG', 'DPD Next Day Out of Gauge', 12159, 'Mainland', 21247, 'Parcel', 14.05)
  ON CONFLICT (customer_id, service_id, zone_id, weight_class_id)
  DO UPDATE SET
    price        = EXCLUDED.price,
    service_name = EXCLUDED.service_name,
    zone_name    = EXCLUDED.zone_name,
    updated_at   = NOW();

  RAISE NOTICE 'Cranswick rates inserted/updated for customer %', v_customer_id;
END $$;
