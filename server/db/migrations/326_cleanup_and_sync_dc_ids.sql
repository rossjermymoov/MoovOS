-- Migration 326: Remove placeholder customers and update DC IDs for existing customers
-- 1. Delete Wosi Wosi and any auto-created placeholder records
DELETE FROM customers 
WHERE LOWER(business_name) LIKE '%wosi wosi%' 
   OR LOWER(business_name) LIKE '%wasi wasi%'
   OR registered_address = 'Registered Address' 
   OR postcode = 'UK';

-- 2. Clear MOOV-0176 / 0176 from Europa or any other record
UPDATE customers 
SET dc_customer_id = NULL 
WHERE dc_customer_id = 'MOOV-0176' 
   OR dc_customer_id = '0176';

-- 3. Set Europa's dc_customer_id back to 'Europa' (or its own ID)
UPDATE customers 
SET dc_customer_id = 'Europa' 
WHERE LOWER(business_name) = 'europa';

DO $$
DECLARE
  v_cust_id UUID;
BEGIN

  -- ── Developer Testing (1) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Developer Testing')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Developer Testing%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = '1' OR dc_customer_id = '1')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = '1',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Cloud 9 Fulfilment (Cloud9) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Cloud 9 Fulfilment')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Cloud 9 Fulfilment%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'Cloud9' OR dc_customer_id = '9')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'Cloud9',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── WXM - Greenplant UK Ltd (WXM-0004) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('WXM - Greenplant UK Ltd')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%WXM - Greenplant UK Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'WXM-0004' OR dc_customer_id = '0004')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'WXM-0004',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── WXM - Projekt Indigo Studio Ltd (WXM-0005) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('WXM - Projekt Indigo Studio Ltd')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%WXM - Projekt Indigo Studio Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'WXM-0005' OR dc_customer_id = '0005')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'WXM-0005',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Floship-Returns (FLOSHIP) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Floship-Returns')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Floship-Returns%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'FLOSHIP' )
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'FLOSHIP',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Keells (DP1-0201) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Keells')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Keells%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'DP1-0201' OR dc_customer_id = '1')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'DP1-0201',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── MoreHustl (HOF-0031) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('MoreHustl')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%MoreHustl%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'HOF-0031' OR dc_customer_id = '0031')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'HOF-0031',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Suresh Deepal Herath 12 (Dep2-0006) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Suresh Deepal Herath 12')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Suresh Deepal Herath 12%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'Dep2-0006' OR dc_customer_id = '2')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'Dep2-0006',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── The Chosen Baller LLC (001-0002) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('The Chosen Baller LLC')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%The Chosen Baller LLC%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = '001-0002' OR dc_customer_id = '001')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = '001-0002',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── SND Electrical (HOF-0054) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('SND Electrical')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%SND Electrical%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'HOF-0054' OR dc_customer_id = '0054')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'HOF-0054',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── E & L Trading Ltd (HOF-0055) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('E & L Trading Ltd')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%E & L Trading Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'HOF-0055' OR dc_customer_id = '0055')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'HOF-0055',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Britalitez Limited (HOF-0056) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Britalitez Limited')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Britalitez Limited%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'HOF-0056' OR dc_customer_id = '0056')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'HOF-0056',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Moov Prod Admin two (DD2-0003) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Moov Prod Admin two')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Moov Prod Admin two%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'DD2-0003' OR dc_customer_id = '2')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'DD2-0003',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Danny Snelson (HOF-0008) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Danny Snelson')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Danny Snelson%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'HOF-0008' OR dc_customer_id = '0008')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'HOF-0008',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Spare and Square (HOF-GONE) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Spare and Square')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Spare and Square%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'HOF-GONE' )
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'HOF-GONE',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Crystal Nails (HOF-0009) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Crystal Nails')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Crystal Nails%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'HOF-0009' OR dc_customer_id = '0009')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'HOF-0009',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Fight Outlet (HOF-0010) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Fight Outlet')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Fight Outlet%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'HOF-0010' OR dc_customer_id = '0010')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'HOF-0010',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Prophecy Cricket Ltd (HOF-0011) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Prophecy Cricket Ltd')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Prophecy Cricket Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'HOF-0011' OR dc_customer_id = '0011')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'HOF-0011',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Seedball Limited (HOF-0012) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Seedball Limited')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Seedball Limited%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'HOF-0012' OR dc_customer_id = '0012')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'HOF-0012',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Saloos Ltd (MOOV-0002) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Saloos Ltd')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Saloos Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0002' OR dc_customer_id = '0002')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0002',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── MP Homewares Ltd (MOOV-0003) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('MP Homewares Ltd')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%MP Homewares Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0003' OR dc_customer_id = '0003')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0003',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── I Luv Designer (MOOV-0004) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('I Luv Designer')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%I Luv Designer%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0004' OR dc_customer_id = '0004')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0004',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── 3 Devices Ltd (MOOV-0005) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('3 Devices Ltd')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%3 Devices Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0005' OR dc_customer_id = '0005')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0005',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── EF TEST CUSTOMER QA EIGHT (DF1-0004) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('EF TEST CUSTOMER QA EIGHT')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%EF TEST CUSTOMER QA EIGHT%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'DF1-0004' OR dc_customer_id = '1')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'DF1-0004',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Yayo Familia Ltd (MOOV-0006) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Yayo Familia Ltd')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Yayo Familia Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0006' OR dc_customer_id = '0006')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0006',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Capatex Limited (MOOV-0007) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Capatex Limited')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Capatex Limited%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0007' OR dc_customer_id = '0007')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0007',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Trident Pumps (MOOV-0008) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Trident Pumps')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Trident Pumps%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0008' OR dc_customer_id = '0008')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0008',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Tribal Society (MOOV-0009) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Tribal Society')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Tribal Society%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0009' OR dc_customer_id = '0009')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0009',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Millvill Industrial Supplies Ltd (MOOV-0010) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Millvill Industrial Supplies Ltd')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Millvill Industrial Supplies Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0010' OR dc_customer_id = '0010')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0010',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── B2B Workwear & Janitorial Ltd (MOOV-0011) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('B2B Workwear & Janitorial Ltd')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%B2B Workwear & Janitorial Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0011' OR dc_customer_id = '0011')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0011',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Britalitez Ltd (MOOV-0012) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Britalitez Ltd')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Britalitez Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0012' OR dc_customer_id = '0012')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0012',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Code Nine UK Ltd (MOOV-0013) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Code Nine UK Ltd')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Code Nine UK Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0013' OR dc_customer_id = '0013')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0013',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Edmunson Electrical Leeds (MOOV-0014) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Edmunson Electrical Leeds')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Edmunson Electrical Leeds%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0014' OR dc_customer_id = '0014')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0014',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Green Footprint Services Ltd (MOOV-0015) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Green Footprint Services Ltd')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Green Footprint Services Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0015' OR dc_customer_id = '0015')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0015',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── EF QA CUSTOMER HS (DP1-0011) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('EF QA CUSTOMER HS')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%EF QA CUSTOMER HS%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'DP1-0011' OR dc_customer_id = '1')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'DP1-0011',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── hjko (1233-0001) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('hjko')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%hjko%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = '1233-0001' OR dc_customer_id = '1233')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = '1233-0001',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── qwerty (DF1-0007) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('qwerty')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%qwerty%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'DF1-0007' OR dc_customer_id = '1')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'DF1-0007',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Norfolk Saw Services (MOOV-0016) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Norfolk Saw Services')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Norfolk Saw Services%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0016' OR dc_customer_id = '0016')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0016',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Rilco Electrical Supplies (MOOV-0017) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Rilco Electrical Supplies')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Rilco Electrical Supplies%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0017' OR dc_customer_id = '0017')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0017',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── asdfg (DF1-0008) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('asdfg')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%asdfg%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'DF1-0008' OR dc_customer_id = '1')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'DF1-0008',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Passion Accessories Ltd (MOOV-0018) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Passion Accessories Ltd')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Passion Accessories Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0018' OR dc_customer_id = '0018')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0018',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Spare and Square Ltd (MOOV-0019) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Spare and Square Ltd')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Spare and Square Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0019' OR dc_customer_id = '0019')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0019',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── nnmm (DF1-0009) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('nnmm')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%nnmm%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'DF1-0009' OR dc_customer_id = '1')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'DF1-0009',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── check (1233-0002) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('check')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%check%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = '1233-0002' OR dc_customer_id = '1233')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = '1233-0002',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── SND ELECTRICAL WHOLESALERS (UK) LTD (MOOV-0020) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('SND ELECTRICAL WHOLESALERS (UK) LTD')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%SND ELECTRICAL WHOLESALERS (UK) LTD%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0020' OR dc_customer_id = '0020')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0020',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Efutures (DP1-0014) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Efutures')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Efutures%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'DP1-0014' OR dc_customer_id = '1')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'DP1-0014',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Lifemax Limited (MOOV-0021) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Lifemax Limited')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Lifemax Limited%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0021' OR dc_customer_id = '0021')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0021',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── IFS (DD2-0005) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('IFS')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%IFS%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'DD2-0005' OR dc_customer_id = '2')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'DD2-0005',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── M and J Brothers Ltd (MOOV-0022) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('M and J Brothers Ltd')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%M and J Brothers Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0022' OR dc_customer_id = '0022')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0022',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Beacons and Lightbars (MOOV-0023) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Beacons and Lightbars')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Beacons and Lightbars%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0023' OR dc_customer_id = '0023')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0023',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── DDUP International Ltd (MOOV-0024) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('DDUP International Ltd')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%DDUP International Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0024' OR dc_customer_id = '0024')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0024',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Granola Kitchen Ltd (MOOV-0025) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Granola Kitchen Ltd')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Granola Kitchen Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0025' OR dc_customer_id = '0025')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0025',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Pet & Grooming Supplies Ltd (MOOV-0026) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Pet & Grooming Supplies Ltd')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Pet & Grooming Supplies Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0026' OR dc_customer_id = '0026')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0026',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── SRR3 (DF1-0010) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('SRR3')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%SRR3%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'DF1-0010' OR dc_customer_id = '1')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'DF1-0010',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Uni4mers (Uni4mers) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Uni4mers')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Uni4mers%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'Uni4mers' OR dc_customer_id = '4')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'Uni4mers',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Efutures4 (DP1-0016) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Efutures4')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Efutures4%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'DP1-0016' OR dc_customer_id = '1')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'DP1-0016',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── EFtures5 (DP1-0017) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('EFtures5')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%EFtures5%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'DP1-0017' OR dc_customer_id = '1')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'DP1-0017',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Sharkeye Wheel Aligners UK Ltd (MOOV-0027) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Sharkeye Wheel Aligners UK Ltd')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Sharkeye Wheel Aligners UK Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0027' OR dc_customer_id = '0027')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0027',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Efutures5 (DDJ1-0001) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Efutures5')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Efutures5%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'DDJ1-0001' OR dc_customer_id = '1')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'DDJ1-0001',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── The Hanger Store (MOOV-0028) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('The Hanger Store')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%The Hanger Store%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0028' OR dc_customer_id = '0028')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0028',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── How High Brands (MOOV-0029) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('How High Brands')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%How High Brands%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0029' OR dc_customer_id = '0029')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0029',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── SQA (DP1-0019) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('SQA')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%SQA%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'DP1-0019' OR dc_customer_id = '1')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'DP1-0019',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── SINGER (DP1-0021) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('SINGER')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%SINGER%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'DP1-0021' OR dc_customer_id = '1')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'DP1-0021',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Greenplant UK Ltd (MOOV-0030) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Greenplant UK Ltd')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Greenplant UK Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0030' OR dc_customer_id = '0030')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0030',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Assetee (DP1-0024) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Assetee')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Assetee%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'DP1-0024' OR dc_customer_id = '1')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'DP1-0024',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Mobberley Cakes Ltd (MOOV-0031) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Mobberley Cakes Ltd')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Mobberley Cakes Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0031' OR dc_customer_id = '0031')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0031',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Ecom Group UK Limited (MOOV-0032) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Ecom Group UK Limited')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Ecom Group UK Limited%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0032' OR dc_customer_id = '0032')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0032',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Heaven Scent Incense Ltd (MOOV-0033) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Heaven Scent Incense Ltd')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Heaven Scent Incense Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0033' OR dc_customer_id = '0033')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0033',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── EFUTURES6 (DP1-0025) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('EFUTURES6')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%EFUTURES6%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'DP1-0025' OR dc_customer_id = '1')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'DP1-0025',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── AJP1 (AJP1) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('AJP1')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%AJP1%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'AJP1' OR dc_customer_id = '1')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'AJP1',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── AJP2 (AJP2) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('AJP2')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%AJP2%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'AJP2' OR dc_customer_id = '2')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'AJP2',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── AJP3 (AJP3) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('AJP3')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%AJP3%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'AJP3' OR dc_customer_id = '3')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'AJP3',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── AJP4 (AJP4) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('AJP4')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%AJP4%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'AJP4' OR dc_customer_id = '4')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'AJP4',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── AJP5 (AJP5) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('AJP5')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%AJP5%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'AJP5' OR dc_customer_id = '5')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'AJP5',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Info Technology Supply (MOOV-0034) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Info Technology Supply')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Info Technology Supply%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0034' OR dc_customer_id = '0034')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0034',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── 99X (DP1-0027) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('99X')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%99X%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'DP1-0027' OR dc_customer_id = '1')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'DP1-0027',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Aegean Sea Ltd (MOOV-0035) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Aegean Sea Ltd')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Aegean Sea Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0035' OR dc_customer_id = '0035')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0035',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── LB Finance (DP1-0028) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('LB Finance')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%LB Finance%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'DP1-0028' OR dc_customer_id = '1')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'DP1-0028',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── DM AGENCY AND DISTRIBUTION (MOOV-0036) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('DM AGENCY AND DISTRIBUTION')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%DM AGENCY AND DISTRIBUTION%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0036' OR dc_customer_id = '0036')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0036',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── DDPL (DDPL) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('DDPL')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%DDPL%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'DDPL' )
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'DDPL',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Aglory MERCHANT ENTERPRISES LIMITED (Aglory MERCHANT ENTERPRISES LIMITED) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Aglory MERCHANT ENTERPRISES LIMITED')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Aglory MERCHANT ENTERPRISES LIMITED%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'Aglory MERCHANT ENTERPRISES LIMITED' )
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'Aglory MERCHANT ENTERPRISES LIMITED',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── HCL (DP1-0029) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('HCL')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%HCL%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'DP1-0029' OR dc_customer_id = '1')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'DP1-0029',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── NEXT (DP1-0030) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('NEXT')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%NEXT%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'DP1-0030' OR dc_customer_id = '1')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'DP1-0030',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── E Square (E Square) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('E Square')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%E Square%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'E Square' )
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'E Square',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Natural Spa Supplies Ltd (MOOV-0037) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Natural Spa Supplies Ltd')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Natural Spa Supplies Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0037' OR dc_customer_id = '0037')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0037',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── JOY ASIAN FOOD & GROCERY LIMITED (MOOV-0038) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('JOY ASIAN FOOD & GROCERY LIMITED')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%JOY ASIAN FOOD & GROCERY LIMITED%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0038' OR dc_customer_id = '0038')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0038',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Bakers Street Limited (MOOV-0039) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Bakers Street Limited')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Bakers Street Limited%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0039' OR dc_customer_id = '0039')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0039',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── 8ack (8ack) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('8ack')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%8ack%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = '8ack' OR dc_customer_id = '8')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = '8ack',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Jane Scott Ceramics (MOOV-0040) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Jane Scott Ceramics')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Jane Scott Ceramics%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0040' OR dc_customer_id = '0040')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0040',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── SCR DISTRIBUTION (MOOV-0041) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('SCR DISTRIBUTION')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%SCR DISTRIBUTION%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0041' OR dc_customer_id = '0041')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0041',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Megway (Megway Parcels) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Megway')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Megway%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'Megway Parcels' )
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'Megway Parcels',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Lather Up (MOOV-0042) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Lather Up')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Lather Up%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0042' OR dc_customer_id = '0042')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0042',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Impoxer LTD T/A Makrom (MOOV-0043) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Impoxer LTD T/A Makrom')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Impoxer LTD T/A Makrom%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0043' OR dc_customer_id = '0043')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0043',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Vertura Ltd (MOOV-0045) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Vertura Ltd')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Vertura Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0045' OR dc_customer_id = '0045')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0045',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Roar Gill Ltd (MOOV-0046) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Roar Gill Ltd')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Roar Gill Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0046' OR dc_customer_id = '0046')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0046',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Oriental Mart (Oriental Mart) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Oriental Mart')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Oriental Mart%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'Oriental Mart' )
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'Oriental Mart',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Reevo (MOOV-0047) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Reevo')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Reevo%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0047' OR dc_customer_id = '0047')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0047',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Lace and Favour Ltd (MOOV-0048) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Lace and Favour Ltd')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Lace and Favour Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0048' OR dc_customer_id = '0048')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0048',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Andersen EV (Andersen EV) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Andersen EV')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Andersen EV%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'Andersen EV' )
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'Andersen EV',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Henry And Tosh Limited (MOOV-0050) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Henry And Tosh Limited')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Henry And Tosh Limited%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0050' OR dc_customer_id = '0050')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0050',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── March Laboratories Ltd / Ace Canine Healthcare (MOOV-0051) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('March Laboratories Ltd / Ace Canine Healthcare')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%March Laboratories Ltd / Ace Canine Healthcare%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0051' OR dc_customer_id = '0051')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0051',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── May2024 (DF1-0012) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('May2024')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%May2024%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'DF1-0012' OR dc_customer_id = '1')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'DF1-0012',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── test 2024 (DF1-0013) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('test 2024')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%test 2024%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'DF1-0013' OR dc_customer_id = '1')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'DF1-0013',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── testii (DF1-0014) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('testii')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%testii%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'DF1-0014' OR dc_customer_id = '1')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'DF1-0014',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Abans Company (DQA1-0001) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Abans Company')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Abans Company%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'DQA1-0001' OR dc_customer_id = '1')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'DQA1-0001',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Neil Test (MOOV-0053) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Neil Test')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Neil Test%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0053' OR dc_customer_id = '0053')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0053',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Moov Parcel (MOOV-0054) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Moov Parcel')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Moov Parcel%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0054' OR dc_customer_id = '0054')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0054',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Ultra Soft Water Softeners Ltd (MOOV-0056) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Ultra Soft Water Softeners Ltd')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Ultra Soft Water Softeners Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0056' OR dc_customer_id = '0056')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0056',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── UK Optics Ltd (MOOV-0057) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('UK Optics Ltd')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%UK Optics Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0057' OR dc_customer_id = '0057')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0057',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── CLIPHER LTD (MOOV-0058) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('CLIPHER LTD')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%CLIPHER LTD%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0058' OR dc_customer_id = '0058')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0058',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Damro (DF1-0015) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Damro')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Damro%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'DF1-0015' OR dc_customer_id = '1')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'DF1-0015',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Teleseen (DP1-0034) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Teleseen')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Teleseen%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'DP1-0034' OR dc_customer_id = '1')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'DP1-0034',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Live Quote Testing (LQT) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Live Quote Testing')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Live Quote Testing%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'LQT' )
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'LQT',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── P&S Products & Refreshening Ltd (MOOV-0059) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('P&S Products & Refreshening Ltd')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%P&S Products & Refreshening Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0059' OR dc_customer_id = '0059')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0059',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── HOME AND HAVEN LIMITED (MOOV-0060) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('HOME AND HAVEN LIMITED')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%HOME AND HAVEN LIMITED%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0060' OR dc_customer_id = '0060')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0060',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── 2024 (DP1-0037) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('2024')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%2024%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'DP1-0037' OR dc_customer_id = '1')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'DP1-0037',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Jetstar Airways (DP1-0038) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Jetstar Airways')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Jetstar Airways%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'DP1-0038' OR dc_customer_id = '1')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'DP1-0038',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Rifai UK Ltd (MOOV-0061) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Rifai UK Ltd')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Rifai UK Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0061' OR dc_customer_id = '0061')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0061',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Giga Distributors (MOOV-0062) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Giga Distributors')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Giga Distributors%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0062' OR dc_customer_id = '0062')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0062',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── TKS NATURALS LTD (MOOV-0063) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('TKS NATURALS LTD')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%TKS NATURALS LTD%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0063' OR dc_customer_id = '0063')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0063',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Mini La Mode (MOOV-0064) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Mini La Mode')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Mini La Mode%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0064' OR dc_customer_id = '0064')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0064',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── TCS Worldwide (TCS) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('TCS Worldwide')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%TCS Worldwide%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'TCS' )
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'TCS',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── ERTECH LTD (MOOV-0066) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('ERTECH LTD')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%ERTECH LTD%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0066' OR dc_customer_id = '0066')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0066',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── D S Engineering (MOOV-0067) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('D S Engineering')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%D S Engineering%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0067' OR dc_customer_id = '0067')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0067',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── kol (1233-0003) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('kol')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%kol%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = '1233-0003' OR dc_customer_id = '1233')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = '1233-0003',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Hairways (Hair & Beauty) Ltd (MOOV-0068) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Hairways (Hair & Beauty) Ltd')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Hairways (Hair & Beauty) Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0068' OR dc_customer_id = '0068')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0068',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Soghaat Gifts & Fragrances Ltd. (MOOV-0069) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Soghaat Gifts & Fragrances Ltd.')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Soghaat Gifts & Fragrances Ltd.%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0069' OR dc_customer_id = '0069')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0069',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Lampfix (MOOV-0070) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Lampfix')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Lampfix%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0070' OR dc_customer_id = '0070')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0070',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Bentley Photographic (MOOV-0071) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Bentley Photographic')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Bentley Photographic%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0071' OR dc_customer_id = '0071')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0071',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Creative Solution (DQA1-0005) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Creative Solution')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Creative Solution%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'DQA1-0005' OR dc_customer_id = '1')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'DQA1-0005',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Gapstar (DP1-0043) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Gapstar')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Gapstar%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'DP1-0043' OR dc_customer_id = '1')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'DP1-0043',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── TestCompany11 (DDK1-0002) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('TestCompany11')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%TestCompany11%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'DDK1-0002' OR dc_customer_id = '1')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'DDK1-0002',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Virtusa (DQA1-0007) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Virtusa')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Virtusa%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'DQA1-0007' OR dc_customer_id = '1')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'DQA1-0007',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Toyota (DQA1-0009) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Toyota')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Toyota%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'DQA1-0009' OR dc_customer_id = '1')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'DQA1-0009',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Brandix (DQA1-0011) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Brandix')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Brandix%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'DQA1-0011' OR dc_customer_id = '1')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'DQA1-0011',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Softlogic (DQA1-0012) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Softlogic')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Softlogic%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'DQA1-0012' OR dc_customer_id = '1')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'DQA1-0012',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Daraz (DQA1-0013) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Daraz')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Daraz%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'DQA1-0013' OR dc_customer_id = '1')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'DQA1-0013',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Impact Particles (MOOV-0072) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Impact Particles')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Impact Particles%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0072' OR dc_customer_id = '0072')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0072',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Garden Greatness LTD (MOOV-0073) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Garden Greatness LTD')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Garden Greatness LTD%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0073' OR dc_customer_id = '0073')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0073',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Major Brushes Ltd (MOOV-0074) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Major Brushes Ltd')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Major Brushes Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0074' OR dc_customer_id = '0074')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0074',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Ottone Hardware (MOOV-0065) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Ottone Hardware')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Ottone Hardware%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0065' OR dc_customer_id = '0065')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0065',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Europa (Europa) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Europa')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Europa%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'Europa' )
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'Europa',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── TELESONIC (DQA1-0014) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('TELESONIC')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%TELESONIC%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'DQA1-0014' OR dc_customer_id = '1')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'DQA1-0014',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── ALDO (DQA1-0015) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('ALDO')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%ALDO%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'DQA1-0015' OR dc_customer_id = '1')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'DQA1-0015',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Barry AI (Barry AI) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Barry AI')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Barry AI%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'Barry AI' )
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'Barry AI',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── NECTR (MOOV-0075) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('NECTR')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%NECTR%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0075' OR dc_customer_id = '0075')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0075',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Ray Wai-Shing (HOF-0007) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Ray Wai-Shing')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Ray Wai-Shing%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'HOF-0007' OR dc_customer_id = '0007')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'HOF-0007',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Michael Chadburn (HOF-0003) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Michael Chadburn')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Michael Chadburn%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'HOF-0003' OR dc_customer_id = '0003')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'HOF-0003',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── UK Demo (DD2-0002) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('UK Demo')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%UK Demo%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'DD2-0002' OR dc_customer_id = '2')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'DD2-0002',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Ninja UK Production (HOF-0002) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Ninja UK Production')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Ninja UK Production%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'HOF-0002' OR dc_customer_id = '0002')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'HOF-0002',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Prod Chinthaka (HOF-0001) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Prod Chinthaka')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Prod Chinthaka%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'HOF-0001' OR dc_customer_id = '0001')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'HOF-0001',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── EFUTURES1 (DP1-0001) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('EFUTURES1')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%EFUTURES1%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'DP1-0001' OR dc_customer_id = '1')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'DP1-0001',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Moreyeah Foods Ltd (MOOV-0076) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Moreyeah Foods Ltd')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Moreyeah Foods Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0076' OR dc_customer_id = '0076')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0076',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── S Smith & Sons Carpets Ltd (MOOV-0077) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('S Smith & Sons Carpets Ltd')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%S Smith & Sons Carpets Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0077' OR dc_customer_id = '0077')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0077',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── The Railway Shop Ltd (MOOV-0078) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('The Railway Shop Ltd')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%The Railway Shop Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0078' OR dc_customer_id = '0078')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0078',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Pex Ltd (MOOV-0079) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Pex Ltd')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Pex Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0079' OR dc_customer_id = '0079')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0079',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Finger on Pulse Ltd (MOOV-0080) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Finger on Pulse Ltd')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Finger on Pulse Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0080' OR dc_customer_id = '0080')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0080',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Iglu Meal Prep (Iglu Meal Prep) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Iglu Meal Prep')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Iglu Meal Prep%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'Iglu Meal Prep' )
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'Iglu Meal Prep',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Yourbookstore (Yourbookstore) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Yourbookstore')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Yourbookstore%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'Yourbookstore' )
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'Yourbookstore',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Carnivore Cartel Ltd (MOOV-0081) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Carnivore Cartel Ltd')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Carnivore Cartel Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0081' OR dc_customer_id = '0081')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0081',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Igluu Ltd (MOOV-0082) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Igluu Ltd')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Igluu Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0082' OR dc_customer_id = '0082')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0082',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── E-Health Pharmacy Ltd (MOOV-0083) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('E-Health Pharmacy Ltd')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%E-Health Pharmacy Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0083' OR dc_customer_id = '0083')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0083',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Techworknetwork LTD (MOOV-0084) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Techworknetwork LTD')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Techworknetwork LTD%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0084' OR dc_customer_id = '0084')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0084',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Matrix Seating Limited (MOOV-0085) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Matrix Seating Limited')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Matrix Seating Limited%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0085' OR dc_customer_id = '0085')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0085',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── test (DP1-0044) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('test')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%test%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'DP1-0044' OR dc_customer_id = '1')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'DP1-0044',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Test company name (DP1-0045) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Test company name')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Test company name%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'DP1-0045' OR dc_customer_id = '1')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'DP1-0045',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Zesta (DP2-0001) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Zesta')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Zesta%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'DP2-0001' OR dc_customer_id = '2')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'DP2-0001',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── HSBC (DDJ1-0002) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('HSBC')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%HSBC%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'DDJ1-0002' OR dc_customer_id = '1')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'DDJ1-0002',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Danijels Parcels (MOOV-0087) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Danijels Parcels')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Danijels Parcels%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0087' OR dc_customer_id = '0087')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0087',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── TCS Express Worldwide UK Limited (MOOV-0088) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('TCS Express Worldwide UK Limited')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%TCS Express Worldwide UK Limited%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0088' OR dc_customer_id = '0088')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0088',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Clearance Stock Supplies Limited (MOOV-0089) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Clearance Stock Supplies Limited')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Clearance Stock Supplies Limited%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0089' OR dc_customer_id = '0089')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0089',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Octopus (DP1-0046) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Octopus')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Octopus%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'DP1-0046' OR dc_customer_id = '1')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'DP1-0046',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Matt Test (MOOV-0090) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Matt Test')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Matt Test%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0090' OR dc_customer_id = '0090')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0090',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Test company (DQA1-0016) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Test company')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Test company%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'DQA1-0016' OR dc_customer_id = '1')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'DQA1-0016',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Pet Food Online LTD (MOOV-0091) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Pet Food Online LTD')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Pet Food Online LTD%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0091' OR dc_customer_id = '0091')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0091',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Aromina (DDJ1-0003) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Aromina')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Aromina%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'DDJ1-0003' OR dc_customer_id = '1')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'DDJ1-0003',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Paragon Design Joinery Ltd (MOOV-0092) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Paragon Design Joinery Ltd')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Paragon Design Joinery Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0092' OR dc_customer_id = '0092')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0092',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Macchiato Bar Ltd (MOOV-0093) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Macchiato Bar Ltd')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Macchiato Bar Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0093' OR dc_customer_id = '0093')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0093',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Soothe Limited t/a Luxury Skincare Brands (MOOV-0094) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Soothe Limited t/a Luxury Skincare Brands')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Soothe Limited t/a Luxury Skincare Brands%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0094' OR dc_customer_id = '0094')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0094',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── MAD baits supplies Ltd (MOOV-0095) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('MAD baits supplies Ltd')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%MAD baits supplies Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0095' OR dc_customer_id = '0095')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0095',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Sam Scotts Limited (MOOV-0097) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Sam Scotts Limited')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Sam Scotts Limited%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0097' OR dc_customer_id = '0097')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0097',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Crytec Limited (MOOV-0098) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Crytec Limited')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Crytec Limited%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0098' OR dc_customer_id = '0098')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0098',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Hairways (Hair & Beauty) Ltd Site B (MOOV-0099) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Hairways (Hair & Beauty) Ltd Site B')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Hairways (Hair & Beauty) Ltd Site B%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0099' OR dc_customer_id = '0099')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0099',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── WoodUbend Ltd (MOOV-0101) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('WoodUbend Ltd')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%WoodUbend Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0101' OR dc_customer_id = '0101')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0101',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── TMK Trading Ltd t/a Nexus Modelling Supplies (MOOV-0102) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('TMK Trading Ltd t/a Nexus Modelling Supplies')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%TMK Trading Ltd t/a Nexus Modelling Supplies%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0102' OR dc_customer_id = '0102')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0102',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Brexons Workwear (MOOV-0103) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Brexons Workwear')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Brexons Workwear%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0103' OR dc_customer_id = '0103')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0103',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Sing Ko (MOOV-0105) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Sing Ko')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Sing Ko%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0105' OR dc_customer_id = '0105')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0105',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Boori (Europe) LTD (MOOV-0106) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Boori (Europe) LTD')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Boori (Europe) LTD%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0106' OR dc_customer_id = '0106')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0106',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── mike (123-0001) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('mike')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%mike%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = '123-0001' OR dc_customer_id = '123')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = '123-0001',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── sdfdsf (11-2002) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('sdfdsf')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%sdfdsf%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = '11-2002' OR dc_customer_id = '11')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = '11-2002',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── MV (123-0002) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('MV')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%MV%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = '123-0002' OR dc_customer_id = '123')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = '123-0002',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── SYNTAXGENIE (123-0003) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('SYNTAXGENIE')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%SYNTAXGENIE%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = '123-0003' OR dc_customer_id = '123')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = '123-0003',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── sdgsd (123-0004) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('sdgsd')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%sdgsd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = '123-0004' OR dc_customer_id = '123')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = '123-0004',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── cf (11-2001) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('cf')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%cf%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = '11-2001' OR dc_customer_id = '11')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = '11-2001',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Property Documents Ltd (MOOV-0107) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Property Documents Ltd')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Property Documents Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0107' OR dc_customer_id = '0107')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0107',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Accentura (DP1-0047) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Accentura')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Accentura%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'DP1-0047' OR dc_customer_id = '1')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'DP1-0047',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Direct Auto Electrics Ltd (MOOV-0108) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Direct Auto Electrics Ltd')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Direct Auto Electrics Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0108' OR dc_customer_id = '0108')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0108',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Sampath Bank (DDJ1-0004) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Sampath Bank')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Sampath Bank%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'DDJ1-0004' OR dc_customer_id = '1')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'DDJ1-0004',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── W J Jones Ltd T/A Zoar''s Ark (MOOV-0109) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('W J Jones Ltd T/A Zoar''s Ark')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%W J Jones Ltd T/A Zoar''s Ark%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0109' OR dc_customer_id = '0109')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0109',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Raycom Ltd (MOOV-0110) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Raycom Ltd')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Raycom Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0110' OR dc_customer_id = '0110')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0110',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Michael kors (DQA1-0017) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Michael kors')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Michael kors%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'DQA1-0017' OR dc_customer_id = '1')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'DQA1-0017',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Vintsreet (Vintsreet) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Vintsreet')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Vintsreet%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'Vintsreet' )
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'Vintsreet',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Efutures Prod Test Account (DD2-0006) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Efutures Prod Test Account')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Efutures Prod Test Account%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'DD2-0006' OR dc_customer_id = '2')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'DD2-0006',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Redo Commerce (Redo Commerce) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Redo Commerce')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Redo Commerce%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'Redo Commerce' )
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'Redo Commerce',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Empire Printing & Embroidery Ltd (MOOV-0111) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Empire Printing & Embroidery Ltd')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Empire Printing & Embroidery Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0111' OR dc_customer_id = '0111')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0111',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── BARRY CARTER MOTOR PRODUCTS (MOOV-0113) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('BARRY CARTER MOTOR PRODUCTS')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%BARRY CARTER MOTOR PRODUCTS%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0113' OR dc_customer_id = '0113')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0113',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Cranswick (Cranswick) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Cranswick')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Cranswick%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'Cranswick' )
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'Cranswick',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Vint Street Ltd. (MOOV-0114) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Vint Street Ltd.')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Vint Street Ltd.%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0114' OR dc_customer_id = '0114')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0114',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Imagin Products Ltd (MOOV-0115) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Imagin Products Ltd')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Imagin Products Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0115' OR dc_customer_id = '0115')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0115',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Efutures Prod Account Two (DD2-0007) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Efutures Prod Account Two')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Efutures Prod Account Two%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'DD2-0007' OR dc_customer_id = '2')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'DD2-0007',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── EZZTECH (MOOV-0116) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('EZZTECH')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%EZZTECH%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0116' OR dc_customer_id = '0116')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0116',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Tool Hub Ltd (MOOV-0117) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Tool Hub Ltd')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Tool Hub Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0117' OR dc_customer_id = '0117')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0117',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Getplumb Reading Ltd (MOOV-0118) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Getplumb Reading Ltd')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Getplumb Reading Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0118' OR dc_customer_id = '0118')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0118',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Vision Warehouse (MOOV-0112) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Vision Warehouse')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Vision Warehouse%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0112' OR dc_customer_id = '0112')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0112',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── 608 Group Ltd (304 Clothing) (MOOV-0119) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('608 Group Ltd (304 Clothing)')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%608 Group Ltd (304 Clothing)%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0119' OR dc_customer_id = '0119')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0119',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Sky Chemicals (UK) Ltd (MOOV-0120) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Sky Chemicals (UK) Ltd')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Sky Chemicals (UK) Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0120' OR dc_customer_id = '0120')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0120',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Wedcova Uk Ltd (MOOV-0121) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Wedcova Uk Ltd')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Wedcova Uk Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0121' OR dc_customer_id = '0121')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0121',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Fosseway Parcels Ltd (MOOV-0122) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Fosseway Parcels Ltd')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Fosseway Parcels Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0122' OR dc_customer_id = '0122')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0122',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── ARIMAC (DDJ1-0005) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('ARIMAC')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%ARIMAC%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'DDJ1-0005' OR dc_customer_id = '1')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'DDJ1-0005',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── GPG - Getpersonalisedgifts Limited (MOOV-0123) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('GPG - Getpersonalisedgifts Limited')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%GPG - Getpersonalisedgifts Limited%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0123' OR dc_customer_id = '0123')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0123',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Thirsty Soft Drinks (MOOV-0124) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Thirsty Soft Drinks')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Thirsty Soft Drinks%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0124' OR dc_customer_id = '0124')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0124',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Gifts2Impress (MOOV-0125) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Gifts2Impress')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Gifts2Impress%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0125' OR dc_customer_id = '0125')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0125',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Xylo LTD (MOOV-0126) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Xylo LTD')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Xylo LTD%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0126' OR dc_customer_id = '0126')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0126',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── The Saddlery Shop Ltd (MOOV-0127) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('The Saddlery Shop Ltd')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%The Saddlery Shop Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0127' OR dc_customer_id = '0127')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0127',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── EF TEST QA ACCOUNT (DD2-0008) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('EF TEST QA ACCOUNT')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%EF TEST QA ACCOUNT%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'DD2-0008' OR dc_customer_id = '2')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'DD2-0008',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Organax Ltd (MOOV-0128) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Organax Ltd')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Organax Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0128' OR dc_customer_id = '0128')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0128',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Gra Telford LTD (MOOV-0129) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Gra Telford LTD')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Gra Telford LTD%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0129' OR dc_customer_id = '0129')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0129',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Attapattu & Sons (123-0005) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Attapattu & Sons')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Attapattu & Sons%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = '123-0005' OR dc_customer_id = '123')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = '123-0005',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Jayasuriya & Sons (123-0006) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Jayasuriya & Sons')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Jayasuriya & Sons%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = '123-0006' OR dc_customer_id = '123')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = '123-0006',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── The Wall Lighting Company Ltd (MOOV-0130) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('The Wall Lighting Company Ltd')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%The Wall Lighting Company Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0130' OR dc_customer_id = '0130')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0130',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Chilli Seating Ltd (MOOV-0131) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Chilli Seating Ltd')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Chilli Seating Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0131' OR dc_customer_id = '0131')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0131',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── ZARA Company (DDJ1-0006) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('ZARA Company')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%ZARA Company%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'DDJ1-0006' OR dc_customer_id = '1')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'DDJ1-0006',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── N70 (123-0007) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('N70')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%N70%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = '123-0007' OR dc_customer_id = '123')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = '123-0007',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Mahela Co (123-0008) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Mahela Co')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Mahela Co%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = '123-0008' OR dc_customer_id = '123')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = '123-0008',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── David Jones (DP1-0048) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('David Jones')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%David Jones%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'DP1-0048' OR dc_customer_id = '1')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'DP1-0048',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Deshi Delights Ltd (MOOV-0132) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Deshi Delights Ltd')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Deshi Delights Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0132' OR dc_customer_id = '0132')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0132',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── EFUTURES TEST COMPANY (DD2-0009) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('EFUTURES TEST COMPANY')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%EFUTURES TEST COMPANY%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'DD2-0009' OR dc_customer_id = '2')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'DD2-0009',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Bill''s Tool Store Ltd (MOOV-0133) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Bill''s Tool Store Ltd')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Bill''s Tool Store Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0133' OR dc_customer_id = '0133')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0133',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Jaycee Engineering T/A Jaycee Trophies (MOOV-0134) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Jaycee Engineering T/A Jaycee Trophies')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Jaycee Engineering T/A Jaycee Trophies%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0134' OR dc_customer_id = '0134')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0134',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Arden Medical Limited (MOOV-0135) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Arden Medical Limited')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Arden Medical Limited%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0135' OR dc_customer_id = '0135')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0135',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── ORIGINAL SOURCE LIMITED (MOOV-0136) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('ORIGINAL SOURCE LIMITED')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%ORIGINAL SOURCE LIMITED%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0136' OR dc_customer_id = '0136')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0136',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Ransom Publishing Ltd (MOOV-0137) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Ransom Publishing Ltd')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Ransom Publishing Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0137' OR dc_customer_id = '0137')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0137',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Webhook Test (123-0010) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Webhook Test')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Webhook Test%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = '123-0010' OR dc_customer_id = '123')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = '123-0010',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Fortec Trading Ltd t/a Glowtopia (Fortec Trading Ltd t/a Glowtopia) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Fortec Trading Ltd t/a Glowtopia')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Fortec Trading Ltd t/a Glowtopia%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'Fortec Trading Ltd t/a Glowtopia' )
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'Fortec Trading Ltd t/a Glowtopia',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Alpha Cus (123-0011) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Alpha Cus')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Alpha Cus%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = '123-0011' OR dc_customer_id = '123')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = '123-0011',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Beta Cus (123-0012) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Beta Cus')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Beta Cus%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = '123-0012' OR dc_customer_id = '123')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = '123-0012',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Vintstreet (Vintstreet) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Vintstreet')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Vintstreet%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'Vintstreet' )
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'Vintstreet',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Westcare Ltd T/A westcare Supply Zone (MOOV-0138) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Westcare Ltd T/A westcare Supply Zone')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Westcare Ltd T/A westcare Supply Zone%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0138' OR dc_customer_id = '0138')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0138',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Talpa office products ltd (MOOV-0139) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Talpa office products ltd')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Talpa office products ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0139' OR dc_customer_id = '0139')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0139',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── LED Smart Solutions Limited (MOOV-0140) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('LED Smart Solutions Limited')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%LED Smart Solutions Limited%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0140' OR dc_customer_id = '0140')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0140',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── My Company (HOF-0013) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('My Company')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%My Company%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'HOF-0013' OR dc_customer_id = '0013')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'HOF-0013',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── JST Supplies LTD (MOOV-0141) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('JST Supplies LTD')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%JST Supplies LTD%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0141' OR dc_customer_id = '0141')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0141',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Moov Diana Demo (MOOV-0142) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Moov Diana Demo')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Moov Diana Demo%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0142' OR dc_customer_id = '0142')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0142',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── OliArt Wood LTD (MOOV-0143) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('OliArt Wood LTD')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%OliArt Wood LTD%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0143' OR dc_customer_id = '0143')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0143',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Bessette LTD (MOOV-0144) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Bessette LTD')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Bessette LTD%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0144' OR dc_customer_id = '0144')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0144',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── NDB (DDJ1-0007) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('NDB')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%NDB%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'DDJ1-0007' OR dc_customer_id = '1')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'DDJ1-0007',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── CONTEXT PNEUMATIC SUPPLIES LIMITED (MOOV-0145) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('CONTEXT PNEUMATIC SUPPLIES LIMITED')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%CONTEXT PNEUMATIC SUPPLIES LIMITED%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0145' OR dc_customer_id = '0145')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0145',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Bentley and Bo Interiors Ltd (MOOV-0146) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Bentley and Bo Interiors Ltd')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Bentley and Bo Interiors Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0146' OR dc_customer_id = '0146')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0146',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── SME IT Solutions Limited (MOOV-0147) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('SME IT Solutions Limited')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%SME IT Solutions Limited%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0147' OR dc_customer_id = '0147')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0147',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── EFUTURES SMOKE TEST CUSTOMER (MOOV-0148) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('EFUTURES SMOKE TEST CUSTOMER')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%EFUTURES SMOKE TEST CUSTOMER%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0148' OR dc_customer_id = '0148')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0148',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Buffalo Systems Ltd (MOOV-0149) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Buffalo Systems Ltd')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Buffalo Systems Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0149' OR dc_customer_id = '0149')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0149',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── East London Packaging Supplies Ltd (MOOV-0150) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('East London Packaging Supplies Ltd')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%East London Packaging Supplies Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0150' OR dc_customer_id = '0150')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0150',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Metal Polishing Supplies Ltd (MOOV-0151) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Metal Polishing Supplies Ltd')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Metal Polishing Supplies Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0151' OR dc_customer_id = '0151')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0151',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Spokz Ltd (MOOV-0152) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Spokz Ltd')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Spokz Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0152' OR dc_customer_id = '0152')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0152',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Youtheory (123-0013) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Youtheory')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Youtheory%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = '123-0013' OR dc_customer_id = '123')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = '123-0013',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── M. Criscuolo & Co Ltd (MOOV-0153) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('M. Criscuolo & Co Ltd')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%M. Criscuolo & Co Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0153' OR dc_customer_id = '0153')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0153',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Kettles Pottery Supplies Ltd (MOOV-0154) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Kettles Pottery Supplies Ltd')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Kettles Pottery Supplies Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0154' OR dc_customer_id = '0154')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0154',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── East Coast Creations Ltd (MOOV-0155) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('East Coast Creations Ltd')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%East Coast Creations Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0155' OR dc_customer_id = '0155')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0155',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── ETA Solutions Limited (MOOV-0156) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('ETA Solutions Limited')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%ETA Solutions Limited%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0156' OR dc_customer_id = '0156')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0156',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Security Trade Products Ltd (MOOV-0157) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Security Trade Products Ltd')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Security Trade Products Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0157' OR dc_customer_id = '0157')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0157',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Sarratt Online Ltd (MOOV-0158) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Sarratt Online Ltd')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Sarratt Online Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0158' OR dc_customer_id = '0158')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0158',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Agar Hygiene Ltd (MOOV-0159) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Agar Hygiene Ltd')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Agar Hygiene Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0159' OR dc_customer_id = '0159')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0159',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Lesser Spotted Images Ltd (MOOV-0160) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Lesser Spotted Images Ltd')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Lesser Spotted Images Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0160' OR dc_customer_id = '0160')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0160',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Just Cable Ties (MOOV-0161) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Just Cable Ties')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Just Cable Ties%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0161' OR dc_customer_id = '0161')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0161',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Work and Wear Direct Ltd (Work and Wear Direct Ltd) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Work and Wear Direct Ltd')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Work and Wear Direct Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'Work and Wear Direct Ltd' )
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'Work and Wear Direct Ltd',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Exhale Boutique (Exhale Boutique) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Exhale Boutique')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Exhale Boutique%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'Exhale Boutique' )
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'Exhale Boutique',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Southdown Abrasives & Ind Chemicals Ltd (MOOV-0162) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Southdown Abrasives & Ind Chemicals Ltd')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Southdown Abrasives & Ind Chemicals Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0162' OR dc_customer_id = '0162')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0162',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Tackl (Tackl) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Tackl')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Tackl%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'Tackl' )
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'Tackl',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Auto Test (Auto) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Auto Test')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Auto Test%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'Auto' )
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'Auto',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── HPSA Ltd (MOOV-0163) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('HPSA Ltd')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%HPSA Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0163' OR dc_customer_id = '0163')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0163',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── ceravi (DP1-0051) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('ceravi')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%ceravi%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'DP1-0051' OR dc_customer_id = '1')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'DP1-0051',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── PWS Leeds Ltd (MOOV-0164) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('PWS Leeds Ltd')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%PWS Leeds Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0164' OR dc_customer_id = '0164')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0164',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Total Insignia Ltd (MOOV-0165) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Total Insignia Ltd')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Total Insignia Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0165' OR dc_customer_id = '0165')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0165',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── USER (EFD1-0004) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('USER')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%USER%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'EFD1-0004' OR dc_customer_id = '1')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'EFD1-0004',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── The Wild Meat Company ltd (MOOV-0166) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('The Wild Meat Company ltd')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%The Wild Meat Company ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0166' OR dc_customer_id = '0166')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0166',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Grace Test Account (MOOV-0167) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Grace Test Account')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Grace Test Account%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0167' OR dc_customer_id = '0167')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0167',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Bob AI (MOOV-0168) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Bob AI')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Bob AI%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0168' OR dc_customer_id = '0168')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0168',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Xplore Brands (MOOV-0169) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Xplore Brands')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Xplore Brands%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0169' OR dc_customer_id = '0169')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0169',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Medicube (DQA1-0018) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Medicube')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Medicube%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'DQA1-0018' OR dc_customer_id = '1')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'DQA1-0018',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Sherwood Wholesale Foods Ltd (MOOV-0170) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Sherwood Wholesale Foods Ltd')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Sherwood Wholesale Foods Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0170' OR dc_customer_id = '0170')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0170',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── 2023 (QDP1-0001) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('2023')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%2023%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'QDP1-0001' OR dc_customer_id = '1')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'QDP1-0001',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── PROD EF COMPANY (TDP1-0001) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('PROD EF COMPANY')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%PROD EF COMPANY%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'TDP1-0001' OR dc_customer_id = '1')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'TDP1-0001',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── EF (DE22-0009) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('EF')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%EF%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'DE22-0009' OR dc_customer_id = '22')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'DE22-0009',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── NNU (DE22-0011) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('NNU')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%NNU%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'DE22-0011' OR dc_customer_id = '22')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'DE22-0011',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Non Ninja Company (QDP1-0003) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Non Ninja Company')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Non Ninja Company%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'QDP1-0003' OR dc_customer_id = '1')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'QDP1-0003',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Test Ninja company (DP1-0053) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Test Ninja company')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Test Ninja company%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'DP1-0053' OR dc_customer_id = '1')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'DP1-0053',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Efutures Non Ninja company (DE22-0015) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Efutures Non Ninja company')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Efutures Non Ninja company%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'DE22-0015' OR dc_customer_id = '22')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'DE22-0015',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── EFUTURES TEST PORD NINJA COMPANY (TDP1-0005) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('EFUTURES TEST PORD NINJA COMPANY')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%EFUTURES TEST PORD NINJA COMPANY%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'TDP1-0005' OR dc_customer_id = '1')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'TDP1-0005',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Test Efutures Non Ninja comp (TDP1-0007) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Test Efutures Non Ninja comp')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Test Efutures Non Ninja comp%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'TDP1-0007' OR dc_customer_id = '1')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'TDP1-0007',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Jamie Ferments Limited (MOOV-0171) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Jamie Ferments Limited')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Jamie Ferments Limited%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0171' OR dc_customer_id = '0171')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0171',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Jezaya UK Limited (MOOV-0172) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Jezaya UK Limited')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Jezaya UK Limited%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0172' OR dc_customer_id = '0172')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0172',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Wine Buffs Ltd (MOOV-0173) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Wine Buffs Ltd')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Wine Buffs Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0173' OR dc_customer_id = '0173')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0173',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Doran Packaging Ltd (MOOV-0174) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Doran Packaging Ltd')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Doran Packaging Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0174' OR dc_customer_id = '0174')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0174',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Purozo Limited (MOOV-0175) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Purozo Limited')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Purozo Limited%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0175' OR dc_customer_id = '0175')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0175',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── My Shadow Ltd (MOOV-0177) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('My Shadow Ltd')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%My Shadow Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0177' OR dc_customer_id = '0177')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0177',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── U-Telecom Ltd (MOOV-0178) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('U-Telecom Ltd')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%U-Telecom Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0178' OR dc_customer_id = '0178')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0178',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Mala Leather (MOOV-0179) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Mala Leather')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Mala Leather%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0179' OR dc_customer_id = '0179')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0179',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── CT Inc (DP1-0003) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('CT Inc')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%CT Inc%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'DP1-0003' OR dc_customer_id = '1')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'DP1-0003',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Golf and Baby Limited (MOOV-0180) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Golf and Baby Limited')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Golf and Baby Limited%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0180' OR dc_customer_id = '0180')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0180',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── IMEX China Trade Ltd (MOOV-0181) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('IMEX China Trade Ltd')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%IMEX China Trade Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0181' OR dc_customer_id = '0181')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0181',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Tanalia Ltd (MOOV-0182) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Tanalia Ltd')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Tanalia Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0182' OR dc_customer_id = '0182')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0182',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Saturn Display Ltd (MOOV-0183) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Saturn Display Ltd')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Saturn Display Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0183' OR dc_customer_id = '0183')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0183',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Fun Stickers Ltd (MOOV-0184) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Fun Stickers Ltd')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Fun Stickers Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0184' OR dc_customer_id = '0184')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0184',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Perex Group Ltd (MOOV-0185) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Perex Group Ltd')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Perex Group Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0185' OR dc_customer_id = '0185')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0185',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── TT Proturf Ltd (MOOV-0186) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('TT Proturf Ltd')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%TT Proturf Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0186' OR dc_customer_id = '0186')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0186',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Decorative Gardens Ltd (MOOV-0187) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Decorative Gardens Ltd')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Decorative Gardens Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0187' OR dc_customer_id = '0187')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0187',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Isoclean Ltd (MOOV-0188) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Isoclean Ltd')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Isoclean Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0188' OR dc_customer_id = '0188')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0188',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── C Com (DP1-0054) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('C Com')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%C Com%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'DP1-0054' OR dc_customer_id = '1')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'DP1-0054',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Bodri Ltd (MOOV-0189) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Bodri Ltd')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Bodri Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0189' OR dc_customer_id = '0189')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0189',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── 1st Class Uniforms & Workwear Ltd (MOOV-0190) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('1st Class Uniforms & Workwear Ltd')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%1st Class Uniforms & Workwear Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0190' OR dc_customer_id = '0190')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0190',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Carp Junky (MOOV-0191) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Carp Junky')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Carp Junky%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0191' OR dc_customer_id = '0191')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0191',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Mackemshop Ltd (MOOV-0192) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Mackemshop Ltd')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Mackemshop Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0192' OR dc_customer_id = '0192')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0192',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Test company CHN (TDP1-0009) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Test company CHN')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Test company CHN%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'TDP1-0009' OR dc_customer_id = '1')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'TDP1-0009',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── UK Wedding Favours Ltd (MOOV-0193) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('UK Wedding Favours Ltd')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%UK Wedding Favours Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0193' OR dc_customer_id = '0193')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0193',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Pure Crimson Design Limited (MOOV-0194) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Pure Crimson Design Limited')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Pure Crimson Design Limited%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0194' OR dc_customer_id = '0194')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0194',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── ID Dance school sport & leisure wear limited (MOOV-0195) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('ID Dance school sport & leisure wear limited')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%ID Dance school sport & leisure wear limited%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0195' OR dc_customer_id = '0195')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0195',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Smilax Ltd (MOOV-0196) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Smilax Ltd')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Smilax Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0196' OR dc_customer_id = '0196')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0196',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Slumba London (MOOV-0197) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Slumba London')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Slumba London%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0197' OR dc_customer_id = '0197')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0197',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Amba Hydraulics Ltd (MOOV-0198) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Amba Hydraulics Ltd')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Amba Hydraulics Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0198' OR dc_customer_id = '0198')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0198',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Ayurvedic Nature Care Ltd (MOOV-0199) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Ayurvedic Nature Care Ltd')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Ayurvedic Nature Care Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0199' OR dc_customer_id = '0199')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0199',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Chopra Brothers Intl Group Ltd (MOOV-0200) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Chopra Brothers Intl Group Ltd')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Chopra Brothers Intl Group Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0200' OR dc_customer_id = '0200')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0200',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Sofa Scene Ltd (MOOV-0201) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Sofa Scene Ltd')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Sofa Scene Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0201' OR dc_customer_id = '0201')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0201',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Metal Work Supplies Ltd (MOOV-0202) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Metal Work Supplies Ltd')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Metal Work Supplies Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0202' OR dc_customer_id = '0202')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0202',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Meilleure Decor Ltd (MOOV-0203) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Meilleure Decor Ltd')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Meilleure Decor Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0203' OR dc_customer_id = '0203')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0203',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Taunton Trailers (MOOV-0204) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Taunton Trailers')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Taunton Trailers%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0204' OR dc_customer_id = '0204')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0204',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Kitloop (Kitloop) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Kitloop')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Kitloop%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'Kitloop' )
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'Kitloop',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Frith Holdings Ltd (MOOV-0205) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Frith Holdings Ltd')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Frith Holdings Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0205' OR dc_customer_id = '0205')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0205',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── 24Up Ltd (MOOV-0206) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('24Up Ltd')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%24Up Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0206' OR dc_customer_id = '0206')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0206',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Scarlet Ltd (MOOV-0207) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Scarlet Ltd')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Scarlet Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0207' OR dc_customer_id = '0207')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0207',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── J Adams Ltd (MOOV-0208) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('J Adams Ltd')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%J Adams Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0208' OR dc_customer_id = '0208')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0208',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Scarlet Ltd (Scarlet Ltd) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Scarlet Ltd')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Scarlet Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'Scarlet Ltd' )
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'Scarlet Ltd',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Wolf Cycles Limited (MOOV-0209) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Wolf Cycles Limited')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Wolf Cycles Limited%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0209' OR dc_customer_id = '0209')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0209',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Hilltop Boarding Kennels and Cat Hotel Ltd (MOOV-0210) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Hilltop Boarding Kennels and Cat Hotel Ltd')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Hilltop Boarding Kennels and Cat Hotel Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0210' OR dc_customer_id = '0210')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0210',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Tam Demo Account (MOOV-0211) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Tam Demo Account')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Tam Demo Account%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0211' OR dc_customer_id = '0211')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0211',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Truck Cranes Ltd (MOOV-0212) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Truck Cranes Ltd')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Truck Cranes Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0212' OR dc_customer_id = '0212')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0212',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Simple Camper Vans Limited (MOOV-0213) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Simple Camper Vans Limited')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Simple Camper Vans Limited%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0213' OR dc_customer_id = '0213')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0213',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Direct Imaging Supplies Limited (MOOV-0214) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Direct Imaging Supplies Limited')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Direct Imaging Supplies Limited%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0214' OR dc_customer_id = '0214')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0214',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Bodies-in-Motion Dancewear (MOOV-0215) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Bodies-in-Motion Dancewear')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Bodies-in-Motion Dancewear%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0215' OR dc_customer_id = '0215')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0215',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Marvellous Mushrooms (MOOV-0216) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Marvellous Mushrooms')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Marvellous Mushrooms%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0216' OR dc_customer_id = '0216')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0216',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Blaze''s Bistro (MOOV-0217) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Blaze''s Bistro')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Blaze''s Bistro%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0217' OR dc_customer_id = '0217')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0217',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Triumph Dorset Ltd (MOOV-0218) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Triumph Dorset Ltd')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Triumph Dorset Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0218' OR dc_customer_id = '0218')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0218',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Cold Case Investigation Unit (MOOV-0219) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Cold Case Investigation Unit')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Cold Case Investigation Unit%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0219' OR dc_customer_id = '0219')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0219',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── WPC Supplies Ltd (MOOV-0220) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('WPC Supplies Ltd')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%WPC Supplies Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0220' OR dc_customer_id = '0220')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0220',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── IOI Trading Ltd (MOOV-0221) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('IOI Trading Ltd')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%IOI Trading Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0221' OR dc_customer_id = '0221')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0221',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Trembling Madness Ltd (MOOV-0222) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Trembling Madness Ltd')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Trembling Madness Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0222' OR dc_customer_id = '0222')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0222',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Ashley House Printing Co Ltd (MOOV-0224) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Ashley House Printing Co Ltd')
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Ashley House Printing Co Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0224' OR dc_customer_id = '0224')
      AND id != v_cust_id;

    -- Update the matching customer with exact DC ID
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0224',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

END $$;
