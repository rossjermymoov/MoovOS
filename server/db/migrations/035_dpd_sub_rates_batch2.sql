-- 035: DPD Mainland sub-parcel (2nd+ box) sell rates — batch 2
--
-- Source: Moov Parcel rate card PDFs (Dec 2025 / Jan 2026)
-- Customers: Fosseway Parcels Ltd, Impoxer LTD T/A Makrom,
--            Norfolk Saw Services, P&S Products & Refreshening Ltd,
--            Passion Accessories Ltd, Pet & Grooming Supplies Ltd,
--            Pex Ltd, Railway Shop, Seedball Limited,
--            Techworknetwork LTD, TMK Trading Ltd t/a Nexus Modelling Supplies,
--            Wedcova Uk Ltd, Xylo Ltd
--
-- Customers WITHOUT sub rates (no sub box column on their rate card):
--   Imagin Products Ltd, Kammac, Millvill Industrial Supplies Ltd,
--   Oriental Mart, Trident Pumps, Reevo, Rilco, Vision Warehouse (Multibox only)
--
-- Skipped (Parcelshop): W J Jones Ltd T/A Zoar's Ark
-- Skipped (DHL): Tool Hub Ltd
-- Skipped (Yodel): Green Footprint Services Ltd
-- Skipped (DHL): Raycom Ltd

DO $$
DECLARE
  v_id UUID;
