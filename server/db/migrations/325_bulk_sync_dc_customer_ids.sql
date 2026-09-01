-- Migration 325: Bulk Sync Despatch Cloud Customer IDs (Non-HOF)
-- Generated automatically from customer mapping directory

DO $$
DECLARE
  v_cust_id INT;
  v_aliases TEXT[];
BEGIN

  -- ── Developer Testing (1) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = '1' OR dc_customer_id = '1')
    AND LOWER(business_name) != LOWER('Developer Testing') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Developer Testing'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Developer Testing') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Developer Testing'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Developer Testing%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = '1',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Developer Testing', '1', '1'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Developer Testing', '1', '1', 'active', 'standard', ARRAY['Developer Testing', '1', '1']);
  END IF;

  -- ── Cloud 9 Fulfilment (Cloud9) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'Cloud9' OR dc_customer_id = '9')
    AND LOWER(business_name) != LOWER('Cloud 9 Fulfilment') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Cloud 9 Fulfilment'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Cloud 9 Fulfilment') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Cloud 9 Fulfilment'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Cloud 9 Fulfilment%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'Cloud9',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Cloud 9 Fulfilment', 'Cloud9', '9'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Cloud 9 Fulfilment', 'Cloud9', 'Cloud9', 'active', 'standard', ARRAY['Cloud 9 Fulfilment', 'Cloud9', '9']);
  END IF;

  -- ── WXM - Greenplant UK Ltd (WXM-0004) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'WXM-0004' OR dc_customer_id = '0004')
    AND LOWER(business_name) != LOWER('WXM - Greenplant UK Ltd') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('WXM - Greenplant UK Ltd'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('WXM - Greenplant UK Ltd') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('WXM - Greenplant UK Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%WXM - Greenplant UK Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'WXM-0004',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['WXM - Greenplant UK Ltd', 'WXM-0004', '0004', '4'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('WXM - Greenplant UK Ltd', 'WXM-0004', 'WXM-0004', 'active', 'standard', ARRAY['WXM - Greenplant UK Ltd', 'WXM-0004', '0004', '4']);
  END IF;

  -- ── WXM - Projekt Indigo Studio Ltd (WXM-0005) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'WXM-0005' OR dc_customer_id = '0005')
    AND LOWER(business_name) != LOWER('WXM - Projekt Indigo Studio Ltd') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('WXM - Projekt Indigo Studio Ltd'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('WXM - Projekt Indigo Studio Ltd') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('WXM - Projekt Indigo Studio Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%WXM - Projekt Indigo Studio Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'WXM-0005',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['WXM - Projekt Indigo Studio Ltd', 'WXM-0005', '0005', '5'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('WXM - Projekt Indigo Studio Ltd', 'WXM-0005', 'WXM-0005', 'active', 'standard', ARRAY['WXM - Projekt Indigo Studio Ltd', 'WXM-0005', '0005', '5']);
  END IF;

  -- ── Floship-Returns (FLOSHIP) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'FLOSHIP' )
    AND LOWER(business_name) != LOWER('Floship-Returns') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Floship-Returns'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Floship-Returns') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Floship-Returns'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Floship-Returns%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'FLOSHIP',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Floship-Returns', 'FLOSHIP'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Floship-Returns', 'FLOSHIP', 'FLOSHIP', 'active', 'standard', ARRAY['Floship-Returns', 'FLOSHIP']);
  END IF;

  -- ── Keells (DP1-0201) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'DP1-0201' OR dc_customer_id = '1')
    AND LOWER(business_name) != LOWER('Keells') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Keells'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Keells') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Keells'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Keells%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'DP1-0201',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Keells', 'DP1-0201', '1'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Keells', 'DP1-0201', 'DP1-0201', 'active', 'standard', ARRAY['Keells', 'DP1-0201', '1']);
  END IF;

  -- ── MoreHustl (HOF-0031) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'HOF-0031' OR dc_customer_id = '0031')
    AND LOWER(business_name) != LOWER('MoreHustl') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('MoreHustl'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('MoreHustl') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('MoreHustl'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%MoreHustl%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'HOF-0031',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['MoreHustl', 'HOF-0031', '0031', '31'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('MoreHustl', 'HOF-0031', 'HOF-0031', 'active', 'standard', ARRAY['MoreHustl', 'HOF-0031', '0031', '31']);
  END IF;

  -- ── Suresh Deepal Herath 12 (Dep2-0006) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'Dep2-0006' OR dc_customer_id = '2')
    AND LOWER(business_name) != LOWER('Suresh Deepal Herath 12') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Suresh Deepal Herath 12'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Suresh Deepal Herath 12') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Suresh Deepal Herath 12'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Suresh Deepal Herath 12%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'Dep2-0006',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Suresh Deepal Herath 12', 'Dep2-0006', '2'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Suresh Deepal Herath 12', 'Dep2-0006', 'Dep2-0006', 'active', 'standard', ARRAY['Suresh Deepal Herath 12', 'Dep2-0006', '2']);
  END IF;

  -- ── The Chosen Baller LLC (001-0002) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = '001-0002' OR dc_customer_id = '001')
    AND LOWER(business_name) != LOWER('The Chosen Baller LLC') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('The Chosen Baller LLC'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('The Chosen Baller LLC') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('The Chosen Baller LLC'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%The Chosen Baller LLC%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = '001-0002',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['The Chosen Baller LLC', '001-0002', '001', '1'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('The Chosen Baller LLC', '001-0002', '001-0002', 'active', 'standard', ARRAY['The Chosen Baller LLC', '001-0002', '001', '1']);
  END IF;

  -- ── SND Electrical (HOF-0054) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'HOF-0054' OR dc_customer_id = '0054')
    AND LOWER(business_name) != LOWER('SND Electrical') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('SND Electrical'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('SND Electrical') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('SND Electrical'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%SND Electrical%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'HOF-0054',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['SND Electrical', 'HOF-0054', '0054', '54'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('SND Electrical', 'HOF-0054', 'HOF-0054', 'active', 'standard', ARRAY['SND Electrical', 'HOF-0054', '0054', '54']);
  END IF;

  -- ── E & L Trading Ltd (HOF-0055) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'HOF-0055' OR dc_customer_id = '0055')
    AND LOWER(business_name) != LOWER('E & L Trading Ltd') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('E & L Trading Ltd'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('E & L Trading Ltd') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('E & L Trading Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%E & L Trading Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'HOF-0055',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['E & L Trading Ltd', 'HOF-0055', '0055', '55'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('E & L Trading Ltd', 'HOF-0055', 'HOF-0055', 'active', 'standard', ARRAY['E & L Trading Ltd', 'HOF-0055', '0055', '55']);
  END IF;

  -- ── Britalitez Limited (HOF-0056) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'HOF-0056' OR dc_customer_id = '0056')
    AND LOWER(business_name) != LOWER('Britalitez Limited') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Britalitez Limited'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Britalitez Limited') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Britalitez Limited'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Britalitez Limited%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'HOF-0056',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Britalitez Limited', 'HOF-0056', '0056', '56'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Britalitez Limited', 'HOF-0056', 'HOF-0056', 'active', 'standard', ARRAY['Britalitez Limited', 'HOF-0056', '0056', '56']);
  END IF;

  -- ── Moov Prod Admin two (DD2-0003) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'DD2-0003' OR dc_customer_id = '2')
    AND LOWER(business_name) != LOWER('Moov Prod Admin two') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Moov Prod Admin two'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Moov Prod Admin two') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Moov Prod Admin two'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Moov Prod Admin two%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'DD2-0003',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Moov Prod Admin two', 'DD2-0003', '2'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Moov Prod Admin two', 'DD2-0003', 'DD2-0003', 'active', 'standard', ARRAY['Moov Prod Admin two', 'DD2-0003', '2']);
  END IF;

  -- ── Danny Snelson (HOF-0008) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'HOF-0008' OR dc_customer_id = '0008')
    AND LOWER(business_name) != LOWER('Danny Snelson') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Danny Snelson'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Danny Snelson') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Danny Snelson'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Danny Snelson%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'HOF-0008',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Danny Snelson', 'HOF-0008', '0008', '8'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Danny Snelson', 'HOF-0008', 'HOF-0008', 'active', 'standard', ARRAY['Danny Snelson', 'HOF-0008', '0008', '8']);
  END IF;

  -- ── Spare and Square (HOF-GONE) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'HOF-GONE' )
    AND LOWER(business_name) != LOWER('Spare and Square') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Spare and Square'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Spare and Square') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Spare and Square'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Spare and Square%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'HOF-GONE',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Spare and Square', 'HOF-GONE'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Spare and Square', 'HOF-GONE', 'HOF-GONE', 'active', 'standard', ARRAY['Spare and Square', 'HOF-GONE']);
  END IF;

  -- ── Crystal Nails (HOF-0009) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'HOF-0009' OR dc_customer_id = '0009')
    AND LOWER(business_name) != LOWER('Crystal Nails') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Crystal Nails'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Crystal Nails') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Crystal Nails'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Crystal Nails%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'HOF-0009',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Crystal Nails', 'HOF-0009', '0009', '9'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Crystal Nails', 'HOF-0009', 'HOF-0009', 'active', 'standard', ARRAY['Crystal Nails', 'HOF-0009', '0009', '9']);
  END IF;

  -- ── Fight Outlet (HOF-0010) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'HOF-0010' OR dc_customer_id = '0010')
    AND LOWER(business_name) != LOWER('Fight Outlet') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Fight Outlet'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Fight Outlet') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Fight Outlet'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Fight Outlet%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'HOF-0010',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Fight Outlet', 'HOF-0010', '0010', '10'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Fight Outlet', 'HOF-0010', 'HOF-0010', 'active', 'standard', ARRAY['Fight Outlet', 'HOF-0010', '0010', '10']);
  END IF;

  -- ── Prophecy Cricket Ltd (HOF-0011) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'HOF-0011' OR dc_customer_id = '0011')
    AND LOWER(business_name) != LOWER('Prophecy Cricket Ltd') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Prophecy Cricket Ltd'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Prophecy Cricket Ltd') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Prophecy Cricket Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Prophecy Cricket Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'HOF-0011',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Prophecy Cricket Ltd', 'HOF-0011', '0011', '11'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Prophecy Cricket Ltd', 'HOF-0011', 'HOF-0011', 'active', 'standard', ARRAY['Prophecy Cricket Ltd', 'HOF-0011', '0011', '11']);
  END IF;

  -- ── Seedball Limited (HOF-0012) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'HOF-0012' OR dc_customer_id = '0012')
    AND LOWER(business_name) != LOWER('Seedball Limited') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Seedball Limited'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Seedball Limited') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Seedball Limited'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Seedball Limited%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'HOF-0012',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Seedball Limited', 'HOF-0012', '0012', '12'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Seedball Limited', 'HOF-0012', 'HOF-0012', 'active', 'standard', ARRAY['Seedball Limited', 'HOF-0012', '0012', '12']);
  END IF;

  -- ── Saloos Ltd (MOOV-0002) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0002' OR dc_customer_id = '0002')
    AND LOWER(business_name) != LOWER('Saloos Ltd') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Saloos Ltd'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Saloos Ltd') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Saloos Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Saloos Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0002',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Saloos Ltd', 'MOOV-0002', '0002', '2'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Saloos Ltd', 'MOOV-0002', 'MOOV-0002', 'active', 'standard', ARRAY['Saloos Ltd', 'MOOV-0002', '0002', '2']);
  END IF;

  -- ── MP Homewares Ltd (MOOV-0003) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0003' OR dc_customer_id = '0003')
    AND LOWER(business_name) != LOWER('MP Homewares Ltd') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('MP Homewares Ltd'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('MP Homewares Ltd') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('MP Homewares Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%MP Homewares Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0003',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['MP Homewares Ltd', 'MOOV-0003', '0003', '3'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('MP Homewares Ltd', 'MOOV-0003', 'MOOV-0003', 'active', 'standard', ARRAY['MP Homewares Ltd', 'MOOV-0003', '0003', '3']);
  END IF;

  -- ── I Luv Designer (MOOV-0004) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0004' OR dc_customer_id = '0004')
    AND LOWER(business_name) != LOWER('I Luv Designer') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('I Luv Designer'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('I Luv Designer') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('I Luv Designer'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%I Luv Designer%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0004',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['I Luv Designer', 'MOOV-0004', '0004', '4'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('I Luv Designer', 'MOOV-0004', 'MOOV-0004', 'active', 'standard', ARRAY['I Luv Designer', 'MOOV-0004', '0004', '4']);
  END IF;

  -- ── 3 Devices Ltd (MOOV-0005) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0005' OR dc_customer_id = '0005')
    AND LOWER(business_name) != LOWER('3 Devices Ltd') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('3 Devices Ltd'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('3 Devices Ltd') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('3 Devices Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%3 Devices Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0005',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['3 Devices Ltd', 'MOOV-0005', '0005', '5'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('3 Devices Ltd', 'MOOV-0005', 'MOOV-0005', 'active', 'standard', ARRAY['3 Devices Ltd', 'MOOV-0005', '0005', '5']);
  END IF;

  -- ── EF TEST CUSTOMER QA EIGHT (DF1-0004) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'DF1-0004' OR dc_customer_id = '1')
    AND LOWER(business_name) != LOWER('EF TEST CUSTOMER QA EIGHT') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('EF TEST CUSTOMER QA EIGHT'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('EF TEST CUSTOMER QA EIGHT') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('EF TEST CUSTOMER QA EIGHT'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%EF TEST CUSTOMER QA EIGHT%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'DF1-0004',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['EF TEST CUSTOMER QA EIGHT', 'DF1-0004', '1'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('EF TEST CUSTOMER QA EIGHT', 'DF1-0004', 'DF1-0004', 'active', 'standard', ARRAY['EF TEST CUSTOMER QA EIGHT', 'DF1-0004', '1']);
  END IF;

  -- ── Yayo Familia Ltd (MOOV-0006) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0006' OR dc_customer_id = '0006')
    AND LOWER(business_name) != LOWER('Yayo Familia Ltd') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Yayo Familia Ltd'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Yayo Familia Ltd') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Yayo Familia Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Yayo Familia Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0006',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Yayo Familia Ltd', 'MOOV-0006', '0006', '6'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Yayo Familia Ltd', 'MOOV-0006', 'MOOV-0006', 'active', 'standard', ARRAY['Yayo Familia Ltd', 'MOOV-0006', '0006', '6']);
  END IF;

  -- ── Capatex Limited (MOOV-0007) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0007' OR dc_customer_id = '0007')
    AND LOWER(business_name) != LOWER('Capatex Limited') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Capatex Limited'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Capatex Limited') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Capatex Limited'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Capatex Limited%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0007',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Capatex Limited', 'MOOV-0007', '0007', '7'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Capatex Limited', 'MOOV-0007', 'MOOV-0007', 'active', 'standard', ARRAY['Capatex Limited', 'MOOV-0007', '0007', '7']);
  END IF;

  -- ── Trident Pumps (MOOV-0008) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0008' OR dc_customer_id = '0008')
    AND LOWER(business_name) != LOWER('Trident Pumps') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Trident Pumps'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Trident Pumps') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Trident Pumps'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Trident Pumps%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0008',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Trident Pumps', 'MOOV-0008', '0008', '8'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Trident Pumps', 'MOOV-0008', 'MOOV-0008', 'active', 'standard', ARRAY['Trident Pumps', 'MOOV-0008', '0008', '8']);
  END IF;

  -- ── Tribal Society (MOOV-0009) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0009' OR dc_customer_id = '0009')
    AND LOWER(business_name) != LOWER('Tribal Society') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Tribal Society'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Tribal Society') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Tribal Society'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Tribal Society%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0009',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Tribal Society', 'MOOV-0009', '0009', '9'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Tribal Society', 'MOOV-0009', 'MOOV-0009', 'active', 'standard', ARRAY['Tribal Society', 'MOOV-0009', '0009', '9']);
  END IF;

  -- ── Millvill Industrial Supplies Ltd (MOOV-0010) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0010' OR dc_customer_id = '0010')
    AND LOWER(business_name) != LOWER('Millvill Industrial Supplies Ltd') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Millvill Industrial Supplies Ltd'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Millvill Industrial Supplies Ltd') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Millvill Industrial Supplies Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Millvill Industrial Supplies Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0010',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Millvill Industrial Supplies Ltd', 'MOOV-0010', '0010', '10'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Millvill Industrial Supplies Ltd', 'MOOV-0010', 'MOOV-0010', 'active', 'standard', ARRAY['Millvill Industrial Supplies Ltd', 'MOOV-0010', '0010', '10']);
  END IF;

  -- ── B2B Workwear & Janitorial Ltd (MOOV-0011) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0011' OR dc_customer_id = '0011')
    AND LOWER(business_name) != LOWER('B2B Workwear & Janitorial Ltd') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('B2B Workwear & Janitorial Ltd'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('B2B Workwear & Janitorial Ltd') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('B2B Workwear & Janitorial Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%B2B Workwear & Janitorial Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0011',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['B2B Workwear & Janitorial Ltd', 'MOOV-0011', '0011', '11'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('B2B Workwear & Janitorial Ltd', 'MOOV-0011', 'MOOV-0011', 'active', 'standard', ARRAY['B2B Workwear & Janitorial Ltd', 'MOOV-0011', '0011', '11']);
  END IF;

  -- ── Britalitez Ltd (MOOV-0012) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0012' OR dc_customer_id = '0012')
    AND LOWER(business_name) != LOWER('Britalitez Ltd') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Britalitez Ltd'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Britalitez Ltd') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Britalitez Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Britalitez Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0012',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Britalitez Ltd', 'MOOV-0012', '0012', '12'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Britalitez Ltd', 'MOOV-0012', 'MOOV-0012', 'active', 'standard', ARRAY['Britalitez Ltd', 'MOOV-0012', '0012', '12']);
  END IF;

  -- ── Code Nine UK Ltd (MOOV-0013) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0013' OR dc_customer_id = '0013')
    AND LOWER(business_name) != LOWER('Code Nine UK Ltd') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Code Nine UK Ltd'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Code Nine UK Ltd') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Code Nine UK Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Code Nine UK Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0013',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Code Nine UK Ltd', 'MOOV-0013', '0013', '13'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Code Nine UK Ltd', 'MOOV-0013', 'MOOV-0013', 'active', 'standard', ARRAY['Code Nine UK Ltd', 'MOOV-0013', '0013', '13']);
  END IF;

  -- ── Edmunson Electrical Leeds (MOOV-0014) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0014' OR dc_customer_id = '0014')
    AND LOWER(business_name) != LOWER('Edmunson Electrical Leeds') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Edmunson Electrical Leeds'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Edmunson Electrical Leeds') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Edmunson Electrical Leeds'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Edmunson Electrical Leeds%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0014',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Edmunson Electrical Leeds', 'MOOV-0014', '0014', '14'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Edmunson Electrical Leeds', 'MOOV-0014', 'MOOV-0014', 'active', 'standard', ARRAY['Edmunson Electrical Leeds', 'MOOV-0014', '0014', '14']);
  END IF;

  -- ── Green Footprint Services Ltd (MOOV-0015) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0015' OR dc_customer_id = '0015')
    AND LOWER(business_name) != LOWER('Green Footprint Services Ltd') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Green Footprint Services Ltd'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Green Footprint Services Ltd') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Green Footprint Services Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Green Footprint Services Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0015',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Green Footprint Services Ltd', 'MOOV-0015', '0015', '15'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Green Footprint Services Ltd', 'MOOV-0015', 'MOOV-0015', 'active', 'standard', ARRAY['Green Footprint Services Ltd', 'MOOV-0015', '0015', '15']);
  END IF;

  -- ── EF QA CUSTOMER HS (DP1-0011) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'DP1-0011' OR dc_customer_id = '1')
    AND LOWER(business_name) != LOWER('EF QA CUSTOMER HS') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('EF QA CUSTOMER HS'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('EF QA CUSTOMER HS') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('EF QA CUSTOMER HS'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%EF QA CUSTOMER HS%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'DP1-0011',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['EF QA CUSTOMER HS', 'DP1-0011', '1'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('EF QA CUSTOMER HS', 'DP1-0011', 'DP1-0011', 'active', 'standard', ARRAY['EF QA CUSTOMER HS', 'DP1-0011', '1']);
  END IF;

  -- ── hjko (1233-0001) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = '1233-0001' OR dc_customer_id = '1233')
    AND LOWER(business_name) != LOWER('hjko') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('hjko'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('hjko') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('hjko'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%hjko%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = '1233-0001',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['hjko', '1233-0001', '1233'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('hjko', '1233-0001', '1233-0001', 'active', 'standard', ARRAY['hjko', '1233-0001', '1233']);
  END IF;

  -- ── qwerty (DF1-0007) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'DF1-0007' OR dc_customer_id = '1')
    AND LOWER(business_name) != LOWER('qwerty') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('qwerty'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('qwerty') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('qwerty'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%qwerty%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'DF1-0007',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['qwerty', 'DF1-0007', '1'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('qwerty', 'DF1-0007', 'DF1-0007', 'active', 'standard', ARRAY['qwerty', 'DF1-0007', '1']);
  END IF;

  -- ── Norfolk Saw Services (MOOV-0016) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0016' OR dc_customer_id = '0016')
    AND LOWER(business_name) != LOWER('Norfolk Saw Services') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Norfolk Saw Services'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Norfolk Saw Services') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Norfolk Saw Services'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Norfolk Saw Services%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0016',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Norfolk Saw Services', 'MOOV-0016', '0016', '16'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Norfolk Saw Services', 'MOOV-0016', 'MOOV-0016', 'active', 'standard', ARRAY['Norfolk Saw Services', 'MOOV-0016', '0016', '16']);
  END IF;

  -- ── Rilco Electrical Supplies (MOOV-0017) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0017' OR dc_customer_id = '0017')
    AND LOWER(business_name) != LOWER('Rilco Electrical Supplies') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Rilco Electrical Supplies'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Rilco Electrical Supplies') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Rilco Electrical Supplies'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Rilco Electrical Supplies%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0017',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Rilco Electrical Supplies', 'MOOV-0017', '0017', '17'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Rilco Electrical Supplies', 'MOOV-0017', 'MOOV-0017', 'active', 'standard', ARRAY['Rilco Electrical Supplies', 'MOOV-0017', '0017', '17']);
  END IF;

  -- ── asdfg (DF1-0008) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'DF1-0008' OR dc_customer_id = '1')
    AND LOWER(business_name) != LOWER('asdfg') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('asdfg'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('asdfg') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('asdfg'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%asdfg%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'DF1-0008',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['asdfg', 'DF1-0008', '1'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('asdfg', 'DF1-0008', 'DF1-0008', 'active', 'standard', ARRAY['asdfg', 'DF1-0008', '1']);
  END IF;

  -- ── Passion Accessories Ltd (MOOV-0018) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0018' OR dc_customer_id = '0018')
    AND LOWER(business_name) != LOWER('Passion Accessories Ltd') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Passion Accessories Ltd'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Passion Accessories Ltd') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Passion Accessories Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Passion Accessories Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0018',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Passion Accessories Ltd', 'MOOV-0018', '0018', '18'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Passion Accessories Ltd', 'MOOV-0018', 'MOOV-0018', 'active', 'standard', ARRAY['Passion Accessories Ltd', 'MOOV-0018', '0018', '18']);
  END IF;

  -- ── Spare and Square Ltd (MOOV-0019) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0019' OR dc_customer_id = '0019')
    AND LOWER(business_name) != LOWER('Spare and Square Ltd') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Spare and Square Ltd'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Spare and Square Ltd') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Spare and Square Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Spare and Square Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0019',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Spare and Square Ltd', 'MOOV-0019', '0019', '19'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Spare and Square Ltd', 'MOOV-0019', 'MOOV-0019', 'active', 'standard', ARRAY['Spare and Square Ltd', 'MOOV-0019', '0019', '19']);
  END IF;

  -- ── nnmm (DF1-0009) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'DF1-0009' OR dc_customer_id = '1')
    AND LOWER(business_name) != LOWER('nnmm') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('nnmm'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('nnmm') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('nnmm'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%nnmm%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'DF1-0009',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['nnmm', 'DF1-0009', '1'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('nnmm', 'DF1-0009', 'DF1-0009', 'active', 'standard', ARRAY['nnmm', 'DF1-0009', '1']);
  END IF;

  -- ── check (1233-0002) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = '1233-0002' OR dc_customer_id = '1233')
    AND LOWER(business_name) != LOWER('check') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('check'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('check') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('check'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%check%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = '1233-0002',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['check', '1233-0002', '1233'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('check', '1233-0002', '1233-0002', 'active', 'standard', ARRAY['check', '1233-0002', '1233']);
  END IF;

  -- ── SND ELECTRICAL WHOLESALERS (UK) LTD (MOOV-0020) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0020' OR dc_customer_id = '0020')
    AND LOWER(business_name) != LOWER('SND ELECTRICAL WHOLESALERS (UK) LTD') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('SND ELECTRICAL WHOLESALERS (UK) LTD'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('SND ELECTRICAL WHOLESALERS (UK) LTD') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('SND ELECTRICAL WHOLESALERS (UK) LTD'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%SND ELECTRICAL WHOLESALERS (UK) LTD%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0020',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['SND ELECTRICAL WHOLESALERS (UK) LTD', 'MOOV-0020', '0020', '20'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('SND ELECTRICAL WHOLESALERS (UK) LTD', 'MOOV-0020', 'MOOV-0020', 'active', 'standard', ARRAY['SND ELECTRICAL WHOLESALERS (UK) LTD', 'MOOV-0020', '0020', '20']);
  END IF;

  -- ── Efutures (DP1-0014) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'DP1-0014' OR dc_customer_id = '1')
    AND LOWER(business_name) != LOWER('Efutures') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Efutures'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Efutures') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Efutures'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Efutures%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'DP1-0014',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Efutures', 'DP1-0014', '1'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Efutures', 'DP1-0014', 'DP1-0014', 'active', 'standard', ARRAY['Efutures', 'DP1-0014', '1']);
  END IF;

  -- ── Lifemax Limited (MOOV-0021) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0021' OR dc_customer_id = '0021')
    AND LOWER(business_name) != LOWER('Lifemax Limited') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Lifemax Limited'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Lifemax Limited') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Lifemax Limited'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Lifemax Limited%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0021',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Lifemax Limited', 'MOOV-0021', '0021', '21'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Lifemax Limited', 'MOOV-0021', 'MOOV-0021', 'active', 'standard', ARRAY['Lifemax Limited', 'MOOV-0021', '0021', '21']);
  END IF;

  -- ── IFS (DD2-0005) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'DD2-0005' OR dc_customer_id = '2')
    AND LOWER(business_name) != LOWER('IFS') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('IFS'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('IFS') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('IFS'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%IFS%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'DD2-0005',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['IFS', 'DD2-0005', '2'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('IFS', 'DD2-0005', 'DD2-0005', 'active', 'standard', ARRAY['IFS', 'DD2-0005', '2']);
  END IF;

  -- ── M and J Brothers Ltd (MOOV-0022) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0022' OR dc_customer_id = '0022')
    AND LOWER(business_name) != LOWER('M and J Brothers Ltd') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('M and J Brothers Ltd'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('M and J Brothers Ltd') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('M and J Brothers Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%M and J Brothers Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0022',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['M and J Brothers Ltd', 'MOOV-0022', '0022', '22'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('M and J Brothers Ltd', 'MOOV-0022', 'MOOV-0022', 'active', 'standard', ARRAY['M and J Brothers Ltd', 'MOOV-0022', '0022', '22']);
  END IF;

  -- ── Beacons and Lightbars (MOOV-0023) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0023' OR dc_customer_id = '0023')
    AND LOWER(business_name) != LOWER('Beacons and Lightbars') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Beacons and Lightbars'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Beacons and Lightbars') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Beacons and Lightbars'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Beacons and Lightbars%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0023',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Beacons and Lightbars', 'MOOV-0023', '0023', '23'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Beacons and Lightbars', 'MOOV-0023', 'MOOV-0023', 'active', 'standard', ARRAY['Beacons and Lightbars', 'MOOV-0023', '0023', '23']);
  END IF;

  -- ── DDUP International Ltd (MOOV-0024) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0024' OR dc_customer_id = '0024')
    AND LOWER(business_name) != LOWER('DDUP International Ltd') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('DDUP International Ltd'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('DDUP International Ltd') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('DDUP International Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%DDUP International Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0024',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['DDUP International Ltd', 'MOOV-0024', '0024', '24'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('DDUP International Ltd', 'MOOV-0024', 'MOOV-0024', 'active', 'standard', ARRAY['DDUP International Ltd', 'MOOV-0024', '0024', '24']);
  END IF;

  -- ── Granola Kitchen Ltd (MOOV-0025) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0025' OR dc_customer_id = '0025')
    AND LOWER(business_name) != LOWER('Granola Kitchen Ltd') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Granola Kitchen Ltd'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Granola Kitchen Ltd') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Granola Kitchen Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Granola Kitchen Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0025',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Granola Kitchen Ltd', 'MOOV-0025', '0025', '25'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Granola Kitchen Ltd', 'MOOV-0025', 'MOOV-0025', 'active', 'standard', ARRAY['Granola Kitchen Ltd', 'MOOV-0025', '0025', '25']);
  END IF;

  -- ── Pet & Grooming Supplies Ltd (MOOV-0026) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0026' OR dc_customer_id = '0026')
    AND LOWER(business_name) != LOWER('Pet & Grooming Supplies Ltd') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Pet & Grooming Supplies Ltd'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Pet & Grooming Supplies Ltd') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Pet & Grooming Supplies Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Pet & Grooming Supplies Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0026',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Pet & Grooming Supplies Ltd', 'MOOV-0026', '0026', '26'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Pet & Grooming Supplies Ltd', 'MOOV-0026', 'MOOV-0026', 'active', 'standard', ARRAY['Pet & Grooming Supplies Ltd', 'MOOV-0026', '0026', '26']);
  END IF;

  -- ── SRR3 (DF1-0010) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'DF1-0010' OR dc_customer_id = '1')
    AND LOWER(business_name) != LOWER('SRR3') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('SRR3'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('SRR3') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('SRR3'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%SRR3%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'DF1-0010',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['SRR3', 'DF1-0010', '1'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('SRR3', 'DF1-0010', 'DF1-0010', 'active', 'standard', ARRAY['SRR3', 'DF1-0010', '1']);
  END IF;

  -- ── Uni4mers (Uni4mers) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'Uni4mers' OR dc_customer_id = '4')
    AND LOWER(business_name) != LOWER('Uni4mers') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Uni4mers'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Uni4mers') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Uni4mers'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Uni4mers%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'Uni4mers',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Uni4mers', 'Uni4mers', '4'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Uni4mers', 'Uni4mers', 'Uni4mers', 'active', 'standard', ARRAY['Uni4mers', 'Uni4mers', '4']);
  END IF;

  -- ── Efutures4 (DP1-0016) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'DP1-0016' OR dc_customer_id = '1')
    AND LOWER(business_name) != LOWER('Efutures4') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Efutures4'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Efutures4') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Efutures4'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Efutures4%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'DP1-0016',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Efutures4', 'DP1-0016', '1'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Efutures4', 'DP1-0016', 'DP1-0016', 'active', 'standard', ARRAY['Efutures4', 'DP1-0016', '1']);
  END IF;

  -- ── EFtures5 (DP1-0017) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'DP1-0017' OR dc_customer_id = '1')
    AND LOWER(business_name) != LOWER('EFtures5') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('EFtures5'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('EFtures5') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('EFtures5'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%EFtures5%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'DP1-0017',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['EFtures5', 'DP1-0017', '1'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('EFtures5', 'DP1-0017', 'DP1-0017', 'active', 'standard', ARRAY['EFtures5', 'DP1-0017', '1']);
  END IF;

  -- ── Sharkeye Wheel Aligners UK Ltd (MOOV-0027) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0027' OR dc_customer_id = '0027')
    AND LOWER(business_name) != LOWER('Sharkeye Wheel Aligners UK Ltd') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Sharkeye Wheel Aligners UK Ltd'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Sharkeye Wheel Aligners UK Ltd') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Sharkeye Wheel Aligners UK Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Sharkeye Wheel Aligners UK Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0027',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Sharkeye Wheel Aligners UK Ltd', 'MOOV-0027', '0027', '27'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Sharkeye Wheel Aligners UK Ltd', 'MOOV-0027', 'MOOV-0027', 'active', 'standard', ARRAY['Sharkeye Wheel Aligners UK Ltd', 'MOOV-0027', '0027', '27']);
  END IF;

  -- ── Efutures5 (DDJ1-0001) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'DDJ1-0001' OR dc_customer_id = '1')
    AND LOWER(business_name) != LOWER('Efutures5') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Efutures5'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Efutures5') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Efutures5'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Efutures5%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'DDJ1-0001',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Efutures5', 'DDJ1-0001', '1'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Efutures5', 'DDJ1-0001', 'DDJ1-0001', 'active', 'standard', ARRAY['Efutures5', 'DDJ1-0001', '1']);
  END IF;

  -- ── The Hanger Store (MOOV-0028) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0028' OR dc_customer_id = '0028')
    AND LOWER(business_name) != LOWER('The Hanger Store') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('The Hanger Store'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('The Hanger Store') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('The Hanger Store'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%The Hanger Store%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0028',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['The Hanger Store', 'MOOV-0028', '0028', '28'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('The Hanger Store', 'MOOV-0028', 'MOOV-0028', 'active', 'standard', ARRAY['The Hanger Store', 'MOOV-0028', '0028', '28']);
  END IF;

  -- ── How High Brands (MOOV-0029) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0029' OR dc_customer_id = '0029')
    AND LOWER(business_name) != LOWER('How High Brands') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('How High Brands'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('How High Brands') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('How High Brands'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%How High Brands%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0029',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['How High Brands', 'MOOV-0029', '0029', '29'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('How High Brands', 'MOOV-0029', 'MOOV-0029', 'active', 'standard', ARRAY['How High Brands', 'MOOV-0029', '0029', '29']);
  END IF;

  -- ── SQA (DP1-0019) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'DP1-0019' OR dc_customer_id = '1')
    AND LOWER(business_name) != LOWER('SQA') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('SQA'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('SQA') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('SQA'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%SQA%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'DP1-0019',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['SQA', 'DP1-0019', '1'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('SQA', 'DP1-0019', 'DP1-0019', 'active', 'standard', ARRAY['SQA', 'DP1-0019', '1']);
  END IF;

  -- ── SINGER (DP1-0021) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'DP1-0021' OR dc_customer_id = '1')
    AND LOWER(business_name) != LOWER('SINGER') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('SINGER'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('SINGER') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('SINGER'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%SINGER%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'DP1-0021',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['SINGER', 'DP1-0021', '1'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('SINGER', 'DP1-0021', 'DP1-0021', 'active', 'standard', ARRAY['SINGER', 'DP1-0021', '1']);
  END IF;

  -- ── Greenplant UK Ltd (MOOV-0030) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0030' OR dc_customer_id = '0030')
    AND LOWER(business_name) != LOWER('Greenplant UK Ltd') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Greenplant UK Ltd'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Greenplant UK Ltd') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Greenplant UK Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Greenplant UK Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0030',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Greenplant UK Ltd', 'MOOV-0030', '0030', '30'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Greenplant UK Ltd', 'MOOV-0030', 'MOOV-0030', 'active', 'standard', ARRAY['Greenplant UK Ltd', 'MOOV-0030', '0030', '30']);
  END IF;

  -- ── Assetee (DP1-0024) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'DP1-0024' OR dc_customer_id = '1')
    AND LOWER(business_name) != LOWER('Assetee') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Assetee'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Assetee') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Assetee'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Assetee%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'DP1-0024',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Assetee', 'DP1-0024', '1'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Assetee', 'DP1-0024', 'DP1-0024', 'active', 'standard', ARRAY['Assetee', 'DP1-0024', '1']);
  END IF;

  -- ── Mobberley Cakes Ltd (MOOV-0031) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0031' OR dc_customer_id = '0031')
    AND LOWER(business_name) != LOWER('Mobberley Cakes Ltd') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Mobberley Cakes Ltd'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Mobberley Cakes Ltd') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Mobberley Cakes Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Mobberley Cakes Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0031',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Mobberley Cakes Ltd', 'MOOV-0031', '0031', '31'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Mobberley Cakes Ltd', 'MOOV-0031', 'MOOV-0031', 'active', 'standard', ARRAY['Mobberley Cakes Ltd', 'MOOV-0031', '0031', '31']);
  END IF;

  -- ── Ecom Group UK Limited (MOOV-0032) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0032' OR dc_customer_id = '0032')
    AND LOWER(business_name) != LOWER('Ecom Group UK Limited') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Ecom Group UK Limited'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Ecom Group UK Limited') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Ecom Group UK Limited'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Ecom Group UK Limited%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0032',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Ecom Group UK Limited', 'MOOV-0032', '0032', '32'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Ecom Group UK Limited', 'MOOV-0032', 'MOOV-0032', 'active', 'standard', ARRAY['Ecom Group UK Limited', 'MOOV-0032', '0032', '32']);
  END IF;

  -- ── Heaven Scent Incense Ltd (MOOV-0033) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0033' OR dc_customer_id = '0033')
    AND LOWER(business_name) != LOWER('Heaven Scent Incense Ltd') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Heaven Scent Incense Ltd'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Heaven Scent Incense Ltd') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Heaven Scent Incense Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Heaven Scent Incense Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0033',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Heaven Scent Incense Ltd', 'MOOV-0033', '0033', '33'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Heaven Scent Incense Ltd', 'MOOV-0033', 'MOOV-0033', 'active', 'standard', ARRAY['Heaven Scent Incense Ltd', 'MOOV-0033', '0033', '33']);
  END IF;

  -- ── EFUTURES6 (DP1-0025) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'DP1-0025' OR dc_customer_id = '1')
    AND LOWER(business_name) != LOWER('EFUTURES6') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('EFUTURES6'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('EFUTURES6') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('EFUTURES6'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%EFUTURES6%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'DP1-0025',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['EFUTURES6', 'DP1-0025', '1'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('EFUTURES6', 'DP1-0025', 'DP1-0025', 'active', 'standard', ARRAY['EFUTURES6', 'DP1-0025', '1']);
  END IF;

  -- ── AJP1 (AJP1) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'AJP1' OR dc_customer_id = '1')
    AND LOWER(business_name) != LOWER('AJP1') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('AJP1'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('AJP1') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('AJP1'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%AJP1%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'AJP1',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['AJP1', 'AJP1', '1'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('AJP1', 'AJP1', 'AJP1', 'active', 'standard', ARRAY['AJP1', 'AJP1', '1']);
  END IF;

  -- ── AJP2 (AJP2) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'AJP2' OR dc_customer_id = '2')
    AND LOWER(business_name) != LOWER('AJP2') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('AJP2'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('AJP2') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('AJP2'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%AJP2%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'AJP2',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['AJP2', 'AJP2', '2'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('AJP2', 'AJP2', 'AJP2', 'active', 'standard', ARRAY['AJP2', 'AJP2', '2']);
  END IF;

  -- ── AJP3 (AJP3) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'AJP3' OR dc_customer_id = '3')
    AND LOWER(business_name) != LOWER('AJP3') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('AJP3'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('AJP3') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('AJP3'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%AJP3%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'AJP3',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['AJP3', 'AJP3', '3'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('AJP3', 'AJP3', 'AJP3', 'active', 'standard', ARRAY['AJP3', 'AJP3', '3']);
  END IF;

  -- ── AJP4 (AJP4) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'AJP4' OR dc_customer_id = '4')
    AND LOWER(business_name) != LOWER('AJP4') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('AJP4'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('AJP4') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('AJP4'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%AJP4%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'AJP4',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['AJP4', 'AJP4', '4'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('AJP4', 'AJP4', 'AJP4', 'active', 'standard', ARRAY['AJP4', 'AJP4', '4']);
  END IF;

  -- ── AJP5 (AJP5) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'AJP5' OR dc_customer_id = '5')
    AND LOWER(business_name) != LOWER('AJP5') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('AJP5'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('AJP5') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('AJP5'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%AJP5%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'AJP5',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['AJP5', 'AJP5', '5'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('AJP5', 'AJP5', 'AJP5', 'active', 'standard', ARRAY['AJP5', 'AJP5', '5']);
  END IF;

  -- ── Info Technology Supply (MOOV-0034) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0034' OR dc_customer_id = '0034')
    AND LOWER(business_name) != LOWER('Info Technology Supply') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Info Technology Supply'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Info Technology Supply') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Info Technology Supply'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Info Technology Supply%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0034',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Info Technology Supply', 'MOOV-0034', '0034', '34'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Info Technology Supply', 'MOOV-0034', 'MOOV-0034', 'active', 'standard', ARRAY['Info Technology Supply', 'MOOV-0034', '0034', '34']);
  END IF;

  -- ── 99X (DP1-0027) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'DP1-0027' OR dc_customer_id = '1')
    AND LOWER(business_name) != LOWER('99X') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('99X'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('99X') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('99X'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%99X%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'DP1-0027',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['99X', 'DP1-0027', '1'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('99X', 'DP1-0027', 'DP1-0027', 'active', 'standard', ARRAY['99X', 'DP1-0027', '1']);
  END IF;

  -- ── Aegean Sea Ltd (MOOV-0035) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0035' OR dc_customer_id = '0035')
    AND LOWER(business_name) != LOWER('Aegean Sea Ltd') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Aegean Sea Ltd'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Aegean Sea Ltd') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Aegean Sea Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Aegean Sea Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0035',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Aegean Sea Ltd', 'MOOV-0035', '0035', '35'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Aegean Sea Ltd', 'MOOV-0035', 'MOOV-0035', 'active', 'standard', ARRAY['Aegean Sea Ltd', 'MOOV-0035', '0035', '35']);
  END IF;

  -- ── LB Finance (DP1-0028) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'DP1-0028' OR dc_customer_id = '1')
    AND LOWER(business_name) != LOWER('LB Finance') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('LB Finance'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('LB Finance') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('LB Finance'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%LB Finance%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'DP1-0028',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['LB Finance', 'DP1-0028', '1'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('LB Finance', 'DP1-0028', 'DP1-0028', 'active', 'standard', ARRAY['LB Finance', 'DP1-0028', '1']);
  END IF;

  -- ── DM AGENCY AND DISTRIBUTION (MOOV-0036) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0036' OR dc_customer_id = '0036')
    AND LOWER(business_name) != LOWER('DM AGENCY AND DISTRIBUTION') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('DM AGENCY AND DISTRIBUTION'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('DM AGENCY AND DISTRIBUTION') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('DM AGENCY AND DISTRIBUTION'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%DM AGENCY AND DISTRIBUTION%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0036',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['DM AGENCY AND DISTRIBUTION', 'MOOV-0036', '0036', '36'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('DM AGENCY AND DISTRIBUTION', 'MOOV-0036', 'MOOV-0036', 'active', 'standard', ARRAY['DM AGENCY AND DISTRIBUTION', 'MOOV-0036', '0036', '36']);
  END IF;

  -- ── DDPL (DDPL) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'DDPL' )
    AND LOWER(business_name) != LOWER('DDPL') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('DDPL'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('DDPL') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('DDPL'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%DDPL%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'DDPL',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['DDPL', 'DDPL'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('DDPL', 'DDPL', 'DDPL', 'active', 'standard', ARRAY['DDPL', 'DDPL']);
  END IF;

  -- ── Aglory MERCHANT ENTERPRISES LIMITED (Aglory MERCHANT ENTERPRISES LIMITED) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'Aglory MERCHANT ENTERPRISES LIMITED' )
    AND LOWER(business_name) != LOWER('Aglory MERCHANT ENTERPRISES LIMITED') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Aglory MERCHANT ENTERPRISES LIMITED'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Aglory MERCHANT ENTERPRISES LIMITED') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Aglory MERCHANT ENTERPRISES LIMITED'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Aglory MERCHANT ENTERPRISES LIMITED%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'Aglory MERCHANT ENTERPRISES LIMITED',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Aglory MERCHANT ENTERPRISES LIMITED', 'Aglory MERCHANT ENTERPRISES LIMITED'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Aglory MERCHANT ENTERPRISES LIMITED', 'Aglory MERCHANT ENTERPRISES LIMITED', 'Aglory MERCHANT ENTERPRISES LIMITED', 'active', 'standard', ARRAY['Aglory MERCHANT ENTERPRISES LIMITED', 'Aglory MERCHANT ENTERPRISES LIMITED']);
  END IF;

  -- ── HCL (DP1-0029) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'DP1-0029' OR dc_customer_id = '1')
    AND LOWER(business_name) != LOWER('HCL') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('HCL'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('HCL') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('HCL'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%HCL%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'DP1-0029',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['HCL', 'DP1-0029', '1'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('HCL', 'DP1-0029', 'DP1-0029', 'active', 'standard', ARRAY['HCL', 'DP1-0029', '1']);
  END IF;

  -- ── NEXT (DP1-0030) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'DP1-0030' OR dc_customer_id = '1')
    AND LOWER(business_name) != LOWER('NEXT') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('NEXT'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('NEXT') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('NEXT'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%NEXT%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'DP1-0030',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['NEXT', 'DP1-0030', '1'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('NEXT', 'DP1-0030', 'DP1-0030', 'active', 'standard', ARRAY['NEXT', 'DP1-0030', '1']);
  END IF;

  -- ── E Square (E Square) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'E Square' )
    AND LOWER(business_name) != LOWER('E Square') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('E Square'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('E Square') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('E Square'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%E Square%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'E Square',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['E Square', 'E Square'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('E Square', 'E Square', 'E Square', 'active', 'standard', ARRAY['E Square', 'E Square']);
  END IF;

  -- ── Natural Spa Supplies Ltd (MOOV-0037) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0037' OR dc_customer_id = '0037')
    AND LOWER(business_name) != LOWER('Natural Spa Supplies Ltd') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Natural Spa Supplies Ltd'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Natural Spa Supplies Ltd') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Natural Spa Supplies Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Natural Spa Supplies Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0037',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Natural Spa Supplies Ltd', 'MOOV-0037', '0037', '37'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Natural Spa Supplies Ltd', 'MOOV-0037', 'MOOV-0037', 'active', 'standard', ARRAY['Natural Spa Supplies Ltd', 'MOOV-0037', '0037', '37']);
  END IF;

  -- ── JOY ASIAN FOOD & GROCERY LIMITED (MOOV-0038) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0038' OR dc_customer_id = '0038')
    AND LOWER(business_name) != LOWER('JOY ASIAN FOOD & GROCERY LIMITED') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('JOY ASIAN FOOD & GROCERY LIMITED'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('JOY ASIAN FOOD & GROCERY LIMITED') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('JOY ASIAN FOOD & GROCERY LIMITED'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%JOY ASIAN FOOD & GROCERY LIMITED%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0038',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['JOY ASIAN FOOD & GROCERY LIMITED', 'MOOV-0038', '0038', '38'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('JOY ASIAN FOOD & GROCERY LIMITED', 'MOOV-0038', 'MOOV-0038', 'active', 'standard', ARRAY['JOY ASIAN FOOD & GROCERY LIMITED', 'MOOV-0038', '0038', '38']);
  END IF;

  -- ── Bakers Street Limited (MOOV-0039) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0039' OR dc_customer_id = '0039')
    AND LOWER(business_name) != LOWER('Bakers Street Limited') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Bakers Street Limited'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Bakers Street Limited') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Bakers Street Limited'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Bakers Street Limited%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0039',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Bakers Street Limited', 'MOOV-0039', '0039', '39'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Bakers Street Limited', 'MOOV-0039', 'MOOV-0039', 'active', 'standard', ARRAY['Bakers Street Limited', 'MOOV-0039', '0039', '39']);
  END IF;

  -- ── 8ack (8ack) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = '8ack' OR dc_customer_id = '8')
    AND LOWER(business_name) != LOWER('8ack') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('8ack'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('8ack') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('8ack'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%8ack%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = '8ack',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['8ack', '8ack', '8'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('8ack', '8ack', '8ack', 'active', 'standard', ARRAY['8ack', '8ack', '8']);
  END IF;

  -- ── Jane Scott Ceramics (MOOV-0040) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0040' OR dc_customer_id = '0040')
    AND LOWER(business_name) != LOWER('Jane Scott Ceramics') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Jane Scott Ceramics'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Jane Scott Ceramics') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Jane Scott Ceramics'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Jane Scott Ceramics%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0040',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Jane Scott Ceramics', 'MOOV-0040', '0040', '40'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Jane Scott Ceramics', 'MOOV-0040', 'MOOV-0040', 'active', 'standard', ARRAY['Jane Scott Ceramics', 'MOOV-0040', '0040', '40']);
  END IF;

  -- ── SCR DISTRIBUTION (MOOV-0041) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0041' OR dc_customer_id = '0041')
    AND LOWER(business_name) != LOWER('SCR DISTRIBUTION') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('SCR DISTRIBUTION'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('SCR DISTRIBUTION') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('SCR DISTRIBUTION'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%SCR DISTRIBUTION%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0041',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['SCR DISTRIBUTION', 'MOOV-0041', '0041', '41'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('SCR DISTRIBUTION', 'MOOV-0041', 'MOOV-0041', 'active', 'standard', ARRAY['SCR DISTRIBUTION', 'MOOV-0041', '0041', '41']);
  END IF;

  -- ── Megway (Megway Parcels) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'Megway Parcels' )
    AND LOWER(business_name) != LOWER('Megway') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Megway'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Megway') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Megway'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Megway%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'Megway Parcels',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Megway', 'Megway Parcels'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Megway', 'Megway Parcels', 'Megway Parcels', 'active', 'standard', ARRAY['Megway', 'Megway Parcels']);
  END IF;

  -- ── Lather Up (MOOV-0042) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0042' OR dc_customer_id = '0042')
    AND LOWER(business_name) != LOWER('Lather Up') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Lather Up'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Lather Up') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Lather Up'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Lather Up%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0042',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Lather Up', 'MOOV-0042', '0042', '42'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Lather Up', 'MOOV-0042', 'MOOV-0042', 'active', 'standard', ARRAY['Lather Up', 'MOOV-0042', '0042', '42']);
  END IF;

  -- ── Impoxer LTD T/A Makrom (MOOV-0043) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0043' OR dc_customer_id = '0043')
    AND LOWER(business_name) != LOWER('Impoxer LTD T/A Makrom') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Impoxer LTD T/A Makrom'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Impoxer LTD T/A Makrom') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Impoxer LTD T/A Makrom'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Impoxer LTD T/A Makrom%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0043',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Impoxer LTD T/A Makrom', 'MOOV-0043', '0043', '43'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Impoxer LTD T/A Makrom', 'MOOV-0043', 'MOOV-0043', 'active', 'standard', ARRAY['Impoxer LTD T/A Makrom', 'MOOV-0043', '0043', '43']);
  END IF;

  -- ── Vertura Ltd (MOOV-0045) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0045' OR dc_customer_id = '0045')
    AND LOWER(business_name) != LOWER('Vertura Ltd') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Vertura Ltd'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Vertura Ltd') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Vertura Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Vertura Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0045',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Vertura Ltd', 'MOOV-0045', '0045', '45'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Vertura Ltd', 'MOOV-0045', 'MOOV-0045', 'active', 'standard', ARRAY['Vertura Ltd', 'MOOV-0045', '0045', '45']);
  END IF;

  -- ── Roar Gill Ltd (MOOV-0046) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0046' OR dc_customer_id = '0046')
    AND LOWER(business_name) != LOWER('Roar Gill Ltd') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Roar Gill Ltd'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Roar Gill Ltd') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Roar Gill Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Roar Gill Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0046',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Roar Gill Ltd', 'MOOV-0046', '0046', '46'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Roar Gill Ltd', 'MOOV-0046', 'MOOV-0046', 'active', 'standard', ARRAY['Roar Gill Ltd', 'MOOV-0046', '0046', '46']);
  END IF;

  -- ── Oriental Mart (Oriental Mart) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'Oriental Mart' )
    AND LOWER(business_name) != LOWER('Oriental Mart') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Oriental Mart'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Oriental Mart') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Oriental Mart'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Oriental Mart%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'Oriental Mart',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Oriental Mart', 'Oriental Mart'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Oriental Mart', 'Oriental Mart', 'Oriental Mart', 'active', 'standard', ARRAY['Oriental Mart', 'Oriental Mart']);
  END IF;

  -- ── Reevo (MOOV-0047) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0047' OR dc_customer_id = '0047')
    AND LOWER(business_name) != LOWER('Reevo') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Reevo'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Reevo') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Reevo'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Reevo%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0047',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Reevo', 'MOOV-0047', '0047', '47'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Reevo', 'MOOV-0047', 'MOOV-0047', 'active', 'standard', ARRAY['Reevo', 'MOOV-0047', '0047', '47']);
  END IF;

  -- ── Lace and Favour Ltd (MOOV-0048) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0048' OR dc_customer_id = '0048')
    AND LOWER(business_name) != LOWER('Lace and Favour Ltd') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Lace and Favour Ltd'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Lace and Favour Ltd') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Lace and Favour Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Lace and Favour Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0048',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Lace and Favour Ltd', 'MOOV-0048', '0048', '48'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Lace and Favour Ltd', 'MOOV-0048', 'MOOV-0048', 'active', 'standard', ARRAY['Lace and Favour Ltd', 'MOOV-0048', '0048', '48']);
  END IF;

  -- ── Andersen EV (Andersen EV) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'Andersen EV' )
    AND LOWER(business_name) != LOWER('Andersen EV') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Andersen EV'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Andersen EV') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Andersen EV'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Andersen EV%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'Andersen EV',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Andersen EV', 'Andersen EV'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Andersen EV', 'Andersen EV', 'Andersen EV', 'active', 'standard', ARRAY['Andersen EV', 'Andersen EV']);
  END IF;

  -- ── Henry And Tosh Limited (MOOV-0050) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0050' OR dc_customer_id = '0050')
    AND LOWER(business_name) != LOWER('Henry And Tosh Limited') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Henry And Tosh Limited'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Henry And Tosh Limited') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Henry And Tosh Limited'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Henry And Tosh Limited%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0050',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Henry And Tosh Limited', 'MOOV-0050', '0050', '50'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Henry And Tosh Limited', 'MOOV-0050', 'MOOV-0050', 'active', 'standard', ARRAY['Henry And Tosh Limited', 'MOOV-0050', '0050', '50']);
  END IF;

  -- ── March Laboratories Ltd / Ace Canine Healthcare (MOOV-0051) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0051' OR dc_customer_id = '0051')
    AND LOWER(business_name) != LOWER('March Laboratories Ltd / Ace Canine Healthcare') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('March Laboratories Ltd / Ace Canine Healthcare'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('March Laboratories Ltd / Ace Canine Healthcare') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('March Laboratories Ltd / Ace Canine Healthcare'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%March Laboratories Ltd / Ace Canine Healthcare%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0051',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['March Laboratories Ltd / Ace Canine Healthcare', 'MOOV-0051', '0051', '51'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('March Laboratories Ltd / Ace Canine Healthcare', 'MOOV-0051', 'MOOV-0051', 'active', 'standard', ARRAY['March Laboratories Ltd / Ace Canine Healthcare', 'MOOV-0051', '0051', '51']);
  END IF;

  -- ── May2024 (DF1-0012) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'DF1-0012' OR dc_customer_id = '1')
    AND LOWER(business_name) != LOWER('May2024') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('May2024'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('May2024') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('May2024'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%May2024%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'DF1-0012',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['May2024', 'DF1-0012', '1'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('May2024', 'DF1-0012', 'DF1-0012', 'active', 'standard', ARRAY['May2024', 'DF1-0012', '1']);
  END IF;

  -- ── test 2024 (DF1-0013) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'DF1-0013' OR dc_customer_id = '1')
    AND LOWER(business_name) != LOWER('test 2024') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('test 2024'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('test 2024') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('test 2024'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%test 2024%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'DF1-0013',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['test 2024', 'DF1-0013', '1'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('test 2024', 'DF1-0013', 'DF1-0013', 'active', 'standard', ARRAY['test 2024', 'DF1-0013', '1']);
  END IF;

  -- ── testii (DF1-0014) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'DF1-0014' OR dc_customer_id = '1')
    AND LOWER(business_name) != LOWER('testii') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('testii'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('testii') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('testii'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%testii%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'DF1-0014',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['testii', 'DF1-0014', '1'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('testii', 'DF1-0014', 'DF1-0014', 'active', 'standard', ARRAY['testii', 'DF1-0014', '1']);
  END IF;

  -- ── Abans Company (DQA1-0001) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'DQA1-0001' OR dc_customer_id = '1')
    AND LOWER(business_name) != LOWER('Abans Company') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Abans Company'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Abans Company') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Abans Company'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Abans Company%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'DQA1-0001',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Abans Company', 'DQA1-0001', '1'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Abans Company', 'DQA1-0001', 'DQA1-0001', 'active', 'standard', ARRAY['Abans Company', 'DQA1-0001', '1']);
  END IF;

  -- ── Neil Test (MOOV-0053) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0053' OR dc_customer_id = '0053')
    AND LOWER(business_name) != LOWER('Neil Test') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Neil Test'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Neil Test') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Neil Test'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Neil Test%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0053',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Neil Test', 'MOOV-0053', '0053', '53'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Neil Test', 'MOOV-0053', 'MOOV-0053', 'active', 'standard', ARRAY['Neil Test', 'MOOV-0053', '0053', '53']);
  END IF;

  -- ── Moov Parcel (MOOV-0054) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0054' OR dc_customer_id = '0054')
    AND LOWER(business_name) != LOWER('Moov Parcel') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Moov Parcel'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Moov Parcel') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Moov Parcel'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Moov Parcel%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0054',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Moov Parcel', 'MOOV-0054', '0054', '54'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Moov Parcel', 'MOOV-0054', 'MOOV-0054', 'active', 'standard', ARRAY['Moov Parcel', 'MOOV-0054', '0054', '54']);
  END IF;

  -- ── Ultra Soft Water Softeners Ltd (MOOV-0056) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0056' OR dc_customer_id = '0056')
    AND LOWER(business_name) != LOWER('Ultra Soft Water Softeners Ltd') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Ultra Soft Water Softeners Ltd'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Ultra Soft Water Softeners Ltd') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Ultra Soft Water Softeners Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Ultra Soft Water Softeners Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0056',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Ultra Soft Water Softeners Ltd', 'MOOV-0056', '0056', '56'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Ultra Soft Water Softeners Ltd', 'MOOV-0056', 'MOOV-0056', 'active', 'standard', ARRAY['Ultra Soft Water Softeners Ltd', 'MOOV-0056', '0056', '56']);
  END IF;

  -- ── UK Optics Ltd (MOOV-0057) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0057' OR dc_customer_id = '0057')
    AND LOWER(business_name) != LOWER('UK Optics Ltd') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('UK Optics Ltd'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('UK Optics Ltd') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('UK Optics Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%UK Optics Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0057',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['UK Optics Ltd', 'MOOV-0057', '0057', '57'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('UK Optics Ltd', 'MOOV-0057', 'MOOV-0057', 'active', 'standard', ARRAY['UK Optics Ltd', 'MOOV-0057', '0057', '57']);
  END IF;

  -- ── CLIPHER LTD (MOOV-0058) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0058' OR dc_customer_id = '0058')
    AND LOWER(business_name) != LOWER('CLIPHER LTD') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('CLIPHER LTD'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('CLIPHER LTD') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('CLIPHER LTD'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%CLIPHER LTD%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0058',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['CLIPHER LTD', 'MOOV-0058', '0058', '58'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('CLIPHER LTD', 'MOOV-0058', 'MOOV-0058', 'active', 'standard', ARRAY['CLIPHER LTD', 'MOOV-0058', '0058', '58']);
  END IF;

  -- ── Damro (DF1-0015) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'DF1-0015' OR dc_customer_id = '1')
    AND LOWER(business_name) != LOWER('Damro') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Damro'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Damro') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Damro'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Damro%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'DF1-0015',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Damro', 'DF1-0015', '1'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Damro', 'DF1-0015', 'DF1-0015', 'active', 'standard', ARRAY['Damro', 'DF1-0015', '1']);
  END IF;

  -- ── Teleseen (DP1-0034) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'DP1-0034' OR dc_customer_id = '1')
    AND LOWER(business_name) != LOWER('Teleseen') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Teleseen'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Teleseen') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Teleseen'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Teleseen%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'DP1-0034',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Teleseen', 'DP1-0034', '1'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Teleseen', 'DP1-0034', 'DP1-0034', 'active', 'standard', ARRAY['Teleseen', 'DP1-0034', '1']);
  END IF;

  -- ── Live Quote Testing (LQT) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'LQT' )
    AND LOWER(business_name) != LOWER('Live Quote Testing') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Live Quote Testing'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Live Quote Testing') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Live Quote Testing'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Live Quote Testing%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'LQT',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Live Quote Testing', 'LQT'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Live Quote Testing', 'LQT', 'LQT', 'active', 'standard', ARRAY['Live Quote Testing', 'LQT']);
  END IF;

  -- ── P&S Products & Refreshening Ltd (MOOV-0059) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0059' OR dc_customer_id = '0059')
    AND LOWER(business_name) != LOWER('P&S Products & Refreshening Ltd') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('P&S Products & Refreshening Ltd'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('P&S Products & Refreshening Ltd') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('P&S Products & Refreshening Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%P&S Products & Refreshening Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0059',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['P&S Products & Refreshening Ltd', 'MOOV-0059', '0059', '59'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('P&S Products & Refreshening Ltd', 'MOOV-0059', 'MOOV-0059', 'active', 'standard', ARRAY['P&S Products & Refreshening Ltd', 'MOOV-0059', '0059', '59']);
  END IF;

  -- ── HOME AND HAVEN LIMITED (MOOV-0060) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0060' OR dc_customer_id = '0060')
    AND LOWER(business_name) != LOWER('HOME AND HAVEN LIMITED') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('HOME AND HAVEN LIMITED'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('HOME AND HAVEN LIMITED') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('HOME AND HAVEN LIMITED'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%HOME AND HAVEN LIMITED%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0060',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['HOME AND HAVEN LIMITED', 'MOOV-0060', '0060', '60'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('HOME AND HAVEN LIMITED', 'MOOV-0060', 'MOOV-0060', 'active', 'standard', ARRAY['HOME AND HAVEN LIMITED', 'MOOV-0060', '0060', '60']);
  END IF;

  -- ── 2024 (DP1-0037) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'DP1-0037' OR dc_customer_id = '1')
    AND LOWER(business_name) != LOWER('2024') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('2024'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('2024') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('2024'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%2024%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'DP1-0037',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['2024', 'DP1-0037', '1'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('2024', 'DP1-0037', 'DP1-0037', 'active', 'standard', ARRAY['2024', 'DP1-0037', '1']);
  END IF;

  -- ── Jetstar Airways (DP1-0038) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'DP1-0038' OR dc_customer_id = '1')
    AND LOWER(business_name) != LOWER('Jetstar Airways') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Jetstar Airways'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Jetstar Airways') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Jetstar Airways'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Jetstar Airways%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'DP1-0038',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Jetstar Airways', 'DP1-0038', '1'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Jetstar Airways', 'DP1-0038', 'DP1-0038', 'active', 'standard', ARRAY['Jetstar Airways', 'DP1-0038', '1']);
  END IF;

  -- ── Rifai UK Ltd (MOOV-0061) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0061' OR dc_customer_id = '0061')
    AND LOWER(business_name) != LOWER('Rifai UK Ltd') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Rifai UK Ltd'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Rifai UK Ltd') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Rifai UK Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Rifai UK Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0061',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Rifai UK Ltd', 'MOOV-0061', '0061', '61'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Rifai UK Ltd', 'MOOV-0061', 'MOOV-0061', 'active', 'standard', ARRAY['Rifai UK Ltd', 'MOOV-0061', '0061', '61']);
  END IF;

  -- ── Giga Distributors (MOOV-0062) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0062' OR dc_customer_id = '0062')
    AND LOWER(business_name) != LOWER('Giga Distributors') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Giga Distributors'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Giga Distributors') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Giga Distributors'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Giga Distributors%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0062',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Giga Distributors', 'MOOV-0062', '0062', '62'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Giga Distributors', 'MOOV-0062', 'MOOV-0062', 'active', 'standard', ARRAY['Giga Distributors', 'MOOV-0062', '0062', '62']);
  END IF;

  -- ── TKS NATURALS LTD (MOOV-0063) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0063' OR dc_customer_id = '0063')
    AND LOWER(business_name) != LOWER('TKS NATURALS LTD') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('TKS NATURALS LTD'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('TKS NATURALS LTD') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('TKS NATURALS LTD'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%TKS NATURALS LTD%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0063',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['TKS NATURALS LTD', 'MOOV-0063', '0063', '63'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('TKS NATURALS LTD', 'MOOV-0063', 'MOOV-0063', 'active', 'standard', ARRAY['TKS NATURALS LTD', 'MOOV-0063', '0063', '63']);
  END IF;

  -- ── Mini La Mode (MOOV-0064) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0064' OR dc_customer_id = '0064')
    AND LOWER(business_name) != LOWER('Mini La Mode') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Mini La Mode'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Mini La Mode') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Mini La Mode'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Mini La Mode%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0064',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Mini La Mode', 'MOOV-0064', '0064', '64'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Mini La Mode', 'MOOV-0064', 'MOOV-0064', 'active', 'standard', ARRAY['Mini La Mode', 'MOOV-0064', '0064', '64']);
  END IF;

  -- ── TCS Worldwide (TCS) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'TCS' )
    AND LOWER(business_name) != LOWER('TCS Worldwide') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('TCS Worldwide'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('TCS Worldwide') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('TCS Worldwide'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%TCS Worldwide%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'TCS',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['TCS Worldwide', 'TCS'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('TCS Worldwide', 'TCS', 'TCS', 'active', 'standard', ARRAY['TCS Worldwide', 'TCS']);
  END IF;

  -- ── ERTECH LTD (MOOV-0066) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0066' OR dc_customer_id = '0066')
    AND LOWER(business_name) != LOWER('ERTECH LTD') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('ERTECH LTD'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('ERTECH LTD') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('ERTECH LTD'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%ERTECH LTD%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0066',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['ERTECH LTD', 'MOOV-0066', '0066', '66'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('ERTECH LTD', 'MOOV-0066', 'MOOV-0066', 'active', 'standard', ARRAY['ERTECH LTD', 'MOOV-0066', '0066', '66']);
  END IF;

  -- ── D S Engineering (MOOV-0067) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0067' OR dc_customer_id = '0067')
    AND LOWER(business_name) != LOWER('D S Engineering') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('D S Engineering'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('D S Engineering') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('D S Engineering'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%D S Engineering%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0067',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['D S Engineering', 'MOOV-0067', '0067', '67'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('D S Engineering', 'MOOV-0067', 'MOOV-0067', 'active', 'standard', ARRAY['D S Engineering', 'MOOV-0067', '0067', '67']);
  END IF;

  -- ── kol (1233-0003) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = '1233-0003' OR dc_customer_id = '1233')
    AND LOWER(business_name) != LOWER('kol') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('kol'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('kol') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('kol'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%kol%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = '1233-0003',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['kol', '1233-0003', '1233'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('kol', '1233-0003', '1233-0003', 'active', 'standard', ARRAY['kol', '1233-0003', '1233']);
  END IF;

  -- ── Hairways (Hair & Beauty) Ltd (MOOV-0068) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0068' OR dc_customer_id = '0068')
    AND LOWER(business_name) != LOWER('Hairways (Hair & Beauty) Ltd') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Hairways (Hair & Beauty) Ltd'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Hairways (Hair & Beauty) Ltd') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Hairways (Hair & Beauty) Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Hairways (Hair & Beauty) Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0068',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Hairways (Hair & Beauty) Ltd', 'MOOV-0068', '0068', '68'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Hairways (Hair & Beauty) Ltd', 'MOOV-0068', 'MOOV-0068', 'active', 'standard', ARRAY['Hairways (Hair & Beauty) Ltd', 'MOOV-0068', '0068', '68']);
  END IF;

  -- ── Soghaat Gifts & Fragrances Ltd. (MOOV-0069) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0069' OR dc_customer_id = '0069')
    AND LOWER(business_name) != LOWER('Soghaat Gifts & Fragrances Ltd.') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Soghaat Gifts & Fragrances Ltd.'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Soghaat Gifts & Fragrances Ltd.') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Soghaat Gifts & Fragrances Ltd.'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Soghaat Gifts & Fragrances Ltd.%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0069',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Soghaat Gifts & Fragrances Ltd.', 'MOOV-0069', '0069', '69'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Soghaat Gifts & Fragrances Ltd.', 'MOOV-0069', 'MOOV-0069', 'active', 'standard', ARRAY['Soghaat Gifts & Fragrances Ltd.', 'MOOV-0069', '0069', '69']);
  END IF;

  -- ── Lampfix (MOOV-0070) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0070' OR dc_customer_id = '0070')
    AND LOWER(business_name) != LOWER('Lampfix') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Lampfix'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Lampfix') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Lampfix'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Lampfix%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0070',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Lampfix', 'MOOV-0070', '0070', '70'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Lampfix', 'MOOV-0070', 'MOOV-0070', 'active', 'standard', ARRAY['Lampfix', 'MOOV-0070', '0070', '70']);
  END IF;

  -- ── Bentley Photographic (MOOV-0071) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0071' OR dc_customer_id = '0071')
    AND LOWER(business_name) != LOWER('Bentley Photographic') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Bentley Photographic'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Bentley Photographic') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Bentley Photographic'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Bentley Photographic%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0071',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Bentley Photographic', 'MOOV-0071', '0071', '71'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Bentley Photographic', 'MOOV-0071', 'MOOV-0071', 'active', 'standard', ARRAY['Bentley Photographic', 'MOOV-0071', '0071', '71']);
  END IF;

  -- ── Creative Solution (DQA1-0005) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'DQA1-0005' OR dc_customer_id = '1')
    AND LOWER(business_name) != LOWER('Creative Solution') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Creative Solution'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Creative Solution') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Creative Solution'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Creative Solution%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'DQA1-0005',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Creative Solution', 'DQA1-0005', '1'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Creative Solution', 'DQA1-0005', 'DQA1-0005', 'active', 'standard', ARRAY['Creative Solution', 'DQA1-0005', '1']);
  END IF;

  -- ── Gapstar (DP1-0043) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'DP1-0043' OR dc_customer_id = '1')
    AND LOWER(business_name) != LOWER('Gapstar') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Gapstar'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Gapstar') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Gapstar'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Gapstar%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'DP1-0043',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Gapstar', 'DP1-0043', '1'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Gapstar', 'DP1-0043', 'DP1-0043', 'active', 'standard', ARRAY['Gapstar', 'DP1-0043', '1']);
  END IF;

  -- ── TestCompany11 (DDK1-0002) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'DDK1-0002' OR dc_customer_id = '1')
    AND LOWER(business_name) != LOWER('TestCompany11') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('TestCompany11'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('TestCompany11') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('TestCompany11'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%TestCompany11%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'DDK1-0002',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['TestCompany11', 'DDK1-0002', '1'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('TestCompany11', 'DDK1-0002', 'DDK1-0002', 'active', 'standard', ARRAY['TestCompany11', 'DDK1-0002', '1']);
  END IF;

  -- ── Virtusa (DQA1-0007) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'DQA1-0007' OR dc_customer_id = '1')
    AND LOWER(business_name) != LOWER('Virtusa') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Virtusa'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Virtusa') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Virtusa'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Virtusa%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'DQA1-0007',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Virtusa', 'DQA1-0007', '1'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Virtusa', 'DQA1-0007', 'DQA1-0007', 'active', 'standard', ARRAY['Virtusa', 'DQA1-0007', '1']);
  END IF;

  -- ── Toyota (DQA1-0009) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'DQA1-0009' OR dc_customer_id = '1')
    AND LOWER(business_name) != LOWER('Toyota') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Toyota'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Toyota') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Toyota'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Toyota%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'DQA1-0009',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Toyota', 'DQA1-0009', '1'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Toyota', 'DQA1-0009', 'DQA1-0009', 'active', 'standard', ARRAY['Toyota', 'DQA1-0009', '1']);
  END IF;

  -- ── Brandix (DQA1-0011) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'DQA1-0011' OR dc_customer_id = '1')
    AND LOWER(business_name) != LOWER('Brandix') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Brandix'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Brandix') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Brandix'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Brandix%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'DQA1-0011',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Brandix', 'DQA1-0011', '1'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Brandix', 'DQA1-0011', 'DQA1-0011', 'active', 'standard', ARRAY['Brandix', 'DQA1-0011', '1']);
  END IF;

  -- ── Softlogic (DQA1-0012) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'DQA1-0012' OR dc_customer_id = '1')
    AND LOWER(business_name) != LOWER('Softlogic') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Softlogic'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Softlogic') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Softlogic'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Softlogic%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'DQA1-0012',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Softlogic', 'DQA1-0012', '1'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Softlogic', 'DQA1-0012', 'DQA1-0012', 'active', 'standard', ARRAY['Softlogic', 'DQA1-0012', '1']);
  END IF;

  -- ── Daraz (DQA1-0013) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'DQA1-0013' OR dc_customer_id = '1')
    AND LOWER(business_name) != LOWER('Daraz') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Daraz'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Daraz') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Daraz'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Daraz%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'DQA1-0013',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Daraz', 'DQA1-0013', '1'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Daraz', 'DQA1-0013', 'DQA1-0013', 'active', 'standard', ARRAY['Daraz', 'DQA1-0013', '1']);
  END IF;

  -- ── Impact Particles (MOOV-0072) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0072' OR dc_customer_id = '0072')
    AND LOWER(business_name) != LOWER('Impact Particles') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Impact Particles'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Impact Particles') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Impact Particles'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Impact Particles%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0072',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Impact Particles', 'MOOV-0072', '0072', '72'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Impact Particles', 'MOOV-0072', 'MOOV-0072', 'active', 'standard', ARRAY['Impact Particles', 'MOOV-0072', '0072', '72']);
  END IF;

  -- ── Garden Greatness LTD (MOOV-0073) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0073' OR dc_customer_id = '0073')
    AND LOWER(business_name) != LOWER('Garden Greatness LTD') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Garden Greatness LTD'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Garden Greatness LTD') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Garden Greatness LTD'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Garden Greatness LTD%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0073',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Garden Greatness LTD', 'MOOV-0073', '0073', '73'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Garden Greatness LTD', 'MOOV-0073', 'MOOV-0073', 'active', 'standard', ARRAY['Garden Greatness LTD', 'MOOV-0073', '0073', '73']);
  END IF;

  -- ── Major Brushes Ltd (MOOV-0074) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0074' OR dc_customer_id = '0074')
    AND LOWER(business_name) != LOWER('Major Brushes Ltd') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Major Brushes Ltd'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Major Brushes Ltd') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Major Brushes Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Major Brushes Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0074',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Major Brushes Ltd', 'MOOV-0074', '0074', '74'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Major Brushes Ltd', 'MOOV-0074', 'MOOV-0074', 'active', 'standard', ARRAY['Major Brushes Ltd', 'MOOV-0074', '0074', '74']);
  END IF;

  -- ── Ottone Hardware (MOOV-0065) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0065' OR dc_customer_id = '0065')
    AND LOWER(business_name) != LOWER('Ottone Hardware') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Ottone Hardware'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Ottone Hardware') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Ottone Hardware'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Ottone Hardware%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0065',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Ottone Hardware', 'MOOV-0065', '0065', '65'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Ottone Hardware', 'MOOV-0065', 'MOOV-0065', 'active', 'standard', ARRAY['Ottone Hardware', 'MOOV-0065', '0065', '65']);
  END IF;

  -- ── Europa (Europa) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'Europa' )
    AND LOWER(business_name) != LOWER('Europa') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Europa'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Europa') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Europa'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Europa%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'Europa',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Europa', 'Europa'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Europa', 'Europa', 'Europa', 'active', 'standard', ARRAY['Europa', 'Europa']);
  END IF;

  -- ── TELESONIC (DQA1-0014) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'DQA1-0014' OR dc_customer_id = '1')
    AND LOWER(business_name) != LOWER('TELESONIC') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('TELESONIC'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('TELESONIC') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('TELESONIC'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%TELESONIC%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'DQA1-0014',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['TELESONIC', 'DQA1-0014', '1'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('TELESONIC', 'DQA1-0014', 'DQA1-0014', 'active', 'standard', ARRAY['TELESONIC', 'DQA1-0014', '1']);
  END IF;

  -- ── ALDO (DQA1-0015) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'DQA1-0015' OR dc_customer_id = '1')
    AND LOWER(business_name) != LOWER('ALDO') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('ALDO'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('ALDO') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('ALDO'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%ALDO%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'DQA1-0015',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['ALDO', 'DQA1-0015', '1'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('ALDO', 'DQA1-0015', 'DQA1-0015', 'active', 'standard', ARRAY['ALDO', 'DQA1-0015', '1']);
  END IF;

  -- ── Barry AI (Barry AI) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'Barry AI' )
    AND LOWER(business_name) != LOWER('Barry AI') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Barry AI'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Barry AI') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Barry AI'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Barry AI%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'Barry AI',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Barry AI', 'Barry AI'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Barry AI', 'Barry AI', 'Barry AI', 'active', 'standard', ARRAY['Barry AI', 'Barry AI']);
  END IF;

  -- ── NECTR (MOOV-0075) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0075' OR dc_customer_id = '0075')
    AND LOWER(business_name) != LOWER('NECTR') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('NECTR'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('NECTR') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('NECTR'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%NECTR%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0075',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['NECTR', 'MOOV-0075', '0075', '75'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('NECTR', 'MOOV-0075', 'MOOV-0075', 'active', 'standard', ARRAY['NECTR', 'MOOV-0075', '0075', '75']);
  END IF;

  -- ── Ray Wai-Shing (HOF-0007) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'HOF-0007' OR dc_customer_id = '0007')
    AND LOWER(business_name) != LOWER('Ray Wai-Shing') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Ray Wai-Shing'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Ray Wai-Shing') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Ray Wai-Shing'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Ray Wai-Shing%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'HOF-0007',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Ray Wai-Shing', 'HOF-0007', '0007', '7'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Ray Wai-Shing', 'HOF-0007', 'HOF-0007', 'active', 'standard', ARRAY['Ray Wai-Shing', 'HOF-0007', '0007', '7']);
  END IF;

  -- ── Michael Chadburn (HOF-0003) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'HOF-0003' OR dc_customer_id = '0003')
    AND LOWER(business_name) != LOWER('Michael Chadburn') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Michael Chadburn'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Michael Chadburn') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Michael Chadburn'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Michael Chadburn%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'HOF-0003',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Michael Chadburn', 'HOF-0003', '0003', '3'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Michael Chadburn', 'HOF-0003', 'HOF-0003', 'active', 'standard', ARRAY['Michael Chadburn', 'HOF-0003', '0003', '3']);
  END IF;

  -- ── UK Demo (DD2-0002) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'DD2-0002' OR dc_customer_id = '2')
    AND LOWER(business_name) != LOWER('UK Demo') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('UK Demo'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('UK Demo') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('UK Demo'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%UK Demo%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'DD2-0002',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['UK Demo', 'DD2-0002', '2'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('UK Demo', 'DD2-0002', 'DD2-0002', 'active', 'standard', ARRAY['UK Demo', 'DD2-0002', '2']);
  END IF;

  -- ── Ninja UK Production (HOF-0002) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'HOF-0002' OR dc_customer_id = '0002')
    AND LOWER(business_name) != LOWER('Ninja UK Production') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Ninja UK Production'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Ninja UK Production') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Ninja UK Production'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Ninja UK Production%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'HOF-0002',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Ninja UK Production', 'HOF-0002', '0002', '2'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Ninja UK Production', 'HOF-0002', 'HOF-0002', 'active', 'standard', ARRAY['Ninja UK Production', 'HOF-0002', '0002', '2']);
  END IF;

  -- ── Prod Chinthaka (HOF-0001) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'HOF-0001' OR dc_customer_id = '0001')
    AND LOWER(business_name) != LOWER('Prod Chinthaka') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Prod Chinthaka'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Prod Chinthaka') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Prod Chinthaka'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Prod Chinthaka%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'HOF-0001',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Prod Chinthaka', 'HOF-0001', '0001', '1'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Prod Chinthaka', 'HOF-0001', 'HOF-0001', 'active', 'standard', ARRAY['Prod Chinthaka', 'HOF-0001', '0001', '1']);
  END IF;

  -- ── EFUTURES1 (DP1-0001) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'DP1-0001' OR dc_customer_id = '1')
    AND LOWER(business_name) != LOWER('EFUTURES1') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('EFUTURES1'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('EFUTURES1') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('EFUTURES1'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%EFUTURES1%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'DP1-0001',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['EFUTURES1', 'DP1-0001', '1'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('EFUTURES1', 'DP1-0001', 'DP1-0001', 'active', 'standard', ARRAY['EFUTURES1', 'DP1-0001', '1']);
  END IF;

  -- ── Moreyeah Foods Ltd (MOOV-0076) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0076' OR dc_customer_id = '0076')
    AND LOWER(business_name) != LOWER('Moreyeah Foods Ltd') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Moreyeah Foods Ltd'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Moreyeah Foods Ltd') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Moreyeah Foods Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Moreyeah Foods Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0076',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Moreyeah Foods Ltd', 'MOOV-0076', '0076', '76'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Moreyeah Foods Ltd', 'MOOV-0076', 'MOOV-0076', 'active', 'standard', ARRAY['Moreyeah Foods Ltd', 'MOOV-0076', '0076', '76']);
  END IF;

  -- ── S Smith & Sons Carpets Ltd (MOOV-0077) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0077' OR dc_customer_id = '0077')
    AND LOWER(business_name) != LOWER('S Smith & Sons Carpets Ltd') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('S Smith & Sons Carpets Ltd'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('S Smith & Sons Carpets Ltd') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('S Smith & Sons Carpets Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%S Smith & Sons Carpets Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0077',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['S Smith & Sons Carpets Ltd', 'MOOV-0077', '0077', '77'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('S Smith & Sons Carpets Ltd', 'MOOV-0077', 'MOOV-0077', 'active', 'standard', ARRAY['S Smith & Sons Carpets Ltd', 'MOOV-0077', '0077', '77']);
  END IF;

  -- ── The Railway Shop Ltd (MOOV-0078) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0078' OR dc_customer_id = '0078')
    AND LOWER(business_name) != LOWER('The Railway Shop Ltd') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('The Railway Shop Ltd'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('The Railway Shop Ltd') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('The Railway Shop Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%The Railway Shop Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0078',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['The Railway Shop Ltd', 'MOOV-0078', '0078', '78'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('The Railway Shop Ltd', 'MOOV-0078', 'MOOV-0078', 'active', 'standard', ARRAY['The Railway Shop Ltd', 'MOOV-0078', '0078', '78']);
  END IF;

  -- ── Pex Ltd (MOOV-0079) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0079' OR dc_customer_id = '0079')
    AND LOWER(business_name) != LOWER('Pex Ltd') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Pex Ltd'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Pex Ltd') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Pex Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Pex Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0079',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Pex Ltd', 'MOOV-0079', '0079', '79'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Pex Ltd', 'MOOV-0079', 'MOOV-0079', 'active', 'standard', ARRAY['Pex Ltd', 'MOOV-0079', '0079', '79']);
  END IF;

  -- ── Finger on Pulse Ltd (MOOV-0080) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0080' OR dc_customer_id = '0080')
    AND LOWER(business_name) != LOWER('Finger on Pulse Ltd') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Finger on Pulse Ltd'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Finger on Pulse Ltd') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Finger on Pulse Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Finger on Pulse Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0080',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Finger on Pulse Ltd', 'MOOV-0080', '0080', '80'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Finger on Pulse Ltd', 'MOOV-0080', 'MOOV-0080', 'active', 'standard', ARRAY['Finger on Pulse Ltd', 'MOOV-0080', '0080', '80']);
  END IF;

  -- ── Iglu Meal Prep (Iglu Meal Prep) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'Iglu Meal Prep' )
    AND LOWER(business_name) != LOWER('Iglu Meal Prep') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Iglu Meal Prep'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Iglu Meal Prep') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Iglu Meal Prep'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Iglu Meal Prep%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'Iglu Meal Prep',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Iglu Meal Prep', 'Iglu Meal Prep'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Iglu Meal Prep', 'Iglu Meal Prep', 'Iglu Meal Prep', 'active', 'standard', ARRAY['Iglu Meal Prep', 'Iglu Meal Prep']);
  END IF;

  -- ── Yourbookstore (Yourbookstore) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'Yourbookstore' )
    AND LOWER(business_name) != LOWER('Yourbookstore') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Yourbookstore'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Yourbookstore') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Yourbookstore'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Yourbookstore%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'Yourbookstore',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Yourbookstore', 'Yourbookstore'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Yourbookstore', 'Yourbookstore', 'Yourbookstore', 'active', 'standard', ARRAY['Yourbookstore', 'Yourbookstore']);
  END IF;

  -- ── Carnivore Cartel Ltd (MOOV-0081) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0081' OR dc_customer_id = '0081')
    AND LOWER(business_name) != LOWER('Carnivore Cartel Ltd') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Carnivore Cartel Ltd'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Carnivore Cartel Ltd') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Carnivore Cartel Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Carnivore Cartel Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0081',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Carnivore Cartel Ltd', 'MOOV-0081', '0081', '81'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Carnivore Cartel Ltd', 'MOOV-0081', 'MOOV-0081', 'active', 'standard', ARRAY['Carnivore Cartel Ltd', 'MOOV-0081', '0081', '81']);
  END IF;

  -- ── Igluu Ltd (MOOV-0082) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0082' OR dc_customer_id = '0082')
    AND LOWER(business_name) != LOWER('Igluu Ltd') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Igluu Ltd'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Igluu Ltd') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Igluu Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Igluu Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0082',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Igluu Ltd', 'MOOV-0082', '0082', '82'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Igluu Ltd', 'MOOV-0082', 'MOOV-0082', 'active', 'standard', ARRAY['Igluu Ltd', 'MOOV-0082', '0082', '82']);
  END IF;

  -- ── E-Health Pharmacy Ltd (MOOV-0083) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0083' OR dc_customer_id = '0083')
    AND LOWER(business_name) != LOWER('E-Health Pharmacy Ltd') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('E-Health Pharmacy Ltd'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('E-Health Pharmacy Ltd') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('E-Health Pharmacy Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%E-Health Pharmacy Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0083',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['E-Health Pharmacy Ltd', 'MOOV-0083', '0083', '83'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('E-Health Pharmacy Ltd', 'MOOV-0083', 'MOOV-0083', 'active', 'standard', ARRAY['E-Health Pharmacy Ltd', 'MOOV-0083', '0083', '83']);
  END IF;

  -- ── Techworknetwork LTD (MOOV-0084) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0084' OR dc_customer_id = '0084')
    AND LOWER(business_name) != LOWER('Techworknetwork LTD') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Techworknetwork LTD'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Techworknetwork LTD') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Techworknetwork LTD'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Techworknetwork LTD%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0084',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Techworknetwork LTD', 'MOOV-0084', '0084', '84'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Techworknetwork LTD', 'MOOV-0084', 'MOOV-0084', 'active', 'standard', ARRAY['Techworknetwork LTD', 'MOOV-0084', '0084', '84']);
  END IF;

  -- ── Matrix Seating Limited (MOOV-0085) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0085' OR dc_customer_id = '0085')
    AND LOWER(business_name) != LOWER('Matrix Seating Limited') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Matrix Seating Limited'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Matrix Seating Limited') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Matrix Seating Limited'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Matrix Seating Limited%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0085',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Matrix Seating Limited', 'MOOV-0085', '0085', '85'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Matrix Seating Limited', 'MOOV-0085', 'MOOV-0085', 'active', 'standard', ARRAY['Matrix Seating Limited', 'MOOV-0085', '0085', '85']);
  END IF;

  -- ── test (DP1-0044) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'DP1-0044' OR dc_customer_id = '1')
    AND LOWER(business_name) != LOWER('test') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('test'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('test') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('test'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%test%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'DP1-0044',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['test', 'DP1-0044', '1'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('test', 'DP1-0044', 'DP1-0044', 'active', 'standard', ARRAY['test', 'DP1-0044', '1']);
  END IF;

  -- ── Test company name (DP1-0045) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'DP1-0045' OR dc_customer_id = '1')
    AND LOWER(business_name) != LOWER('Test company name') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Test company name'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Test company name') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Test company name'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Test company name%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'DP1-0045',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Test company name', 'DP1-0045', '1'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Test company name', 'DP1-0045', 'DP1-0045', 'active', 'standard', ARRAY['Test company name', 'DP1-0045', '1']);
  END IF;

  -- ── Zesta (DP2-0001) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'DP2-0001' OR dc_customer_id = '2')
    AND LOWER(business_name) != LOWER('Zesta') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Zesta'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Zesta') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Zesta'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Zesta%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'DP2-0001',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Zesta', 'DP2-0001', '2'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Zesta', 'DP2-0001', 'DP2-0001', 'active', 'standard', ARRAY['Zesta', 'DP2-0001', '2']);
  END IF;

  -- ── HSBC (DDJ1-0002) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'DDJ1-0002' OR dc_customer_id = '1')
    AND LOWER(business_name) != LOWER('HSBC') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('HSBC'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('HSBC') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('HSBC'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%HSBC%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'DDJ1-0002',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['HSBC', 'DDJ1-0002', '1'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('HSBC', 'DDJ1-0002', 'DDJ1-0002', 'active', 'standard', ARRAY['HSBC', 'DDJ1-0002', '1']);
  END IF;

  -- ── Danijels Parcels (MOOV-0087) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0087' OR dc_customer_id = '0087')
    AND LOWER(business_name) != LOWER('Danijels Parcels') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Danijels Parcels'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Danijels Parcels') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Danijels Parcels'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Danijels Parcels%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0087',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Danijels Parcels', 'MOOV-0087', '0087', '87'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Danijels Parcels', 'MOOV-0087', 'MOOV-0087', 'active', 'standard', ARRAY['Danijels Parcels', 'MOOV-0087', '0087', '87']);
  END IF;

  -- ── TCS Express Worldwide UK Limited (MOOV-0088) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0088' OR dc_customer_id = '0088')
    AND LOWER(business_name) != LOWER('TCS Express Worldwide UK Limited') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('TCS Express Worldwide UK Limited'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('TCS Express Worldwide UK Limited') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('TCS Express Worldwide UK Limited'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%TCS Express Worldwide UK Limited%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0088',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['TCS Express Worldwide UK Limited', 'MOOV-0088', '0088', '88'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('TCS Express Worldwide UK Limited', 'MOOV-0088', 'MOOV-0088', 'active', 'standard', ARRAY['TCS Express Worldwide UK Limited', 'MOOV-0088', '0088', '88']);
  END IF;

  -- ── Clearance Stock Supplies Limited (MOOV-0089) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0089' OR dc_customer_id = '0089')
    AND LOWER(business_name) != LOWER('Clearance Stock Supplies Limited') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Clearance Stock Supplies Limited'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Clearance Stock Supplies Limited') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Clearance Stock Supplies Limited'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Clearance Stock Supplies Limited%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0089',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Clearance Stock Supplies Limited', 'MOOV-0089', '0089', '89'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Clearance Stock Supplies Limited', 'MOOV-0089', 'MOOV-0089', 'active', 'standard', ARRAY['Clearance Stock Supplies Limited', 'MOOV-0089', '0089', '89']);
  END IF;

  -- ── Octopus (DP1-0046) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'DP1-0046' OR dc_customer_id = '1')
    AND LOWER(business_name) != LOWER('Octopus') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Octopus'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Octopus') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Octopus'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Octopus%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'DP1-0046',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Octopus', 'DP1-0046', '1'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Octopus', 'DP1-0046', 'DP1-0046', 'active', 'standard', ARRAY['Octopus', 'DP1-0046', '1']);
  END IF;

  -- ── Matt Test (MOOV-0090) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0090' OR dc_customer_id = '0090')
    AND LOWER(business_name) != LOWER('Matt Test') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Matt Test'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Matt Test') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Matt Test'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Matt Test%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0090',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Matt Test', 'MOOV-0090', '0090', '90'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Matt Test', 'MOOV-0090', 'MOOV-0090', 'active', 'standard', ARRAY['Matt Test', 'MOOV-0090', '0090', '90']);
  END IF;

  -- ── Test company (DQA1-0016) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'DQA1-0016' OR dc_customer_id = '1')
    AND LOWER(business_name) != LOWER('Test company') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Test company'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Test company') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Test company'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Test company%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'DQA1-0016',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Test company', 'DQA1-0016', '1'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Test company', 'DQA1-0016', 'DQA1-0016', 'active', 'standard', ARRAY['Test company', 'DQA1-0016', '1']);
  END IF;

  -- ── Pet Food Online LTD (MOOV-0091) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0091' OR dc_customer_id = '0091')
    AND LOWER(business_name) != LOWER('Pet Food Online LTD') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Pet Food Online LTD'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Pet Food Online LTD') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Pet Food Online LTD'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Pet Food Online LTD%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0091',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Pet Food Online LTD', 'MOOV-0091', '0091', '91'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Pet Food Online LTD', 'MOOV-0091', 'MOOV-0091', 'active', 'standard', ARRAY['Pet Food Online LTD', 'MOOV-0091', '0091', '91']);
  END IF;

  -- ── Aromina (DDJ1-0003) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'DDJ1-0003' OR dc_customer_id = '1')
    AND LOWER(business_name) != LOWER('Aromina') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Aromina'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Aromina') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Aromina'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Aromina%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'DDJ1-0003',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Aromina', 'DDJ1-0003', '1'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Aromina', 'DDJ1-0003', 'DDJ1-0003', 'active', 'standard', ARRAY['Aromina', 'DDJ1-0003', '1']);
  END IF;

  -- ── Paragon Design Joinery Ltd (MOOV-0092) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0092' OR dc_customer_id = '0092')
    AND LOWER(business_name) != LOWER('Paragon Design Joinery Ltd') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Paragon Design Joinery Ltd'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Paragon Design Joinery Ltd') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Paragon Design Joinery Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Paragon Design Joinery Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0092',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Paragon Design Joinery Ltd', 'MOOV-0092', '0092', '92'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Paragon Design Joinery Ltd', 'MOOV-0092', 'MOOV-0092', 'active', 'standard', ARRAY['Paragon Design Joinery Ltd', 'MOOV-0092', '0092', '92']);
  END IF;

  -- ── Macchiato Bar Ltd (MOOV-0093) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0093' OR dc_customer_id = '0093')
    AND LOWER(business_name) != LOWER('Macchiato Bar Ltd') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Macchiato Bar Ltd'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Macchiato Bar Ltd') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Macchiato Bar Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Macchiato Bar Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0093',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Macchiato Bar Ltd', 'MOOV-0093', '0093', '93'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Macchiato Bar Ltd', 'MOOV-0093', 'MOOV-0093', 'active', 'standard', ARRAY['Macchiato Bar Ltd', 'MOOV-0093', '0093', '93']);
  END IF;

  -- ── Soothe Limited t/a Luxury Skincare Brands (MOOV-0094) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0094' OR dc_customer_id = '0094')
    AND LOWER(business_name) != LOWER('Soothe Limited t/a Luxury Skincare Brands') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Soothe Limited t/a Luxury Skincare Brands'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Soothe Limited t/a Luxury Skincare Brands') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Soothe Limited t/a Luxury Skincare Brands'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Soothe Limited t/a Luxury Skincare Brands%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0094',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Soothe Limited t/a Luxury Skincare Brands', 'MOOV-0094', '0094', '94'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Soothe Limited t/a Luxury Skincare Brands', 'MOOV-0094', 'MOOV-0094', 'active', 'standard', ARRAY['Soothe Limited t/a Luxury Skincare Brands', 'MOOV-0094', '0094', '94']);
  END IF;

  -- ── MAD baits supplies Ltd (MOOV-0095) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0095' OR dc_customer_id = '0095')
    AND LOWER(business_name) != LOWER('MAD baits supplies Ltd') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('MAD baits supplies Ltd'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('MAD baits supplies Ltd') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('MAD baits supplies Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%MAD baits supplies Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0095',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['MAD baits supplies Ltd', 'MOOV-0095', '0095', '95'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('MAD baits supplies Ltd', 'MOOV-0095', 'MOOV-0095', 'active', 'standard', ARRAY['MAD baits supplies Ltd', 'MOOV-0095', '0095', '95']);
  END IF;

  -- ── Sam Scotts Limited (MOOV-0097) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0097' OR dc_customer_id = '0097')
    AND LOWER(business_name) != LOWER('Sam Scotts Limited') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Sam Scotts Limited'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Sam Scotts Limited') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Sam Scotts Limited'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Sam Scotts Limited%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0097',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Sam Scotts Limited', 'MOOV-0097', '0097', '97'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Sam Scotts Limited', 'MOOV-0097', 'MOOV-0097', 'active', 'standard', ARRAY['Sam Scotts Limited', 'MOOV-0097', '0097', '97']);
  END IF;

  -- ── Crytec Limited (MOOV-0098) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0098' OR dc_customer_id = '0098')
    AND LOWER(business_name) != LOWER('Crytec Limited') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Crytec Limited'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Crytec Limited') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Crytec Limited'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Crytec Limited%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0098',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Crytec Limited', 'MOOV-0098', '0098', '98'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Crytec Limited', 'MOOV-0098', 'MOOV-0098', 'active', 'standard', ARRAY['Crytec Limited', 'MOOV-0098', '0098', '98']);
  END IF;

  -- ── Hairways (Hair & Beauty) Ltd Site B (MOOV-0099) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0099' OR dc_customer_id = '0099')
    AND LOWER(business_name) != LOWER('Hairways (Hair & Beauty) Ltd Site B') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Hairways (Hair & Beauty) Ltd Site B'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Hairways (Hair & Beauty) Ltd Site B') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Hairways (Hair & Beauty) Ltd Site B'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Hairways (Hair & Beauty) Ltd Site B%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0099',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Hairways (Hair & Beauty) Ltd Site B', 'MOOV-0099', '0099', '99'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Hairways (Hair & Beauty) Ltd Site B', 'MOOV-0099', 'MOOV-0099', 'active', 'standard', ARRAY['Hairways (Hair & Beauty) Ltd Site B', 'MOOV-0099', '0099', '99']);
  END IF;

  -- ── WoodUbend Ltd (MOOV-0101) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0101' OR dc_customer_id = '0101')
    AND LOWER(business_name) != LOWER('WoodUbend Ltd') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('WoodUbend Ltd'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('WoodUbend Ltd') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('WoodUbend Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%WoodUbend Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0101',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['WoodUbend Ltd', 'MOOV-0101', '0101', '101'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('WoodUbend Ltd', 'MOOV-0101', 'MOOV-0101', 'active', 'standard', ARRAY['WoodUbend Ltd', 'MOOV-0101', '0101', '101']);
  END IF;

  -- ── TMK Trading Ltd t/a Nexus Modelling Supplies (MOOV-0102) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0102' OR dc_customer_id = '0102')
    AND LOWER(business_name) != LOWER('TMK Trading Ltd t/a Nexus Modelling Supplies') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('TMK Trading Ltd t/a Nexus Modelling Supplies'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('TMK Trading Ltd t/a Nexus Modelling Supplies') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('TMK Trading Ltd t/a Nexus Modelling Supplies'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%TMK Trading Ltd t/a Nexus Modelling Supplies%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0102',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['TMK Trading Ltd t/a Nexus Modelling Supplies', 'MOOV-0102', '0102', '102'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('TMK Trading Ltd t/a Nexus Modelling Supplies', 'MOOV-0102', 'MOOV-0102', 'active', 'standard', ARRAY['TMK Trading Ltd t/a Nexus Modelling Supplies', 'MOOV-0102', '0102', '102']);
  END IF;

  -- ── Brexons Workwear (MOOV-0103) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0103' OR dc_customer_id = '0103')
    AND LOWER(business_name) != LOWER('Brexons Workwear') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Brexons Workwear'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Brexons Workwear') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Brexons Workwear'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Brexons Workwear%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0103',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Brexons Workwear', 'MOOV-0103', '0103', '103'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Brexons Workwear', 'MOOV-0103', 'MOOV-0103', 'active', 'standard', ARRAY['Brexons Workwear', 'MOOV-0103', '0103', '103']);
  END IF;

  -- ── Sing Ko (MOOV-0105) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0105' OR dc_customer_id = '0105')
    AND LOWER(business_name) != LOWER('Sing Ko') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Sing Ko'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Sing Ko') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Sing Ko'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Sing Ko%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0105',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Sing Ko', 'MOOV-0105', '0105', '105'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Sing Ko', 'MOOV-0105', 'MOOV-0105', 'active', 'standard', ARRAY['Sing Ko', 'MOOV-0105', '0105', '105']);
  END IF;

  -- ── Boori (Europe) LTD (MOOV-0106) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0106' OR dc_customer_id = '0106')
    AND LOWER(business_name) != LOWER('Boori (Europe) LTD') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Boori (Europe) LTD'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Boori (Europe) LTD') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Boori (Europe) LTD'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Boori (Europe) LTD%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0106',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Boori (Europe) LTD', 'MOOV-0106', '0106', '106'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Boori (Europe) LTD', 'MOOV-0106', 'MOOV-0106', 'active', 'standard', ARRAY['Boori (Europe) LTD', 'MOOV-0106', '0106', '106']);
  END IF;

  -- ── mike (123-0001) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = '123-0001' OR dc_customer_id = '123')
    AND LOWER(business_name) != LOWER('mike') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('mike'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('mike') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('mike'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%mike%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = '123-0001',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['mike', '123-0001', '123'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('mike', '123-0001', '123-0001', 'active', 'standard', ARRAY['mike', '123-0001', '123']);
  END IF;

  -- ── sdfdsf (11-2002) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = '11-2002' OR dc_customer_id = '11')
    AND LOWER(business_name) != LOWER('sdfdsf') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('sdfdsf'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('sdfdsf') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('sdfdsf'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%sdfdsf%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = '11-2002',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['sdfdsf', '11-2002', '11'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('sdfdsf', '11-2002', '11-2002', 'active', 'standard', ARRAY['sdfdsf', '11-2002', '11']);
  END IF;

  -- ── MV (123-0002) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = '123-0002' OR dc_customer_id = '123')
    AND LOWER(business_name) != LOWER('MV') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('MV'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('MV') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('MV'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%MV%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = '123-0002',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['MV', '123-0002', '123'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('MV', '123-0002', '123-0002', 'active', 'standard', ARRAY['MV', '123-0002', '123']);
  END IF;

  -- ── SYNTAXGENIE (123-0003) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = '123-0003' OR dc_customer_id = '123')
    AND LOWER(business_name) != LOWER('SYNTAXGENIE') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('SYNTAXGENIE'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('SYNTAXGENIE') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('SYNTAXGENIE'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%SYNTAXGENIE%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = '123-0003',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['SYNTAXGENIE', '123-0003', '123'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('SYNTAXGENIE', '123-0003', '123-0003', 'active', 'standard', ARRAY['SYNTAXGENIE', '123-0003', '123']);
  END IF;

  -- ── sdgsd (123-0004) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = '123-0004' OR dc_customer_id = '123')
    AND LOWER(business_name) != LOWER('sdgsd') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('sdgsd'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('sdgsd') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('sdgsd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%sdgsd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = '123-0004',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['sdgsd', '123-0004', '123'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('sdgsd', '123-0004', '123-0004', 'active', 'standard', ARRAY['sdgsd', '123-0004', '123']);
  END IF;

  -- ── cf (11-2001) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = '11-2001' OR dc_customer_id = '11')
    AND LOWER(business_name) != LOWER('cf') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('cf'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('cf') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('cf'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%cf%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = '11-2001',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['cf', '11-2001', '11'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('cf', '11-2001', '11-2001', 'active', 'standard', ARRAY['cf', '11-2001', '11']);
  END IF;

  -- ── Property Documents Ltd (MOOV-0107) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0107' OR dc_customer_id = '0107')
    AND LOWER(business_name) != LOWER('Property Documents Ltd') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Property Documents Ltd'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Property Documents Ltd') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Property Documents Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Property Documents Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0107',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Property Documents Ltd', 'MOOV-0107', '0107', '107'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Property Documents Ltd', 'MOOV-0107', 'MOOV-0107', 'active', 'standard', ARRAY['Property Documents Ltd', 'MOOV-0107', '0107', '107']);
  END IF;

  -- ── Accentura (DP1-0047) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'DP1-0047' OR dc_customer_id = '1')
    AND LOWER(business_name) != LOWER('Accentura') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Accentura'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Accentura') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Accentura'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Accentura%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'DP1-0047',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Accentura', 'DP1-0047', '1'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Accentura', 'DP1-0047', 'DP1-0047', 'active', 'standard', ARRAY['Accentura', 'DP1-0047', '1']);
  END IF;

  -- ── Direct Auto Electrics Ltd (MOOV-0108) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0108' OR dc_customer_id = '0108')
    AND LOWER(business_name) != LOWER('Direct Auto Electrics Ltd') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Direct Auto Electrics Ltd'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Direct Auto Electrics Ltd') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Direct Auto Electrics Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Direct Auto Electrics Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0108',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Direct Auto Electrics Ltd', 'MOOV-0108', '0108', '108'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Direct Auto Electrics Ltd', 'MOOV-0108', 'MOOV-0108', 'active', 'standard', ARRAY['Direct Auto Electrics Ltd', 'MOOV-0108', '0108', '108']);
  END IF;

  -- ── Sampath Bank (DDJ1-0004) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'DDJ1-0004' OR dc_customer_id = '1')
    AND LOWER(business_name) != LOWER('Sampath Bank') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Sampath Bank'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Sampath Bank') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Sampath Bank'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Sampath Bank%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'DDJ1-0004',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Sampath Bank', 'DDJ1-0004', '1'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Sampath Bank', 'DDJ1-0004', 'DDJ1-0004', 'active', 'standard', ARRAY['Sampath Bank', 'DDJ1-0004', '1']);
  END IF;

  -- ── W J Jones Ltd T/A Zoar''s Ark (MOOV-0109) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0109' OR dc_customer_id = '0109')
    AND LOWER(business_name) != LOWER('W J Jones Ltd T/A Zoar''s Ark') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('W J Jones Ltd T/A Zoar''s Ark'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('W J Jones Ltd T/A Zoar''s Ark') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('W J Jones Ltd T/A Zoar''s Ark'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%W J Jones Ltd T/A Zoar''s Ark%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0109',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['W J Jones Ltd T/A Zoar''s Ark', 'MOOV-0109', '0109', '109'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('W J Jones Ltd T/A Zoar''s Ark', 'MOOV-0109', 'MOOV-0109', 'active', 'standard', ARRAY['W J Jones Ltd T/A Zoar''s Ark', 'MOOV-0109', '0109', '109']);
  END IF;

  -- ── Raycom Ltd (MOOV-0110) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0110' OR dc_customer_id = '0110')
    AND LOWER(business_name) != LOWER('Raycom Ltd') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Raycom Ltd'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Raycom Ltd') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Raycom Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Raycom Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0110',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Raycom Ltd', 'MOOV-0110', '0110', '110'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Raycom Ltd', 'MOOV-0110', 'MOOV-0110', 'active', 'standard', ARRAY['Raycom Ltd', 'MOOV-0110', '0110', '110']);
  END IF;

  -- ── Michael kors (DQA1-0017) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'DQA1-0017' OR dc_customer_id = '1')
    AND LOWER(business_name) != LOWER('Michael kors') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Michael kors'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Michael kors') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Michael kors'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Michael kors%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'DQA1-0017',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Michael kors', 'DQA1-0017', '1'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Michael kors', 'DQA1-0017', 'DQA1-0017', 'active', 'standard', ARRAY['Michael kors', 'DQA1-0017', '1']);
  END IF;

  -- ── Vintsreet (Vintsreet) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'Vintsreet' )
    AND LOWER(business_name) != LOWER('Vintsreet') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Vintsreet'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Vintsreet') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Vintsreet'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Vintsreet%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'Vintsreet',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Vintsreet', 'Vintsreet'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Vintsreet', 'Vintsreet', 'Vintsreet', 'active', 'standard', ARRAY['Vintsreet', 'Vintsreet']);
  END IF;

  -- ── Efutures Prod Test Account (DD2-0006) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'DD2-0006' OR dc_customer_id = '2')
    AND LOWER(business_name) != LOWER('Efutures Prod Test Account') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Efutures Prod Test Account'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Efutures Prod Test Account') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Efutures Prod Test Account'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Efutures Prod Test Account%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'DD2-0006',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Efutures Prod Test Account', 'DD2-0006', '2'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Efutures Prod Test Account', 'DD2-0006', 'DD2-0006', 'active', 'standard', ARRAY['Efutures Prod Test Account', 'DD2-0006', '2']);
  END IF;

  -- ── Redo Commerce (Redo Commerce) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'Redo Commerce' )
    AND LOWER(business_name) != LOWER('Redo Commerce') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Redo Commerce'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Redo Commerce') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Redo Commerce'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Redo Commerce%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'Redo Commerce',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Redo Commerce', 'Redo Commerce'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Redo Commerce', 'Redo Commerce', 'Redo Commerce', 'active', 'standard', ARRAY['Redo Commerce', 'Redo Commerce']);
  END IF;

  -- ── Empire Printing & Embroidery Ltd (MOOV-0111) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0111' OR dc_customer_id = '0111')
    AND LOWER(business_name) != LOWER('Empire Printing & Embroidery Ltd') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Empire Printing & Embroidery Ltd'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Empire Printing & Embroidery Ltd') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Empire Printing & Embroidery Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Empire Printing & Embroidery Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0111',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Empire Printing & Embroidery Ltd', 'MOOV-0111', '0111', '111'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Empire Printing & Embroidery Ltd', 'MOOV-0111', 'MOOV-0111', 'active', 'standard', ARRAY['Empire Printing & Embroidery Ltd', 'MOOV-0111', '0111', '111']);
  END IF;

  -- ── BARRY CARTER MOTOR PRODUCTS (MOOV-0113) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0113' OR dc_customer_id = '0113')
    AND LOWER(business_name) != LOWER('BARRY CARTER MOTOR PRODUCTS') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('BARRY CARTER MOTOR PRODUCTS'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('BARRY CARTER MOTOR PRODUCTS') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('BARRY CARTER MOTOR PRODUCTS'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%BARRY CARTER MOTOR PRODUCTS%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0113',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['BARRY CARTER MOTOR PRODUCTS', 'MOOV-0113', '0113', '113'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('BARRY CARTER MOTOR PRODUCTS', 'MOOV-0113', 'MOOV-0113', 'active', 'standard', ARRAY['BARRY CARTER MOTOR PRODUCTS', 'MOOV-0113', '0113', '113']);
  END IF;

  -- ── Cranswick (Cranswick) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'Cranswick' )
    AND LOWER(business_name) != LOWER('Cranswick') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Cranswick'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Cranswick') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Cranswick'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Cranswick%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'Cranswick',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Cranswick', 'Cranswick'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Cranswick', 'Cranswick', 'Cranswick', 'active', 'standard', ARRAY['Cranswick', 'Cranswick']);
  END IF;

  -- ── Vint Street Ltd. (MOOV-0114) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0114' OR dc_customer_id = '0114')
    AND LOWER(business_name) != LOWER('Vint Street Ltd.') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Vint Street Ltd.'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Vint Street Ltd.') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Vint Street Ltd.'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Vint Street Ltd.%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0114',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Vint Street Ltd.', 'MOOV-0114', '0114', '114'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Vint Street Ltd.', 'MOOV-0114', 'MOOV-0114', 'active', 'standard', ARRAY['Vint Street Ltd.', 'MOOV-0114', '0114', '114']);
  END IF;

  -- ── Imagin Products Ltd (MOOV-0115) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0115' OR dc_customer_id = '0115')
    AND LOWER(business_name) != LOWER('Imagin Products Ltd') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Imagin Products Ltd'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Imagin Products Ltd') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Imagin Products Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Imagin Products Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0115',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Imagin Products Ltd', 'MOOV-0115', '0115', '115'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Imagin Products Ltd', 'MOOV-0115', 'MOOV-0115', 'active', 'standard', ARRAY['Imagin Products Ltd', 'MOOV-0115', '0115', '115']);
  END IF;

  -- ── Efutures Prod Account Two (DD2-0007) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'DD2-0007' OR dc_customer_id = '2')
    AND LOWER(business_name) != LOWER('Efutures Prod Account Two') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Efutures Prod Account Two'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Efutures Prod Account Two') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Efutures Prod Account Two'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Efutures Prod Account Two%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'DD2-0007',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Efutures Prod Account Two', 'DD2-0007', '2'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Efutures Prod Account Two', 'DD2-0007', 'DD2-0007', 'active', 'standard', ARRAY['Efutures Prod Account Two', 'DD2-0007', '2']);
  END IF;

  -- ── EZZTECH (MOOV-0116) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0116' OR dc_customer_id = '0116')
    AND LOWER(business_name) != LOWER('EZZTECH') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('EZZTECH'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('EZZTECH') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('EZZTECH'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%EZZTECH%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0116',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['EZZTECH', 'MOOV-0116', '0116', '116'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('EZZTECH', 'MOOV-0116', 'MOOV-0116', 'active', 'standard', ARRAY['EZZTECH', 'MOOV-0116', '0116', '116']);
  END IF;

  -- ── Tool Hub Ltd (MOOV-0117) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0117' OR dc_customer_id = '0117')
    AND LOWER(business_name) != LOWER('Tool Hub Ltd') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Tool Hub Ltd'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Tool Hub Ltd') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Tool Hub Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Tool Hub Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0117',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Tool Hub Ltd', 'MOOV-0117', '0117', '117'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Tool Hub Ltd', 'MOOV-0117', 'MOOV-0117', 'active', 'standard', ARRAY['Tool Hub Ltd', 'MOOV-0117', '0117', '117']);
  END IF;

  -- ── Getplumb Reading Ltd (MOOV-0118) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0118' OR dc_customer_id = '0118')
    AND LOWER(business_name) != LOWER('Getplumb Reading Ltd') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Getplumb Reading Ltd'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Getplumb Reading Ltd') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Getplumb Reading Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Getplumb Reading Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0118',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Getplumb Reading Ltd', 'MOOV-0118', '0118', '118'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Getplumb Reading Ltd', 'MOOV-0118', 'MOOV-0118', 'active', 'standard', ARRAY['Getplumb Reading Ltd', 'MOOV-0118', '0118', '118']);
  END IF;

  -- ── Vision Warehouse (MOOV-0112) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0112' OR dc_customer_id = '0112')
    AND LOWER(business_name) != LOWER('Vision Warehouse') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Vision Warehouse'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Vision Warehouse') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Vision Warehouse'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Vision Warehouse%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0112',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Vision Warehouse', 'MOOV-0112', '0112', '112'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Vision Warehouse', 'MOOV-0112', 'MOOV-0112', 'active', 'standard', ARRAY['Vision Warehouse', 'MOOV-0112', '0112', '112']);
  END IF;

  -- ── 608 Group Ltd (304 Clothing) (MOOV-0119) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0119' OR dc_customer_id = '0119')
    AND LOWER(business_name) != LOWER('608 Group Ltd (304 Clothing)') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('608 Group Ltd (304 Clothing)'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('608 Group Ltd (304 Clothing)') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('608 Group Ltd (304 Clothing)'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%608 Group Ltd (304 Clothing)%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0119',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['608 Group Ltd (304 Clothing)', 'MOOV-0119', '0119', '119'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('608 Group Ltd (304 Clothing)', 'MOOV-0119', 'MOOV-0119', 'active', 'standard', ARRAY['608 Group Ltd (304 Clothing)', 'MOOV-0119', '0119', '119']);
  END IF;

  -- ── Sky Chemicals (UK) Ltd (MOOV-0120) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0120' OR dc_customer_id = '0120')
    AND LOWER(business_name) != LOWER('Sky Chemicals (UK) Ltd') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Sky Chemicals (UK) Ltd'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Sky Chemicals (UK) Ltd') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Sky Chemicals (UK) Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Sky Chemicals (UK) Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0120',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Sky Chemicals (UK) Ltd', 'MOOV-0120', '0120', '120'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Sky Chemicals (UK) Ltd', 'MOOV-0120', 'MOOV-0120', 'active', 'standard', ARRAY['Sky Chemicals (UK) Ltd', 'MOOV-0120', '0120', '120']);
  END IF;

  -- ── Wedcova Uk Ltd (MOOV-0121) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0121' OR dc_customer_id = '0121')
    AND LOWER(business_name) != LOWER('Wedcova Uk Ltd') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Wedcova Uk Ltd'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Wedcova Uk Ltd') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Wedcova Uk Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Wedcova Uk Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0121',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Wedcova Uk Ltd', 'MOOV-0121', '0121', '121'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Wedcova Uk Ltd', 'MOOV-0121', 'MOOV-0121', 'active', 'standard', ARRAY['Wedcova Uk Ltd', 'MOOV-0121', '0121', '121']);
  END IF;

  -- ── Fosseway Parcels Ltd (MOOV-0122) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0122' OR dc_customer_id = '0122')
    AND LOWER(business_name) != LOWER('Fosseway Parcels Ltd') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Fosseway Parcels Ltd'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Fosseway Parcels Ltd') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Fosseway Parcels Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Fosseway Parcels Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0122',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Fosseway Parcels Ltd', 'MOOV-0122', '0122', '122'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Fosseway Parcels Ltd', 'MOOV-0122', 'MOOV-0122', 'active', 'standard', ARRAY['Fosseway Parcels Ltd', 'MOOV-0122', '0122', '122']);
  END IF;

  -- ── ARIMAC (DDJ1-0005) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'DDJ1-0005' OR dc_customer_id = '1')
    AND LOWER(business_name) != LOWER('ARIMAC') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('ARIMAC'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('ARIMAC') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('ARIMAC'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%ARIMAC%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'DDJ1-0005',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['ARIMAC', 'DDJ1-0005', '1'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('ARIMAC', 'DDJ1-0005', 'DDJ1-0005', 'active', 'standard', ARRAY['ARIMAC', 'DDJ1-0005', '1']);
  END IF;

  -- ── GPG - Getpersonalisedgifts Limited (MOOV-0123) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0123' OR dc_customer_id = '0123')
    AND LOWER(business_name) != LOWER('GPG - Getpersonalisedgifts Limited') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('GPG - Getpersonalisedgifts Limited'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('GPG - Getpersonalisedgifts Limited') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('GPG - Getpersonalisedgifts Limited'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%GPG - Getpersonalisedgifts Limited%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0123',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['GPG - Getpersonalisedgifts Limited', 'MOOV-0123', '0123', '123'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('GPG - Getpersonalisedgifts Limited', 'MOOV-0123', 'MOOV-0123', 'active', 'standard', ARRAY['GPG - Getpersonalisedgifts Limited', 'MOOV-0123', '0123', '123']);
  END IF;

  -- ── Thirsty Soft Drinks (MOOV-0124) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0124' OR dc_customer_id = '0124')
    AND LOWER(business_name) != LOWER('Thirsty Soft Drinks') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Thirsty Soft Drinks'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Thirsty Soft Drinks') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Thirsty Soft Drinks'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Thirsty Soft Drinks%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0124',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Thirsty Soft Drinks', 'MOOV-0124', '0124', '124'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Thirsty Soft Drinks', 'MOOV-0124', 'MOOV-0124', 'active', 'standard', ARRAY['Thirsty Soft Drinks', 'MOOV-0124', '0124', '124']);
  END IF;

  -- ── Gifts2Impress (MOOV-0125) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0125' OR dc_customer_id = '0125')
    AND LOWER(business_name) != LOWER('Gifts2Impress') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Gifts2Impress'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Gifts2Impress') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Gifts2Impress'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Gifts2Impress%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0125',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Gifts2Impress', 'MOOV-0125', '0125', '125'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Gifts2Impress', 'MOOV-0125', 'MOOV-0125', 'active', 'standard', ARRAY['Gifts2Impress', 'MOOV-0125', '0125', '125']);
  END IF;

  -- ── Xylo LTD (MOOV-0126) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0126' OR dc_customer_id = '0126')
    AND LOWER(business_name) != LOWER('Xylo LTD') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Xylo LTD'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Xylo LTD') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Xylo LTD'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Xylo LTD%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0126',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Xylo LTD', 'MOOV-0126', '0126', '126'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Xylo LTD', 'MOOV-0126', 'MOOV-0126', 'active', 'standard', ARRAY['Xylo LTD', 'MOOV-0126', '0126', '126']);
  END IF;

  -- ── The Saddlery Shop Ltd (MOOV-0127) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0127' OR dc_customer_id = '0127')
    AND LOWER(business_name) != LOWER('The Saddlery Shop Ltd') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('The Saddlery Shop Ltd'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('The Saddlery Shop Ltd') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('The Saddlery Shop Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%The Saddlery Shop Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0127',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['The Saddlery Shop Ltd', 'MOOV-0127', '0127', '127'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('The Saddlery Shop Ltd', 'MOOV-0127', 'MOOV-0127', 'active', 'standard', ARRAY['The Saddlery Shop Ltd', 'MOOV-0127', '0127', '127']);
  END IF;

  -- ── EF TEST QA ACCOUNT (DD2-0008) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'DD2-0008' OR dc_customer_id = '2')
    AND LOWER(business_name) != LOWER('EF TEST QA ACCOUNT') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('EF TEST QA ACCOUNT'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('EF TEST QA ACCOUNT') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('EF TEST QA ACCOUNT'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%EF TEST QA ACCOUNT%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'DD2-0008',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['EF TEST QA ACCOUNT', 'DD2-0008', '2'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('EF TEST QA ACCOUNT', 'DD2-0008', 'DD2-0008', 'active', 'standard', ARRAY['EF TEST QA ACCOUNT', 'DD2-0008', '2']);
  END IF;

  -- ── Organax Ltd (MOOV-0128) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0128' OR dc_customer_id = '0128')
    AND LOWER(business_name) != LOWER('Organax Ltd') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Organax Ltd'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Organax Ltd') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Organax Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Organax Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0128',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Organax Ltd', 'MOOV-0128', '0128', '128'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Organax Ltd', 'MOOV-0128', 'MOOV-0128', 'active', 'standard', ARRAY['Organax Ltd', 'MOOV-0128', '0128', '128']);
  END IF;

  -- ── Gra Telford LTD (MOOV-0129) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0129' OR dc_customer_id = '0129')
    AND LOWER(business_name) != LOWER('Gra Telford LTD') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Gra Telford LTD'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Gra Telford LTD') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Gra Telford LTD'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Gra Telford LTD%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0129',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Gra Telford LTD', 'MOOV-0129', '0129', '129'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Gra Telford LTD', 'MOOV-0129', 'MOOV-0129', 'active', 'standard', ARRAY['Gra Telford LTD', 'MOOV-0129', '0129', '129']);
  END IF;

  -- ── Attapattu & Sons (123-0005) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = '123-0005' OR dc_customer_id = '123')
    AND LOWER(business_name) != LOWER('Attapattu & Sons') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Attapattu & Sons'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Attapattu & Sons') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Attapattu & Sons'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Attapattu & Sons%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = '123-0005',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Attapattu & Sons', '123-0005', '123'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Attapattu & Sons', '123-0005', '123-0005', 'active', 'standard', ARRAY['Attapattu & Sons', '123-0005', '123']);
  END IF;

  -- ── Jayasuriya & Sons (123-0006) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = '123-0006' OR dc_customer_id = '123')
    AND LOWER(business_name) != LOWER('Jayasuriya & Sons') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Jayasuriya & Sons'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Jayasuriya & Sons') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Jayasuriya & Sons'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Jayasuriya & Sons%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = '123-0006',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Jayasuriya & Sons', '123-0006', '123'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Jayasuriya & Sons', '123-0006', '123-0006', 'active', 'standard', ARRAY['Jayasuriya & Sons', '123-0006', '123']);
  END IF;

  -- ── The Wall Lighting Company Ltd (MOOV-0130) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0130' OR dc_customer_id = '0130')
    AND LOWER(business_name) != LOWER('The Wall Lighting Company Ltd') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('The Wall Lighting Company Ltd'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('The Wall Lighting Company Ltd') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('The Wall Lighting Company Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%The Wall Lighting Company Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0130',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['The Wall Lighting Company Ltd', 'MOOV-0130', '0130', '130'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('The Wall Lighting Company Ltd', 'MOOV-0130', 'MOOV-0130', 'active', 'standard', ARRAY['The Wall Lighting Company Ltd', 'MOOV-0130', '0130', '130']);
  END IF;

  -- ── Chilli Seating Ltd (MOOV-0131) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0131' OR dc_customer_id = '0131')
    AND LOWER(business_name) != LOWER('Chilli Seating Ltd') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Chilli Seating Ltd'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Chilli Seating Ltd') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Chilli Seating Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Chilli Seating Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0131',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Chilli Seating Ltd', 'MOOV-0131', '0131', '131'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Chilli Seating Ltd', 'MOOV-0131', 'MOOV-0131', 'active', 'standard', ARRAY['Chilli Seating Ltd', 'MOOV-0131', '0131', '131']);
  END IF;

  -- ── ZARA Company (DDJ1-0006) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'DDJ1-0006' OR dc_customer_id = '1')
    AND LOWER(business_name) != LOWER('ZARA Company') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('ZARA Company'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('ZARA Company') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('ZARA Company'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%ZARA Company%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'DDJ1-0006',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['ZARA Company', 'DDJ1-0006', '1'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('ZARA Company', 'DDJ1-0006', 'DDJ1-0006', 'active', 'standard', ARRAY['ZARA Company', 'DDJ1-0006', '1']);
  END IF;

  -- ── N70 (123-0007) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = '123-0007' OR dc_customer_id = '123')
    AND LOWER(business_name) != LOWER('N70') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('N70'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('N70') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('N70'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%N70%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = '123-0007',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['N70', '123-0007', '123'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('N70', '123-0007', '123-0007', 'active', 'standard', ARRAY['N70', '123-0007', '123']);
  END IF;

  -- ── Mahela Co (123-0008) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = '123-0008' OR dc_customer_id = '123')
    AND LOWER(business_name) != LOWER('Mahela Co') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Mahela Co'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Mahela Co') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Mahela Co'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Mahela Co%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = '123-0008',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Mahela Co', '123-0008', '123'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Mahela Co', '123-0008', '123-0008', 'active', 'standard', ARRAY['Mahela Co', '123-0008', '123']);
  END IF;

  -- ── David Jones (DP1-0048) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'DP1-0048' OR dc_customer_id = '1')
    AND LOWER(business_name) != LOWER('David Jones') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('David Jones'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('David Jones') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('David Jones'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%David Jones%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'DP1-0048',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['David Jones', 'DP1-0048', '1'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('David Jones', 'DP1-0048', 'DP1-0048', 'active', 'standard', ARRAY['David Jones', 'DP1-0048', '1']);
  END IF;

  -- ── Deshi Delights Ltd (MOOV-0132) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0132' OR dc_customer_id = '0132')
    AND LOWER(business_name) != LOWER('Deshi Delights Ltd') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Deshi Delights Ltd'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Deshi Delights Ltd') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Deshi Delights Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Deshi Delights Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0132',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Deshi Delights Ltd', 'MOOV-0132', '0132', '132'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Deshi Delights Ltd', 'MOOV-0132', 'MOOV-0132', 'active', 'standard', ARRAY['Deshi Delights Ltd', 'MOOV-0132', '0132', '132']);
  END IF;

  -- ── EFUTURES TEST COMPANY (DD2-0009) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'DD2-0009' OR dc_customer_id = '2')
    AND LOWER(business_name) != LOWER('EFUTURES TEST COMPANY') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('EFUTURES TEST COMPANY'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('EFUTURES TEST COMPANY') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('EFUTURES TEST COMPANY'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%EFUTURES TEST COMPANY%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'DD2-0009',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['EFUTURES TEST COMPANY', 'DD2-0009', '2'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('EFUTURES TEST COMPANY', 'DD2-0009', 'DD2-0009', 'active', 'standard', ARRAY['EFUTURES TEST COMPANY', 'DD2-0009', '2']);
  END IF;

  -- ── Bill''s Tool Store Ltd (MOOV-0133) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0133' OR dc_customer_id = '0133')
    AND LOWER(business_name) != LOWER('Bill''s Tool Store Ltd') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Bill''s Tool Store Ltd'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Bill''s Tool Store Ltd') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Bill''s Tool Store Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Bill''s Tool Store Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0133',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Bill''s Tool Store Ltd', 'MOOV-0133', '0133', '133'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Bill''s Tool Store Ltd', 'MOOV-0133', 'MOOV-0133', 'active', 'standard', ARRAY['Bill''s Tool Store Ltd', 'MOOV-0133', '0133', '133']);
  END IF;

  -- ── Jaycee Engineering T/A Jaycee Trophies (MOOV-0134) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0134' OR dc_customer_id = '0134')
    AND LOWER(business_name) != LOWER('Jaycee Engineering T/A Jaycee Trophies') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Jaycee Engineering T/A Jaycee Trophies'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Jaycee Engineering T/A Jaycee Trophies') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Jaycee Engineering T/A Jaycee Trophies'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Jaycee Engineering T/A Jaycee Trophies%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0134',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Jaycee Engineering T/A Jaycee Trophies', 'MOOV-0134', '0134', '134'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Jaycee Engineering T/A Jaycee Trophies', 'MOOV-0134', 'MOOV-0134', 'active', 'standard', ARRAY['Jaycee Engineering T/A Jaycee Trophies', 'MOOV-0134', '0134', '134']);
  END IF;

  -- ── Arden Medical Limited (MOOV-0135) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0135' OR dc_customer_id = '0135')
    AND LOWER(business_name) != LOWER('Arden Medical Limited') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Arden Medical Limited'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Arden Medical Limited') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Arden Medical Limited'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Arden Medical Limited%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0135',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Arden Medical Limited', 'MOOV-0135', '0135', '135'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Arden Medical Limited', 'MOOV-0135', 'MOOV-0135', 'active', 'standard', ARRAY['Arden Medical Limited', 'MOOV-0135', '0135', '135']);
  END IF;

  -- ── ORIGINAL SOURCE LIMITED (MOOV-0136) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0136' OR dc_customer_id = '0136')
    AND LOWER(business_name) != LOWER('ORIGINAL SOURCE LIMITED') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('ORIGINAL SOURCE LIMITED'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('ORIGINAL SOURCE LIMITED') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('ORIGINAL SOURCE LIMITED'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%ORIGINAL SOURCE LIMITED%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0136',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['ORIGINAL SOURCE LIMITED', 'MOOV-0136', '0136', '136'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('ORIGINAL SOURCE LIMITED', 'MOOV-0136', 'MOOV-0136', 'active', 'standard', ARRAY['ORIGINAL SOURCE LIMITED', 'MOOV-0136', '0136', '136']);
  END IF;

  -- ── Ransom Publishing Ltd (MOOV-0137) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0137' OR dc_customer_id = '0137')
    AND LOWER(business_name) != LOWER('Ransom Publishing Ltd') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Ransom Publishing Ltd'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Ransom Publishing Ltd') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Ransom Publishing Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Ransom Publishing Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0137',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Ransom Publishing Ltd', 'MOOV-0137', '0137', '137'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Ransom Publishing Ltd', 'MOOV-0137', 'MOOV-0137', 'active', 'standard', ARRAY['Ransom Publishing Ltd', 'MOOV-0137', '0137', '137']);
  END IF;

  -- ── Webhook Test (123-0010) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = '123-0010' OR dc_customer_id = '123')
    AND LOWER(business_name) != LOWER('Webhook Test') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Webhook Test'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Webhook Test') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Webhook Test'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Webhook Test%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = '123-0010',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Webhook Test', '123-0010', '123'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Webhook Test', '123-0010', '123-0010', 'active', 'standard', ARRAY['Webhook Test', '123-0010', '123']);
  END IF;

  -- ── Fortec Trading Ltd t/a Glowtopia (Fortec Trading Ltd t/a Glowtopia) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'Fortec Trading Ltd t/a Glowtopia' )
    AND LOWER(business_name) != LOWER('Fortec Trading Ltd t/a Glowtopia') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Fortec Trading Ltd t/a Glowtopia'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Fortec Trading Ltd t/a Glowtopia') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Fortec Trading Ltd t/a Glowtopia'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Fortec Trading Ltd t/a Glowtopia%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'Fortec Trading Ltd t/a Glowtopia',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Fortec Trading Ltd t/a Glowtopia', 'Fortec Trading Ltd t/a Glowtopia'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Fortec Trading Ltd t/a Glowtopia', 'Fortec Trading Ltd t/a Glowtopia', 'Fortec Trading Ltd t/a Glowtopia', 'active', 'standard', ARRAY['Fortec Trading Ltd t/a Glowtopia', 'Fortec Trading Ltd t/a Glowtopia']);
  END IF;

  -- ── Alpha Cus (123-0011) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = '123-0011' OR dc_customer_id = '123')
    AND LOWER(business_name) != LOWER('Alpha Cus') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Alpha Cus'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Alpha Cus') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Alpha Cus'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Alpha Cus%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = '123-0011',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Alpha Cus', '123-0011', '123'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Alpha Cus', '123-0011', '123-0011', 'active', 'standard', ARRAY['Alpha Cus', '123-0011', '123']);
  END IF;

  -- ── Beta Cus (123-0012) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = '123-0012' OR dc_customer_id = '123')
    AND LOWER(business_name) != LOWER('Beta Cus') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Beta Cus'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Beta Cus') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Beta Cus'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Beta Cus%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = '123-0012',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Beta Cus', '123-0012', '123'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Beta Cus', '123-0012', '123-0012', 'active', 'standard', ARRAY['Beta Cus', '123-0012', '123']);
  END IF;

  -- ── Vintstreet (Vintstreet) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'Vintstreet' )
    AND LOWER(business_name) != LOWER('Vintstreet') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Vintstreet'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Vintstreet') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Vintstreet'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Vintstreet%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'Vintstreet',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Vintstreet', 'Vintstreet'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Vintstreet', 'Vintstreet', 'Vintstreet', 'active', 'standard', ARRAY['Vintstreet', 'Vintstreet']);
  END IF;

  -- ── Westcare Ltd T/A westcare Supply Zone (MOOV-0138) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0138' OR dc_customer_id = '0138')
    AND LOWER(business_name) != LOWER('Westcare Ltd T/A westcare Supply Zone') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Westcare Ltd T/A westcare Supply Zone'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Westcare Ltd T/A westcare Supply Zone') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Westcare Ltd T/A westcare Supply Zone'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Westcare Ltd T/A westcare Supply Zone%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0138',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Westcare Ltd T/A westcare Supply Zone', 'MOOV-0138', '0138', '138'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Westcare Ltd T/A westcare Supply Zone', 'MOOV-0138', 'MOOV-0138', 'active', 'standard', ARRAY['Westcare Ltd T/A westcare Supply Zone', 'MOOV-0138', '0138', '138']);
  END IF;

  -- ── Talpa office products ltd (MOOV-0139) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0139' OR dc_customer_id = '0139')
    AND LOWER(business_name) != LOWER('Talpa office products ltd') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Talpa office products ltd'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Talpa office products ltd') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Talpa office products ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Talpa office products ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0139',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Talpa office products ltd', 'MOOV-0139', '0139', '139'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Talpa office products ltd', 'MOOV-0139', 'MOOV-0139', 'active', 'standard', ARRAY['Talpa office products ltd', 'MOOV-0139', '0139', '139']);
  END IF;

  -- ── LED Smart Solutions Limited (MOOV-0140) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0140' OR dc_customer_id = '0140')
    AND LOWER(business_name) != LOWER('LED Smart Solutions Limited') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('LED Smart Solutions Limited'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('LED Smart Solutions Limited') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('LED Smart Solutions Limited'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%LED Smart Solutions Limited%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0140',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['LED Smart Solutions Limited', 'MOOV-0140', '0140', '140'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('LED Smart Solutions Limited', 'MOOV-0140', 'MOOV-0140', 'active', 'standard', ARRAY['LED Smart Solutions Limited', 'MOOV-0140', '0140', '140']);
  END IF;

  -- ── My Company (HOF-0013) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'HOF-0013' OR dc_customer_id = '0013')
    AND LOWER(business_name) != LOWER('My Company') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('My Company'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('My Company') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('My Company'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%My Company%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'HOF-0013',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['My Company', 'HOF-0013', '0013', '13'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('My Company', 'HOF-0013', 'HOF-0013', 'active', 'standard', ARRAY['My Company', 'HOF-0013', '0013', '13']);
  END IF;

  -- ── JST Supplies LTD (MOOV-0141) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0141' OR dc_customer_id = '0141')
    AND LOWER(business_name) != LOWER('JST Supplies LTD') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('JST Supplies LTD'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('JST Supplies LTD') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('JST Supplies LTD'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%JST Supplies LTD%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0141',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['JST Supplies LTD', 'MOOV-0141', '0141', '141'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('JST Supplies LTD', 'MOOV-0141', 'MOOV-0141', 'active', 'standard', ARRAY['JST Supplies LTD', 'MOOV-0141', '0141', '141']);
  END IF;

  -- ── Moov Diana Demo (MOOV-0142) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0142' OR dc_customer_id = '0142')
    AND LOWER(business_name) != LOWER('Moov Diana Demo') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Moov Diana Demo'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Moov Diana Demo') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Moov Diana Demo'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Moov Diana Demo%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0142',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Moov Diana Demo', 'MOOV-0142', '0142', '142'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Moov Diana Demo', 'MOOV-0142', 'MOOV-0142', 'active', 'standard', ARRAY['Moov Diana Demo', 'MOOV-0142', '0142', '142']);
  END IF;

  -- ── OliArt Wood LTD (MOOV-0143) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0143' OR dc_customer_id = '0143')
    AND LOWER(business_name) != LOWER('OliArt Wood LTD') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('OliArt Wood LTD'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('OliArt Wood LTD') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('OliArt Wood LTD'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%OliArt Wood LTD%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0143',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['OliArt Wood LTD', 'MOOV-0143', '0143', '143'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('OliArt Wood LTD', 'MOOV-0143', 'MOOV-0143', 'active', 'standard', ARRAY['OliArt Wood LTD', 'MOOV-0143', '0143', '143']);
  END IF;

  -- ── Bessette LTD (MOOV-0144) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0144' OR dc_customer_id = '0144')
    AND LOWER(business_name) != LOWER('Bessette LTD') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Bessette LTD'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Bessette LTD') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Bessette LTD'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Bessette LTD%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0144',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Bessette LTD', 'MOOV-0144', '0144', '144'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Bessette LTD', 'MOOV-0144', 'MOOV-0144', 'active', 'standard', ARRAY['Bessette LTD', 'MOOV-0144', '0144', '144']);
  END IF;

  -- ── NDB (DDJ1-0007) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'DDJ1-0007' OR dc_customer_id = '1')
    AND LOWER(business_name) != LOWER('NDB') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('NDB'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('NDB') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('NDB'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%NDB%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'DDJ1-0007',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['NDB', 'DDJ1-0007', '1'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('NDB', 'DDJ1-0007', 'DDJ1-0007', 'active', 'standard', ARRAY['NDB', 'DDJ1-0007', '1']);
  END IF;

  -- ── CONTEXT PNEUMATIC SUPPLIES LIMITED (MOOV-0145) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0145' OR dc_customer_id = '0145')
    AND LOWER(business_name) != LOWER('CONTEXT PNEUMATIC SUPPLIES LIMITED') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('CONTEXT PNEUMATIC SUPPLIES LIMITED'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('CONTEXT PNEUMATIC SUPPLIES LIMITED') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('CONTEXT PNEUMATIC SUPPLIES LIMITED'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%CONTEXT PNEUMATIC SUPPLIES LIMITED%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0145',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['CONTEXT PNEUMATIC SUPPLIES LIMITED', 'MOOV-0145', '0145', '145'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('CONTEXT PNEUMATIC SUPPLIES LIMITED', 'MOOV-0145', 'MOOV-0145', 'active', 'standard', ARRAY['CONTEXT PNEUMATIC SUPPLIES LIMITED', 'MOOV-0145', '0145', '145']);
  END IF;

  -- ── Bentley and Bo Interiors Ltd (MOOV-0146) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0146' OR dc_customer_id = '0146')
    AND LOWER(business_name) != LOWER('Bentley and Bo Interiors Ltd') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Bentley and Bo Interiors Ltd'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Bentley and Bo Interiors Ltd') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Bentley and Bo Interiors Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Bentley and Bo Interiors Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0146',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Bentley and Bo Interiors Ltd', 'MOOV-0146', '0146', '146'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Bentley and Bo Interiors Ltd', 'MOOV-0146', 'MOOV-0146', 'active', 'standard', ARRAY['Bentley and Bo Interiors Ltd', 'MOOV-0146', '0146', '146']);
  END IF;

  -- ── SME IT Solutions Limited (MOOV-0147) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0147' OR dc_customer_id = '0147')
    AND LOWER(business_name) != LOWER('SME IT Solutions Limited') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('SME IT Solutions Limited'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('SME IT Solutions Limited') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('SME IT Solutions Limited'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%SME IT Solutions Limited%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0147',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['SME IT Solutions Limited', 'MOOV-0147', '0147', '147'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('SME IT Solutions Limited', 'MOOV-0147', 'MOOV-0147', 'active', 'standard', ARRAY['SME IT Solutions Limited', 'MOOV-0147', '0147', '147']);
  END IF;

  -- ── EFUTURES SMOKE TEST CUSTOMER (MOOV-0148) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0148' OR dc_customer_id = '0148')
    AND LOWER(business_name) != LOWER('EFUTURES SMOKE TEST CUSTOMER') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('EFUTURES SMOKE TEST CUSTOMER'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('EFUTURES SMOKE TEST CUSTOMER') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('EFUTURES SMOKE TEST CUSTOMER'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%EFUTURES SMOKE TEST CUSTOMER%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0148',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['EFUTURES SMOKE TEST CUSTOMER', 'MOOV-0148', '0148', '148'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('EFUTURES SMOKE TEST CUSTOMER', 'MOOV-0148', 'MOOV-0148', 'active', 'standard', ARRAY['EFUTURES SMOKE TEST CUSTOMER', 'MOOV-0148', '0148', '148']);
  END IF;

  -- ── Buffalo Systems Ltd (MOOV-0149) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0149' OR dc_customer_id = '0149')
    AND LOWER(business_name) != LOWER('Buffalo Systems Ltd') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Buffalo Systems Ltd'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Buffalo Systems Ltd') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Buffalo Systems Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Buffalo Systems Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0149',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Buffalo Systems Ltd', 'MOOV-0149', '0149', '149'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Buffalo Systems Ltd', 'MOOV-0149', 'MOOV-0149', 'active', 'standard', ARRAY['Buffalo Systems Ltd', 'MOOV-0149', '0149', '149']);
  END IF;

  -- ── East London Packaging Supplies Ltd (MOOV-0150) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0150' OR dc_customer_id = '0150')
    AND LOWER(business_name) != LOWER('East London Packaging Supplies Ltd') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('East London Packaging Supplies Ltd'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('East London Packaging Supplies Ltd') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('East London Packaging Supplies Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%East London Packaging Supplies Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0150',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['East London Packaging Supplies Ltd', 'MOOV-0150', '0150', '150'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('East London Packaging Supplies Ltd', 'MOOV-0150', 'MOOV-0150', 'active', 'standard', ARRAY['East London Packaging Supplies Ltd', 'MOOV-0150', '0150', '150']);
  END IF;

  -- ── Metal Polishing Supplies Ltd (MOOV-0151) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0151' OR dc_customer_id = '0151')
    AND LOWER(business_name) != LOWER('Metal Polishing Supplies Ltd') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Metal Polishing Supplies Ltd'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Metal Polishing Supplies Ltd') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Metal Polishing Supplies Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Metal Polishing Supplies Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0151',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Metal Polishing Supplies Ltd', 'MOOV-0151', '0151', '151'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Metal Polishing Supplies Ltd', 'MOOV-0151', 'MOOV-0151', 'active', 'standard', ARRAY['Metal Polishing Supplies Ltd', 'MOOV-0151', '0151', '151']);
  END IF;

  -- ── Spokz Ltd (MOOV-0152) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0152' OR dc_customer_id = '0152')
    AND LOWER(business_name) != LOWER('Spokz Ltd') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Spokz Ltd'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Spokz Ltd') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Spokz Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Spokz Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0152',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Spokz Ltd', 'MOOV-0152', '0152', '152'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Spokz Ltd', 'MOOV-0152', 'MOOV-0152', 'active', 'standard', ARRAY['Spokz Ltd', 'MOOV-0152', '0152', '152']);
  END IF;

  -- ── Youtheory (123-0013) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = '123-0013' OR dc_customer_id = '123')
    AND LOWER(business_name) != LOWER('Youtheory') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Youtheory'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Youtheory') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Youtheory'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Youtheory%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = '123-0013',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Youtheory', '123-0013', '123'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Youtheory', '123-0013', '123-0013', 'active', 'standard', ARRAY['Youtheory', '123-0013', '123']);
  END IF;

  -- ── M. Criscuolo & Co Ltd (MOOV-0153) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0153' OR dc_customer_id = '0153')
    AND LOWER(business_name) != LOWER('M. Criscuolo & Co Ltd') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('M. Criscuolo & Co Ltd'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('M. Criscuolo & Co Ltd') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('M. Criscuolo & Co Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%M. Criscuolo & Co Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0153',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['M. Criscuolo & Co Ltd', 'MOOV-0153', '0153', '153'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('M. Criscuolo & Co Ltd', 'MOOV-0153', 'MOOV-0153', 'active', 'standard', ARRAY['M. Criscuolo & Co Ltd', 'MOOV-0153', '0153', '153']);
  END IF;

  -- ── Kettles Pottery Supplies Ltd (MOOV-0154) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0154' OR dc_customer_id = '0154')
    AND LOWER(business_name) != LOWER('Kettles Pottery Supplies Ltd') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Kettles Pottery Supplies Ltd'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Kettles Pottery Supplies Ltd') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Kettles Pottery Supplies Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Kettles Pottery Supplies Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0154',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Kettles Pottery Supplies Ltd', 'MOOV-0154', '0154', '154'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Kettles Pottery Supplies Ltd', 'MOOV-0154', 'MOOV-0154', 'active', 'standard', ARRAY['Kettles Pottery Supplies Ltd', 'MOOV-0154', '0154', '154']);
  END IF;

  -- ── East Coast Creations Ltd (MOOV-0155) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0155' OR dc_customer_id = '0155')
    AND LOWER(business_name) != LOWER('East Coast Creations Ltd') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('East Coast Creations Ltd'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('East Coast Creations Ltd') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('East Coast Creations Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%East Coast Creations Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0155',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['East Coast Creations Ltd', 'MOOV-0155', '0155', '155'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('East Coast Creations Ltd', 'MOOV-0155', 'MOOV-0155', 'active', 'standard', ARRAY['East Coast Creations Ltd', 'MOOV-0155', '0155', '155']);
  END IF;

  -- ── ETA Solutions Limited (MOOV-0156) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0156' OR dc_customer_id = '0156')
    AND LOWER(business_name) != LOWER('ETA Solutions Limited') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('ETA Solutions Limited'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('ETA Solutions Limited') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('ETA Solutions Limited'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%ETA Solutions Limited%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0156',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['ETA Solutions Limited', 'MOOV-0156', '0156', '156'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('ETA Solutions Limited', 'MOOV-0156', 'MOOV-0156', 'active', 'standard', ARRAY['ETA Solutions Limited', 'MOOV-0156', '0156', '156']);
  END IF;

  -- ── Security Trade Products Ltd (MOOV-0157) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0157' OR dc_customer_id = '0157')
    AND LOWER(business_name) != LOWER('Security Trade Products Ltd') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Security Trade Products Ltd'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Security Trade Products Ltd') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Security Trade Products Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Security Trade Products Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0157',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Security Trade Products Ltd', 'MOOV-0157', '0157', '157'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Security Trade Products Ltd', 'MOOV-0157', 'MOOV-0157', 'active', 'standard', ARRAY['Security Trade Products Ltd', 'MOOV-0157', '0157', '157']);
  END IF;

  -- ── Sarratt Online Ltd (MOOV-0158) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0158' OR dc_customer_id = '0158')
    AND LOWER(business_name) != LOWER('Sarratt Online Ltd') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Sarratt Online Ltd'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Sarratt Online Ltd') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Sarratt Online Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Sarratt Online Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0158',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Sarratt Online Ltd', 'MOOV-0158', '0158', '158'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Sarratt Online Ltd', 'MOOV-0158', 'MOOV-0158', 'active', 'standard', ARRAY['Sarratt Online Ltd', 'MOOV-0158', '0158', '158']);
  END IF;

  -- ── Agar Hygiene Ltd (MOOV-0159) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0159' OR dc_customer_id = '0159')
    AND LOWER(business_name) != LOWER('Agar Hygiene Ltd') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Agar Hygiene Ltd'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Agar Hygiene Ltd') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Agar Hygiene Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Agar Hygiene Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0159',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Agar Hygiene Ltd', 'MOOV-0159', '0159', '159'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Agar Hygiene Ltd', 'MOOV-0159', 'MOOV-0159', 'active', 'standard', ARRAY['Agar Hygiene Ltd', 'MOOV-0159', '0159', '159']);
  END IF;

  -- ── Lesser Spotted Images Ltd (MOOV-0160) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0160' OR dc_customer_id = '0160')
    AND LOWER(business_name) != LOWER('Lesser Spotted Images Ltd') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Lesser Spotted Images Ltd'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Lesser Spotted Images Ltd') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Lesser Spotted Images Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Lesser Spotted Images Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0160',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Lesser Spotted Images Ltd', 'MOOV-0160', '0160', '160'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Lesser Spotted Images Ltd', 'MOOV-0160', 'MOOV-0160', 'active', 'standard', ARRAY['Lesser Spotted Images Ltd', 'MOOV-0160', '0160', '160']);
  END IF;

  -- ── Just Cable Ties (MOOV-0161) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0161' OR dc_customer_id = '0161')
    AND LOWER(business_name) != LOWER('Just Cable Ties') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Just Cable Ties'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Just Cable Ties') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Just Cable Ties'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Just Cable Ties%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0161',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Just Cable Ties', 'MOOV-0161', '0161', '161'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Just Cable Ties', 'MOOV-0161', 'MOOV-0161', 'active', 'standard', ARRAY['Just Cable Ties', 'MOOV-0161', '0161', '161']);
  END IF;

  -- ── Work and Wear Direct Ltd (Work and Wear Direct Ltd) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'Work and Wear Direct Ltd' )
    AND LOWER(business_name) != LOWER('Work and Wear Direct Ltd') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Work and Wear Direct Ltd'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Work and Wear Direct Ltd') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Work and Wear Direct Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Work and Wear Direct Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'Work and Wear Direct Ltd',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Work and Wear Direct Ltd', 'Work and Wear Direct Ltd'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Work and Wear Direct Ltd', 'Work and Wear Direct Ltd', 'Work and Wear Direct Ltd', 'active', 'standard', ARRAY['Work and Wear Direct Ltd', 'Work and Wear Direct Ltd']);
  END IF;

  -- ── Exhale Boutique (Exhale Boutique) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'Exhale Boutique' )
    AND LOWER(business_name) != LOWER('Exhale Boutique') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Exhale Boutique'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Exhale Boutique') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Exhale Boutique'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Exhale Boutique%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'Exhale Boutique',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Exhale Boutique', 'Exhale Boutique'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Exhale Boutique', 'Exhale Boutique', 'Exhale Boutique', 'active', 'standard', ARRAY['Exhale Boutique', 'Exhale Boutique']);
  END IF;

  -- ── Southdown Abrasives & Ind Chemicals Ltd (MOOV-0162) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0162' OR dc_customer_id = '0162')
    AND LOWER(business_name) != LOWER('Southdown Abrasives & Ind Chemicals Ltd') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Southdown Abrasives & Ind Chemicals Ltd'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Southdown Abrasives & Ind Chemicals Ltd') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Southdown Abrasives & Ind Chemicals Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Southdown Abrasives & Ind Chemicals Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0162',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Southdown Abrasives & Ind Chemicals Ltd', 'MOOV-0162', '0162', '162'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Southdown Abrasives & Ind Chemicals Ltd', 'MOOV-0162', 'MOOV-0162', 'active', 'standard', ARRAY['Southdown Abrasives & Ind Chemicals Ltd', 'MOOV-0162', '0162', '162']);
  END IF;

  -- ── Tackl (Tackl) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'Tackl' )
    AND LOWER(business_name) != LOWER('Tackl') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Tackl'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Tackl') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Tackl'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Tackl%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'Tackl',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Tackl', 'Tackl'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Tackl', 'Tackl', 'Tackl', 'active', 'standard', ARRAY['Tackl', 'Tackl']);
  END IF;

  -- ── Auto Test (Auto) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'Auto' )
    AND LOWER(business_name) != LOWER('Auto Test') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Auto Test'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Auto Test') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Auto Test'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Auto Test%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'Auto',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Auto Test', 'Auto'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Auto Test', 'Auto', 'Auto', 'active', 'standard', ARRAY['Auto Test', 'Auto']);
  END IF;

  -- ── HPSA Ltd (MOOV-0163) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0163' OR dc_customer_id = '0163')
    AND LOWER(business_name) != LOWER('HPSA Ltd') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('HPSA Ltd'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('HPSA Ltd') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('HPSA Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%HPSA Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0163',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['HPSA Ltd', 'MOOV-0163', '0163', '163'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('HPSA Ltd', 'MOOV-0163', 'MOOV-0163', 'active', 'standard', ARRAY['HPSA Ltd', 'MOOV-0163', '0163', '163']);
  END IF;

  -- ── ceravi (DP1-0051) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'DP1-0051' OR dc_customer_id = '1')
    AND LOWER(business_name) != LOWER('ceravi') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('ceravi'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('ceravi') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('ceravi'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%ceravi%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'DP1-0051',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['ceravi', 'DP1-0051', '1'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('ceravi', 'DP1-0051', 'DP1-0051', 'active', 'standard', ARRAY['ceravi', 'DP1-0051', '1']);
  END IF;

  -- ── PWS Leeds Ltd (MOOV-0164) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0164' OR dc_customer_id = '0164')
    AND LOWER(business_name) != LOWER('PWS Leeds Ltd') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('PWS Leeds Ltd'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('PWS Leeds Ltd') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('PWS Leeds Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%PWS Leeds Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0164',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['PWS Leeds Ltd', 'MOOV-0164', '0164', '164'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('PWS Leeds Ltd', 'MOOV-0164', 'MOOV-0164', 'active', 'standard', ARRAY['PWS Leeds Ltd', 'MOOV-0164', '0164', '164']);
  END IF;

  -- ── Total Insignia Ltd (MOOV-0165) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0165' OR dc_customer_id = '0165')
    AND LOWER(business_name) != LOWER('Total Insignia Ltd') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Total Insignia Ltd'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Total Insignia Ltd') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Total Insignia Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Total Insignia Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0165',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Total Insignia Ltd', 'MOOV-0165', '0165', '165'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Total Insignia Ltd', 'MOOV-0165', 'MOOV-0165', 'active', 'standard', ARRAY['Total Insignia Ltd', 'MOOV-0165', '0165', '165']);
  END IF;

  -- ── USER (EFD1-0004) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'EFD1-0004' OR dc_customer_id = '1')
    AND LOWER(business_name) != LOWER('USER') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('USER'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('USER') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('USER'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%USER%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'EFD1-0004',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['USER', 'EFD1-0004', '1'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('USER', 'EFD1-0004', 'EFD1-0004', 'active', 'standard', ARRAY['USER', 'EFD1-0004', '1']);
  END IF;

  -- ── The Wild Meat Company ltd (MOOV-0166) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0166' OR dc_customer_id = '0166')
    AND LOWER(business_name) != LOWER('The Wild Meat Company ltd') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('The Wild Meat Company ltd'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('The Wild Meat Company ltd') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('The Wild Meat Company ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%The Wild Meat Company ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0166',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['The Wild Meat Company ltd', 'MOOV-0166', '0166', '166'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('The Wild Meat Company ltd', 'MOOV-0166', 'MOOV-0166', 'active', 'standard', ARRAY['The Wild Meat Company ltd', 'MOOV-0166', '0166', '166']);
  END IF;

  -- ── Grace Test Account (MOOV-0167) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0167' OR dc_customer_id = '0167')
    AND LOWER(business_name) != LOWER('Grace Test Account') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Grace Test Account'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Grace Test Account') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Grace Test Account'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Grace Test Account%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0167',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Grace Test Account', 'MOOV-0167', '0167', '167'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Grace Test Account', 'MOOV-0167', 'MOOV-0167', 'active', 'standard', ARRAY['Grace Test Account', 'MOOV-0167', '0167', '167']);
  END IF;

  -- ── Bob AI (MOOV-0168) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0168' OR dc_customer_id = '0168')
    AND LOWER(business_name) != LOWER('Bob AI') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Bob AI'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Bob AI') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Bob AI'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Bob AI%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0168',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Bob AI', 'MOOV-0168', '0168', '168'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Bob AI', 'MOOV-0168', 'MOOV-0168', 'active', 'standard', ARRAY['Bob AI', 'MOOV-0168', '0168', '168']);
  END IF;

  -- ── Xplore Brands (MOOV-0169) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0169' OR dc_customer_id = '0169')
    AND LOWER(business_name) != LOWER('Xplore Brands') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Xplore Brands'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Xplore Brands') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Xplore Brands'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Xplore Brands%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0169',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Xplore Brands', 'MOOV-0169', '0169', '169'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Xplore Brands', 'MOOV-0169', 'MOOV-0169', 'active', 'standard', ARRAY['Xplore Brands', 'MOOV-0169', '0169', '169']);
  END IF;

  -- ── Medicube (DQA1-0018) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'DQA1-0018' OR dc_customer_id = '1')
    AND LOWER(business_name) != LOWER('Medicube') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Medicube'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Medicube') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Medicube'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Medicube%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'DQA1-0018',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Medicube', 'DQA1-0018', '1'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Medicube', 'DQA1-0018', 'DQA1-0018', 'active', 'standard', ARRAY['Medicube', 'DQA1-0018', '1']);
  END IF;

  -- ── Sherwood Wholesale Foods Ltd (MOOV-0170) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0170' OR dc_customer_id = '0170')
    AND LOWER(business_name) != LOWER('Sherwood Wholesale Foods Ltd') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Sherwood Wholesale Foods Ltd'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Sherwood Wholesale Foods Ltd') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Sherwood Wholesale Foods Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Sherwood Wholesale Foods Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0170',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Sherwood Wholesale Foods Ltd', 'MOOV-0170', '0170', '170'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Sherwood Wholesale Foods Ltd', 'MOOV-0170', 'MOOV-0170', 'active', 'standard', ARRAY['Sherwood Wholesale Foods Ltd', 'MOOV-0170', '0170', '170']);
  END IF;

  -- ── 2023 (QDP1-0001) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'QDP1-0001' OR dc_customer_id = '1')
    AND LOWER(business_name) != LOWER('2023') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('2023'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('2023') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('2023'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%2023%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'QDP1-0001',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['2023', 'QDP1-0001', '1'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('2023', 'QDP1-0001', 'QDP1-0001', 'active', 'standard', ARRAY['2023', 'QDP1-0001', '1']);
  END IF;

  -- ── PROD EF COMPANY (TDP1-0001) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'TDP1-0001' OR dc_customer_id = '1')
    AND LOWER(business_name) != LOWER('PROD EF COMPANY') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('PROD EF COMPANY'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('PROD EF COMPANY') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('PROD EF COMPANY'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%PROD EF COMPANY%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'TDP1-0001',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['PROD EF COMPANY', 'TDP1-0001', '1'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('PROD EF COMPANY', 'TDP1-0001', 'TDP1-0001', 'active', 'standard', ARRAY['PROD EF COMPANY', 'TDP1-0001', '1']);
  END IF;

  -- ── EF (DE22-0009) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'DE22-0009' OR dc_customer_id = '22')
    AND LOWER(business_name) != LOWER('EF') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('EF'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('EF') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('EF'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%EF%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'DE22-0009',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['EF', 'DE22-0009', '22'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('EF', 'DE22-0009', 'DE22-0009', 'active', 'standard', ARRAY['EF', 'DE22-0009', '22']);
  END IF;

  -- ── NNU (DE22-0011) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'DE22-0011' OR dc_customer_id = '22')
    AND LOWER(business_name) != LOWER('NNU') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('NNU'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('NNU') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('NNU'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%NNU%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'DE22-0011',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['NNU', 'DE22-0011', '22'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('NNU', 'DE22-0011', 'DE22-0011', 'active', 'standard', ARRAY['NNU', 'DE22-0011', '22']);
  END IF;

  -- ── Non Ninja Company (QDP1-0003) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'QDP1-0003' OR dc_customer_id = '1')
    AND LOWER(business_name) != LOWER('Non Ninja Company') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Non Ninja Company'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Non Ninja Company') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Non Ninja Company'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Non Ninja Company%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'QDP1-0003',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Non Ninja Company', 'QDP1-0003', '1'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Non Ninja Company', 'QDP1-0003', 'QDP1-0003', 'active', 'standard', ARRAY['Non Ninja Company', 'QDP1-0003', '1']);
  END IF;

  -- ── Test Ninja company (DP1-0053) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'DP1-0053' OR dc_customer_id = '1')
    AND LOWER(business_name) != LOWER('Test Ninja company') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Test Ninja company'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Test Ninja company') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Test Ninja company'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Test Ninja company%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'DP1-0053',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Test Ninja company', 'DP1-0053', '1'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Test Ninja company', 'DP1-0053', 'DP1-0053', 'active', 'standard', ARRAY['Test Ninja company', 'DP1-0053', '1']);
  END IF;

  -- ── Efutures Non Ninja company (DE22-0015) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'DE22-0015' OR dc_customer_id = '22')
    AND LOWER(business_name) != LOWER('Efutures Non Ninja company') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Efutures Non Ninja company'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Efutures Non Ninja company') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Efutures Non Ninja company'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Efutures Non Ninja company%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'DE22-0015',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Efutures Non Ninja company', 'DE22-0015', '22'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Efutures Non Ninja company', 'DE22-0015', 'DE22-0015', 'active', 'standard', ARRAY['Efutures Non Ninja company', 'DE22-0015', '22']);
  END IF;

  -- ── EFUTURES TEST PORD NINJA COMPANY (TDP1-0005) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'TDP1-0005' OR dc_customer_id = '1')
    AND LOWER(business_name) != LOWER('EFUTURES TEST PORD NINJA COMPANY') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('EFUTURES TEST PORD NINJA COMPANY'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('EFUTURES TEST PORD NINJA COMPANY') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('EFUTURES TEST PORD NINJA COMPANY'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%EFUTURES TEST PORD NINJA COMPANY%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'TDP1-0005',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['EFUTURES TEST PORD NINJA COMPANY', 'TDP1-0005', '1'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('EFUTURES TEST PORD NINJA COMPANY', 'TDP1-0005', 'TDP1-0005', 'active', 'standard', ARRAY['EFUTURES TEST PORD NINJA COMPANY', 'TDP1-0005', '1']);
  END IF;

  -- ── Test Efutures Non Ninja comp (TDP1-0007) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'TDP1-0007' OR dc_customer_id = '1')
    AND LOWER(business_name) != LOWER('Test Efutures Non Ninja comp') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Test Efutures Non Ninja comp'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Test Efutures Non Ninja comp') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Test Efutures Non Ninja comp'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Test Efutures Non Ninja comp%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'TDP1-0007',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Test Efutures Non Ninja comp', 'TDP1-0007', '1'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Test Efutures Non Ninja comp', 'TDP1-0007', 'TDP1-0007', 'active', 'standard', ARRAY['Test Efutures Non Ninja comp', 'TDP1-0007', '1']);
  END IF;

  -- ── Jamie Ferments Limited (MOOV-0171) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0171' OR dc_customer_id = '0171')
    AND LOWER(business_name) != LOWER('Jamie Ferments Limited') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Jamie Ferments Limited'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Jamie Ferments Limited') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Jamie Ferments Limited'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Jamie Ferments Limited%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0171',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Jamie Ferments Limited', 'MOOV-0171', '0171', '171'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Jamie Ferments Limited', 'MOOV-0171', 'MOOV-0171', 'active', 'standard', ARRAY['Jamie Ferments Limited', 'MOOV-0171', '0171', '171']);
  END IF;

  -- ── Jezaya UK Limited (MOOV-0172) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0172' OR dc_customer_id = '0172')
    AND LOWER(business_name) != LOWER('Jezaya UK Limited') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Jezaya UK Limited'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Jezaya UK Limited') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Jezaya UK Limited'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Jezaya UK Limited%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0172',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Jezaya UK Limited', 'MOOV-0172', '0172', '172'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Jezaya UK Limited', 'MOOV-0172', 'MOOV-0172', 'active', 'standard', ARRAY['Jezaya UK Limited', 'MOOV-0172', '0172', '172']);
  END IF;

  -- ── Wine Buffs Ltd (MOOV-0173) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0173' OR dc_customer_id = '0173')
    AND LOWER(business_name) != LOWER('Wine Buffs Ltd') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Wine Buffs Ltd'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Wine Buffs Ltd') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Wine Buffs Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Wine Buffs Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0173',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Wine Buffs Ltd', 'MOOV-0173', '0173', '173'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Wine Buffs Ltd', 'MOOV-0173', 'MOOV-0173', 'active', 'standard', ARRAY['Wine Buffs Ltd', 'MOOV-0173', '0173', '173']);
  END IF;

  -- ── Doran Packaging Ltd (MOOV-0174) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0174' OR dc_customer_id = '0174')
    AND LOWER(business_name) != LOWER('Doran Packaging Ltd') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Doran Packaging Ltd'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Doran Packaging Ltd') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Doran Packaging Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Doran Packaging Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0174',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Doran Packaging Ltd', 'MOOV-0174', '0174', '174'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Doran Packaging Ltd', 'MOOV-0174', 'MOOV-0174', 'active', 'standard', ARRAY['Doran Packaging Ltd', 'MOOV-0174', '0174', '174']);
  END IF;

  -- ── Purozo Limited (MOOV-0175) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0175' OR dc_customer_id = '0175')
    AND LOWER(business_name) != LOWER('Purozo Limited') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Purozo Limited'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Purozo Limited') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Purozo Limited'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Purozo Limited%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0175',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Purozo Limited', 'MOOV-0175', '0175', '175'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Purozo Limited', 'MOOV-0175', 'MOOV-0175', 'active', 'standard', ARRAY['Purozo Limited', 'MOOV-0175', '0175', '175']);
  END IF;

  -- ── Wosi Wosi Foods Limited (MOOV-0176) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0176' OR dc_customer_id = '0176')
    AND LOWER(business_name) != LOWER('Wosi Wosi Foods Limited') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Wosi Wosi Foods Limited'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Wosi Wosi Foods Limited') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Wosi Wosi Foods Limited'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Wosi Wosi Foods Limited%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0176',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Wosi Wosi Foods Limited', 'MOOV-0176', '0176', '176', 'wasi wasi', 'wasiwasi', 'wosi wosi', 'wosiwosi', '0176'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Wosi Wosi Foods Limited', 'MOOV-0176', 'MOOV-0176', 'active', 'standard', ARRAY['Wosi Wosi Foods Limited', 'MOOV-0176', '0176', '176', 'wasi wasi', 'wasiwasi', 'wosi wosi', 'wosiwosi', '0176']);
  END IF;

  -- ── My Shadow Ltd (MOOV-0177) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0177' OR dc_customer_id = '0177')
    AND LOWER(business_name) != LOWER('My Shadow Ltd') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('My Shadow Ltd'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('My Shadow Ltd') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('My Shadow Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%My Shadow Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0177',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['My Shadow Ltd', 'MOOV-0177', '0177', '177'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('My Shadow Ltd', 'MOOV-0177', 'MOOV-0177', 'active', 'standard', ARRAY['My Shadow Ltd', 'MOOV-0177', '0177', '177']);
  END IF;

  -- ── U-Telecom Ltd (MOOV-0178) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0178' OR dc_customer_id = '0178')
    AND LOWER(business_name) != LOWER('U-Telecom Ltd') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('U-Telecom Ltd'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('U-Telecom Ltd') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('U-Telecom Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%U-Telecom Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0178',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['U-Telecom Ltd', 'MOOV-0178', '0178', '178'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('U-Telecom Ltd', 'MOOV-0178', 'MOOV-0178', 'active', 'standard', ARRAY['U-Telecom Ltd', 'MOOV-0178', '0178', '178']);
  END IF;

  -- ── Mala Leather (MOOV-0179) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0179' OR dc_customer_id = '0179')
    AND LOWER(business_name) != LOWER('Mala Leather') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Mala Leather'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Mala Leather') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Mala Leather'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Mala Leather%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0179',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Mala Leather', 'MOOV-0179', '0179', '179'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Mala Leather', 'MOOV-0179', 'MOOV-0179', 'active', 'standard', ARRAY['Mala Leather', 'MOOV-0179', '0179', '179']);
  END IF;

  -- ── CT Inc (DP1-0003) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'DP1-0003' OR dc_customer_id = '1')
    AND LOWER(business_name) != LOWER('CT Inc') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('CT Inc'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('CT Inc') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('CT Inc'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%CT Inc%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'DP1-0003',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['CT Inc', 'DP1-0003', '1'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('CT Inc', 'DP1-0003', 'DP1-0003', 'active', 'standard', ARRAY['CT Inc', 'DP1-0003', '1']);
  END IF;

  -- ── Golf and Baby Limited (MOOV-0180) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0180' OR dc_customer_id = '0180')
    AND LOWER(business_name) != LOWER('Golf and Baby Limited') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Golf and Baby Limited'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Golf and Baby Limited') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Golf and Baby Limited'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Golf and Baby Limited%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0180',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Golf and Baby Limited', 'MOOV-0180', '0180', '180'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Golf and Baby Limited', 'MOOV-0180', 'MOOV-0180', 'active', 'standard', ARRAY['Golf and Baby Limited', 'MOOV-0180', '0180', '180']);
  END IF;

  -- ── IMEX China Trade Ltd (MOOV-0181) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0181' OR dc_customer_id = '0181')
    AND LOWER(business_name) != LOWER('IMEX China Trade Ltd') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('IMEX China Trade Ltd'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('IMEX China Trade Ltd') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('IMEX China Trade Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%IMEX China Trade Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0181',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['IMEX China Trade Ltd', 'MOOV-0181', '0181', '181'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('IMEX China Trade Ltd', 'MOOV-0181', 'MOOV-0181', 'active', 'standard', ARRAY['IMEX China Trade Ltd', 'MOOV-0181', '0181', '181']);
  END IF;

  -- ── Tanalia Ltd (MOOV-0182) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0182' OR dc_customer_id = '0182')
    AND LOWER(business_name) != LOWER('Tanalia Ltd') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Tanalia Ltd'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Tanalia Ltd') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Tanalia Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Tanalia Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0182',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Tanalia Ltd', 'MOOV-0182', '0182', '182'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Tanalia Ltd', 'MOOV-0182', 'MOOV-0182', 'active', 'standard', ARRAY['Tanalia Ltd', 'MOOV-0182', '0182', '182']);
  END IF;

  -- ── Saturn Display Ltd (MOOV-0183) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0183' OR dc_customer_id = '0183')
    AND LOWER(business_name) != LOWER('Saturn Display Ltd') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Saturn Display Ltd'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Saturn Display Ltd') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Saturn Display Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Saturn Display Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0183',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Saturn Display Ltd', 'MOOV-0183', '0183', '183'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Saturn Display Ltd', 'MOOV-0183', 'MOOV-0183', 'active', 'standard', ARRAY['Saturn Display Ltd', 'MOOV-0183', '0183', '183']);
  END IF;

  -- ── Fun Stickers Ltd (MOOV-0184) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0184' OR dc_customer_id = '0184')
    AND LOWER(business_name) != LOWER('Fun Stickers Ltd') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Fun Stickers Ltd'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Fun Stickers Ltd') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Fun Stickers Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Fun Stickers Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0184',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Fun Stickers Ltd', 'MOOV-0184', '0184', '184'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Fun Stickers Ltd', 'MOOV-0184', 'MOOV-0184', 'active', 'standard', ARRAY['Fun Stickers Ltd', 'MOOV-0184', '0184', '184']);
  END IF;

  -- ── Perex Group Ltd (MOOV-0185) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0185' OR dc_customer_id = '0185')
    AND LOWER(business_name) != LOWER('Perex Group Ltd') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Perex Group Ltd'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Perex Group Ltd') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Perex Group Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Perex Group Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0185',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Perex Group Ltd', 'MOOV-0185', '0185', '185'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Perex Group Ltd', 'MOOV-0185', 'MOOV-0185', 'active', 'standard', ARRAY['Perex Group Ltd', 'MOOV-0185', '0185', '185']);
  END IF;

  -- ── TT Proturf Ltd (MOOV-0186) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0186' OR dc_customer_id = '0186')
    AND LOWER(business_name) != LOWER('TT Proturf Ltd') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('TT Proturf Ltd'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('TT Proturf Ltd') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('TT Proturf Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%TT Proturf Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0186',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['TT Proturf Ltd', 'MOOV-0186', '0186', '186'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('TT Proturf Ltd', 'MOOV-0186', 'MOOV-0186', 'active', 'standard', ARRAY['TT Proturf Ltd', 'MOOV-0186', '0186', '186']);
  END IF;

  -- ── Decorative Gardens Ltd (MOOV-0187) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0187' OR dc_customer_id = '0187')
    AND LOWER(business_name) != LOWER('Decorative Gardens Ltd') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Decorative Gardens Ltd'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Decorative Gardens Ltd') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Decorative Gardens Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Decorative Gardens Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0187',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Decorative Gardens Ltd', 'MOOV-0187', '0187', '187'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Decorative Gardens Ltd', 'MOOV-0187', 'MOOV-0187', 'active', 'standard', ARRAY['Decorative Gardens Ltd', 'MOOV-0187', '0187', '187']);
  END IF;

  -- ── Isoclean Ltd (MOOV-0188) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0188' OR dc_customer_id = '0188')
    AND LOWER(business_name) != LOWER('Isoclean Ltd') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Isoclean Ltd'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Isoclean Ltd') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Isoclean Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Isoclean Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0188',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Isoclean Ltd', 'MOOV-0188', '0188', '188'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Isoclean Ltd', 'MOOV-0188', 'MOOV-0188', 'active', 'standard', ARRAY['Isoclean Ltd', 'MOOV-0188', '0188', '188']);
  END IF;

  -- ── C Com (DP1-0054) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'DP1-0054' OR dc_customer_id = '1')
    AND LOWER(business_name) != LOWER('C Com') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('C Com'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('C Com') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('C Com'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%C Com%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'DP1-0054',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['C Com', 'DP1-0054', '1'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('C Com', 'DP1-0054', 'DP1-0054', 'active', 'standard', ARRAY['C Com', 'DP1-0054', '1']);
  END IF;

  -- ── Bodri Ltd (MOOV-0189) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0189' OR dc_customer_id = '0189')
    AND LOWER(business_name) != LOWER('Bodri Ltd') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Bodri Ltd'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Bodri Ltd') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Bodri Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Bodri Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0189',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Bodri Ltd', 'MOOV-0189', '0189', '189'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Bodri Ltd', 'MOOV-0189', 'MOOV-0189', 'active', 'standard', ARRAY['Bodri Ltd', 'MOOV-0189', '0189', '189']);
  END IF;

  -- ── 1st Class Uniforms & Workwear Ltd (MOOV-0190) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0190' OR dc_customer_id = '0190')
    AND LOWER(business_name) != LOWER('1st Class Uniforms & Workwear Ltd') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('1st Class Uniforms & Workwear Ltd'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('1st Class Uniforms & Workwear Ltd') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('1st Class Uniforms & Workwear Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%1st Class Uniforms & Workwear Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0190',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['1st Class Uniforms & Workwear Ltd', 'MOOV-0190', '0190', '190'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('1st Class Uniforms & Workwear Ltd', 'MOOV-0190', 'MOOV-0190', 'active', 'standard', ARRAY['1st Class Uniforms & Workwear Ltd', 'MOOV-0190', '0190', '190']);
  END IF;

  -- ── Carp Junky (MOOV-0191) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0191' OR dc_customer_id = '0191')
    AND LOWER(business_name) != LOWER('Carp Junky') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Carp Junky'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Carp Junky') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Carp Junky'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Carp Junky%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0191',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Carp Junky', 'MOOV-0191', '0191', '191'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Carp Junky', 'MOOV-0191', 'MOOV-0191', 'active', 'standard', ARRAY['Carp Junky', 'MOOV-0191', '0191', '191']);
  END IF;

  -- ── Mackemshop Ltd (MOOV-0192) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0192' OR dc_customer_id = '0192')
    AND LOWER(business_name) != LOWER('Mackemshop Ltd') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Mackemshop Ltd'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Mackemshop Ltd') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Mackemshop Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Mackemshop Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0192',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Mackemshop Ltd', 'MOOV-0192', '0192', '192'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Mackemshop Ltd', 'MOOV-0192', 'MOOV-0192', 'active', 'standard', ARRAY['Mackemshop Ltd', 'MOOV-0192', '0192', '192']);
  END IF;

  -- ── Test company CHN (TDP1-0009) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'TDP1-0009' OR dc_customer_id = '1')
    AND LOWER(business_name) != LOWER('Test company CHN') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Test company CHN'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Test company CHN') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Test company CHN'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Test company CHN%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'TDP1-0009',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Test company CHN', 'TDP1-0009', '1'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Test company CHN', 'TDP1-0009', 'TDP1-0009', 'active', 'standard', ARRAY['Test company CHN', 'TDP1-0009', '1']);
  END IF;

  -- ── UK Wedding Favours Ltd (MOOV-0193) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0193' OR dc_customer_id = '0193')
    AND LOWER(business_name) != LOWER('UK Wedding Favours Ltd') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('UK Wedding Favours Ltd'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('UK Wedding Favours Ltd') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('UK Wedding Favours Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%UK Wedding Favours Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0193',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['UK Wedding Favours Ltd', 'MOOV-0193', '0193', '193'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('UK Wedding Favours Ltd', 'MOOV-0193', 'MOOV-0193', 'active', 'standard', ARRAY['UK Wedding Favours Ltd', 'MOOV-0193', '0193', '193']);
  END IF;

  -- ── Pure Crimson Design Limited (MOOV-0194) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0194' OR dc_customer_id = '0194')
    AND LOWER(business_name) != LOWER('Pure Crimson Design Limited') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Pure Crimson Design Limited'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Pure Crimson Design Limited') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Pure Crimson Design Limited'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Pure Crimson Design Limited%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0194',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Pure Crimson Design Limited', 'MOOV-0194', '0194', '194'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Pure Crimson Design Limited', 'MOOV-0194', 'MOOV-0194', 'active', 'standard', ARRAY['Pure Crimson Design Limited', 'MOOV-0194', '0194', '194']);
  END IF;

  -- ── ID Dance school sport & leisure wear limited (MOOV-0195) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0195' OR dc_customer_id = '0195')
    AND LOWER(business_name) != LOWER('ID Dance school sport & leisure wear limited') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('ID Dance school sport & leisure wear limited'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('ID Dance school sport & leisure wear limited') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('ID Dance school sport & leisure wear limited'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%ID Dance school sport & leisure wear limited%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0195',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['ID Dance school sport & leisure wear limited', 'MOOV-0195', '0195', '195'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('ID Dance school sport & leisure wear limited', 'MOOV-0195', 'MOOV-0195', 'active', 'standard', ARRAY['ID Dance school sport & leisure wear limited', 'MOOV-0195', '0195', '195']);
  END IF;

  -- ── Smilax Ltd (MOOV-0196) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0196' OR dc_customer_id = '0196')
    AND LOWER(business_name) != LOWER('Smilax Ltd') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Smilax Ltd'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Smilax Ltd') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Smilax Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Smilax Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0196',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Smilax Ltd', 'MOOV-0196', '0196', '196'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Smilax Ltd', 'MOOV-0196', 'MOOV-0196', 'active', 'standard', ARRAY['Smilax Ltd', 'MOOV-0196', '0196', '196']);
  END IF;

  -- ── Slumba London (MOOV-0197) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0197' OR dc_customer_id = '0197')
    AND LOWER(business_name) != LOWER('Slumba London') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Slumba London'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Slumba London') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Slumba London'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Slumba London%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0197',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Slumba London', 'MOOV-0197', '0197', '197'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Slumba London', 'MOOV-0197', 'MOOV-0197', 'active', 'standard', ARRAY['Slumba London', 'MOOV-0197', '0197', '197']);
  END IF;

  -- ── Amba Hydraulics Ltd (MOOV-0198) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0198' OR dc_customer_id = '0198')
    AND LOWER(business_name) != LOWER('Amba Hydraulics Ltd') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Amba Hydraulics Ltd'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Amba Hydraulics Ltd') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Amba Hydraulics Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Amba Hydraulics Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0198',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Amba Hydraulics Ltd', 'MOOV-0198', '0198', '198'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Amba Hydraulics Ltd', 'MOOV-0198', 'MOOV-0198', 'active', 'standard', ARRAY['Amba Hydraulics Ltd', 'MOOV-0198', '0198', '198']);
  END IF;

  -- ── Ayurvedic Nature Care Ltd (MOOV-0199) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0199' OR dc_customer_id = '0199')
    AND LOWER(business_name) != LOWER('Ayurvedic Nature Care Ltd') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Ayurvedic Nature Care Ltd'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Ayurvedic Nature Care Ltd') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Ayurvedic Nature Care Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Ayurvedic Nature Care Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0199',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Ayurvedic Nature Care Ltd', 'MOOV-0199', '0199', '199'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Ayurvedic Nature Care Ltd', 'MOOV-0199', 'MOOV-0199', 'active', 'standard', ARRAY['Ayurvedic Nature Care Ltd', 'MOOV-0199', '0199', '199']);
  END IF;

  -- ── Chopra Brothers Intl Group Ltd (MOOV-0200) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0200' OR dc_customer_id = '0200')
    AND LOWER(business_name) != LOWER('Chopra Brothers Intl Group Ltd') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Chopra Brothers Intl Group Ltd'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Chopra Brothers Intl Group Ltd') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Chopra Brothers Intl Group Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Chopra Brothers Intl Group Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0200',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Chopra Brothers Intl Group Ltd', 'MOOV-0200', '0200', '200'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Chopra Brothers Intl Group Ltd', 'MOOV-0200', 'MOOV-0200', 'active', 'standard', ARRAY['Chopra Brothers Intl Group Ltd', 'MOOV-0200', '0200', '200']);
  END IF;

  -- ── Sofa Scene Ltd (MOOV-0201) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0201' OR dc_customer_id = '0201')
    AND LOWER(business_name) != LOWER('Sofa Scene Ltd') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Sofa Scene Ltd'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Sofa Scene Ltd') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Sofa Scene Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Sofa Scene Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0201',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Sofa Scene Ltd', 'MOOV-0201', '0201', '201'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Sofa Scene Ltd', 'MOOV-0201', 'MOOV-0201', 'active', 'standard', ARRAY['Sofa Scene Ltd', 'MOOV-0201', '0201', '201']);
  END IF;

  -- ── Metal Work Supplies Ltd (MOOV-0202) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0202' OR dc_customer_id = '0202')
    AND LOWER(business_name) != LOWER('Metal Work Supplies Ltd') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Metal Work Supplies Ltd'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Metal Work Supplies Ltd') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Metal Work Supplies Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Metal Work Supplies Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0202',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Metal Work Supplies Ltd', 'MOOV-0202', '0202', '202'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Metal Work Supplies Ltd', 'MOOV-0202', 'MOOV-0202', 'active', 'standard', ARRAY['Metal Work Supplies Ltd', 'MOOV-0202', '0202', '202']);
  END IF;

  -- ── Meilleure Decor Ltd (MOOV-0203) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0203' OR dc_customer_id = '0203')
    AND LOWER(business_name) != LOWER('Meilleure Decor Ltd') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Meilleure Decor Ltd'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Meilleure Decor Ltd') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Meilleure Decor Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Meilleure Decor Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0203',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Meilleure Decor Ltd', 'MOOV-0203', '0203', '203'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Meilleure Decor Ltd', 'MOOV-0203', 'MOOV-0203', 'active', 'standard', ARRAY['Meilleure Decor Ltd', 'MOOV-0203', '0203', '203']);
  END IF;

  -- ── Taunton Trailers (MOOV-0204) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0204' OR dc_customer_id = '0204')
    AND LOWER(business_name) != LOWER('Taunton Trailers') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Taunton Trailers'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Taunton Trailers') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Taunton Trailers'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Taunton Trailers%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0204',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Taunton Trailers', 'MOOV-0204', '0204', '204'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Taunton Trailers', 'MOOV-0204', 'MOOV-0204', 'active', 'standard', ARRAY['Taunton Trailers', 'MOOV-0204', '0204', '204']);
  END IF;

  -- ── Kitloop (Kitloop) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'Kitloop' )
    AND LOWER(business_name) != LOWER('Kitloop') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Kitloop'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Kitloop') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Kitloop'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Kitloop%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'Kitloop',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Kitloop', 'Kitloop'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Kitloop', 'Kitloop', 'Kitloop', 'active', 'standard', ARRAY['Kitloop', 'Kitloop']);
  END IF;

  -- ── Frith Holdings Ltd (MOOV-0205) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0205' OR dc_customer_id = '0205')
    AND LOWER(business_name) != LOWER('Frith Holdings Ltd') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Frith Holdings Ltd'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Frith Holdings Ltd') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Frith Holdings Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Frith Holdings Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0205',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Frith Holdings Ltd', 'MOOV-0205', '0205', '205'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Frith Holdings Ltd', 'MOOV-0205', 'MOOV-0205', 'active', 'standard', ARRAY['Frith Holdings Ltd', 'MOOV-0205', '0205', '205']);
  END IF;

  -- ── 24Up Ltd (MOOV-0206) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0206' OR dc_customer_id = '0206')
    AND LOWER(business_name) != LOWER('24Up Ltd') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('24Up Ltd'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('24Up Ltd') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('24Up Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%24Up Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0206',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['24Up Ltd', 'MOOV-0206', '0206', '206'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('24Up Ltd', 'MOOV-0206', 'MOOV-0206', 'active', 'standard', ARRAY['24Up Ltd', 'MOOV-0206', '0206', '206']);
  END IF;

  -- ── Scarlet Ltd (MOOV-0207) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0207' OR dc_customer_id = '0207')
    AND LOWER(business_name) != LOWER('Scarlet Ltd') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Scarlet Ltd'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Scarlet Ltd') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Scarlet Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Scarlet Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0207',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Scarlet Ltd', 'MOOV-0207', '0207', '207'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Scarlet Ltd', 'MOOV-0207', 'MOOV-0207', 'active', 'standard', ARRAY['Scarlet Ltd', 'MOOV-0207', '0207', '207']);
  END IF;

  -- ── J Adams Ltd (MOOV-0208) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0208' OR dc_customer_id = '0208')
    AND LOWER(business_name) != LOWER('J Adams Ltd') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('J Adams Ltd'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('J Adams Ltd') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('J Adams Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%J Adams Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0208',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['J Adams Ltd', 'MOOV-0208', '0208', '208'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('J Adams Ltd', 'MOOV-0208', 'MOOV-0208', 'active', 'standard', ARRAY['J Adams Ltd', 'MOOV-0208', '0208', '208']);
  END IF;

  -- ── Scarlet Ltd (Scarlet Ltd) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'Scarlet Ltd' )
    AND LOWER(business_name) != LOWER('Scarlet Ltd') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Scarlet Ltd'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Scarlet Ltd') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Scarlet Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Scarlet Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'Scarlet Ltd',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Scarlet Ltd', 'Scarlet Ltd'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Scarlet Ltd', 'Scarlet Ltd', 'Scarlet Ltd', 'active', 'standard', ARRAY['Scarlet Ltd', 'Scarlet Ltd']);
  END IF;

  -- ── Wolf Cycles Limited (MOOV-0209) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0209' OR dc_customer_id = '0209')
    AND LOWER(business_name) != LOWER('Wolf Cycles Limited') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Wolf Cycles Limited'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Wolf Cycles Limited') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Wolf Cycles Limited'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Wolf Cycles Limited%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0209',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Wolf Cycles Limited', 'MOOV-0209', '0209', '209'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Wolf Cycles Limited', 'MOOV-0209', 'MOOV-0209', 'active', 'standard', ARRAY['Wolf Cycles Limited', 'MOOV-0209', '0209', '209']);
  END IF;

  -- ── Hilltop Boarding Kennels and Cat Hotel Ltd (MOOV-0210) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0210' OR dc_customer_id = '0210')
    AND LOWER(business_name) != LOWER('Hilltop Boarding Kennels and Cat Hotel Ltd') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Hilltop Boarding Kennels and Cat Hotel Ltd'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Hilltop Boarding Kennels and Cat Hotel Ltd') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Hilltop Boarding Kennels and Cat Hotel Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Hilltop Boarding Kennels and Cat Hotel Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0210',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Hilltop Boarding Kennels and Cat Hotel Ltd', 'MOOV-0210', '0210', '210'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Hilltop Boarding Kennels and Cat Hotel Ltd', 'MOOV-0210', 'MOOV-0210', 'active', 'standard', ARRAY['Hilltop Boarding Kennels and Cat Hotel Ltd', 'MOOV-0210', '0210', '210']);
  END IF;

  -- ── Tam Demo Account (MOOV-0211) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0211' OR dc_customer_id = '0211')
    AND LOWER(business_name) != LOWER('Tam Demo Account') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Tam Demo Account'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Tam Demo Account') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Tam Demo Account'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Tam Demo Account%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0211',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Tam Demo Account', 'MOOV-0211', '0211', '211'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Tam Demo Account', 'MOOV-0211', 'MOOV-0211', 'active', 'standard', ARRAY['Tam Demo Account', 'MOOV-0211', '0211', '211']);
  END IF;

  -- ── Truck Cranes Ltd (MOOV-0212) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0212' OR dc_customer_id = '0212')
    AND LOWER(business_name) != LOWER('Truck Cranes Ltd') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Truck Cranes Ltd'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Truck Cranes Ltd') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Truck Cranes Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Truck Cranes Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0212',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Truck Cranes Ltd', 'MOOV-0212', '0212', '212'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Truck Cranes Ltd', 'MOOV-0212', 'MOOV-0212', 'active', 'standard', ARRAY['Truck Cranes Ltd', 'MOOV-0212', '0212', '212']);
  END IF;

  -- ── Simple Camper Vans Limited (MOOV-0213) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0213' OR dc_customer_id = '0213')
    AND LOWER(business_name) != LOWER('Simple Camper Vans Limited') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Simple Camper Vans Limited'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Simple Camper Vans Limited') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Simple Camper Vans Limited'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Simple Camper Vans Limited%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0213',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Simple Camper Vans Limited', 'MOOV-0213', '0213', '213'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Simple Camper Vans Limited', 'MOOV-0213', 'MOOV-0213', 'active', 'standard', ARRAY['Simple Camper Vans Limited', 'MOOV-0213', '0213', '213']);
  END IF;

  -- ── Direct Imaging Supplies Limited (MOOV-0214) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0214' OR dc_customer_id = '0214')
    AND LOWER(business_name) != LOWER('Direct Imaging Supplies Limited') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Direct Imaging Supplies Limited'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Direct Imaging Supplies Limited') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Direct Imaging Supplies Limited'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Direct Imaging Supplies Limited%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0214',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Direct Imaging Supplies Limited', 'MOOV-0214', '0214', '214'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Direct Imaging Supplies Limited', 'MOOV-0214', 'MOOV-0214', 'active', 'standard', ARRAY['Direct Imaging Supplies Limited', 'MOOV-0214', '0214', '214']);
  END IF;

  -- ── Bodies-in-Motion Dancewear (MOOV-0215) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0215' OR dc_customer_id = '0215')
    AND LOWER(business_name) != LOWER('Bodies-in-Motion Dancewear') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Bodies-in-Motion Dancewear'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Bodies-in-Motion Dancewear') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Bodies-in-Motion Dancewear'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Bodies-in-Motion Dancewear%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0215',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Bodies-in-Motion Dancewear', 'MOOV-0215', '0215', '215'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Bodies-in-Motion Dancewear', 'MOOV-0215', 'MOOV-0215', 'active', 'standard', ARRAY['Bodies-in-Motion Dancewear', 'MOOV-0215', '0215', '215']);
  END IF;

  -- ── Marvellous Mushrooms (MOOV-0216) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0216' OR dc_customer_id = '0216')
    AND LOWER(business_name) != LOWER('Marvellous Mushrooms') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Marvellous Mushrooms'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Marvellous Mushrooms') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Marvellous Mushrooms'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Marvellous Mushrooms%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0216',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Marvellous Mushrooms', 'MOOV-0216', '0216', '216'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Marvellous Mushrooms', 'MOOV-0216', 'MOOV-0216', 'active', 'standard', ARRAY['Marvellous Mushrooms', 'MOOV-0216', '0216', '216']);
  END IF;

  -- ── Blaze''s Bistro (MOOV-0217) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0217' OR dc_customer_id = '0217')
    AND LOWER(business_name) != LOWER('Blaze''s Bistro') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Blaze''s Bistro'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Blaze''s Bistro') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Blaze''s Bistro'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Blaze''s Bistro%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0217',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Blaze''s Bistro', 'MOOV-0217', '0217', '217'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Blaze''s Bistro', 'MOOV-0217', 'MOOV-0217', 'active', 'standard', ARRAY['Blaze''s Bistro', 'MOOV-0217', '0217', '217']);
  END IF;

  -- ── Triumph Dorset Ltd (MOOV-0218) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0218' OR dc_customer_id = '0218')
    AND LOWER(business_name) != LOWER('Triumph Dorset Ltd') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Triumph Dorset Ltd'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Triumph Dorset Ltd') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Triumph Dorset Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Triumph Dorset Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0218',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Triumph Dorset Ltd', 'MOOV-0218', '0218', '218'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Triumph Dorset Ltd', 'MOOV-0218', 'MOOV-0218', 'active', 'standard', ARRAY['Triumph Dorset Ltd', 'MOOV-0218', '0218', '218']);
  END IF;

  -- ── Cold Case Investigation Unit (MOOV-0219) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0219' OR dc_customer_id = '0219')
    AND LOWER(business_name) != LOWER('Cold Case Investigation Unit') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Cold Case Investigation Unit'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Cold Case Investigation Unit') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Cold Case Investigation Unit'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Cold Case Investigation Unit%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0219',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Cold Case Investigation Unit', 'MOOV-0219', '0219', '219'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Cold Case Investigation Unit', 'MOOV-0219', 'MOOV-0219', 'active', 'standard', ARRAY['Cold Case Investigation Unit', 'MOOV-0219', '0219', '219']);
  END IF;

  -- ── WPC Supplies Ltd (MOOV-0220) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0220' OR dc_customer_id = '0220')
    AND LOWER(business_name) != LOWER('WPC Supplies Ltd') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('WPC Supplies Ltd'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('WPC Supplies Ltd') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('WPC Supplies Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%WPC Supplies Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0220',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['WPC Supplies Ltd', 'MOOV-0220', '0220', '220'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('WPC Supplies Ltd', 'MOOV-0220', 'MOOV-0220', 'active', 'standard', ARRAY['WPC Supplies Ltd', 'MOOV-0220', '0220', '220']);
  END IF;

  -- ── IOI Trading Ltd (MOOV-0221) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0221' OR dc_customer_id = '0221')
    AND LOWER(business_name) != LOWER('IOI Trading Ltd') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('IOI Trading Ltd'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('IOI Trading Ltd') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('IOI Trading Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%IOI Trading Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0221',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['IOI Trading Ltd', 'MOOV-0221', '0221', '221'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('IOI Trading Ltd', 'MOOV-0221', 'MOOV-0221', 'active', 'standard', ARRAY['IOI Trading Ltd', 'MOOV-0221', '0221', '221']);
  END IF;

  -- ── Trembling Madness Ltd (MOOV-0222) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0222' OR dc_customer_id = '0222')
    AND LOWER(business_name) != LOWER('Trembling Madness Ltd') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Trembling Madness Ltd'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Trembling Madness Ltd') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Trembling Madness Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Trembling Madness Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0222',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Trembling Madness Ltd', 'MOOV-0222', '0222', '222'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Trembling Madness Ltd', 'MOOV-0222', 'MOOV-0222', 'active', 'standard', ARRAY['Trembling Madness Ltd', 'MOOV-0222', '0222', '222']);
  END IF;

  -- ── Ashley House Printing Co Ltd (MOOV-0224) ──
  -- Clear conflict on any customer with a different name
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0224' OR dc_customer_id = '0224')
    AND LOWER(business_name) != LOWER('Ashley House Printing Co Ltd') 
    AND (trading_name IS NULL OR LOWER(trading_name) != LOWER('Ashley House Printing Co Ltd'));

  -- Find target customer
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Ashley House Printing Co Ltd') 
     OR (trading_name IS NOT NULL AND LOWER(trading_name) = LOWER('Ashley House Printing Co Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) ILIKE '%Ashley House Printing Co Ltd%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NOT NULL THEN
    UPDATE customers 
    SET dc_customer_id = 'MOOV-0224',
        billing_aliases = ARRAY(SELECT DISTINCT unnest(COALESCE(billing_aliases, ARRAY[]::TEXT[]) || ARRAY['Ashley House Printing Co Ltd', 'MOOV-0224', '0224', '224'])),
        updated_at = NOW()
    WHERE id = v_cust_id;
  ELSE
    INSERT INTO customers (business_name, dc_customer_id, account_number, account_status, tier, billing_aliases)
    VALUES ('Ashley House Printing Co Ltd', 'MOOV-0224', 'MOOV-0224', 'active', 'standard', ARRAY['Ashley House Printing Co Ltd', 'MOOV-0224', '0224', '224']);
  END IF;

END $$;
