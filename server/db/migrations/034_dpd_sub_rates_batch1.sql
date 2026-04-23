-- 034: DPD Mainland sub-parcel (2nd+ box) sell rates — batch 1
--
-- Source: Moov Parcel rate card PDFs (Dec 2025 / Jan 2026)
-- Customers: Aegean Sea Ltd, Bakers Street, Beacons and Lightbars,
--            Capatex Limited, Empire Printing, Fortec
--
-- Customers in this batch WITHOUT sub rates (no sub box column on their rate card):
--   Bentley Photographic, Britalitez Ltd, Carnivore Cartel Ltd,
--   Code Nine UK Ltd, Crystal Nails, Crytec Limited,
--   Direct Auto Electrics Ltd, E-Health Pharmacy Ltd, Fight Outlet
--
-- DHL customers skipped (separate process):
--   Barry Carter Motor Products, Boori (Europe) LTD, Ezz Tech

DO $$
DECLARE
  v_id UUID;
BEGIN

  -- ── Aegean Sea Ltd ────────────────────────────────────────────
  SELECT id INTO v_id FROM customers WHERE business_name ILIKE 'Aegean Sea%' LIMIT 1;
  IF v_id IS NOT NULL THEN
    UPDATE customer_rates SET price_sub = s.price_sub
    FROM (VALUES
      ('DPD-12','Mainland', 3.68),
      ('DPD-14','Mainland',12.74),
      ('DPD-13','Mainland', 7.55),
      ('DPD-18','Mainland',15.89),
      ('DPD-17','Mainland',12.61),
      ('DPD-16','Mainland', 7.51),
      ('DPD-01','Mainland', 8.08)
    ) AS s(service_code,zone_name,price_sub)
    WHERE customer_id=v_id AND service_code=s.service_code AND zone_name=s.zone_name;
    RAISE NOTICE 'Aegean Sea Ltd: sub rates applied (customer_id=%)', v_id;
  ELSE
    RAISE NOTICE 'Aegean Sea Ltd: not found — skipped';
  END IF;

  -- ── Bakers Street ─────────────────────────────────────────────
  SELECT id INTO v_id FROM customers WHERE business_name ILIKE 'Bakers Street%' LIMIT 1;
  IF v_id IS NOT NULL THEN
    UPDATE customer_rates SET price_sub = s.price_sub
    FROM (VALUES
      ('DPD-12','Mainland', 3.62),
      ('DPD-14','Mainland',11.81),
      ('DPD-13','Mainland', 6.81),
      ('DPD-18','Mainland',11.81),
      ('DPD-17','Mainland',11.35),
      ('DPD-16','Mainland', 5.52),
      ('DPD-01','Mainland', 6.05)
    ) AS s(service_code,zone_name,price_sub)
    WHERE customer_id=v_id AND service_code=s.service_code AND zone_name=s.zone_name;
    RAISE NOTICE 'Bakers Street: sub rates applied (customer_id=%)', v_id;
  ELSE
    RAISE NOTICE 'Bakers Street: not found — skipped';
  END IF;

  -- ── Beacons and Lightbars ─────────────────────────────────────
  SELECT id INTO v_id FROM customers WHERE business_name ILIKE 'Beacons and Lightbars%' LIMIT 1;
  IF v_id IS NOT NULL THEN
    UPDATE customer_rates SET price_sub = s.price_sub
    FROM (VALUES
      ('DPD-12','Mainland', 3.78),
      ('DPD-14','Mainland',12.86),
      ('DPD-13','Mainland', 7.62),
      ('DPD-18','Mainland',16.04),
      ('DPD-17','Mainland',12.73),
      ('DPD-16','Mainland', 7.59),
      ('DPD-01','Mainland', 8.15)
    ) AS s(service_code,zone_name,price_sub)
    WHERE customer_id=v_id AND service_code=s.service_code AND zone_name=s.zone_name;
    RAISE NOTICE 'Beacons and Lightbars: sub rates applied (customer_id=%)', v_id;
  ELSE
    RAISE NOTICE 'Beacons and Lightbars: not found — skipped';
  END IF;

  -- ── Capatex Limited ───────────────────────────────────────────
  SELECT id INTO v_id FROM customers WHERE business_name ILIKE 'Capatex%' LIMIT 1;
  IF v_id IS NOT NULL THEN
    UPDATE customer_rates SET price_sub = s.price_sub
    FROM (VALUES
      ('DPD-12','Mainland', 3.43),
      ('DPD-14','Mainland',12.09),
      ('DPD-13','Mainland', 7.17),
      ('DPD-18','Mainland',15.08),
      ('DPD-17','Mainland',11.97),
      ('DPD-16','Mainland', 7.14),
      ('DPD-01','Mainland', 7.67)
    ) AS s(service_code,zone_name,price_sub)
    WHERE customer_id=v_id AND service_code=s.service_code AND zone_name=s.zone_name;
    RAISE NOTICE 'Capatex Limited: sub rates applied (customer_id=%)', v_id;
  ELSE
    RAISE NOTICE 'Capatex Limited: not found — skipped';
  END IF;

  -- ── Empire Printing ───────────────────────────────────────────
  SELECT id INTO v_id FROM customers WHERE business_name ILIKE 'Empire Printing%' LIMIT 1;
  IF v_id IS NOT NULL THEN
    UPDATE customer_rates SET price_sub = s.price_sub
    FROM (VALUES
      ('DPD-12','Mainland', 3.45),
      ('DPD-14','Mainland',11.65),
      ('DPD-13','Mainland', 6.55),
      ('DPD-18','Mainland',15.15),
      ('DPD-17','Mainland',11.65),
      ('DPD-16','Mainland', 5.75),
      ('DPD-01','Mainland', 5.75)
    ) AS s(service_code,zone_name,price_sub)
    WHERE customer_id=v_id AND service_code=s.service_code AND zone_name=s.zone_name;
    RAISE NOTICE 'Empire Printing: sub rates applied (customer_id=%)', v_id;
  ELSE
    RAISE NOTICE 'Empire Printing: not found — skipped';
  END IF;

  -- ── Fortec ────────────────────────────────────────────────────
  SELECT id INTO v_id FROM customers WHERE business_name ILIKE 'Fortec%' LIMIT 1;
  IF v_id IS NOT NULL THEN
    UPDATE customer_rates SET price_sub = s.price_sub
    FROM (VALUES
      ('DPD-12','Mainland', 3.53),
      ('DPD-14','Mainland',11.65),
      ('DPD-13','Mainland', 6.55),
      ('DPD-18','Mainland',15.15),
      ('DPD-17','Mainland',11.65),
      ('DPD-16','Mainland', 5.75),
      ('DPD-01','Mainland', 5.75)
    ) AS s(service_code,zone_name,price_sub)
    WHERE customer_id=v_id AND service_code=s.service_code AND zone_name=s.zone_name;
    RAISE NOTICE 'Fortec: sub rates applied (customer_id=%)', v_id;
  ELSE
    RAISE NOTICE 'Fortec: not found — skipped';
  END IF;

END $$;
