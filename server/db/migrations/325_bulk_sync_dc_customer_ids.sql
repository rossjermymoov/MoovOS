-- Migration 325: Update Despatch Cloud Customer IDs for Existing Customers Only
-- STRICTLY UPDATE ONLY — No new customer records created.

DO $$
DECLARE
  v_cust_id UUID;
BEGIN

  -- ── Developer Testing (1) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Developer Testing')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Developer Testing'))
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

    UPDATE customers 
    SET dc_customer_id = '1',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Developer Testing', '1', '1'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Cloud 9 Fulfilment (Cloud9) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Cloud 9 Fulfilment')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Cloud 9 Fulfilment'))
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

    UPDATE customers 
    SET dc_customer_id = 'Cloud9',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Cloud 9 Fulfilment', 'Cloud9', '9'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── WXM - Greenplant UK Ltd (WXM-0004) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('WXM - Greenplant UK Ltd')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('WXM - Greenplant UK Ltd'))
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

    UPDATE customers 
    SET dc_customer_id = 'WXM-0004',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['WXM - Greenplant UK Ltd', 'WXM-0004', '0004', '4'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── WXM - Projekt Indigo Studio Ltd (WXM-0005) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('WXM - Projekt Indigo Studio Ltd')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('WXM - Projekt Indigo Studio Ltd'))
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

    UPDATE customers 
    SET dc_customer_id = 'WXM-0005',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['WXM - Projekt Indigo Studio Ltd', 'WXM-0005', '0005', '5'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Floship-Returns (FLOSHIP) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Floship-Returns')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Floship-Returns'))
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

    UPDATE customers 
    SET dc_customer_id = 'FLOSHIP',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Floship-Returns', 'FLOSHIP'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Keells (DP1-0201) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Keells')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Keells'))
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

    UPDATE customers 
    SET dc_customer_id = 'DP1-0201',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Keells', 'DP1-0201', '1'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── MoreHustl (HOF-0031) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('MoreHustl')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('MoreHustl'))
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

    UPDATE customers 
    SET dc_customer_id = 'HOF-0031',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['MoreHustl', 'HOF-0031', '0031', '31'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Suresh Deepal Herath 12 (Dep2-0006) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Suresh Deepal Herath 12')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Suresh Deepal Herath 12'))
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

    UPDATE customers 
    SET dc_customer_id = 'Dep2-0006',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Suresh Deepal Herath 12', 'Dep2-0006', '2'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── The Chosen Baller LLC (001-0002) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('The Chosen Baller LLC')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('The Chosen Baller LLC'))
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

    UPDATE customers 
    SET dc_customer_id = '001-0002',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['The Chosen Baller LLC', '001-0002', '001', '1'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── SND Electrical (HOF-0054) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('SND Electrical')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('SND Electrical'))
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

    UPDATE customers 
    SET dc_customer_id = 'HOF-0054',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['SND Electrical', 'HOF-0054', '0054', '54'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── E & L Trading Ltd (HOF-0055) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('E & L Trading Ltd')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('E & L Trading Ltd'))
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

    UPDATE customers 
    SET dc_customer_id = 'HOF-0055',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['E & L Trading Ltd', 'HOF-0055', '0055', '55'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Britalitez Limited (HOF-0056) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Britalitez Limited')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Britalitez Limited'))
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

    UPDATE customers 
    SET dc_customer_id = 'HOF-0056',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Britalitez Limited', 'HOF-0056', '0056', '56'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Moov Prod Admin two (DD2-0003) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Moov Prod Admin two')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Moov Prod Admin two'))
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

    UPDATE customers 
    SET dc_customer_id = 'DD2-0003',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Moov Prod Admin two', 'DD2-0003', '2'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Danny Snelson (HOF-0008) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Danny Snelson')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Danny Snelson'))
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

    UPDATE customers 
    SET dc_customer_id = 'HOF-0008',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Danny Snelson', 'HOF-0008', '0008', '8'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Spare and Square (HOF-GONE) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Spare and Square')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Spare and Square'))
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

    UPDATE customers 
    SET dc_customer_id = 'HOF-GONE',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Spare and Square', 'HOF-GONE'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Crystal Nails (HOF-0009) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Crystal Nails')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Crystal Nails'))
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

    UPDATE customers 
    SET dc_customer_id = 'HOF-0009',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Crystal Nails', 'HOF-0009', '0009', '9'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Fight Outlet (HOF-0010) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Fight Outlet')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Fight Outlet'))
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

    UPDATE customers 
    SET dc_customer_id = 'HOF-0010',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Fight Outlet', 'HOF-0010', '0010', '10'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Prophecy Cricket Ltd (HOF-0011) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Prophecy Cricket Ltd')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Prophecy Cricket Ltd'))
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

    UPDATE customers 
    SET dc_customer_id = 'HOF-0011',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Prophecy Cricket Ltd', 'HOF-0011', '0011', '11'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Seedball Limited (HOF-0012) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Seedball Limited')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Seedball Limited'))
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

    UPDATE customers 
    SET dc_customer_id = 'HOF-0012',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Seedball Limited', 'HOF-0012', '0012', '12'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Saloos Ltd (MOOV-0002) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Saloos Ltd')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Saloos Ltd'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0002',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Saloos Ltd', 'MOOV-0002', '0002', '2'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── MP Homewares Ltd (MOOV-0003) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('MP Homewares Ltd')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('MP Homewares Ltd'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0003',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['MP Homewares Ltd', 'MOOV-0003', '0003', '3'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── I Luv Designer (MOOV-0004) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('I Luv Designer')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('I Luv Designer'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0004',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['I Luv Designer', 'MOOV-0004', '0004', '4'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── 3 Devices Ltd (MOOV-0005) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('3 Devices Ltd')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('3 Devices Ltd'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0005',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['3 Devices Ltd', 'MOOV-0005', '0005', '5'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── EF TEST CUSTOMER QA EIGHT (DF1-0004) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('EF TEST CUSTOMER QA EIGHT')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('EF TEST CUSTOMER QA EIGHT'))
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

    UPDATE customers 
    SET dc_customer_id = 'DF1-0004',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['EF TEST CUSTOMER QA EIGHT', 'DF1-0004', '1'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Yayo Familia Ltd (MOOV-0006) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Yayo Familia Ltd')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Yayo Familia Ltd'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0006',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Yayo Familia Ltd', 'MOOV-0006', '0006', '6'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Capatex Limited (MOOV-0007) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Capatex Limited')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Capatex Limited'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0007',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Capatex Limited', 'MOOV-0007', '0007', '7'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Trident Pumps (MOOV-0008) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Trident Pumps')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Trident Pumps'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0008',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Trident Pumps', 'MOOV-0008', '0008', '8'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Tribal Society (MOOV-0009) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Tribal Society')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Tribal Society'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0009',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Tribal Society', 'MOOV-0009', '0009', '9'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Millvill Industrial Supplies Ltd (MOOV-0010) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Millvill Industrial Supplies Ltd')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Millvill Industrial Supplies Ltd'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0010',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Millvill Industrial Supplies Ltd', 'MOOV-0010', '0010', '10'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── B2B Workwear & Janitorial Ltd (MOOV-0011) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('B2B Workwear & Janitorial Ltd')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('B2B Workwear & Janitorial Ltd'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0011',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['B2B Workwear & Janitorial Ltd', 'MOOV-0011', '0011', '11'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Britalitez Ltd (MOOV-0012) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Britalitez Ltd')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Britalitez Ltd'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0012',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Britalitez Ltd', 'MOOV-0012', '0012', '12'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Code Nine UK Ltd (MOOV-0013) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Code Nine UK Ltd')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Code Nine UK Ltd'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0013',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Code Nine UK Ltd', 'MOOV-0013', '0013', '13'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Edmunson Electrical Leeds (MOOV-0014) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Edmunson Electrical Leeds')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Edmunson Electrical Leeds'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0014',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Edmunson Electrical Leeds', 'MOOV-0014', '0014', '14'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Green Footprint Services Ltd (MOOV-0015) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Green Footprint Services Ltd')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Green Footprint Services Ltd'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0015',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Green Footprint Services Ltd', 'MOOV-0015', '0015', '15'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── EF QA CUSTOMER HS (DP1-0011) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('EF QA CUSTOMER HS')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('EF QA CUSTOMER HS'))
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

    UPDATE customers 
    SET dc_customer_id = 'DP1-0011',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['EF QA CUSTOMER HS', 'DP1-0011', '1'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── hjko (1233-0001) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('hjko')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('hjko'))
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

    UPDATE customers 
    SET dc_customer_id = '1233-0001',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['hjko', '1233-0001', '1233'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── qwerty (DF1-0007) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('qwerty')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('qwerty'))
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

    UPDATE customers 
    SET dc_customer_id = 'DF1-0007',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['qwerty', 'DF1-0007', '1'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Norfolk Saw Services (MOOV-0016) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Norfolk Saw Services')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Norfolk Saw Services'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0016',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Norfolk Saw Services', 'MOOV-0016', '0016', '16'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Rilco Electrical Supplies (MOOV-0017) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Rilco Electrical Supplies')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Rilco Electrical Supplies'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0017',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Rilco Electrical Supplies', 'MOOV-0017', '0017', '17'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── asdfg (DF1-0008) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('asdfg')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('asdfg'))
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

    UPDATE customers 
    SET dc_customer_id = 'DF1-0008',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['asdfg', 'DF1-0008', '1'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Passion Accessories Ltd (MOOV-0018) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Passion Accessories Ltd')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Passion Accessories Ltd'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0018',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Passion Accessories Ltd', 'MOOV-0018', '0018', '18'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Spare and Square Ltd (MOOV-0019) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Spare and Square Ltd')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Spare and Square Ltd'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0019',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Spare and Square Ltd', 'MOOV-0019', '0019', '19'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── nnmm (DF1-0009) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('nnmm')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('nnmm'))
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

    UPDATE customers 
    SET dc_customer_id = 'DF1-0009',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['nnmm', 'DF1-0009', '1'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── check (1233-0002) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('check')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('check'))
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

    UPDATE customers 
    SET dc_customer_id = '1233-0002',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['check', '1233-0002', '1233'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── SND ELECTRICAL WHOLESALERS (UK) LTD (MOOV-0020) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('SND ELECTRICAL WHOLESALERS (UK) LTD')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('SND ELECTRICAL WHOLESALERS (UK) LTD'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0020',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['SND ELECTRICAL WHOLESALERS (UK) LTD', 'MOOV-0020', '0020', '20'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Efutures (DP1-0014) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Efutures')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Efutures'))
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

    UPDATE customers 
    SET dc_customer_id = 'DP1-0014',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Efutures', 'DP1-0014', '1'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Lifemax Limited (MOOV-0021) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Lifemax Limited')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Lifemax Limited'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0021',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Lifemax Limited', 'MOOV-0021', '0021', '21'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── IFS (DD2-0005) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('IFS')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('IFS'))
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

    UPDATE customers 
    SET dc_customer_id = 'DD2-0005',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['IFS', 'DD2-0005', '2'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── M and J Brothers Ltd (MOOV-0022) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('M and J Brothers Ltd')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('M and J Brothers Ltd'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0022',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['M and J Brothers Ltd', 'MOOV-0022', '0022', '22'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Beacons and Lightbars (MOOV-0023) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Beacons and Lightbars')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Beacons and Lightbars'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0023',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Beacons and Lightbars', 'MOOV-0023', '0023', '23'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── DDUP International Ltd (MOOV-0024) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('DDUP International Ltd')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('DDUP International Ltd'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0024',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['DDUP International Ltd', 'MOOV-0024', '0024', '24'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Granola Kitchen Ltd (MOOV-0025) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Granola Kitchen Ltd')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Granola Kitchen Ltd'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0025',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Granola Kitchen Ltd', 'MOOV-0025', '0025', '25'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Pet & Grooming Supplies Ltd (MOOV-0026) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Pet & Grooming Supplies Ltd')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Pet & Grooming Supplies Ltd'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0026',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Pet & Grooming Supplies Ltd', 'MOOV-0026', '0026', '26'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── SRR3 (DF1-0010) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('SRR3')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('SRR3'))
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

    UPDATE customers 
    SET dc_customer_id = 'DF1-0010',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['SRR3', 'DF1-0010', '1'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Uni4mers (Uni4mers) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Uni4mers')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Uni4mers'))
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

    UPDATE customers 
    SET dc_customer_id = 'Uni4mers',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Uni4mers', 'Uni4mers', '4'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Efutures4 (DP1-0016) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Efutures4')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Efutures4'))
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

    UPDATE customers 
    SET dc_customer_id = 'DP1-0016',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Efutures4', 'DP1-0016', '1'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── EFtures5 (DP1-0017) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('EFtures5')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('EFtures5'))
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

    UPDATE customers 
    SET dc_customer_id = 'DP1-0017',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['EFtures5', 'DP1-0017', '1'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Sharkeye Wheel Aligners UK Ltd (MOOV-0027) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Sharkeye Wheel Aligners UK Ltd')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Sharkeye Wheel Aligners UK Ltd'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0027',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Sharkeye Wheel Aligners UK Ltd', 'MOOV-0027', '0027', '27'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Efutures5 (DDJ1-0001) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Efutures5')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Efutures5'))
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

    UPDATE customers 
    SET dc_customer_id = 'DDJ1-0001',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Efutures5', 'DDJ1-0001', '1'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── The Hanger Store (MOOV-0028) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('The Hanger Store')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('The Hanger Store'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0028',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['The Hanger Store', 'MOOV-0028', '0028', '28'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── How High Brands (MOOV-0029) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('How High Brands')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('How High Brands'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0029',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['How High Brands', 'MOOV-0029', '0029', '29'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── SQA (DP1-0019) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('SQA')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('SQA'))
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

    UPDATE customers 
    SET dc_customer_id = 'DP1-0019',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['SQA', 'DP1-0019', '1'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── SINGER (DP1-0021) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('SINGER')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('SINGER'))
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

    UPDATE customers 
    SET dc_customer_id = 'DP1-0021',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['SINGER', 'DP1-0021', '1'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Greenplant UK Ltd (MOOV-0030) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Greenplant UK Ltd')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Greenplant UK Ltd'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0030',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Greenplant UK Ltd', 'MOOV-0030', '0030', '30'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Assetee (DP1-0024) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Assetee')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Assetee'))
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

    UPDATE customers 
    SET dc_customer_id = 'DP1-0024',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Assetee', 'DP1-0024', '1'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Mobberley Cakes Ltd (MOOV-0031) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Mobberley Cakes Ltd')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Mobberley Cakes Ltd'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0031',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Mobberley Cakes Ltd', 'MOOV-0031', '0031', '31'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Ecom Group UK Limited (MOOV-0032) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Ecom Group UK Limited')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Ecom Group UK Limited'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0032',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Ecom Group UK Limited', 'MOOV-0032', '0032', '32'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Heaven Scent Incense Ltd (MOOV-0033) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Heaven Scent Incense Ltd')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Heaven Scent Incense Ltd'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0033',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Heaven Scent Incense Ltd', 'MOOV-0033', '0033', '33'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── EFUTURES6 (DP1-0025) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('EFUTURES6')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('EFUTURES6'))
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

    UPDATE customers 
    SET dc_customer_id = 'DP1-0025',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['EFUTURES6', 'DP1-0025', '1'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── AJP1 (AJP1) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('AJP1')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('AJP1'))
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

    UPDATE customers 
    SET dc_customer_id = 'AJP1',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['AJP1', 'AJP1', '1'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── AJP2 (AJP2) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('AJP2')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('AJP2'))
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

    UPDATE customers 
    SET dc_customer_id = 'AJP2',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['AJP2', 'AJP2', '2'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── AJP3 (AJP3) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('AJP3')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('AJP3'))
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

    UPDATE customers 
    SET dc_customer_id = 'AJP3',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['AJP3', 'AJP3', '3'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── AJP4 (AJP4) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('AJP4')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('AJP4'))
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

    UPDATE customers 
    SET dc_customer_id = 'AJP4',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['AJP4', 'AJP4', '4'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── AJP5 (AJP5) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('AJP5')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('AJP5'))
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

    UPDATE customers 
    SET dc_customer_id = 'AJP5',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['AJP5', 'AJP5', '5'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Info Technology Supply (MOOV-0034) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Info Technology Supply')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Info Technology Supply'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0034',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Info Technology Supply', 'MOOV-0034', '0034', '34'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── 99X (DP1-0027) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('99X')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('99X'))
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

    UPDATE customers 
    SET dc_customer_id = 'DP1-0027',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['99X', 'DP1-0027', '1'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Aegean Sea Ltd (MOOV-0035) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Aegean Sea Ltd')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Aegean Sea Ltd'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0035',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Aegean Sea Ltd', 'MOOV-0035', '0035', '35'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── LB Finance (DP1-0028) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('LB Finance')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('LB Finance'))
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

    UPDATE customers 
    SET dc_customer_id = 'DP1-0028',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['LB Finance', 'DP1-0028', '1'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── DM AGENCY AND DISTRIBUTION (MOOV-0036) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('DM AGENCY AND DISTRIBUTION')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('DM AGENCY AND DISTRIBUTION'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0036',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['DM AGENCY AND DISTRIBUTION', 'MOOV-0036', '0036', '36'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── DDPL (DDPL) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('DDPL')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('DDPL'))
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

    UPDATE customers 
    SET dc_customer_id = 'DDPL',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['DDPL', 'DDPL'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Aglory MERCHANT ENTERPRISES LIMITED (Aglory MERCHANT ENTERPRISES LIMITED) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Aglory MERCHANT ENTERPRISES LIMITED')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Aglory MERCHANT ENTERPRISES LIMITED'))
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

    UPDATE customers 
    SET dc_customer_id = 'Aglory MERCHANT ENTERPRISES LIMITED',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Aglory MERCHANT ENTERPRISES LIMITED', 'Aglory MERCHANT ENTERPRISES LIMITED'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── HCL (DP1-0029) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('HCL')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('HCL'))
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

    UPDATE customers 
    SET dc_customer_id = 'DP1-0029',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['HCL', 'DP1-0029', '1'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── NEXT (DP1-0030) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('NEXT')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('NEXT'))
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

    UPDATE customers 
    SET dc_customer_id = 'DP1-0030',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['NEXT', 'DP1-0030', '1'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── E Square (E Square) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('E Square')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('E Square'))
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

    UPDATE customers 
    SET dc_customer_id = 'E Square',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['E Square', 'E Square'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Natural Spa Supplies Ltd (MOOV-0037) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Natural Spa Supplies Ltd')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Natural Spa Supplies Ltd'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0037',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Natural Spa Supplies Ltd', 'MOOV-0037', '0037', '37'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── JOY ASIAN FOOD & GROCERY LIMITED (MOOV-0038) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('JOY ASIAN FOOD & GROCERY LIMITED')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('JOY ASIAN FOOD & GROCERY LIMITED'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0038',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['JOY ASIAN FOOD & GROCERY LIMITED', 'MOOV-0038', '0038', '38'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Bakers Street Limited (MOOV-0039) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Bakers Street Limited')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Bakers Street Limited'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0039',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Bakers Street Limited', 'MOOV-0039', '0039', '39'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── 8ack (8ack) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('8ack')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('8ack'))
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

    UPDATE customers 
    SET dc_customer_id = '8ack',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['8ack', '8ack', '8'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Jane Scott Ceramics (MOOV-0040) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Jane Scott Ceramics')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Jane Scott Ceramics'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0040',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Jane Scott Ceramics', 'MOOV-0040', '0040', '40'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── SCR DISTRIBUTION (MOOV-0041) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('SCR DISTRIBUTION')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('SCR DISTRIBUTION'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0041',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['SCR DISTRIBUTION', 'MOOV-0041', '0041', '41'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Megway (Megway Parcels) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Megway')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Megway'))
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

    UPDATE customers 
    SET dc_customer_id = 'Megway Parcels',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Megway', 'Megway Parcels'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Lather Up (MOOV-0042) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Lather Up')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Lather Up'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0042',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Lather Up', 'MOOV-0042', '0042', '42'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Impoxer LTD T/A Makrom (MOOV-0043) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Impoxer LTD T/A Makrom')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Impoxer LTD T/A Makrom'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0043',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Impoxer LTD T/A Makrom', 'MOOV-0043', '0043', '43'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Vertura Ltd (MOOV-0045) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Vertura Ltd')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Vertura Ltd'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0045',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Vertura Ltd', 'MOOV-0045', '0045', '45'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Roar Gill Ltd (MOOV-0046) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Roar Gill Ltd')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Roar Gill Ltd'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0046',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Roar Gill Ltd', 'MOOV-0046', '0046', '46'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Oriental Mart (Oriental Mart) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Oriental Mart')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Oriental Mart'))
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

    UPDATE customers 
    SET dc_customer_id = 'Oriental Mart',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Oriental Mart', 'Oriental Mart'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Reevo (MOOV-0047) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Reevo')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Reevo'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0047',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Reevo', 'MOOV-0047', '0047', '47'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Lace and Favour Ltd (MOOV-0048) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Lace and Favour Ltd')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Lace and Favour Ltd'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0048',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Lace and Favour Ltd', 'MOOV-0048', '0048', '48'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Andersen EV (Andersen EV) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Andersen EV')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Andersen EV'))
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

    UPDATE customers 
    SET dc_customer_id = 'Andersen EV',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Andersen EV', 'Andersen EV'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Henry And Tosh Limited (MOOV-0050) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Henry And Tosh Limited')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Henry And Tosh Limited'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0050',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Henry And Tosh Limited', 'MOOV-0050', '0050', '50'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── March Laboratories Ltd / Ace Canine Healthcare (MOOV-0051) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('March Laboratories Ltd / Ace Canine Healthcare')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('March Laboratories Ltd / Ace Canine Healthcare'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0051',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['March Laboratories Ltd / Ace Canine Healthcare', 'MOOV-0051', '0051', '51'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── May2024 (DF1-0012) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('May2024')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('May2024'))
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

    UPDATE customers 
    SET dc_customer_id = 'DF1-0012',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['May2024', 'DF1-0012', '1'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── test 2024 (DF1-0013) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('test 2024')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('test 2024'))
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

    UPDATE customers 
    SET dc_customer_id = 'DF1-0013',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['test 2024', 'DF1-0013', '1'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── testii (DF1-0014) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('testii')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('testii'))
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

    UPDATE customers 
    SET dc_customer_id = 'DF1-0014',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['testii', 'DF1-0014', '1'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Abans Company (DQA1-0001) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Abans Company')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Abans Company'))
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

    UPDATE customers 
    SET dc_customer_id = 'DQA1-0001',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Abans Company', 'DQA1-0001', '1'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Neil Test (MOOV-0053) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Neil Test')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Neil Test'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0053',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Neil Test', 'MOOV-0053', '0053', '53'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Moov Parcel (MOOV-0054) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Moov Parcel')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Moov Parcel'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0054',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Moov Parcel', 'MOOV-0054', '0054', '54'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Ultra Soft Water Softeners Ltd (MOOV-0056) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Ultra Soft Water Softeners Ltd')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Ultra Soft Water Softeners Ltd'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0056',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Ultra Soft Water Softeners Ltd', 'MOOV-0056', '0056', '56'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── UK Optics Ltd (MOOV-0057) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('UK Optics Ltd')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('UK Optics Ltd'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0057',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['UK Optics Ltd', 'MOOV-0057', '0057', '57'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── CLIPHER LTD (MOOV-0058) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('CLIPHER LTD')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('CLIPHER LTD'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0058',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['CLIPHER LTD', 'MOOV-0058', '0058', '58'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Damro (DF1-0015) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Damro')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Damro'))
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

    UPDATE customers 
    SET dc_customer_id = 'DF1-0015',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Damro', 'DF1-0015', '1'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Teleseen (DP1-0034) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Teleseen')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Teleseen'))
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

    UPDATE customers 
    SET dc_customer_id = 'DP1-0034',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Teleseen', 'DP1-0034', '1'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Live Quote Testing (LQT) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Live Quote Testing')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Live Quote Testing'))
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

    UPDATE customers 
    SET dc_customer_id = 'LQT',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Live Quote Testing', 'LQT'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── P&S Products & Refreshening Ltd (MOOV-0059) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('P&S Products & Refreshening Ltd')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('P&S Products & Refreshening Ltd'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0059',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['P&S Products & Refreshening Ltd', 'MOOV-0059', '0059', '59'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── HOME AND HAVEN LIMITED (MOOV-0060) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('HOME AND HAVEN LIMITED')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('HOME AND HAVEN LIMITED'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0060',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['HOME AND HAVEN LIMITED', 'MOOV-0060', '0060', '60'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── 2024 (DP1-0037) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('2024')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('2024'))
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

    UPDATE customers 
    SET dc_customer_id = 'DP1-0037',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['2024', 'DP1-0037', '1'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Jetstar Airways (DP1-0038) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Jetstar Airways')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Jetstar Airways'))
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

    UPDATE customers 
    SET dc_customer_id = 'DP1-0038',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Jetstar Airways', 'DP1-0038', '1'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Rifai UK Ltd (MOOV-0061) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Rifai UK Ltd')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Rifai UK Ltd'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0061',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Rifai UK Ltd', 'MOOV-0061', '0061', '61'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Giga Distributors (MOOV-0062) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Giga Distributors')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Giga Distributors'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0062',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Giga Distributors', 'MOOV-0062', '0062', '62'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── TKS NATURALS LTD (MOOV-0063) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('TKS NATURALS LTD')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('TKS NATURALS LTD'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0063',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['TKS NATURALS LTD', 'MOOV-0063', '0063', '63'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Mini La Mode (MOOV-0064) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Mini La Mode')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Mini La Mode'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0064',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Mini La Mode', 'MOOV-0064', '0064', '64'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── TCS Worldwide (TCS) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('TCS Worldwide')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('TCS Worldwide'))
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

    UPDATE customers 
    SET dc_customer_id = 'TCS',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['TCS Worldwide', 'TCS'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── ERTECH LTD (MOOV-0066) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('ERTECH LTD')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('ERTECH LTD'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0066',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['ERTECH LTD', 'MOOV-0066', '0066', '66'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── D S Engineering (MOOV-0067) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('D S Engineering')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('D S Engineering'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0067',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['D S Engineering', 'MOOV-0067', '0067', '67'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── kol (1233-0003) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('kol')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('kol'))
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

    UPDATE customers 
    SET dc_customer_id = '1233-0003',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['kol', '1233-0003', '1233'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Hairways (Hair & Beauty) Ltd (MOOV-0068) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Hairways (Hair & Beauty) Ltd')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Hairways (Hair & Beauty) Ltd'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0068',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Hairways (Hair & Beauty) Ltd', 'MOOV-0068', '0068', '68'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Soghaat Gifts & Fragrances Ltd. (MOOV-0069) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Soghaat Gifts & Fragrances Ltd.')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Soghaat Gifts & Fragrances Ltd.'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0069',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Soghaat Gifts & Fragrances Ltd.', 'MOOV-0069', '0069', '69'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Lampfix (MOOV-0070) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Lampfix')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Lampfix'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0070',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Lampfix', 'MOOV-0070', '0070', '70'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Bentley Photographic (MOOV-0071) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Bentley Photographic')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Bentley Photographic'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0071',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Bentley Photographic', 'MOOV-0071', '0071', '71'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Creative Solution (DQA1-0005) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Creative Solution')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Creative Solution'))
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

    UPDATE customers 
    SET dc_customer_id = 'DQA1-0005',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Creative Solution', 'DQA1-0005', '1'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Gapstar (DP1-0043) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Gapstar')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Gapstar'))
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

    UPDATE customers 
    SET dc_customer_id = 'DP1-0043',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Gapstar', 'DP1-0043', '1'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── TestCompany11 (DDK1-0002) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('TestCompany11')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('TestCompany11'))
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

    UPDATE customers 
    SET dc_customer_id = 'DDK1-0002',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['TestCompany11', 'DDK1-0002', '1'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Virtusa (DQA1-0007) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Virtusa')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Virtusa'))
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

    UPDATE customers 
    SET dc_customer_id = 'DQA1-0007',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Virtusa', 'DQA1-0007', '1'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Toyota (DQA1-0009) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Toyota')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Toyota'))
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

    UPDATE customers 
    SET dc_customer_id = 'DQA1-0009',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Toyota', 'DQA1-0009', '1'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Brandix (DQA1-0011) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Brandix')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Brandix'))
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

    UPDATE customers 
    SET dc_customer_id = 'DQA1-0011',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Brandix', 'DQA1-0011', '1'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Softlogic (DQA1-0012) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Softlogic')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Softlogic'))
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

    UPDATE customers 
    SET dc_customer_id = 'DQA1-0012',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Softlogic', 'DQA1-0012', '1'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Daraz (DQA1-0013) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Daraz')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Daraz'))
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

    UPDATE customers 
    SET dc_customer_id = 'DQA1-0013',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Daraz', 'DQA1-0013', '1'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Impact Particles (MOOV-0072) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Impact Particles')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Impact Particles'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0072',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Impact Particles', 'MOOV-0072', '0072', '72'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Garden Greatness LTD (MOOV-0073) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Garden Greatness LTD')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Garden Greatness LTD'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0073',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Garden Greatness LTD', 'MOOV-0073', '0073', '73'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Major Brushes Ltd (MOOV-0074) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Major Brushes Ltd')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Major Brushes Ltd'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0074',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Major Brushes Ltd', 'MOOV-0074', '0074', '74'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Ottone Hardware (MOOV-0065) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Ottone Hardware')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Ottone Hardware'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0065',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Ottone Hardware', 'MOOV-0065', '0065', '65'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Europa (Europa) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Europa')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Europa'))
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

    UPDATE customers 
    SET dc_customer_id = 'Europa',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Europa', 'Europa'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── TELESONIC (DQA1-0014) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('TELESONIC')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('TELESONIC'))
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

    UPDATE customers 
    SET dc_customer_id = 'DQA1-0014',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['TELESONIC', 'DQA1-0014', '1'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── ALDO (DQA1-0015) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('ALDO')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('ALDO'))
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

    UPDATE customers 
    SET dc_customer_id = 'DQA1-0015',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['ALDO', 'DQA1-0015', '1'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Barry AI (Barry AI) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Barry AI')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Barry AI'))
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

    UPDATE customers 
    SET dc_customer_id = 'Barry AI',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Barry AI', 'Barry AI'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── NECTR (MOOV-0075) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('NECTR')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('NECTR'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0075',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['NECTR', 'MOOV-0075', '0075', '75'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Ray Wai-Shing (HOF-0007) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Ray Wai-Shing')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Ray Wai-Shing'))
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

    UPDATE customers 
    SET dc_customer_id = 'HOF-0007',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Ray Wai-Shing', 'HOF-0007', '0007', '7'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Michael Chadburn (HOF-0003) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Michael Chadburn')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Michael Chadburn'))
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

    UPDATE customers 
    SET dc_customer_id = 'HOF-0003',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Michael Chadburn', 'HOF-0003', '0003', '3'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── UK Demo (DD2-0002) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('UK Demo')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('UK Demo'))
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

    UPDATE customers 
    SET dc_customer_id = 'DD2-0002',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['UK Demo', 'DD2-0002', '2'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Ninja UK Production (HOF-0002) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Ninja UK Production')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Ninja UK Production'))
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

    UPDATE customers 
    SET dc_customer_id = 'HOF-0002',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Ninja UK Production', 'HOF-0002', '0002', '2'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Prod Chinthaka (HOF-0001) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Prod Chinthaka')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Prod Chinthaka'))
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

    UPDATE customers 
    SET dc_customer_id = 'HOF-0001',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Prod Chinthaka', 'HOF-0001', '0001', '1'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── EFUTURES1 (DP1-0001) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('EFUTURES1')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('EFUTURES1'))
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

    UPDATE customers 
    SET dc_customer_id = 'DP1-0001',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['EFUTURES1', 'DP1-0001', '1'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Moreyeah Foods Ltd (MOOV-0076) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Moreyeah Foods Ltd')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Moreyeah Foods Ltd'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0076',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Moreyeah Foods Ltd', 'MOOV-0076', '0076', '76'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── S Smith & Sons Carpets Ltd (MOOV-0077) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('S Smith & Sons Carpets Ltd')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('S Smith & Sons Carpets Ltd'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0077',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['S Smith & Sons Carpets Ltd', 'MOOV-0077', '0077', '77'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── The Railway Shop Ltd (MOOV-0078) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('The Railway Shop Ltd')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('The Railway Shop Ltd'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0078',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['The Railway Shop Ltd', 'MOOV-0078', '0078', '78'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Pex Ltd (MOOV-0079) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Pex Ltd')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Pex Ltd'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0079',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Pex Ltd', 'MOOV-0079', '0079', '79'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Finger on Pulse Ltd (MOOV-0080) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Finger on Pulse Ltd')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Finger on Pulse Ltd'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0080',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Finger on Pulse Ltd', 'MOOV-0080', '0080', '80'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Iglu Meal Prep (Iglu Meal Prep) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Iglu Meal Prep')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Iglu Meal Prep'))
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

    UPDATE customers 
    SET dc_customer_id = 'Iglu Meal Prep',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Iglu Meal Prep', 'Iglu Meal Prep'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Yourbookstore (Yourbookstore) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Yourbookstore')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Yourbookstore'))
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

    UPDATE customers 
    SET dc_customer_id = 'Yourbookstore',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Yourbookstore', 'Yourbookstore'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Carnivore Cartel Ltd (MOOV-0081) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Carnivore Cartel Ltd')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Carnivore Cartel Ltd'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0081',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Carnivore Cartel Ltd', 'MOOV-0081', '0081', '81'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Igluu Ltd (MOOV-0082) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Igluu Ltd')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Igluu Ltd'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0082',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Igluu Ltd', 'MOOV-0082', '0082', '82'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── E-Health Pharmacy Ltd (MOOV-0083) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('E-Health Pharmacy Ltd')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('E-Health Pharmacy Ltd'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0083',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['E-Health Pharmacy Ltd', 'MOOV-0083', '0083', '83'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Techworknetwork LTD (MOOV-0084) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Techworknetwork LTD')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Techworknetwork LTD'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0084',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Techworknetwork LTD', 'MOOV-0084', '0084', '84'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Matrix Seating Limited (MOOV-0085) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Matrix Seating Limited')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Matrix Seating Limited'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0085',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Matrix Seating Limited', 'MOOV-0085', '0085', '85'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── test (DP1-0044) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('test')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('test'))
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

    UPDATE customers 
    SET dc_customer_id = 'DP1-0044',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['test', 'DP1-0044', '1'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Test company name (DP1-0045) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Test company name')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Test company name'))
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

    UPDATE customers 
    SET dc_customer_id = 'DP1-0045',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Test company name', 'DP1-0045', '1'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Zesta (DP2-0001) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Zesta')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Zesta'))
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

    UPDATE customers 
    SET dc_customer_id = 'DP2-0001',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Zesta', 'DP2-0001', '2'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── HSBC (DDJ1-0002) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('HSBC')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('HSBC'))
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

    UPDATE customers 
    SET dc_customer_id = 'DDJ1-0002',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['HSBC', 'DDJ1-0002', '1'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Danijels Parcels (MOOV-0087) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Danijels Parcels')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Danijels Parcels'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0087',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Danijels Parcels', 'MOOV-0087', '0087', '87'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── TCS Express Worldwide UK Limited (MOOV-0088) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('TCS Express Worldwide UK Limited')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('TCS Express Worldwide UK Limited'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0088',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['TCS Express Worldwide UK Limited', 'MOOV-0088', '0088', '88'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Clearance Stock Supplies Limited (MOOV-0089) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Clearance Stock Supplies Limited')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Clearance Stock Supplies Limited'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0089',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Clearance Stock Supplies Limited', 'MOOV-0089', '0089', '89'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Octopus (DP1-0046) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Octopus')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Octopus'))
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

    UPDATE customers 
    SET dc_customer_id = 'DP1-0046',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Octopus', 'DP1-0046', '1'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Matt Test (MOOV-0090) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Matt Test')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Matt Test'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0090',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Matt Test', 'MOOV-0090', '0090', '90'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Test company (DQA1-0016) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Test company')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Test company'))
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

    UPDATE customers 
    SET dc_customer_id = 'DQA1-0016',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Test company', 'DQA1-0016', '1'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Pet Food Online LTD (MOOV-0091) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Pet Food Online LTD')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Pet Food Online LTD'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0091',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Pet Food Online LTD', 'MOOV-0091', '0091', '91'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Aromina (DDJ1-0003) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Aromina')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Aromina'))
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

    UPDATE customers 
    SET dc_customer_id = 'DDJ1-0003',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Aromina', 'DDJ1-0003', '1'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Paragon Design Joinery Ltd (MOOV-0092) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Paragon Design Joinery Ltd')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Paragon Design Joinery Ltd'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0092',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Paragon Design Joinery Ltd', 'MOOV-0092', '0092', '92'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Macchiato Bar Ltd (MOOV-0093) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Macchiato Bar Ltd')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Macchiato Bar Ltd'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0093',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Macchiato Bar Ltd', 'MOOV-0093', '0093', '93'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Soothe Limited t/a Luxury Skincare Brands (MOOV-0094) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Soothe Limited t/a Luxury Skincare Brands')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Soothe Limited t/a Luxury Skincare Brands'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0094',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Soothe Limited t/a Luxury Skincare Brands', 'MOOV-0094', '0094', '94'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── MAD baits supplies Ltd (MOOV-0095) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('MAD baits supplies Ltd')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('MAD baits supplies Ltd'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0095',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['MAD baits supplies Ltd', 'MOOV-0095', '0095', '95'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Sam Scotts Limited (MOOV-0097) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Sam Scotts Limited')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Sam Scotts Limited'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0097',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Sam Scotts Limited', 'MOOV-0097', '0097', '97'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Crytec Limited (MOOV-0098) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Crytec Limited')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Crytec Limited'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0098',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Crytec Limited', 'MOOV-0098', '0098', '98'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Hairways (Hair & Beauty) Ltd Site B (MOOV-0099) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Hairways (Hair & Beauty) Ltd Site B')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Hairways (Hair & Beauty) Ltd Site B'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0099',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Hairways (Hair & Beauty) Ltd Site B', 'MOOV-0099', '0099', '99'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── WoodUbend Ltd (MOOV-0101) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('WoodUbend Ltd')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('WoodUbend Ltd'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0101',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['WoodUbend Ltd', 'MOOV-0101', '0101', '101'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── TMK Trading Ltd t/a Nexus Modelling Supplies (MOOV-0102) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('TMK Trading Ltd t/a Nexus Modelling Supplies')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('TMK Trading Ltd t/a Nexus Modelling Supplies'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0102',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['TMK Trading Ltd t/a Nexus Modelling Supplies', 'MOOV-0102', '0102', '102'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Brexons Workwear (MOOV-0103) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Brexons Workwear')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Brexons Workwear'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0103',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Brexons Workwear', 'MOOV-0103', '0103', '103'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Sing Ko (MOOV-0105) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Sing Ko')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Sing Ko'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0105',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Sing Ko', 'MOOV-0105', '0105', '105'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Boori (Europe) LTD (MOOV-0106) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Boori (Europe) LTD')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Boori (Europe) LTD'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0106',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Boori (Europe) LTD', 'MOOV-0106', '0106', '106'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── mike (123-0001) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('mike')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('mike'))
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

    UPDATE customers 
    SET dc_customer_id = '123-0001',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['mike', '123-0001', '123'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── sdfdsf (11-2002) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('sdfdsf')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('sdfdsf'))
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

    UPDATE customers 
    SET dc_customer_id = '11-2002',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['sdfdsf', '11-2002', '11'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── MV (123-0002) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('MV')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('MV'))
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

    UPDATE customers 
    SET dc_customer_id = '123-0002',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['MV', '123-0002', '123'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── SYNTAXGENIE (123-0003) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('SYNTAXGENIE')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('SYNTAXGENIE'))
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

    UPDATE customers 
    SET dc_customer_id = '123-0003',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['SYNTAXGENIE', '123-0003', '123'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── sdgsd (123-0004) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('sdgsd')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('sdgsd'))
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

    UPDATE customers 
    SET dc_customer_id = '123-0004',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['sdgsd', '123-0004', '123'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── cf (11-2001) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('cf')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('cf'))
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

    UPDATE customers 
    SET dc_customer_id = '11-2001',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['cf', '11-2001', '11'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Property Documents Ltd (MOOV-0107) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Property Documents Ltd')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Property Documents Ltd'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0107',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Property Documents Ltd', 'MOOV-0107', '0107', '107'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Accentura (DP1-0047) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Accentura')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Accentura'))
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

    UPDATE customers 
    SET dc_customer_id = 'DP1-0047',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Accentura', 'DP1-0047', '1'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Direct Auto Electrics Ltd (MOOV-0108) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Direct Auto Electrics Ltd')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Direct Auto Electrics Ltd'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0108',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Direct Auto Electrics Ltd', 'MOOV-0108', '0108', '108'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Sampath Bank (DDJ1-0004) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Sampath Bank')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Sampath Bank'))
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

    UPDATE customers 
    SET dc_customer_id = 'DDJ1-0004',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Sampath Bank', 'DDJ1-0004', '1'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── W J Jones Ltd T/A Zoar''s Ark (MOOV-0109) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('W J Jones Ltd T/A Zoar''s Ark')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('W J Jones Ltd T/A Zoar''s Ark'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0109',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['W J Jones Ltd T/A Zoar''s Ark', 'MOOV-0109', '0109', '109'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Raycom Ltd (MOOV-0110) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Raycom Ltd')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Raycom Ltd'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0110',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Raycom Ltd', 'MOOV-0110', '0110', '110'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Michael kors (DQA1-0017) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Michael kors')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Michael kors'))
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

    UPDATE customers 
    SET dc_customer_id = 'DQA1-0017',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Michael kors', 'DQA1-0017', '1'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Vintsreet (Vintsreet) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Vintsreet')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Vintsreet'))
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

    UPDATE customers 
    SET dc_customer_id = 'Vintsreet',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Vintsreet', 'Vintsreet'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Efutures Prod Test Account (DD2-0006) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Efutures Prod Test Account')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Efutures Prod Test Account'))
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

    UPDATE customers 
    SET dc_customer_id = 'DD2-0006',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Efutures Prod Test Account', 'DD2-0006', '2'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Redo Commerce (Redo Commerce) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Redo Commerce')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Redo Commerce'))
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

    UPDATE customers 
    SET dc_customer_id = 'Redo Commerce',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Redo Commerce', 'Redo Commerce'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Empire Printing & Embroidery Ltd (MOOV-0111) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Empire Printing & Embroidery Ltd')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Empire Printing & Embroidery Ltd'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0111',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Empire Printing & Embroidery Ltd', 'MOOV-0111', '0111', '111'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── BARRY CARTER MOTOR PRODUCTS (MOOV-0113) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('BARRY CARTER MOTOR PRODUCTS')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('BARRY CARTER MOTOR PRODUCTS'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0113',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['BARRY CARTER MOTOR PRODUCTS', 'MOOV-0113', '0113', '113'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Cranswick (Cranswick) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Cranswick')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Cranswick'))
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

    UPDATE customers 
    SET dc_customer_id = 'Cranswick',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Cranswick', 'Cranswick'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Vint Street Ltd. (MOOV-0114) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Vint Street Ltd.')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Vint Street Ltd.'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0114',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Vint Street Ltd.', 'MOOV-0114', '0114', '114'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Imagin Products Ltd (MOOV-0115) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Imagin Products Ltd')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Imagin Products Ltd'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0115',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Imagin Products Ltd', 'MOOV-0115', '0115', '115'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Efutures Prod Account Two (DD2-0007) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Efutures Prod Account Two')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Efutures Prod Account Two'))
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

    UPDATE customers 
    SET dc_customer_id = 'DD2-0007',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Efutures Prod Account Two', 'DD2-0007', '2'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── EZZTECH (MOOV-0116) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('EZZTECH')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('EZZTECH'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0116',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['EZZTECH', 'MOOV-0116', '0116', '116'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Tool Hub Ltd (MOOV-0117) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Tool Hub Ltd')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Tool Hub Ltd'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0117',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Tool Hub Ltd', 'MOOV-0117', '0117', '117'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Getplumb Reading Ltd (MOOV-0118) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Getplumb Reading Ltd')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Getplumb Reading Ltd'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0118',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Getplumb Reading Ltd', 'MOOV-0118', '0118', '118'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Vision Warehouse (MOOV-0112) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Vision Warehouse')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Vision Warehouse'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0112',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Vision Warehouse', 'MOOV-0112', '0112', '112'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── 608 Group Ltd (304 Clothing) (MOOV-0119) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('608 Group Ltd (304 Clothing)')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('608 Group Ltd (304 Clothing)'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0119',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['608 Group Ltd (304 Clothing)', 'MOOV-0119', '0119', '119'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Sky Chemicals (UK) Ltd (MOOV-0120) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Sky Chemicals (UK) Ltd')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Sky Chemicals (UK) Ltd'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0120',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Sky Chemicals (UK) Ltd', 'MOOV-0120', '0120', '120'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Wedcova Uk Ltd (MOOV-0121) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Wedcova Uk Ltd')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Wedcova Uk Ltd'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0121',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Wedcova Uk Ltd', 'MOOV-0121', '0121', '121'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Fosseway Parcels Ltd (MOOV-0122) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Fosseway Parcels Ltd')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Fosseway Parcels Ltd'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0122',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Fosseway Parcels Ltd', 'MOOV-0122', '0122', '122'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── ARIMAC (DDJ1-0005) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('ARIMAC')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('ARIMAC'))
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

    UPDATE customers 
    SET dc_customer_id = 'DDJ1-0005',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['ARIMAC', 'DDJ1-0005', '1'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── GPG - Getpersonalisedgifts Limited (MOOV-0123) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('GPG - Getpersonalisedgifts Limited')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('GPG - Getpersonalisedgifts Limited'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0123',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['GPG - Getpersonalisedgifts Limited', 'MOOV-0123', '0123', '123'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Thirsty Soft Drinks (MOOV-0124) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Thirsty Soft Drinks')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Thirsty Soft Drinks'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0124',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Thirsty Soft Drinks', 'MOOV-0124', '0124', '124'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Gifts2Impress (MOOV-0125) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Gifts2Impress')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Gifts2Impress'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0125',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Gifts2Impress', 'MOOV-0125', '0125', '125'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Xylo LTD (MOOV-0126) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Xylo LTD')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Xylo LTD'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0126',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Xylo LTD', 'MOOV-0126', '0126', '126'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── The Saddlery Shop Ltd (MOOV-0127) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('The Saddlery Shop Ltd')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('The Saddlery Shop Ltd'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0127',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['The Saddlery Shop Ltd', 'MOOV-0127', '0127', '127'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── EF TEST QA ACCOUNT (DD2-0008) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('EF TEST QA ACCOUNT')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('EF TEST QA ACCOUNT'))
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

    UPDATE customers 
    SET dc_customer_id = 'DD2-0008',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['EF TEST QA ACCOUNT', 'DD2-0008', '2'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Organax Ltd (MOOV-0128) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Organax Ltd')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Organax Ltd'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0128',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Organax Ltd', 'MOOV-0128', '0128', '128'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Gra Telford LTD (MOOV-0129) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Gra Telford LTD')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Gra Telford LTD'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0129',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Gra Telford LTD', 'MOOV-0129', '0129', '129'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Attapattu & Sons (123-0005) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Attapattu & Sons')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Attapattu & Sons'))
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

    UPDATE customers 
    SET dc_customer_id = '123-0005',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Attapattu & Sons', '123-0005', '123'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Jayasuriya & Sons (123-0006) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Jayasuriya & Sons')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Jayasuriya & Sons'))
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

    UPDATE customers 
    SET dc_customer_id = '123-0006',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Jayasuriya & Sons', '123-0006', '123'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── The Wall Lighting Company Ltd (MOOV-0130) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('The Wall Lighting Company Ltd')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('The Wall Lighting Company Ltd'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0130',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['The Wall Lighting Company Ltd', 'MOOV-0130', '0130', '130'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Chilli Seating Ltd (MOOV-0131) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Chilli Seating Ltd')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Chilli Seating Ltd'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0131',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Chilli Seating Ltd', 'MOOV-0131', '0131', '131'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── ZARA Company (DDJ1-0006) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('ZARA Company')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('ZARA Company'))
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

    UPDATE customers 
    SET dc_customer_id = 'DDJ1-0006',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['ZARA Company', 'DDJ1-0006', '1'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── N70 (123-0007) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('N70')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('N70'))
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

    UPDATE customers 
    SET dc_customer_id = '123-0007',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['N70', '123-0007', '123'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Mahela Co (123-0008) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Mahela Co')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Mahela Co'))
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

    UPDATE customers 
    SET dc_customer_id = '123-0008',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Mahela Co', '123-0008', '123'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── David Jones (DP1-0048) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('David Jones')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('David Jones'))
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

    UPDATE customers 
    SET dc_customer_id = 'DP1-0048',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['David Jones', 'DP1-0048', '1'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Deshi Delights Ltd (MOOV-0132) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Deshi Delights Ltd')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Deshi Delights Ltd'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0132',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Deshi Delights Ltd', 'MOOV-0132', '0132', '132'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── EFUTURES TEST COMPANY (DD2-0009) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('EFUTURES TEST COMPANY')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('EFUTURES TEST COMPANY'))
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

    UPDATE customers 
    SET dc_customer_id = 'DD2-0009',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['EFUTURES TEST COMPANY', 'DD2-0009', '2'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Bill''s Tool Store Ltd (MOOV-0133) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Bill''s Tool Store Ltd')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Bill''s Tool Store Ltd'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0133',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Bill''s Tool Store Ltd', 'MOOV-0133', '0133', '133'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Jaycee Engineering T/A Jaycee Trophies (MOOV-0134) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Jaycee Engineering T/A Jaycee Trophies')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Jaycee Engineering T/A Jaycee Trophies'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0134',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Jaycee Engineering T/A Jaycee Trophies', 'MOOV-0134', '0134', '134'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Arden Medical Limited (MOOV-0135) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Arden Medical Limited')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Arden Medical Limited'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0135',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Arden Medical Limited', 'MOOV-0135', '0135', '135'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── ORIGINAL SOURCE LIMITED (MOOV-0136) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('ORIGINAL SOURCE LIMITED')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('ORIGINAL SOURCE LIMITED'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0136',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['ORIGINAL SOURCE LIMITED', 'MOOV-0136', '0136', '136'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Ransom Publishing Ltd (MOOV-0137) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Ransom Publishing Ltd')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Ransom Publishing Ltd'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0137',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Ransom Publishing Ltd', 'MOOV-0137', '0137', '137'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Webhook Test (123-0010) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Webhook Test')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Webhook Test'))
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

    UPDATE customers 
    SET dc_customer_id = '123-0010',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Webhook Test', '123-0010', '123'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Fortec Trading Ltd t/a Glowtopia (Fortec Trading Ltd t/a Glowtopia) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Fortec Trading Ltd t/a Glowtopia')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Fortec Trading Ltd t/a Glowtopia'))
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

    UPDATE customers 
    SET dc_customer_id = 'Fortec Trading Ltd t/a Glowtopia',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Fortec Trading Ltd t/a Glowtopia', 'Fortec Trading Ltd t/a Glowtopia'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Alpha Cus (123-0011) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Alpha Cus')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Alpha Cus'))
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

    UPDATE customers 
    SET dc_customer_id = '123-0011',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Alpha Cus', '123-0011', '123'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Beta Cus (123-0012) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Beta Cus')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Beta Cus'))
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

    UPDATE customers 
    SET dc_customer_id = '123-0012',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Beta Cus', '123-0012', '123'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Vintstreet (Vintstreet) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Vintstreet')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Vintstreet'))
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

    UPDATE customers 
    SET dc_customer_id = 'Vintstreet',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Vintstreet', 'Vintstreet'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Westcare Ltd T/A westcare Supply Zone (MOOV-0138) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Westcare Ltd T/A westcare Supply Zone')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Westcare Ltd T/A westcare Supply Zone'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0138',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Westcare Ltd T/A westcare Supply Zone', 'MOOV-0138', '0138', '138'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Talpa office products ltd (MOOV-0139) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Talpa office products ltd')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Talpa office products ltd'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0139',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Talpa office products ltd', 'MOOV-0139', '0139', '139'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── LED Smart Solutions Limited (MOOV-0140) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('LED Smart Solutions Limited')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('LED Smart Solutions Limited'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0140',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['LED Smart Solutions Limited', 'MOOV-0140', '0140', '140'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── My Company (HOF-0013) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('My Company')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('My Company'))
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

    UPDATE customers 
    SET dc_customer_id = 'HOF-0013',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['My Company', 'HOF-0013', '0013', '13'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── JST Supplies LTD (MOOV-0141) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('JST Supplies LTD')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('JST Supplies LTD'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0141',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['JST Supplies LTD', 'MOOV-0141', '0141', '141'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Moov Diana Demo (MOOV-0142) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Moov Diana Demo')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Moov Diana Demo'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0142',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Moov Diana Demo', 'MOOV-0142', '0142', '142'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── OliArt Wood LTD (MOOV-0143) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('OliArt Wood LTD')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('OliArt Wood LTD'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0143',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['OliArt Wood LTD', 'MOOV-0143', '0143', '143'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Bessette LTD (MOOV-0144) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Bessette LTD')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Bessette LTD'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0144',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Bessette LTD', 'MOOV-0144', '0144', '144'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── NDB (DDJ1-0007) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('NDB')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('NDB'))
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

    UPDATE customers 
    SET dc_customer_id = 'DDJ1-0007',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['NDB', 'DDJ1-0007', '1'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── CONTEXT PNEUMATIC SUPPLIES LIMITED (MOOV-0145) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('CONTEXT PNEUMATIC SUPPLIES LIMITED')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('CONTEXT PNEUMATIC SUPPLIES LIMITED'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0145',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['CONTEXT PNEUMATIC SUPPLIES LIMITED', 'MOOV-0145', '0145', '145'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Bentley and Bo Interiors Ltd (MOOV-0146) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Bentley and Bo Interiors Ltd')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Bentley and Bo Interiors Ltd'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0146',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Bentley and Bo Interiors Ltd', 'MOOV-0146', '0146', '146'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── SME IT Solutions Limited (MOOV-0147) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('SME IT Solutions Limited')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('SME IT Solutions Limited'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0147',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['SME IT Solutions Limited', 'MOOV-0147', '0147', '147'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── EFUTURES SMOKE TEST CUSTOMER (MOOV-0148) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('EFUTURES SMOKE TEST CUSTOMER')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('EFUTURES SMOKE TEST CUSTOMER'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0148',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['EFUTURES SMOKE TEST CUSTOMER', 'MOOV-0148', '0148', '148'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Buffalo Systems Ltd (MOOV-0149) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Buffalo Systems Ltd')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Buffalo Systems Ltd'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0149',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Buffalo Systems Ltd', 'MOOV-0149', '0149', '149'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── East London Packaging Supplies Ltd (MOOV-0150) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('East London Packaging Supplies Ltd')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('East London Packaging Supplies Ltd'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0150',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['East London Packaging Supplies Ltd', 'MOOV-0150', '0150', '150'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Metal Polishing Supplies Ltd (MOOV-0151) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Metal Polishing Supplies Ltd')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Metal Polishing Supplies Ltd'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0151',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Metal Polishing Supplies Ltd', 'MOOV-0151', '0151', '151'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Spokz Ltd (MOOV-0152) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Spokz Ltd')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Spokz Ltd'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0152',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Spokz Ltd', 'MOOV-0152', '0152', '152'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Youtheory (123-0013) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Youtheory')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Youtheory'))
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

    UPDATE customers 
    SET dc_customer_id = '123-0013',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Youtheory', '123-0013', '123'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── M. Criscuolo & Co Ltd (MOOV-0153) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('M. Criscuolo & Co Ltd')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('M. Criscuolo & Co Ltd'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0153',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['M. Criscuolo & Co Ltd', 'MOOV-0153', '0153', '153'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Kettles Pottery Supplies Ltd (MOOV-0154) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Kettles Pottery Supplies Ltd')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Kettles Pottery Supplies Ltd'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0154',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Kettles Pottery Supplies Ltd', 'MOOV-0154', '0154', '154'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── East Coast Creations Ltd (MOOV-0155) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('East Coast Creations Ltd')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('East Coast Creations Ltd'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0155',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['East Coast Creations Ltd', 'MOOV-0155', '0155', '155'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── ETA Solutions Limited (MOOV-0156) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('ETA Solutions Limited')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('ETA Solutions Limited'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0156',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['ETA Solutions Limited', 'MOOV-0156', '0156', '156'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Security Trade Products Ltd (MOOV-0157) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Security Trade Products Ltd')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Security Trade Products Ltd'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0157',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Security Trade Products Ltd', 'MOOV-0157', '0157', '157'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Sarratt Online Ltd (MOOV-0158) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Sarratt Online Ltd')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Sarratt Online Ltd'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0158',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Sarratt Online Ltd', 'MOOV-0158', '0158', '158'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Agar Hygiene Ltd (MOOV-0159) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Agar Hygiene Ltd')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Agar Hygiene Ltd'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0159',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Agar Hygiene Ltd', 'MOOV-0159', '0159', '159'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Lesser Spotted Images Ltd (MOOV-0160) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Lesser Spotted Images Ltd')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Lesser Spotted Images Ltd'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0160',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Lesser Spotted Images Ltd', 'MOOV-0160', '0160', '160'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Just Cable Ties (MOOV-0161) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Just Cable Ties')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Just Cable Ties'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0161',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Just Cable Ties', 'MOOV-0161', '0161', '161'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Work and Wear Direct Ltd (Work and Wear Direct Ltd) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Work and Wear Direct Ltd')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Work and Wear Direct Ltd'))
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

    UPDATE customers 
    SET dc_customer_id = 'Work and Wear Direct Ltd',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Work and Wear Direct Ltd', 'Work and Wear Direct Ltd'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Exhale Boutique (Exhale Boutique) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Exhale Boutique')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Exhale Boutique'))
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

    UPDATE customers 
    SET dc_customer_id = 'Exhale Boutique',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Exhale Boutique', 'Exhale Boutique'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Southdown Abrasives & Ind Chemicals Ltd (MOOV-0162) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Southdown Abrasives & Ind Chemicals Ltd')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Southdown Abrasives & Ind Chemicals Ltd'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0162',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Southdown Abrasives & Ind Chemicals Ltd', 'MOOV-0162', '0162', '162'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Tackl (Tackl) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Tackl')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Tackl'))
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

    UPDATE customers 
    SET dc_customer_id = 'Tackl',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Tackl', 'Tackl'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Auto Test (Auto) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Auto Test')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Auto Test'))
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

    UPDATE customers 
    SET dc_customer_id = 'Auto',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Auto Test', 'Auto'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── HPSA Ltd (MOOV-0163) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('HPSA Ltd')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('HPSA Ltd'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0163',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['HPSA Ltd', 'MOOV-0163', '0163', '163'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── ceravi (DP1-0051) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('ceravi')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('ceravi'))
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

    UPDATE customers 
    SET dc_customer_id = 'DP1-0051',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['ceravi', 'DP1-0051', '1'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── PWS Leeds Ltd (MOOV-0164) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('PWS Leeds Ltd')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('PWS Leeds Ltd'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0164',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['PWS Leeds Ltd', 'MOOV-0164', '0164', '164'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Total Insignia Ltd (MOOV-0165) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Total Insignia Ltd')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Total Insignia Ltd'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0165',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Total Insignia Ltd', 'MOOV-0165', '0165', '165'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── USER (EFD1-0004) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('USER')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('USER'))
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

    UPDATE customers 
    SET dc_customer_id = 'EFD1-0004',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['USER', 'EFD1-0004', '1'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── The Wild Meat Company ltd (MOOV-0166) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('The Wild Meat Company ltd')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('The Wild Meat Company ltd'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0166',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['The Wild Meat Company ltd', 'MOOV-0166', '0166', '166'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Grace Test Account (MOOV-0167) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Grace Test Account')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Grace Test Account'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0167',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Grace Test Account', 'MOOV-0167', '0167', '167'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Bob AI (MOOV-0168) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Bob AI')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Bob AI'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0168',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Bob AI', 'MOOV-0168', '0168', '168'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Xplore Brands (MOOV-0169) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Xplore Brands')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Xplore Brands'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0169',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Xplore Brands', 'MOOV-0169', '0169', '169'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Medicube (DQA1-0018) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Medicube')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Medicube'))
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

    UPDATE customers 
    SET dc_customer_id = 'DQA1-0018',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Medicube', 'DQA1-0018', '1'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Sherwood Wholesale Foods Ltd (MOOV-0170) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Sherwood Wholesale Foods Ltd')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Sherwood Wholesale Foods Ltd'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0170',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Sherwood Wholesale Foods Ltd', 'MOOV-0170', '0170', '170'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── 2023 (QDP1-0001) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('2023')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('2023'))
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

    UPDATE customers 
    SET dc_customer_id = 'QDP1-0001',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['2023', 'QDP1-0001', '1'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── PROD EF COMPANY (TDP1-0001) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('PROD EF COMPANY')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('PROD EF COMPANY'))
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

    UPDATE customers 
    SET dc_customer_id = 'TDP1-0001',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['PROD EF COMPANY', 'TDP1-0001', '1'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── EF (DE22-0009) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('EF')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('EF'))
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

    UPDATE customers 
    SET dc_customer_id = 'DE22-0009',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['EF', 'DE22-0009', '22'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── NNU (DE22-0011) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('NNU')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('NNU'))
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

    UPDATE customers 
    SET dc_customer_id = 'DE22-0011',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['NNU', 'DE22-0011', '22'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Non Ninja Company (QDP1-0003) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Non Ninja Company')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Non Ninja Company'))
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

    UPDATE customers 
    SET dc_customer_id = 'QDP1-0003',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Non Ninja Company', 'QDP1-0003', '1'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Test Ninja company (DP1-0053) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Test Ninja company')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Test Ninja company'))
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

    UPDATE customers 
    SET dc_customer_id = 'DP1-0053',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Test Ninja company', 'DP1-0053', '1'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Efutures Non Ninja company (DE22-0015) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Efutures Non Ninja company')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Efutures Non Ninja company'))
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

    UPDATE customers 
    SET dc_customer_id = 'DE22-0015',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Efutures Non Ninja company', 'DE22-0015', '22'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── EFUTURES TEST PORD NINJA COMPANY (TDP1-0005) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('EFUTURES TEST PORD NINJA COMPANY')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('EFUTURES TEST PORD NINJA COMPANY'))
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

    UPDATE customers 
    SET dc_customer_id = 'TDP1-0005',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['EFUTURES TEST PORD NINJA COMPANY', 'TDP1-0005', '1'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Test Efutures Non Ninja comp (TDP1-0007) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Test Efutures Non Ninja comp')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Test Efutures Non Ninja comp'))
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

    UPDATE customers 
    SET dc_customer_id = 'TDP1-0007',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Test Efutures Non Ninja comp', 'TDP1-0007', '1'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Jamie Ferments Limited (MOOV-0171) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Jamie Ferments Limited')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Jamie Ferments Limited'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0171',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Jamie Ferments Limited', 'MOOV-0171', '0171', '171'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Jezaya UK Limited (MOOV-0172) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Jezaya UK Limited')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Jezaya UK Limited'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0172',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Jezaya UK Limited', 'MOOV-0172', '0172', '172'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Wine Buffs Ltd (MOOV-0173) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Wine Buffs Ltd')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Wine Buffs Ltd'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0173',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Wine Buffs Ltd', 'MOOV-0173', '0173', '173'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Doran Packaging Ltd (MOOV-0174) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Doran Packaging Ltd')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Doran Packaging Ltd'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0174',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Doran Packaging Ltd', 'MOOV-0174', '0174', '174'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Purozo Limited (MOOV-0175) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Purozo Limited')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Purozo Limited'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0175',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Purozo Limited', 'MOOV-0175', '0175', '175'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Wosi Wosi Foods Limited (MOOV-0176) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Wosi Wosi Foods Limited')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Wosi Wosi Foods Limited'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Wosi Wosi Foods Limited%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Update ONLY if customer exists in database
  IF v_cust_id IS NOT NULL THEN
    -- Clear this dc_customer_id from any other customer record
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0176' OR dc_customer_id = '0176')
      AND id != v_cust_id;

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0176',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Wosi Wosi Foods Limited', 'MOOV-0176', '0176', '176', 'wasi wasi', 'wasiwasi', 'wosi wosi', 'wosiwosi', '0176'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── My Shadow Ltd (MOOV-0177) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('My Shadow Ltd')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('My Shadow Ltd'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0177',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['My Shadow Ltd', 'MOOV-0177', '0177', '177'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── U-Telecom Ltd (MOOV-0178) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('U-Telecom Ltd')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('U-Telecom Ltd'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0178',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['U-Telecom Ltd', 'MOOV-0178', '0178', '178'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Mala Leather (MOOV-0179) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Mala Leather')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Mala Leather'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0179',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Mala Leather', 'MOOV-0179', '0179', '179'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── CT Inc (DP1-0003) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('CT Inc')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('CT Inc'))
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

    UPDATE customers 
    SET dc_customer_id = 'DP1-0003',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['CT Inc', 'DP1-0003', '1'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Golf and Baby Limited (MOOV-0180) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Golf and Baby Limited')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Golf and Baby Limited'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0180',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Golf and Baby Limited', 'MOOV-0180', '0180', '180'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── IMEX China Trade Ltd (MOOV-0181) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('IMEX China Trade Ltd')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('IMEX China Trade Ltd'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0181',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['IMEX China Trade Ltd', 'MOOV-0181', '0181', '181'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Tanalia Ltd (MOOV-0182) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Tanalia Ltd')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Tanalia Ltd'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0182',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Tanalia Ltd', 'MOOV-0182', '0182', '182'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Saturn Display Ltd (MOOV-0183) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Saturn Display Ltd')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Saturn Display Ltd'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0183',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Saturn Display Ltd', 'MOOV-0183', '0183', '183'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Fun Stickers Ltd (MOOV-0184) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Fun Stickers Ltd')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Fun Stickers Ltd'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0184',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Fun Stickers Ltd', 'MOOV-0184', '0184', '184'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Perex Group Ltd (MOOV-0185) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Perex Group Ltd')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Perex Group Ltd'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0185',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Perex Group Ltd', 'MOOV-0185', '0185', '185'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── TT Proturf Ltd (MOOV-0186) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('TT Proturf Ltd')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('TT Proturf Ltd'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0186',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['TT Proturf Ltd', 'MOOV-0186', '0186', '186'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Decorative Gardens Ltd (MOOV-0187) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Decorative Gardens Ltd')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Decorative Gardens Ltd'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0187',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Decorative Gardens Ltd', 'MOOV-0187', '0187', '187'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Isoclean Ltd (MOOV-0188) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Isoclean Ltd')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Isoclean Ltd'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0188',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Isoclean Ltd', 'MOOV-0188', '0188', '188'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── C Com (DP1-0054) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('C Com')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('C Com'))
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

    UPDATE customers 
    SET dc_customer_id = 'DP1-0054',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['C Com', 'DP1-0054', '1'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Bodri Ltd (MOOV-0189) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Bodri Ltd')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Bodri Ltd'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0189',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Bodri Ltd', 'MOOV-0189', '0189', '189'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── 1st Class Uniforms & Workwear Ltd (MOOV-0190) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('1st Class Uniforms & Workwear Ltd')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('1st Class Uniforms & Workwear Ltd'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0190',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['1st Class Uniforms & Workwear Ltd', 'MOOV-0190', '0190', '190'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Carp Junky (MOOV-0191) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Carp Junky')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Carp Junky'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0191',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Carp Junky', 'MOOV-0191', '0191', '191'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Mackemshop Ltd (MOOV-0192) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Mackemshop Ltd')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Mackemshop Ltd'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0192',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Mackemshop Ltd', 'MOOV-0192', '0192', '192'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Test company CHN (TDP1-0009) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Test company CHN')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Test company CHN'))
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

    UPDATE customers 
    SET dc_customer_id = 'TDP1-0009',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Test company CHN', 'TDP1-0009', '1'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── UK Wedding Favours Ltd (MOOV-0193) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('UK Wedding Favours Ltd')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('UK Wedding Favours Ltd'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0193',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['UK Wedding Favours Ltd', 'MOOV-0193', '0193', '193'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Pure Crimson Design Limited (MOOV-0194) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Pure Crimson Design Limited')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Pure Crimson Design Limited'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0194',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Pure Crimson Design Limited', 'MOOV-0194', '0194', '194'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── ID Dance school sport & leisure wear limited (MOOV-0195) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('ID Dance school sport & leisure wear limited')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('ID Dance school sport & leisure wear limited'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0195',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['ID Dance school sport & leisure wear limited', 'MOOV-0195', '0195', '195'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Smilax Ltd (MOOV-0196) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Smilax Ltd')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Smilax Ltd'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0196',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Smilax Ltd', 'MOOV-0196', '0196', '196'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Slumba London (MOOV-0197) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Slumba London')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Slumba London'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0197',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Slumba London', 'MOOV-0197', '0197', '197'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Amba Hydraulics Ltd (MOOV-0198) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Amba Hydraulics Ltd')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Amba Hydraulics Ltd'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0198',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Amba Hydraulics Ltd', 'MOOV-0198', '0198', '198'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Ayurvedic Nature Care Ltd (MOOV-0199) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Ayurvedic Nature Care Ltd')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Ayurvedic Nature Care Ltd'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0199',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Ayurvedic Nature Care Ltd', 'MOOV-0199', '0199', '199'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Chopra Brothers Intl Group Ltd (MOOV-0200) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Chopra Brothers Intl Group Ltd')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Chopra Brothers Intl Group Ltd'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0200',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Chopra Brothers Intl Group Ltd', 'MOOV-0200', '0200', '200'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Sofa Scene Ltd (MOOV-0201) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Sofa Scene Ltd')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Sofa Scene Ltd'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0201',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Sofa Scene Ltd', 'MOOV-0201', '0201', '201'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Metal Work Supplies Ltd (MOOV-0202) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Metal Work Supplies Ltd')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Metal Work Supplies Ltd'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0202',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Metal Work Supplies Ltd', 'MOOV-0202', '0202', '202'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Meilleure Decor Ltd (MOOV-0203) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Meilleure Decor Ltd')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Meilleure Decor Ltd'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0203',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Meilleure Decor Ltd', 'MOOV-0203', '0203', '203'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Taunton Trailers (MOOV-0204) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Taunton Trailers')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Taunton Trailers'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0204',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Taunton Trailers', 'MOOV-0204', '0204', '204'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Kitloop (Kitloop) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Kitloop')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Kitloop'))
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

    UPDATE customers 
    SET dc_customer_id = 'Kitloop',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Kitloop', 'Kitloop'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Frith Holdings Ltd (MOOV-0205) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Frith Holdings Ltd')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Frith Holdings Ltd'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0205',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Frith Holdings Ltd', 'MOOV-0205', '0205', '205'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── 24Up Ltd (MOOV-0206) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('24Up Ltd')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('24Up Ltd'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0206',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['24Up Ltd', 'MOOV-0206', '0206', '206'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Scarlet Ltd (MOOV-0207) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Scarlet Ltd')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Scarlet Ltd'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0207',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Scarlet Ltd', 'MOOV-0207', '0207', '207'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── J Adams Ltd (MOOV-0208) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('J Adams Ltd')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('J Adams Ltd'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0208',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['J Adams Ltd', 'MOOV-0208', '0208', '208'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Scarlet Ltd (Scarlet Ltd) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Scarlet Ltd')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Scarlet Ltd'))
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

    UPDATE customers 
    SET dc_customer_id = 'Scarlet Ltd',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Scarlet Ltd', 'Scarlet Ltd'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Wolf Cycles Limited (MOOV-0209) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Wolf Cycles Limited')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Wolf Cycles Limited'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0209',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Wolf Cycles Limited', 'MOOV-0209', '0209', '209'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Hilltop Boarding Kennels and Cat Hotel Ltd (MOOV-0210) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Hilltop Boarding Kennels and Cat Hotel Ltd')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Hilltop Boarding Kennels and Cat Hotel Ltd'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0210',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Hilltop Boarding Kennels and Cat Hotel Ltd', 'MOOV-0210', '0210', '210'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Tam Demo Account (MOOV-0211) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Tam Demo Account')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Tam Demo Account'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0211',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Tam Demo Account', 'MOOV-0211', '0211', '211'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Truck Cranes Ltd (MOOV-0212) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Truck Cranes Ltd')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Truck Cranes Ltd'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0212',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Truck Cranes Ltd', 'MOOV-0212', '0212', '212'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Simple Camper Vans Limited (MOOV-0213) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Simple Camper Vans Limited')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Simple Camper Vans Limited'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0213',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Simple Camper Vans Limited', 'MOOV-0213', '0213', '213'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Direct Imaging Supplies Limited (MOOV-0214) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Direct Imaging Supplies Limited')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Direct Imaging Supplies Limited'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0214',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Direct Imaging Supplies Limited', 'MOOV-0214', '0214', '214'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Bodies-in-Motion Dancewear (MOOV-0215) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Bodies-in-Motion Dancewear')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Bodies-in-Motion Dancewear'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0215',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Bodies-in-Motion Dancewear', 'MOOV-0215', '0215', '215'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Marvellous Mushrooms (MOOV-0216) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Marvellous Mushrooms')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Marvellous Mushrooms'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0216',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Marvellous Mushrooms', 'MOOV-0216', '0216', '216'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Blaze''s Bistro (MOOV-0217) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Blaze''s Bistro')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Blaze''s Bistro'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0217',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Blaze''s Bistro', 'MOOV-0217', '0217', '217'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Triumph Dorset Ltd (MOOV-0218) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Triumph Dorset Ltd')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Triumph Dorset Ltd'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0218',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Triumph Dorset Ltd', 'MOOV-0218', '0218', '218'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Cold Case Investigation Unit (MOOV-0219) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Cold Case Investigation Unit')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Cold Case Investigation Unit'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0219',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Cold Case Investigation Unit', 'MOOV-0219', '0219', '219'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── WPC Supplies Ltd (MOOV-0220) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('WPC Supplies Ltd')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('WPC Supplies Ltd'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0220',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['WPC Supplies Ltd', 'MOOV-0220', '0220', '220'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── IOI Trading Ltd (MOOV-0221) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('IOI Trading Ltd')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('IOI Trading Ltd'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0221',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['IOI Trading Ltd', 'MOOV-0221', '0221', '221'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Trembling Madness Ltd (MOOV-0222) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Trembling Madness Ltd')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Trembling Madness Ltd'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0222',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Trembling Madness Ltd', 'MOOV-0222', '0222', '222'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Ashley House Printing Co Ltd (MOOV-0224) ──
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Ashley House Printing Co Ltd')
     OR EXISTS (SELECT 1 FROM unnest(billing_aliases) a WHERE LOWER(a) = LOWER('Ashley House Printing Co Ltd'))
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

    UPDATE customers 
    SET dc_customer_id = 'MOOV-0224',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Ashley House Printing Co Ltd', 'MOOV-0224', '0224', '224'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

END $$;