BEGIN

  -- ── Fosseway Parcels Ltd ──────────────────────────────────────────
  SELECT id INTO v_id FROM customers WHERE business_name ILIKE 'Fosseway Parcels%' LIMIT 1;
  IF v_id IS NOT NULL THEN
    UPDATE customer_rates SET price_sub = s.price_sub
    FROM (VALUES
      ('DPD-12','Mainland', 3.69),
      ('DPD-14','Mainland',11.65),
      ('DPD-13','Mainland', 6.55),
      ('DPD-18','Mainland',15.15),
      ('DPD-17','Mainland',11.65),
      ('DPD-16','Mainland', 5.75),
      ('DPD-01','Mainland', 5.75)
    ) AS s(service_code,zone_name,price_sub)
    WHERE customer_id=v_id AND service_code=s.service_code AND zone_name=s.zone_name;
    RAISE NOTICE 'Fosseway Parcels Ltd: sub rates applied (customer_id=%)', v_id;
  ELSE
    RAISE NOTICE 'Fosseway Parcels Ltd: not found — skipped';
  END IF;

  -- ── Impoxer LTD T/A Makrom ────────────────────────────────────────
  SELECT id INTO v_id FROM customers WHERE business_name ILIKE 'Impoxer%' LIMIT 1;
  IF v_id IS NOT NULL THEN
    UPDATE customer_rates SET price_sub = s.price_sub
    FROM (VALUES
      ('DPD-12','Mainland', 3.32),
      ('DPD-14','Mainland',11.21),
      ('DPD-13','Mainland', 6.47),
      ('DPD-18','Mainland',11.21),
      ('DPD-17','Mainland',10.77),
      ('DPD-16','Mainland', 5.25),
      ('DPD-01','Mainland', 5.75)
    ) AS s(service_code,zone_name,price_sub)
    WHERE customer_id=v_id AND service_code=s.service_code AND zone_name=s.zone_name;
    RAISE NOTICE 'Impoxer LTD T/A Makrom: sub rates applied (customer_id=%)', v_id;
  ELSE
    RAISE NOTICE 'Impoxer LTD T/A Makrom: not found — skipped';
  END IF;

  -- ── Norfolk Saw Services ──────────────────────────────────────────
  SELECT id INTO v_id FROM customers WHERE business_name ILIKE 'Norfolk Saw%' LIMIT 1;
  IF v_id IS NOT NULL THEN
    UPDATE customer_rates SET price_sub = s.price_sub
    FROM (VALUES
      ('DPD-12','Mainland', 4.15),
      ('DPD-14','Mainland',12.86),
      ('DPD-13','Mainland', 7.62),
      ('DPD-18','Mainland',16.04),
      ('DPD-17','Mainland',12.73),
      ('DPD-16','Mainland', 7.59),
      ('DPD-01','Mainland', 8.15)
    ) AS s(service_code,zone_name,price_sub)
    WHERE customer_id=v_id AND service_code=s.service_code AND zone_name=s.zone_name;
    RAISE NOTICE 'Norfolk Saw Services: sub rates applied (customer_id=%)', v_id;
  ELSE
    RAISE NOTICE 'Norfolk Saw Services: not found — skipped';
  END IF;

  -- ── P&S Products & Refreshening Ltd ──────────────────────────────
  SELECT id INTO v_id FROM customers WHERE business_name ILIKE 'P&S Products%' OR name ILIKE 'P & S Products%' LIMIT 1;
  IF v_id IS NOT NULL THEN
    UPDATE customer_rates SET price_sub = s.price_sub
    FROM (VALUES
      ('DPD-12','Mainland', 3.23),
      ('DPD-14','Mainland',11.81),
      ('DPD-13','Mainland', 6.81),
      ('DPD-18','Mainland',11.81),
      ('DPD-17','Mainland',11.35),
      ('DPD-16','Mainland', 7.63),
      ('DPD-01','Mainland', 6.05)
    ) AS s(service_code,zone_name,price_sub)
    WHERE customer_id=v_id AND service_code=s.service_code AND zone_name=s.zone_name;
    RAISE NOTICE 'P&S Products & Refreshening Ltd: sub rates applied (customer_id=%)', v_id;
  ELSE
    RAISE NOTICE 'P&S Products & Refreshening Ltd: not found — skipped';
  END IF;

  -- ── Passion Accessories Ltd ───────────────────────────────────────
  SELECT id INTO v_id FROM customers WHERE business_name ILIKE 'Passion Accessories%' LIMIT 1;
  IF v_id IS NOT NULL THEN
    UPDATE customer_rates SET price_sub = s.price_sub
    FROM (VALUES
      ('DPD-12','Mainland', 3.97),
      ('DPD-14','Mainland',12.57),
      ('DPD-13','Mainland', 7.47),
      ('DPD-18','Mainland',15.95),
      ('DPD-17','Mainland',12.57),
      ('DPD-16','Mainland', 7.48),
      ('DPD-01','Mainland', 8.02)
    ) AS s(service_code,zone_name,price_sub)
    WHERE customer_id=v_id AND service_code=s.service_code AND zone_name=s.zone_name;
    RAISE NOTICE 'Passion Accessories Ltd: sub rates applied (customer_id=%)', v_id;
  ELSE
    RAISE NOTICE 'Passion Accessories Ltd: not found — skipped';
  END IF;

  -- ── Pet & Grooming Supplies Ltd ───────────────────────────────────
  SELECT id INTO v_id FROM customers WHERE business_name ILIKE 'Pet & Grooming%' OR name ILIKE 'Pet and Grooming%' LIMIT 1;
  IF v_id IS NOT NULL THEN
    UPDATE customer_rates SET price_sub = s.price_sub
    FROM (VALUES
      ('DPD-12','Mainland', 3.69),
      ('DPD-14','Mainland',11.71),
      ('DPD-13','Mainland', 6.97),
      ('DPD-18','Mainland',14.86),
      ('DPD-17','Mainland',11.71),
      ('DPD-16','Mainland', 7.15),
      ('DPD-01','Mainland', 7.48)
    ) AS s(service_code,zone_name,price_sub)
    WHERE customer_id=v_id AND service_code=s.service_code AND zone_name=s.zone_name;
    RAISE NOTICE 'Pet & Grooming Supplies Ltd: sub rates applied (customer_id=%)', v_id;
  ELSE
    RAISE NOTICE 'Pet & Grooming Supplies Ltd: not found — skipped';
  END IF;

  -- ── Pex Ltd ───────────────────────────────────────────────────────
  SELECT id INTO v_id FROM customers WHERE business_name ILIKE 'Pex Ltd%' LIMIT 1;
  IF v_id IS NOT NULL THEN
    UPDATE customer_rates SET price_sub = s.price_sub
    FROM (VALUES
      ('DPD-12','Mainland', 3.38),
      ('DPD-14','Mainland',11.21),
      ('DPD-13','Mainland', 6.47),
      ('DPD-18','Mainland',11.21),
      ('DPD-17','Mainland',10.77),
      ('DPD-16','Mainland', 5.25),
      ('DPD-01','Mainland', 5.75)
    ) AS s(service_code,zone_name,price_sub)
    WHERE customer_id=v_id AND service_code=s.service_code AND zone_name=s.zone_name;
    RAISE NOTICE 'Pex Ltd: sub rates applied (customer_id=%)', v_id;
  ELSE
    RAISE NOTICE 'Pex Ltd: not found — skipped';
  END IF;

  -- ── Railway Shop ──────────────────────────────────────────────────
  SELECT id INTO v_id FROM customers WHERE business_name ILIKE 'Railway Shop%' LIMIT 1;
  IF v_id IS NOT NULL THEN
    UPDATE customer_rates SET price_sub = s.price_sub
    FROM (VALUES
      ('DPD-12','Mainland', 3.90),
      ('DPD-14','Mainland',11.21),
      ('DPD-13','Mainland', 6.47),
      ('DPD-18','Mainland',11.21),
      ('DPD-17','Mainland',10.77),
      ('DPD-16','Mainland', 5.25),
      ('DPD-01','Mainland', 5.75)
    ) AS s(service_code,zone_name,price_sub)
    WHERE customer_id=v_id AND service_code=s.service_code AND zone_name=s.zone_name;
    RAISE NOTICE 'Railway Shop: sub rates applied (customer_id=%)', v_id;
  ELSE
    RAISE NOTICE 'Railway Shop: not found — skipped';
  END IF;

  -- ── Seedball Limited ──────────────────────────────────────────────
  SELECT id INTO v_id FROM customers WHERE business_name ILIKE 'Seedball%' LIMIT 1;
  IF v_id IS NOT NULL THEN
    UPDATE customer_rates SET price_sub = s.price_sub
    FROM (VALUES
      ('DPD-12','Mainland', 4.98),
      ('DPD-14','Mainland',12.86),
      ('DPD-13','Mainland', 7.62),
      ('DPD-18','Mainland',16.04),
      ('DPD-17','Mainland',12.73),
      ('DPD-16','Mainland', 7.59),
      ('DPD-01','Mainland', 8.15)
    ) AS s(service_code,zone_name,price_sub)
    WHERE customer_id=v_id AND service_code=s.service_code AND zone_name=s.zone_name;
    RAISE NOTICE 'Seedball Limited: sub rates applied (customer_id=%)', v_id;
  ELSE
    RAISE NOTICE 'Seedball Limited: not found — skipped';
  END IF;

  -- ── Techworknetwork LTD ───────────────────────────────────────────
  SELECT id INTO v_id FROM customers WHERE business_name ILIKE 'Techworknetwork%' LIMIT 1;
  IF v_id IS NOT NULL THEN
    UPDATE customer_rates SET price_sub = s.price_sub
    FROM (VALUES
      ('DPD-12','Mainland', 3.51),
      ('DPD-14','Mainland',11.81),
      ('DPD-13','Mainland', 6.81),
      ('DPD-18','Mainland',11.81),
      ('DPD-17','Mainland',11.34),
      ('DPD-16','Mainland', 5.52),
      ('DPD-01','Mainland', 6.05)
    ) AS s(service_code,zone_name,price_sub)
    WHERE customer_id=v_id AND service_code=s.service_code AND zone_name=s.zone_name;
    RAISE NOTICE 'Techworknetwork LTD: sub rates applied (customer_id=%)', v_id;
  ELSE
    RAISE NOTICE 'Techworknetwork LTD: not found — skipped';
  END IF;

  -- ── TMK Trading Ltd t/a Nexus Modelling Supplies ──────────────────
  SELECT id INTO v_id FROM customers WHERE business_name ILIKE 'TMK Trading%' OR name ILIKE 'Nexus Modelling%' LIMIT 1;
  IF v_id IS NOT NULL THEN
    UPDATE customer_rates SET price_sub = s.price_sub
    FROM (VALUES
      ('DPD-12','Mainland', 4.31),
      ('DPD-14','Mainland',11.65),
      ('DPD-13','Mainland', 6.55),
      ('DPD-18','Mainland',15.15),
      ('DPD-17','Mainland',11.65),
      ('DPD-16','Mainland', 5.75),
      ('DPD-01','Mainland', 5.75)
    ) AS s(service_code,zone_name,price_sub)
    WHERE customer_id=v_id AND service_code=s.service_code AND zone_name=s.zone_name;
    RAISE NOTICE 'TMK Trading Ltd t/a Nexus Modelling Supplies: sub rates applied (customer_id=%)', v_id;
  ELSE
    RAISE NOTICE 'TMK Trading Ltd t/a Nexus Modelling Supplies: not found — skipped';
  END IF;

  -- ── Wedcova Uk Ltd ────────────────────────────────────────────────
  SELECT id INTO v_id FROM customers WHERE business_name ILIKE 'Wedcova%' LIMIT 1;
  IF v_id IS NOT NULL THEN
    UPDATE customer_rates SET price_sub = s.price_sub
    FROM (VALUES
      ('DPD-12','Mainland', 3.90),
      ('DPD-14','Mainland',11.65),
      ('DPD-13','Mainland', 6.55),
      ('DPD-18','Mainland',15.15),
      ('DPD-17','Mainland',11.65),
      ('DPD-16','Mainland', 5.75),
      ('DPD-01','Mainland', 5.75)
    ) AS s(service_code,zone_name,price_sub)
    WHERE customer_id=v_id AND service_code=s.service_code AND zone_name=s.zone_name;
    RAISE NOTICE 'Wedcova Uk Ltd: sub rates applied (customer_id=%)', v_id;
  ELSE
    RAISE NOTICE 'Wedcova Uk Ltd: not found — skipped';
  END IF;

  -- ── Xylo Ltd ──────────────────────────────────────────────────────
  SELECT id INTO v_id FROM customers WHERE business_name ILIKE 'Xylo%' LIMIT 1;
  IF v_id IS NOT NULL THEN
    UPDATE customer_rates SET price_sub = s.price_sub
    FROM (VALUES
      ('DPD-12','Mainland', 3.90),
      ('DPD-14','Mainland',11.65),
      ('DPD-13','Mainland', 6.55),
      ('DPD-18','Mainland',15.15),
      ('DPD-17','Mainland',11.65),
      ('DPD-16','Mainland', 5.75),
      ('DPD-01','Mainland', 5.75)
    ) AS s(service_code,zone_name,price_sub)
    WHERE customer_id=v_id AND service_code=s.service_code AND zone_name=s.zone_name;
    RAISE NOTICE 'Xylo Ltd: sub rates applied (customer_id=%)', v_id;
  ELSE
    RAISE NOTICE 'Xylo Ltd: not found — skipped';
  END IF;

END $$;
