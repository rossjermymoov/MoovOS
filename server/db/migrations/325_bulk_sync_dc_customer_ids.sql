-- Migration 325: Bulk Sync Despatch Cloud Customer IDs (Non-HOF)
-- Generated automatically from customer mapping directory

DO $$
DECLARE
  v_cust_id UUID;
BEGIN

  -- ── Developer Testing (1) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = '1' OR dc_customer_id = '1')
    AND LOWER(business_name) != LOWER('Developer Testing');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Developer Testing')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Developer Testing', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), '1',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Developer Testing', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Developer Testing', '1', '1']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Cloud 9 Fulfilment (Cloud9) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'Cloud9' OR dc_customer_id = '9')
    AND LOWER(business_name) != LOWER('Cloud 9 Fulfilment');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Cloud 9 Fulfilment')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Cloud 9 Fulfilment', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'Cloud9',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Cloud 9 Fulfilment', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Cloud 9 Fulfilment', 'Cloud9', '9']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── WXM - Greenplant UK Ltd (WXM-0004) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'WXM-0004' OR dc_customer_id = '0004')
    AND LOWER(business_name) != LOWER('WXM - Greenplant UK Ltd');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('WXM - Greenplant UK Ltd')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'WXM - Greenplant UK Ltd', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'WXM-0004',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('WXM - Greenplant UK Ltd', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['WXM - Greenplant UK Ltd', 'WXM-0004', '0004', '4']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── WXM - Projekt Indigo Studio Ltd (WXM-0005) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'WXM-0005' OR dc_customer_id = '0005')
    AND LOWER(business_name) != LOWER('WXM - Projekt Indigo Studio Ltd');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('WXM - Projekt Indigo Studio Ltd')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'WXM - Projekt Indigo Studio Ltd', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'WXM-0005',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('WXM - Projekt Indigo Studio Ltd', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['WXM - Projekt Indigo Studio Ltd', 'WXM-0005', '0005', '5']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Floship-Returns (FLOSHIP) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'FLOSHIP' )
    AND LOWER(business_name) != LOWER('Floship-Returns');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Floship-Returns')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Floship-Returns', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'FLOSHIP',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Floship-Returns', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Floship-Returns', 'FLOSHIP']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Keells (DP1-0201) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'DP1-0201' OR dc_customer_id = '1')
    AND LOWER(business_name) != LOWER('Keells');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Keells')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Keells', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'DP1-0201',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Keells', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Keells', 'DP1-0201', '1']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── MoreHustl (HOF-0031) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'HOF-0031' OR dc_customer_id = '0031')
    AND LOWER(business_name) != LOWER('MoreHustl');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('MoreHustl')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'MoreHustl', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'HOF-0031',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('MoreHustl', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['MoreHustl', 'HOF-0031', '0031', '31']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Suresh Deepal Herath 12 (Dep2-0006) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'Dep2-0006' OR dc_customer_id = '2')
    AND LOWER(business_name) != LOWER('Suresh Deepal Herath 12');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Suresh Deepal Herath 12')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Suresh Deepal Herath 12', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'Dep2-0006',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Suresh Deepal Herath 12', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Suresh Deepal Herath 12', 'Dep2-0006', '2']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── The Chosen Baller LLC (001-0002) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = '001-0002' OR dc_customer_id = '001')
    AND LOWER(business_name) != LOWER('The Chosen Baller LLC');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('The Chosen Baller LLC')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'The Chosen Baller LLC', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), '001-0002',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('The Chosen Baller LLC', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['The Chosen Baller LLC', '001-0002', '001', '1']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── SND Electrical (HOF-0054) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'HOF-0054' OR dc_customer_id = '0054')
    AND LOWER(business_name) != LOWER('SND Electrical');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('SND Electrical')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'SND Electrical', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'HOF-0054',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('SND Electrical', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['SND Electrical', 'HOF-0054', '0054', '54']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── E & L Trading Ltd (HOF-0055) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'HOF-0055' OR dc_customer_id = '0055')
    AND LOWER(business_name) != LOWER('E & L Trading Ltd');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('E & L Trading Ltd')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'E & L Trading Ltd', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'HOF-0055',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('E & L Trading Ltd', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['E & L Trading Ltd', 'HOF-0055', '0055', '55']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Britalitez Limited (HOF-0056) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'HOF-0056' OR dc_customer_id = '0056')
    AND LOWER(business_name) != LOWER('Britalitez Limited');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Britalitez Limited')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Britalitez Limited', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'HOF-0056',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Britalitez Limited', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Britalitez Limited', 'HOF-0056', '0056', '56']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Moov Prod Admin two (DD2-0003) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'DD2-0003' OR dc_customer_id = '2')
    AND LOWER(business_name) != LOWER('Moov Prod Admin two');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Moov Prod Admin two')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Moov Prod Admin two', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'DD2-0003',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Moov Prod Admin two', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Moov Prod Admin two', 'DD2-0003', '2']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Danny Snelson (HOF-0008) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'HOF-0008' OR dc_customer_id = '0008')
    AND LOWER(business_name) != LOWER('Danny Snelson');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Danny Snelson')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Danny Snelson', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'HOF-0008',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Danny Snelson', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Danny Snelson', 'HOF-0008', '0008', '8']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Spare and Square (HOF-GONE) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'HOF-GONE' )
    AND LOWER(business_name) != LOWER('Spare and Square');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Spare and Square')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Spare and Square', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'HOF-GONE',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Spare and Square', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Spare and Square', 'HOF-GONE']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Crystal Nails (HOF-0009) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'HOF-0009' OR dc_customer_id = '0009')
    AND LOWER(business_name) != LOWER('Crystal Nails');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Crystal Nails')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Crystal Nails', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'HOF-0009',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Crystal Nails', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Crystal Nails', 'HOF-0009', '0009', '9']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Fight Outlet (HOF-0010) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'HOF-0010' OR dc_customer_id = '0010')
    AND LOWER(business_name) != LOWER('Fight Outlet');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Fight Outlet')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Fight Outlet', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'HOF-0010',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Fight Outlet', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Fight Outlet', 'HOF-0010', '0010', '10']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Prophecy Cricket Ltd (HOF-0011) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'HOF-0011' OR dc_customer_id = '0011')
    AND LOWER(business_name) != LOWER('Prophecy Cricket Ltd');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Prophecy Cricket Ltd')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Prophecy Cricket Ltd', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'HOF-0011',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Prophecy Cricket Ltd', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Prophecy Cricket Ltd', 'HOF-0011', '0011', '11']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Seedball Limited (HOF-0012) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'HOF-0012' OR dc_customer_id = '0012')
    AND LOWER(business_name) != LOWER('Seedball Limited');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Seedball Limited')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Seedball Limited', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'HOF-0012',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Seedball Limited', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Seedball Limited', 'HOF-0012', '0012', '12']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Saloos Ltd (MOOV-0002) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0002' OR dc_customer_id = '0002')
    AND LOWER(business_name) != LOWER('Saloos Ltd');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Saloos Ltd')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Saloos Ltd', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0002',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Saloos Ltd', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Saloos Ltd', 'MOOV-0002', '0002', '2']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── MP Homewares Ltd (MOOV-0003) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0003' OR dc_customer_id = '0003')
    AND LOWER(business_name) != LOWER('MP Homewares Ltd');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('MP Homewares Ltd')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'MP Homewares Ltd', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0003',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('MP Homewares Ltd', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['MP Homewares Ltd', 'MOOV-0003', '0003', '3']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── I Luv Designer (MOOV-0004) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0004' OR dc_customer_id = '0004')
    AND LOWER(business_name) != LOWER('I Luv Designer');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('I Luv Designer')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'I Luv Designer', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0004',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('I Luv Designer', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['I Luv Designer', 'MOOV-0004', '0004', '4']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── 3 Devices Ltd (MOOV-0005) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0005' OR dc_customer_id = '0005')
    AND LOWER(business_name) != LOWER('3 Devices Ltd');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('3 Devices Ltd')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      '3 Devices Ltd', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0005',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('3 Devices Ltd', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['3 Devices Ltd', 'MOOV-0005', '0005', '5']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── EF TEST CUSTOMER QA EIGHT (DF1-0004) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'DF1-0004' OR dc_customer_id = '1')
    AND LOWER(business_name) != LOWER('EF TEST CUSTOMER QA EIGHT');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('EF TEST CUSTOMER QA EIGHT')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'EF TEST CUSTOMER QA EIGHT', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'DF1-0004',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('EF TEST CUSTOMER QA EIGHT', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['EF TEST CUSTOMER QA EIGHT', 'DF1-0004', '1']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Yayo Familia Ltd (MOOV-0006) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0006' OR dc_customer_id = '0006')
    AND LOWER(business_name) != LOWER('Yayo Familia Ltd');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Yayo Familia Ltd')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Yayo Familia Ltd', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0006',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Yayo Familia Ltd', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Yayo Familia Ltd', 'MOOV-0006', '0006', '6']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Capatex Limited (MOOV-0007) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0007' OR dc_customer_id = '0007')
    AND LOWER(business_name) != LOWER('Capatex Limited');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Capatex Limited')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Capatex Limited', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0007',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Capatex Limited', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Capatex Limited', 'MOOV-0007', '0007', '7']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Trident Pumps (MOOV-0008) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0008' OR dc_customer_id = '0008')
    AND LOWER(business_name) != LOWER('Trident Pumps');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Trident Pumps')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Trident Pumps', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0008',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Trident Pumps', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Trident Pumps', 'MOOV-0008', '0008', '8']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Tribal Society (MOOV-0009) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0009' OR dc_customer_id = '0009')
    AND LOWER(business_name) != LOWER('Tribal Society');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Tribal Society')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Tribal Society', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0009',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Tribal Society', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Tribal Society', 'MOOV-0009', '0009', '9']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Millvill Industrial Supplies Ltd (MOOV-0010) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0010' OR dc_customer_id = '0010')
    AND LOWER(business_name) != LOWER('Millvill Industrial Supplies Ltd');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Millvill Industrial Supplies Ltd')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Millvill Industrial Supplies Ltd', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0010',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Millvill Industrial Supplies Ltd', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Millvill Industrial Supplies Ltd', 'MOOV-0010', '0010', '10']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── B2B Workwear & Janitorial Ltd (MOOV-0011) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0011' OR dc_customer_id = '0011')
    AND LOWER(business_name) != LOWER('B2B Workwear & Janitorial Ltd');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('B2B Workwear & Janitorial Ltd')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'B2B Workwear & Janitorial Ltd', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0011',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('B2B Workwear & Janitorial Ltd', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['B2B Workwear & Janitorial Ltd', 'MOOV-0011', '0011', '11']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Britalitez Ltd (MOOV-0012) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0012' OR dc_customer_id = '0012')
    AND LOWER(business_name) != LOWER('Britalitez Ltd');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Britalitez Ltd')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Britalitez Ltd', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0012',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Britalitez Ltd', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Britalitez Ltd', 'MOOV-0012', '0012', '12']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Code Nine UK Ltd (MOOV-0013) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0013' OR dc_customer_id = '0013')
    AND LOWER(business_name) != LOWER('Code Nine UK Ltd');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Code Nine UK Ltd')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Code Nine UK Ltd', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0013',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Code Nine UK Ltd', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Code Nine UK Ltd', 'MOOV-0013', '0013', '13']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Edmunson Electrical Leeds (MOOV-0014) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0014' OR dc_customer_id = '0014')
    AND LOWER(business_name) != LOWER('Edmunson Electrical Leeds');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Edmunson Electrical Leeds')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Edmunson Electrical Leeds', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0014',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Edmunson Electrical Leeds', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Edmunson Electrical Leeds', 'MOOV-0014', '0014', '14']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Green Footprint Services Ltd (MOOV-0015) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0015' OR dc_customer_id = '0015')
    AND LOWER(business_name) != LOWER('Green Footprint Services Ltd');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Green Footprint Services Ltd')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Green Footprint Services Ltd', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0015',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Green Footprint Services Ltd', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Green Footprint Services Ltd', 'MOOV-0015', '0015', '15']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── EF QA CUSTOMER HS (DP1-0011) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'DP1-0011' OR dc_customer_id = '1')
    AND LOWER(business_name) != LOWER('EF QA CUSTOMER HS');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('EF QA CUSTOMER HS')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'EF QA CUSTOMER HS', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'DP1-0011',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('EF QA CUSTOMER HS', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['EF QA CUSTOMER HS', 'DP1-0011', '1']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── hjko (1233-0001) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = '1233-0001' OR dc_customer_id = '1233')
    AND LOWER(business_name) != LOWER('hjko');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('hjko')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'hjko', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), '1233-0001',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('hjko', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['hjko', '1233-0001', '1233']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── qwerty (DF1-0007) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'DF1-0007' OR dc_customer_id = '1')
    AND LOWER(business_name) != LOWER('qwerty');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('qwerty')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'qwerty', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'DF1-0007',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('qwerty', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['qwerty', 'DF1-0007', '1']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Norfolk Saw Services (MOOV-0016) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0016' OR dc_customer_id = '0016')
    AND LOWER(business_name) != LOWER('Norfolk Saw Services');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Norfolk Saw Services')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Norfolk Saw Services', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0016',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Norfolk Saw Services', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Norfolk Saw Services', 'MOOV-0016', '0016', '16']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Rilco Electrical Supplies (MOOV-0017) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0017' OR dc_customer_id = '0017')
    AND LOWER(business_name) != LOWER('Rilco Electrical Supplies');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Rilco Electrical Supplies')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Rilco Electrical Supplies', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0017',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Rilco Electrical Supplies', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Rilco Electrical Supplies', 'MOOV-0017', '0017', '17']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── asdfg (DF1-0008) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'DF1-0008' OR dc_customer_id = '1')
    AND LOWER(business_name) != LOWER('asdfg');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('asdfg')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'asdfg', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'DF1-0008',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('asdfg', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['asdfg', 'DF1-0008', '1']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Passion Accessories Ltd (MOOV-0018) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0018' OR dc_customer_id = '0018')
    AND LOWER(business_name) != LOWER('Passion Accessories Ltd');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Passion Accessories Ltd')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Passion Accessories Ltd', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0018',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Passion Accessories Ltd', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Passion Accessories Ltd', 'MOOV-0018', '0018', '18']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Spare and Square Ltd (MOOV-0019) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0019' OR dc_customer_id = '0019')
    AND LOWER(business_name) != LOWER('Spare and Square Ltd');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Spare and Square Ltd')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Spare and Square Ltd', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0019',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Spare and Square Ltd', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Spare and Square Ltd', 'MOOV-0019', '0019', '19']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── nnmm (DF1-0009) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'DF1-0009' OR dc_customer_id = '1')
    AND LOWER(business_name) != LOWER('nnmm');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('nnmm')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'nnmm', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'DF1-0009',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('nnmm', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['nnmm', 'DF1-0009', '1']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── check (1233-0002) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = '1233-0002' OR dc_customer_id = '1233')
    AND LOWER(business_name) != LOWER('check');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('check')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'check', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), '1233-0002',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('check', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['check', '1233-0002', '1233']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── SND ELECTRICAL WHOLESALERS (UK) LTD (MOOV-0020) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0020' OR dc_customer_id = '0020')
    AND LOWER(business_name) != LOWER('SND ELECTRICAL WHOLESALERS (UK) LTD');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('SND ELECTRICAL WHOLESALERS (UK) LTD')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'SND ELECTRICAL WHOLESALERS (UK) LTD', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0020',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('SND ELECTRICAL WHOLESALERS (UK) LTD', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['SND ELECTRICAL WHOLESALERS (UK) LTD', 'MOOV-0020', '0020', '20']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Efutures (DP1-0014) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'DP1-0014' OR dc_customer_id = '1')
    AND LOWER(business_name) != LOWER('Efutures');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Efutures')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Efutures', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'DP1-0014',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Efutures', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Efutures', 'DP1-0014', '1']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Lifemax Limited (MOOV-0021) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0021' OR dc_customer_id = '0021')
    AND LOWER(business_name) != LOWER('Lifemax Limited');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Lifemax Limited')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Lifemax Limited', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0021',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Lifemax Limited', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Lifemax Limited', 'MOOV-0021', '0021', '21']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── IFS (DD2-0005) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'DD2-0005' OR dc_customer_id = '2')
    AND LOWER(business_name) != LOWER('IFS');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('IFS')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'IFS', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'DD2-0005',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('IFS', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['IFS', 'DD2-0005', '2']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── M and J Brothers Ltd (MOOV-0022) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0022' OR dc_customer_id = '0022')
    AND LOWER(business_name) != LOWER('M and J Brothers Ltd');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('M and J Brothers Ltd')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'M and J Brothers Ltd', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0022',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('M and J Brothers Ltd', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['M and J Brothers Ltd', 'MOOV-0022', '0022', '22']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Beacons and Lightbars (MOOV-0023) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0023' OR dc_customer_id = '0023')
    AND LOWER(business_name) != LOWER('Beacons and Lightbars');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Beacons and Lightbars')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Beacons and Lightbars', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0023',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Beacons and Lightbars', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Beacons and Lightbars', 'MOOV-0023', '0023', '23']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── DDUP International Ltd (MOOV-0024) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0024' OR dc_customer_id = '0024')
    AND LOWER(business_name) != LOWER('DDUP International Ltd');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('DDUP International Ltd')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'DDUP International Ltd', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0024',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('DDUP International Ltd', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['DDUP International Ltd', 'MOOV-0024', '0024', '24']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Granola Kitchen Ltd (MOOV-0025) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0025' OR dc_customer_id = '0025')
    AND LOWER(business_name) != LOWER('Granola Kitchen Ltd');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Granola Kitchen Ltd')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Granola Kitchen Ltd', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0025',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Granola Kitchen Ltd', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Granola Kitchen Ltd', 'MOOV-0025', '0025', '25']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Pet & Grooming Supplies Ltd (MOOV-0026) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0026' OR dc_customer_id = '0026')
    AND LOWER(business_name) != LOWER('Pet & Grooming Supplies Ltd');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Pet & Grooming Supplies Ltd')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Pet & Grooming Supplies Ltd', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0026',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Pet & Grooming Supplies Ltd', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Pet & Grooming Supplies Ltd', 'MOOV-0026', '0026', '26']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── SRR3 (DF1-0010) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'DF1-0010' OR dc_customer_id = '1')
    AND LOWER(business_name) != LOWER('SRR3');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('SRR3')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'SRR3', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'DF1-0010',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('SRR3', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['SRR3', 'DF1-0010', '1']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Uni4mers (Uni4mers) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'Uni4mers' OR dc_customer_id = '4')
    AND LOWER(business_name) != LOWER('Uni4mers');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Uni4mers')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Uni4mers', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'Uni4mers',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Uni4mers', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Uni4mers', 'Uni4mers', '4']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Efutures4 (DP1-0016) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'DP1-0016' OR dc_customer_id = '1')
    AND LOWER(business_name) != LOWER('Efutures4');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Efutures4')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Efutures4', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'DP1-0016',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Efutures4', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Efutures4', 'DP1-0016', '1']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── EFtures5 (DP1-0017) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'DP1-0017' OR dc_customer_id = '1')
    AND LOWER(business_name) != LOWER('EFtures5');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('EFtures5')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'EFtures5', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'DP1-0017',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('EFtures5', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['EFtures5', 'DP1-0017', '1']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Sharkeye Wheel Aligners UK Ltd (MOOV-0027) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0027' OR dc_customer_id = '0027')
    AND LOWER(business_name) != LOWER('Sharkeye Wheel Aligners UK Ltd');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Sharkeye Wheel Aligners UK Ltd')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Sharkeye Wheel Aligners UK Ltd', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0027',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Sharkeye Wheel Aligners UK Ltd', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Sharkeye Wheel Aligners UK Ltd', 'MOOV-0027', '0027', '27']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Efutures5 (DDJ1-0001) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'DDJ1-0001' OR dc_customer_id = '1')
    AND LOWER(business_name) != LOWER('Efutures5');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Efutures5')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Efutures5', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'DDJ1-0001',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Efutures5', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Efutures5', 'DDJ1-0001', '1']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── The Hanger Store (MOOV-0028) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0028' OR dc_customer_id = '0028')
    AND LOWER(business_name) != LOWER('The Hanger Store');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('The Hanger Store')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'The Hanger Store', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0028',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('The Hanger Store', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['The Hanger Store', 'MOOV-0028', '0028', '28']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── How High Brands (MOOV-0029) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0029' OR dc_customer_id = '0029')
    AND LOWER(business_name) != LOWER('How High Brands');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('How High Brands')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'How High Brands', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0029',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('How High Brands', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['How High Brands', 'MOOV-0029', '0029', '29']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── SQA (DP1-0019) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'DP1-0019' OR dc_customer_id = '1')
    AND LOWER(business_name) != LOWER('SQA');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('SQA')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'SQA', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'DP1-0019',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('SQA', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['SQA', 'DP1-0019', '1']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── SINGER (DP1-0021) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'DP1-0021' OR dc_customer_id = '1')
    AND LOWER(business_name) != LOWER('SINGER');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('SINGER')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'SINGER', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'DP1-0021',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('SINGER', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['SINGER', 'DP1-0021', '1']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Greenplant UK Ltd (MOOV-0030) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0030' OR dc_customer_id = '0030')
    AND LOWER(business_name) != LOWER('Greenplant UK Ltd');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Greenplant UK Ltd')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Greenplant UK Ltd', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0030',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Greenplant UK Ltd', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Greenplant UK Ltd', 'MOOV-0030', '0030', '30']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Assetee (DP1-0024) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'DP1-0024' OR dc_customer_id = '1')
    AND LOWER(business_name) != LOWER('Assetee');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Assetee')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Assetee', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'DP1-0024',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Assetee', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Assetee', 'DP1-0024', '1']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Mobberley Cakes Ltd (MOOV-0031) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0031' OR dc_customer_id = '0031')
    AND LOWER(business_name) != LOWER('Mobberley Cakes Ltd');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Mobberley Cakes Ltd')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Mobberley Cakes Ltd', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0031',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Mobberley Cakes Ltd', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Mobberley Cakes Ltd', 'MOOV-0031', '0031', '31']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Ecom Group UK Limited (MOOV-0032) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0032' OR dc_customer_id = '0032')
    AND LOWER(business_name) != LOWER('Ecom Group UK Limited');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Ecom Group UK Limited')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Ecom Group UK Limited', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0032',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Ecom Group UK Limited', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Ecom Group UK Limited', 'MOOV-0032', '0032', '32']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Heaven Scent Incense Ltd (MOOV-0033) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0033' OR dc_customer_id = '0033')
    AND LOWER(business_name) != LOWER('Heaven Scent Incense Ltd');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Heaven Scent Incense Ltd')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Heaven Scent Incense Ltd', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0033',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Heaven Scent Incense Ltd', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Heaven Scent Incense Ltd', 'MOOV-0033', '0033', '33']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── EFUTURES6 (DP1-0025) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'DP1-0025' OR dc_customer_id = '1')
    AND LOWER(business_name) != LOWER('EFUTURES6');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('EFUTURES6')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'EFUTURES6', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'DP1-0025',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('EFUTURES6', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['EFUTURES6', 'DP1-0025', '1']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── AJP1 (AJP1) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'AJP1' OR dc_customer_id = '1')
    AND LOWER(business_name) != LOWER('AJP1');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('AJP1')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'AJP1', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'AJP1',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('AJP1', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['AJP1', 'AJP1', '1']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── AJP2 (AJP2) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'AJP2' OR dc_customer_id = '2')
    AND LOWER(business_name) != LOWER('AJP2');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('AJP2')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'AJP2', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'AJP2',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('AJP2', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['AJP2', 'AJP2', '2']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── AJP3 (AJP3) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'AJP3' OR dc_customer_id = '3')
    AND LOWER(business_name) != LOWER('AJP3');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('AJP3')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'AJP3', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'AJP3',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('AJP3', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['AJP3', 'AJP3', '3']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── AJP4 (AJP4) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'AJP4' OR dc_customer_id = '4')
    AND LOWER(business_name) != LOWER('AJP4');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('AJP4')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'AJP4', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'AJP4',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('AJP4', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['AJP4', 'AJP4', '4']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── AJP5 (AJP5) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'AJP5' OR dc_customer_id = '5')
    AND LOWER(business_name) != LOWER('AJP5');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('AJP5')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'AJP5', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'AJP5',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('AJP5', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['AJP5', 'AJP5', '5']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Info Technology Supply (MOOV-0034) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0034' OR dc_customer_id = '0034')
    AND LOWER(business_name) != LOWER('Info Technology Supply');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Info Technology Supply')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Info Technology Supply', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0034',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Info Technology Supply', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Info Technology Supply', 'MOOV-0034', '0034', '34']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── 99X (DP1-0027) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'DP1-0027' OR dc_customer_id = '1')
    AND LOWER(business_name) != LOWER('99X');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('99X')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      '99X', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'DP1-0027',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('99X', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['99X', 'DP1-0027', '1']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Aegean Sea Ltd (MOOV-0035) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0035' OR dc_customer_id = '0035')
    AND LOWER(business_name) != LOWER('Aegean Sea Ltd');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Aegean Sea Ltd')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Aegean Sea Ltd', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0035',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Aegean Sea Ltd', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Aegean Sea Ltd', 'MOOV-0035', '0035', '35']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── LB Finance (DP1-0028) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'DP1-0028' OR dc_customer_id = '1')
    AND LOWER(business_name) != LOWER('LB Finance');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('LB Finance')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'LB Finance', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'DP1-0028',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('LB Finance', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['LB Finance', 'DP1-0028', '1']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── DM AGENCY AND DISTRIBUTION (MOOV-0036) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0036' OR dc_customer_id = '0036')
    AND LOWER(business_name) != LOWER('DM AGENCY AND DISTRIBUTION');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('DM AGENCY AND DISTRIBUTION')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'DM AGENCY AND DISTRIBUTION', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0036',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('DM AGENCY AND DISTRIBUTION', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['DM AGENCY AND DISTRIBUTION', 'MOOV-0036', '0036', '36']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── DDPL (DDPL) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'DDPL' )
    AND LOWER(business_name) != LOWER('DDPL');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('DDPL')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'DDPL', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'DDPL',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('DDPL', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['DDPL', 'DDPL']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Aglory MERCHANT ENTERPRISES LIMITED (Aglory MERCHANT ENTERPRISES LIMITED) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'Aglory MERCHANT ENTERPRISES LIMITED' )
    AND LOWER(business_name) != LOWER('Aglory MERCHANT ENTERPRISES LIMITED');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Aglory MERCHANT ENTERPRISES LIMITED')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Aglory MERCHANT ENTERPRISES LIMITED', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'Aglory MERCHANT ENTERPRISES LIMITED',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Aglory MERCHANT ENTERPRISES LIMITED', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Aglory MERCHANT ENTERPRISES LIMITED', 'Aglory MERCHANT ENTERPRISES LIMITED']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── HCL (DP1-0029) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'DP1-0029' OR dc_customer_id = '1')
    AND LOWER(business_name) != LOWER('HCL');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('HCL')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'HCL', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'DP1-0029',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('HCL', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['HCL', 'DP1-0029', '1']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── NEXT (DP1-0030) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'DP1-0030' OR dc_customer_id = '1')
    AND LOWER(business_name) != LOWER('NEXT');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('NEXT')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'NEXT', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'DP1-0030',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('NEXT', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['NEXT', 'DP1-0030', '1']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── E Square (E Square) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'E Square' )
    AND LOWER(business_name) != LOWER('E Square');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('E Square')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'E Square', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'E Square',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('E Square', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['E Square', 'E Square']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Natural Spa Supplies Ltd (MOOV-0037) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0037' OR dc_customer_id = '0037')
    AND LOWER(business_name) != LOWER('Natural Spa Supplies Ltd');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Natural Spa Supplies Ltd')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Natural Spa Supplies Ltd', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0037',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Natural Spa Supplies Ltd', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Natural Spa Supplies Ltd', 'MOOV-0037', '0037', '37']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── JOY ASIAN FOOD & GROCERY LIMITED (MOOV-0038) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0038' OR dc_customer_id = '0038')
    AND LOWER(business_name) != LOWER('JOY ASIAN FOOD & GROCERY LIMITED');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('JOY ASIAN FOOD & GROCERY LIMITED')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'JOY ASIAN FOOD & GROCERY LIMITED', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0038',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('JOY ASIAN FOOD & GROCERY LIMITED', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['JOY ASIAN FOOD & GROCERY LIMITED', 'MOOV-0038', '0038', '38']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Bakers Street Limited (MOOV-0039) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0039' OR dc_customer_id = '0039')
    AND LOWER(business_name) != LOWER('Bakers Street Limited');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Bakers Street Limited')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Bakers Street Limited', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0039',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Bakers Street Limited', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Bakers Street Limited', 'MOOV-0039', '0039', '39']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── 8ack (8ack) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = '8ack' OR dc_customer_id = '8')
    AND LOWER(business_name) != LOWER('8ack');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('8ack')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      '8ack', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), '8ack',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('8ack', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['8ack', '8ack', '8']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Jane Scott Ceramics (MOOV-0040) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0040' OR dc_customer_id = '0040')
    AND LOWER(business_name) != LOWER('Jane Scott Ceramics');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Jane Scott Ceramics')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Jane Scott Ceramics', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0040',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Jane Scott Ceramics', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Jane Scott Ceramics', 'MOOV-0040', '0040', '40']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── SCR DISTRIBUTION (MOOV-0041) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0041' OR dc_customer_id = '0041')
    AND LOWER(business_name) != LOWER('SCR DISTRIBUTION');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('SCR DISTRIBUTION')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'SCR DISTRIBUTION', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0041',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('SCR DISTRIBUTION', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['SCR DISTRIBUTION', 'MOOV-0041', '0041', '41']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Megway (Megway Parcels) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'Megway Parcels' )
    AND LOWER(business_name) != LOWER('Megway');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Megway')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Megway', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'Megway Parcels',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Megway', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Megway', 'Megway Parcels']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Lather Up (MOOV-0042) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0042' OR dc_customer_id = '0042')
    AND LOWER(business_name) != LOWER('Lather Up');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Lather Up')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Lather Up', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0042',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Lather Up', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Lather Up', 'MOOV-0042', '0042', '42']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Impoxer LTD T/A Makrom (MOOV-0043) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0043' OR dc_customer_id = '0043')
    AND LOWER(business_name) != LOWER('Impoxer LTD T/A Makrom');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Impoxer LTD T/A Makrom')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Impoxer LTD T/A Makrom', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0043',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Impoxer LTD T/A Makrom', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Impoxer LTD T/A Makrom', 'MOOV-0043', '0043', '43']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Vertura Ltd (MOOV-0045) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0045' OR dc_customer_id = '0045')
    AND LOWER(business_name) != LOWER('Vertura Ltd');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Vertura Ltd')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Vertura Ltd', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0045',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Vertura Ltd', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Vertura Ltd', 'MOOV-0045', '0045', '45']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Roar Gill Ltd (MOOV-0046) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0046' OR dc_customer_id = '0046')
    AND LOWER(business_name) != LOWER('Roar Gill Ltd');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Roar Gill Ltd')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Roar Gill Ltd', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0046',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Roar Gill Ltd', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Roar Gill Ltd', 'MOOV-0046', '0046', '46']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Oriental Mart (Oriental Mart) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'Oriental Mart' )
    AND LOWER(business_name) != LOWER('Oriental Mart');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Oriental Mart')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Oriental Mart', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'Oriental Mart',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Oriental Mart', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Oriental Mart', 'Oriental Mart']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Reevo (MOOV-0047) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0047' OR dc_customer_id = '0047')
    AND LOWER(business_name) != LOWER('Reevo');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Reevo')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Reevo', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0047',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Reevo', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Reevo', 'MOOV-0047', '0047', '47']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Lace and Favour Ltd (MOOV-0048) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0048' OR dc_customer_id = '0048')
    AND LOWER(business_name) != LOWER('Lace and Favour Ltd');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Lace and Favour Ltd')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Lace and Favour Ltd', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0048',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Lace and Favour Ltd', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Lace and Favour Ltd', 'MOOV-0048', '0048', '48']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Andersen EV (Andersen EV) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'Andersen EV' )
    AND LOWER(business_name) != LOWER('Andersen EV');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Andersen EV')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Andersen EV', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'Andersen EV',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Andersen EV', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Andersen EV', 'Andersen EV']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Henry And Tosh Limited (MOOV-0050) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0050' OR dc_customer_id = '0050')
    AND LOWER(business_name) != LOWER('Henry And Tosh Limited');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Henry And Tosh Limited')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Henry And Tosh Limited', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0050',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Henry And Tosh Limited', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Henry And Tosh Limited', 'MOOV-0050', '0050', '50']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── March Laboratories Ltd / Ace Canine Healthcare (MOOV-0051) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0051' OR dc_customer_id = '0051')
    AND LOWER(business_name) != LOWER('March Laboratories Ltd / Ace Canine Healthcare');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('March Laboratories Ltd / Ace Canine Healthcare')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'March Laboratories Ltd / Ace Canine Healthcare', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0051',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('March Laboratories Ltd / Ace Canine Healthcare', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['March Laboratories Ltd / Ace Canine Healthcare', 'MOOV-0051', '0051', '51']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── May2024 (DF1-0012) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'DF1-0012' OR dc_customer_id = '1')
    AND LOWER(business_name) != LOWER('May2024');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('May2024')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'May2024', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'DF1-0012',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('May2024', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['May2024', 'DF1-0012', '1']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── test 2024 (DF1-0013) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'DF1-0013' OR dc_customer_id = '1')
    AND LOWER(business_name) != LOWER('test 2024');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('test 2024')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'test 2024', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'DF1-0013',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('test 2024', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['test 2024', 'DF1-0013', '1']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── testii (DF1-0014) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'DF1-0014' OR dc_customer_id = '1')
    AND LOWER(business_name) != LOWER('testii');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('testii')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'testii', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'DF1-0014',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('testii', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['testii', 'DF1-0014', '1']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Abans Company (DQA1-0001) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'DQA1-0001' OR dc_customer_id = '1')
    AND LOWER(business_name) != LOWER('Abans Company');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Abans Company')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Abans Company', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'DQA1-0001',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Abans Company', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Abans Company', 'DQA1-0001', '1']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Neil Test (MOOV-0053) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0053' OR dc_customer_id = '0053')
    AND LOWER(business_name) != LOWER('Neil Test');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Neil Test')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Neil Test', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0053',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Neil Test', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Neil Test', 'MOOV-0053', '0053', '53']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Moov Parcel (MOOV-0054) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0054' OR dc_customer_id = '0054')
    AND LOWER(business_name) != LOWER('Moov Parcel');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Moov Parcel')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Moov Parcel', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0054',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Moov Parcel', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Moov Parcel', 'MOOV-0054', '0054', '54']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Ultra Soft Water Softeners Ltd (MOOV-0056) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0056' OR dc_customer_id = '0056')
    AND LOWER(business_name) != LOWER('Ultra Soft Water Softeners Ltd');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Ultra Soft Water Softeners Ltd')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Ultra Soft Water Softeners Ltd', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0056',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Ultra Soft Water Softeners Ltd', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Ultra Soft Water Softeners Ltd', 'MOOV-0056', '0056', '56']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── UK Optics Ltd (MOOV-0057) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0057' OR dc_customer_id = '0057')
    AND LOWER(business_name) != LOWER('UK Optics Ltd');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('UK Optics Ltd')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'UK Optics Ltd', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0057',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('UK Optics Ltd', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['UK Optics Ltd', 'MOOV-0057', '0057', '57']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── CLIPHER LTD (MOOV-0058) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0058' OR dc_customer_id = '0058')
    AND LOWER(business_name) != LOWER('CLIPHER LTD');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('CLIPHER LTD')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'CLIPHER LTD', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0058',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('CLIPHER LTD', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['CLIPHER LTD', 'MOOV-0058', '0058', '58']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Damro (DF1-0015) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'DF1-0015' OR dc_customer_id = '1')
    AND LOWER(business_name) != LOWER('Damro');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Damro')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Damro', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'DF1-0015',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Damro', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Damro', 'DF1-0015', '1']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Teleseen (DP1-0034) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'DP1-0034' OR dc_customer_id = '1')
    AND LOWER(business_name) != LOWER('Teleseen');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Teleseen')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Teleseen', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'DP1-0034',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Teleseen', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Teleseen', 'DP1-0034', '1']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Live Quote Testing (LQT) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'LQT' )
    AND LOWER(business_name) != LOWER('Live Quote Testing');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Live Quote Testing')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Live Quote Testing', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'LQT',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Live Quote Testing', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Live Quote Testing', 'LQT']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── P&S Products & Refreshening Ltd (MOOV-0059) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0059' OR dc_customer_id = '0059')
    AND LOWER(business_name) != LOWER('P&S Products & Refreshening Ltd');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('P&S Products & Refreshening Ltd')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'P&S Products & Refreshening Ltd', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0059',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('P&S Products & Refreshening Ltd', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['P&S Products & Refreshening Ltd', 'MOOV-0059', '0059', '59']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── HOME AND HAVEN LIMITED (MOOV-0060) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0060' OR dc_customer_id = '0060')
    AND LOWER(business_name) != LOWER('HOME AND HAVEN LIMITED');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('HOME AND HAVEN LIMITED')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'HOME AND HAVEN LIMITED', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0060',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('HOME AND HAVEN LIMITED', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['HOME AND HAVEN LIMITED', 'MOOV-0060', '0060', '60']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── 2024 (DP1-0037) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'DP1-0037' OR dc_customer_id = '1')
    AND LOWER(business_name) != LOWER('2024');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('2024')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      '2024', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'DP1-0037',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('2024', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['2024', 'DP1-0037', '1']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Jetstar Airways (DP1-0038) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'DP1-0038' OR dc_customer_id = '1')
    AND LOWER(business_name) != LOWER('Jetstar Airways');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Jetstar Airways')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Jetstar Airways', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'DP1-0038',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Jetstar Airways', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Jetstar Airways', 'DP1-0038', '1']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Rifai UK Ltd (MOOV-0061) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0061' OR dc_customer_id = '0061')
    AND LOWER(business_name) != LOWER('Rifai UK Ltd');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Rifai UK Ltd')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Rifai UK Ltd', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0061',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Rifai UK Ltd', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Rifai UK Ltd', 'MOOV-0061', '0061', '61']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Giga Distributors (MOOV-0062) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0062' OR dc_customer_id = '0062')
    AND LOWER(business_name) != LOWER('Giga Distributors');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Giga Distributors')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Giga Distributors', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0062',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Giga Distributors', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Giga Distributors', 'MOOV-0062', '0062', '62']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── TKS NATURALS LTD (MOOV-0063) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0063' OR dc_customer_id = '0063')
    AND LOWER(business_name) != LOWER('TKS NATURALS LTD');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('TKS NATURALS LTD')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'TKS NATURALS LTD', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0063',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('TKS NATURALS LTD', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['TKS NATURALS LTD', 'MOOV-0063', '0063', '63']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Mini La Mode (MOOV-0064) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0064' OR dc_customer_id = '0064')
    AND LOWER(business_name) != LOWER('Mini La Mode');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Mini La Mode')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Mini La Mode', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0064',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Mini La Mode', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Mini La Mode', 'MOOV-0064', '0064', '64']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── TCS Worldwide (TCS) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'TCS' )
    AND LOWER(business_name) != LOWER('TCS Worldwide');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('TCS Worldwide')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'TCS Worldwide', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'TCS',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('TCS Worldwide', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['TCS Worldwide', 'TCS']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── ERTECH LTD (MOOV-0066) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0066' OR dc_customer_id = '0066')
    AND LOWER(business_name) != LOWER('ERTECH LTD');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('ERTECH LTD')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'ERTECH LTD', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0066',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('ERTECH LTD', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['ERTECH LTD', 'MOOV-0066', '0066', '66']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── D S Engineering (MOOV-0067) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0067' OR dc_customer_id = '0067')
    AND LOWER(business_name) != LOWER('D S Engineering');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('D S Engineering')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'D S Engineering', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0067',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('D S Engineering', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['D S Engineering', 'MOOV-0067', '0067', '67']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── kol (1233-0003) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = '1233-0003' OR dc_customer_id = '1233')
    AND LOWER(business_name) != LOWER('kol');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('kol')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'kol', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), '1233-0003',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('kol', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['kol', '1233-0003', '1233']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Hairways (Hair & Beauty) Ltd (MOOV-0068) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0068' OR dc_customer_id = '0068')
    AND LOWER(business_name) != LOWER('Hairways (Hair & Beauty) Ltd');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Hairways (Hair & Beauty) Ltd')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Hairways (Hair & Beauty) Ltd', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0068',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Hairways (Hair & Beauty) Ltd', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Hairways (Hair & Beauty) Ltd', 'MOOV-0068', '0068', '68']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Soghaat Gifts & Fragrances Ltd. (MOOV-0069) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0069' OR dc_customer_id = '0069')
    AND LOWER(business_name) != LOWER('Soghaat Gifts & Fragrances Ltd.');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Soghaat Gifts & Fragrances Ltd.')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Soghaat Gifts & Fragrances Ltd.', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0069',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Soghaat Gifts & Fragrances Ltd.', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Soghaat Gifts & Fragrances Ltd.', 'MOOV-0069', '0069', '69']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Lampfix (MOOV-0070) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0070' OR dc_customer_id = '0070')
    AND LOWER(business_name) != LOWER('Lampfix');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Lampfix')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Lampfix', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0070',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Lampfix', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Lampfix', 'MOOV-0070', '0070', '70']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Bentley Photographic (MOOV-0071) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0071' OR dc_customer_id = '0071')
    AND LOWER(business_name) != LOWER('Bentley Photographic');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Bentley Photographic')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Bentley Photographic', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0071',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Bentley Photographic', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Bentley Photographic', 'MOOV-0071', '0071', '71']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Creative Solution (DQA1-0005) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'DQA1-0005' OR dc_customer_id = '1')
    AND LOWER(business_name) != LOWER('Creative Solution');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Creative Solution')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Creative Solution', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'DQA1-0005',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Creative Solution', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Creative Solution', 'DQA1-0005', '1']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Gapstar (DP1-0043) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'DP1-0043' OR dc_customer_id = '1')
    AND LOWER(business_name) != LOWER('Gapstar');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Gapstar')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Gapstar', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'DP1-0043',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Gapstar', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Gapstar', 'DP1-0043', '1']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── TestCompany11 (DDK1-0002) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'DDK1-0002' OR dc_customer_id = '1')
    AND LOWER(business_name) != LOWER('TestCompany11');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('TestCompany11')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'TestCompany11', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'DDK1-0002',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('TestCompany11', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['TestCompany11', 'DDK1-0002', '1']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Virtusa (DQA1-0007) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'DQA1-0007' OR dc_customer_id = '1')
    AND LOWER(business_name) != LOWER('Virtusa');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Virtusa')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Virtusa', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'DQA1-0007',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Virtusa', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Virtusa', 'DQA1-0007', '1']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Toyota (DQA1-0009) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'DQA1-0009' OR dc_customer_id = '1')
    AND LOWER(business_name) != LOWER('Toyota');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Toyota')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Toyota', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'DQA1-0009',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Toyota', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Toyota', 'DQA1-0009', '1']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Brandix (DQA1-0011) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'DQA1-0011' OR dc_customer_id = '1')
    AND LOWER(business_name) != LOWER('Brandix');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Brandix')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Brandix', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'DQA1-0011',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Brandix', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Brandix', 'DQA1-0011', '1']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Softlogic (DQA1-0012) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'DQA1-0012' OR dc_customer_id = '1')
    AND LOWER(business_name) != LOWER('Softlogic');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Softlogic')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Softlogic', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'DQA1-0012',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Softlogic', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Softlogic', 'DQA1-0012', '1']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Daraz (DQA1-0013) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'DQA1-0013' OR dc_customer_id = '1')
    AND LOWER(business_name) != LOWER('Daraz');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Daraz')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Daraz', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'DQA1-0013',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Daraz', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Daraz', 'DQA1-0013', '1']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Impact Particles (MOOV-0072) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0072' OR dc_customer_id = '0072')
    AND LOWER(business_name) != LOWER('Impact Particles');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Impact Particles')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Impact Particles', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0072',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Impact Particles', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Impact Particles', 'MOOV-0072', '0072', '72']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Garden Greatness LTD (MOOV-0073) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0073' OR dc_customer_id = '0073')
    AND LOWER(business_name) != LOWER('Garden Greatness LTD');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Garden Greatness LTD')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Garden Greatness LTD', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0073',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Garden Greatness LTD', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Garden Greatness LTD', 'MOOV-0073', '0073', '73']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Major Brushes Ltd (MOOV-0074) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0074' OR dc_customer_id = '0074')
    AND LOWER(business_name) != LOWER('Major Brushes Ltd');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Major Brushes Ltd')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Major Brushes Ltd', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0074',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Major Brushes Ltd', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Major Brushes Ltd', 'MOOV-0074', '0074', '74']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Ottone Hardware (MOOV-0065) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0065' OR dc_customer_id = '0065')
    AND LOWER(business_name) != LOWER('Ottone Hardware');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Ottone Hardware')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Ottone Hardware', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0065',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Ottone Hardware', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Ottone Hardware', 'MOOV-0065', '0065', '65']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Europa (Europa) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'Europa' )
    AND LOWER(business_name) != LOWER('Europa');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Europa')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Europa', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'Europa',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Europa', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Europa', 'Europa']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── TELESONIC (DQA1-0014) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'DQA1-0014' OR dc_customer_id = '1')
    AND LOWER(business_name) != LOWER('TELESONIC');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('TELESONIC')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'TELESONIC', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'DQA1-0014',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('TELESONIC', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['TELESONIC', 'DQA1-0014', '1']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── ALDO (DQA1-0015) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'DQA1-0015' OR dc_customer_id = '1')
    AND LOWER(business_name) != LOWER('ALDO');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('ALDO')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'ALDO', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'DQA1-0015',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('ALDO', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['ALDO', 'DQA1-0015', '1']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Barry AI (Barry AI) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'Barry AI' )
    AND LOWER(business_name) != LOWER('Barry AI');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Barry AI')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Barry AI', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'Barry AI',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Barry AI', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Barry AI', 'Barry AI']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── NECTR (MOOV-0075) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0075' OR dc_customer_id = '0075')
    AND LOWER(business_name) != LOWER('NECTR');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('NECTR')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'NECTR', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0075',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('NECTR', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['NECTR', 'MOOV-0075', '0075', '75']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Ray Wai-Shing (HOF-0007) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'HOF-0007' OR dc_customer_id = '0007')
    AND LOWER(business_name) != LOWER('Ray Wai-Shing');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Ray Wai-Shing')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Ray Wai-Shing', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'HOF-0007',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Ray Wai-Shing', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Ray Wai-Shing', 'HOF-0007', '0007', '7']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Michael Chadburn (HOF-0003) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'HOF-0003' OR dc_customer_id = '0003')
    AND LOWER(business_name) != LOWER('Michael Chadburn');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Michael Chadburn')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Michael Chadburn', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'HOF-0003',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Michael Chadburn', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Michael Chadburn', 'HOF-0003', '0003', '3']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── UK Demo (DD2-0002) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'DD2-0002' OR dc_customer_id = '2')
    AND LOWER(business_name) != LOWER('UK Demo');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('UK Demo')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'UK Demo', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'DD2-0002',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('UK Demo', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['UK Demo', 'DD2-0002', '2']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Ninja UK Production (HOF-0002) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'HOF-0002' OR dc_customer_id = '0002')
    AND LOWER(business_name) != LOWER('Ninja UK Production');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Ninja UK Production')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Ninja UK Production', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'HOF-0002',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Ninja UK Production', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Ninja UK Production', 'HOF-0002', '0002', '2']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Prod Chinthaka (HOF-0001) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'HOF-0001' OR dc_customer_id = '0001')
    AND LOWER(business_name) != LOWER('Prod Chinthaka');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Prod Chinthaka')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Prod Chinthaka', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'HOF-0001',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Prod Chinthaka', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Prod Chinthaka', 'HOF-0001', '0001', '1']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── EFUTURES1 (DP1-0001) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'DP1-0001' OR dc_customer_id = '1')
    AND LOWER(business_name) != LOWER('EFUTURES1');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('EFUTURES1')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'EFUTURES1', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'DP1-0001',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('EFUTURES1', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['EFUTURES1', 'DP1-0001', '1']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Moreyeah Foods Ltd (MOOV-0076) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0076' OR dc_customer_id = '0076')
    AND LOWER(business_name) != LOWER('Moreyeah Foods Ltd');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Moreyeah Foods Ltd')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Moreyeah Foods Ltd', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0076',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Moreyeah Foods Ltd', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Moreyeah Foods Ltd', 'MOOV-0076', '0076', '76']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── S Smith & Sons Carpets Ltd (MOOV-0077) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0077' OR dc_customer_id = '0077')
    AND LOWER(business_name) != LOWER('S Smith & Sons Carpets Ltd');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('S Smith & Sons Carpets Ltd')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'S Smith & Sons Carpets Ltd', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0077',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('S Smith & Sons Carpets Ltd', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['S Smith & Sons Carpets Ltd', 'MOOV-0077', '0077', '77']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── The Railway Shop Ltd (MOOV-0078) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0078' OR dc_customer_id = '0078')
    AND LOWER(business_name) != LOWER('The Railway Shop Ltd');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('The Railway Shop Ltd')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'The Railway Shop Ltd', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0078',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('The Railway Shop Ltd', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['The Railway Shop Ltd', 'MOOV-0078', '0078', '78']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Pex Ltd (MOOV-0079) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0079' OR dc_customer_id = '0079')
    AND LOWER(business_name) != LOWER('Pex Ltd');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Pex Ltd')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Pex Ltd', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0079',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Pex Ltd', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Pex Ltd', 'MOOV-0079', '0079', '79']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Finger on Pulse Ltd (MOOV-0080) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0080' OR dc_customer_id = '0080')
    AND LOWER(business_name) != LOWER('Finger on Pulse Ltd');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Finger on Pulse Ltd')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Finger on Pulse Ltd', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0080',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Finger on Pulse Ltd', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Finger on Pulse Ltd', 'MOOV-0080', '0080', '80']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Iglu Meal Prep (Iglu Meal Prep) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'Iglu Meal Prep' )
    AND LOWER(business_name) != LOWER('Iglu Meal Prep');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Iglu Meal Prep')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Iglu Meal Prep', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'Iglu Meal Prep',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Iglu Meal Prep', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Iglu Meal Prep', 'Iglu Meal Prep']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Yourbookstore (Yourbookstore) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'Yourbookstore' )
    AND LOWER(business_name) != LOWER('Yourbookstore');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Yourbookstore')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Yourbookstore', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'Yourbookstore',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Yourbookstore', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Yourbookstore', 'Yourbookstore']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Carnivore Cartel Ltd (MOOV-0081) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0081' OR dc_customer_id = '0081')
    AND LOWER(business_name) != LOWER('Carnivore Cartel Ltd');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Carnivore Cartel Ltd')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Carnivore Cartel Ltd', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0081',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Carnivore Cartel Ltd', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Carnivore Cartel Ltd', 'MOOV-0081', '0081', '81']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Igluu Ltd (MOOV-0082) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0082' OR dc_customer_id = '0082')
    AND LOWER(business_name) != LOWER('Igluu Ltd');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Igluu Ltd')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Igluu Ltd', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0082',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Igluu Ltd', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Igluu Ltd', 'MOOV-0082', '0082', '82']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── E-Health Pharmacy Ltd (MOOV-0083) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0083' OR dc_customer_id = '0083')
    AND LOWER(business_name) != LOWER('E-Health Pharmacy Ltd');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('E-Health Pharmacy Ltd')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'E-Health Pharmacy Ltd', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0083',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('E-Health Pharmacy Ltd', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['E-Health Pharmacy Ltd', 'MOOV-0083', '0083', '83']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Techworknetwork LTD (MOOV-0084) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0084' OR dc_customer_id = '0084')
    AND LOWER(business_name) != LOWER('Techworknetwork LTD');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Techworknetwork LTD')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Techworknetwork LTD', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0084',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Techworknetwork LTD', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Techworknetwork LTD', 'MOOV-0084', '0084', '84']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Matrix Seating Limited (MOOV-0085) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0085' OR dc_customer_id = '0085')
    AND LOWER(business_name) != LOWER('Matrix Seating Limited');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Matrix Seating Limited')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Matrix Seating Limited', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0085',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Matrix Seating Limited', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Matrix Seating Limited', 'MOOV-0085', '0085', '85']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── test (DP1-0044) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'DP1-0044' OR dc_customer_id = '1')
    AND LOWER(business_name) != LOWER('test');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('test')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'test', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'DP1-0044',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('test', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['test', 'DP1-0044', '1']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Test company name (DP1-0045) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'DP1-0045' OR dc_customer_id = '1')
    AND LOWER(business_name) != LOWER('Test company name');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Test company name')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Test company name', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'DP1-0045',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Test company name', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Test company name', 'DP1-0045', '1']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Zesta (DP2-0001) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'DP2-0001' OR dc_customer_id = '2')
    AND LOWER(business_name) != LOWER('Zesta');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Zesta')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Zesta', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'DP2-0001',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Zesta', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Zesta', 'DP2-0001', '2']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── HSBC (DDJ1-0002) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'DDJ1-0002' OR dc_customer_id = '1')
    AND LOWER(business_name) != LOWER('HSBC');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('HSBC')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'HSBC', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'DDJ1-0002',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('HSBC', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['HSBC', 'DDJ1-0002', '1']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Danijels Parcels (MOOV-0087) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0087' OR dc_customer_id = '0087')
    AND LOWER(business_name) != LOWER('Danijels Parcels');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Danijels Parcels')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Danijels Parcels', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0087',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Danijels Parcels', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Danijels Parcels', 'MOOV-0087', '0087', '87']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── TCS Express Worldwide UK Limited (MOOV-0088) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0088' OR dc_customer_id = '0088')
    AND LOWER(business_name) != LOWER('TCS Express Worldwide UK Limited');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('TCS Express Worldwide UK Limited')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'TCS Express Worldwide UK Limited', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0088',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('TCS Express Worldwide UK Limited', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['TCS Express Worldwide UK Limited', 'MOOV-0088', '0088', '88']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Clearance Stock Supplies Limited (MOOV-0089) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0089' OR dc_customer_id = '0089')
    AND LOWER(business_name) != LOWER('Clearance Stock Supplies Limited');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Clearance Stock Supplies Limited')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Clearance Stock Supplies Limited', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0089',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Clearance Stock Supplies Limited', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Clearance Stock Supplies Limited', 'MOOV-0089', '0089', '89']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Octopus (DP1-0046) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'DP1-0046' OR dc_customer_id = '1')
    AND LOWER(business_name) != LOWER('Octopus');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Octopus')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Octopus', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'DP1-0046',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Octopus', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Octopus', 'DP1-0046', '1']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Matt Test (MOOV-0090) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0090' OR dc_customer_id = '0090')
    AND LOWER(business_name) != LOWER('Matt Test');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Matt Test')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Matt Test', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0090',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Matt Test', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Matt Test', 'MOOV-0090', '0090', '90']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Test company (DQA1-0016) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'DQA1-0016' OR dc_customer_id = '1')
    AND LOWER(business_name) != LOWER('Test company');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Test company')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Test company', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'DQA1-0016',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Test company', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Test company', 'DQA1-0016', '1']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Pet Food Online LTD (MOOV-0091) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0091' OR dc_customer_id = '0091')
    AND LOWER(business_name) != LOWER('Pet Food Online LTD');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Pet Food Online LTD')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Pet Food Online LTD', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0091',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Pet Food Online LTD', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Pet Food Online LTD', 'MOOV-0091', '0091', '91']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Aromina (DDJ1-0003) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'DDJ1-0003' OR dc_customer_id = '1')
    AND LOWER(business_name) != LOWER('Aromina');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Aromina')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Aromina', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'DDJ1-0003',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Aromina', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Aromina', 'DDJ1-0003', '1']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Paragon Design Joinery Ltd (MOOV-0092) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0092' OR dc_customer_id = '0092')
    AND LOWER(business_name) != LOWER('Paragon Design Joinery Ltd');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Paragon Design Joinery Ltd')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Paragon Design Joinery Ltd', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0092',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Paragon Design Joinery Ltd', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Paragon Design Joinery Ltd', 'MOOV-0092', '0092', '92']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Macchiato Bar Ltd (MOOV-0093) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0093' OR dc_customer_id = '0093')
    AND LOWER(business_name) != LOWER('Macchiato Bar Ltd');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Macchiato Bar Ltd')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Macchiato Bar Ltd', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0093',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Macchiato Bar Ltd', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Macchiato Bar Ltd', 'MOOV-0093', '0093', '93']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Soothe Limited t/a Luxury Skincare Brands (MOOV-0094) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0094' OR dc_customer_id = '0094')
    AND LOWER(business_name) != LOWER('Soothe Limited t/a Luxury Skincare Brands');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Soothe Limited t/a Luxury Skincare Brands')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Soothe Limited t/a Luxury Skincare Brands', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0094',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Soothe Limited t/a Luxury Skincare Brands', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Soothe Limited t/a Luxury Skincare Brands', 'MOOV-0094', '0094', '94']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── MAD baits supplies Ltd (MOOV-0095) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0095' OR dc_customer_id = '0095')
    AND LOWER(business_name) != LOWER('MAD baits supplies Ltd');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('MAD baits supplies Ltd')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'MAD baits supplies Ltd', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0095',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('MAD baits supplies Ltd', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['MAD baits supplies Ltd', 'MOOV-0095', '0095', '95']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Sam Scotts Limited (MOOV-0097) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0097' OR dc_customer_id = '0097')
    AND LOWER(business_name) != LOWER('Sam Scotts Limited');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Sam Scotts Limited')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Sam Scotts Limited', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0097',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Sam Scotts Limited', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Sam Scotts Limited', 'MOOV-0097', '0097', '97']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Crytec Limited (MOOV-0098) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0098' OR dc_customer_id = '0098')
    AND LOWER(business_name) != LOWER('Crytec Limited');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Crytec Limited')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Crytec Limited', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0098',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Crytec Limited', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Crytec Limited', 'MOOV-0098', '0098', '98']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Hairways (Hair & Beauty) Ltd Site B (MOOV-0099) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0099' OR dc_customer_id = '0099')
    AND LOWER(business_name) != LOWER('Hairways (Hair & Beauty) Ltd Site B');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Hairways (Hair & Beauty) Ltd Site B')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Hairways (Hair & Beauty) Ltd Site B', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0099',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Hairways (Hair & Beauty) Ltd Site B', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Hairways (Hair & Beauty) Ltd Site B', 'MOOV-0099', '0099', '99']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── WoodUbend Ltd (MOOV-0101) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0101' OR dc_customer_id = '0101')
    AND LOWER(business_name) != LOWER('WoodUbend Ltd');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('WoodUbend Ltd')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'WoodUbend Ltd', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0101',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('WoodUbend Ltd', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['WoodUbend Ltd', 'MOOV-0101', '0101', '101']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── TMK Trading Ltd t/a Nexus Modelling Supplies (MOOV-0102) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0102' OR dc_customer_id = '0102')
    AND LOWER(business_name) != LOWER('TMK Trading Ltd t/a Nexus Modelling Supplies');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('TMK Trading Ltd t/a Nexus Modelling Supplies')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'TMK Trading Ltd t/a Nexus Modelling Supplies', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0102',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('TMK Trading Ltd t/a Nexus Modelling Supplies', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['TMK Trading Ltd t/a Nexus Modelling Supplies', 'MOOV-0102', '0102', '102']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Brexons Workwear (MOOV-0103) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0103' OR dc_customer_id = '0103')
    AND LOWER(business_name) != LOWER('Brexons Workwear');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Brexons Workwear')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Brexons Workwear', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0103',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Brexons Workwear', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Brexons Workwear', 'MOOV-0103', '0103', '103']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Sing Ko (MOOV-0105) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0105' OR dc_customer_id = '0105')
    AND LOWER(business_name) != LOWER('Sing Ko');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Sing Ko')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Sing Ko', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0105',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Sing Ko', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Sing Ko', 'MOOV-0105', '0105', '105']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Boori (Europe) LTD (MOOV-0106) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0106' OR dc_customer_id = '0106')
    AND LOWER(business_name) != LOWER('Boori (Europe) LTD');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Boori (Europe) LTD')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Boori (Europe) LTD', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0106',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Boori (Europe) LTD', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Boori (Europe) LTD', 'MOOV-0106', '0106', '106']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── mike (123-0001) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = '123-0001' OR dc_customer_id = '123')
    AND LOWER(business_name) != LOWER('mike');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('mike')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'mike', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), '123-0001',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('mike', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['mike', '123-0001', '123']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── sdfdsf (11-2002) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = '11-2002' OR dc_customer_id = '11')
    AND LOWER(business_name) != LOWER('sdfdsf');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('sdfdsf')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'sdfdsf', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), '11-2002',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('sdfdsf', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['sdfdsf', '11-2002', '11']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── MV (123-0002) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = '123-0002' OR dc_customer_id = '123')
    AND LOWER(business_name) != LOWER('MV');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('MV')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'MV', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), '123-0002',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('MV', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['MV', '123-0002', '123']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── SYNTAXGENIE (123-0003) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = '123-0003' OR dc_customer_id = '123')
    AND LOWER(business_name) != LOWER('SYNTAXGENIE');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('SYNTAXGENIE')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'SYNTAXGENIE', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), '123-0003',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('SYNTAXGENIE', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['SYNTAXGENIE', '123-0003', '123']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── sdgsd (123-0004) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = '123-0004' OR dc_customer_id = '123')
    AND LOWER(business_name) != LOWER('sdgsd');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('sdgsd')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'sdgsd', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), '123-0004',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('sdgsd', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['sdgsd', '123-0004', '123']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── cf (11-2001) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = '11-2001' OR dc_customer_id = '11')
    AND LOWER(business_name) != LOWER('cf');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('cf')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'cf', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), '11-2001',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('cf', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['cf', '11-2001', '11']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Property Documents Ltd (MOOV-0107) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0107' OR dc_customer_id = '0107')
    AND LOWER(business_name) != LOWER('Property Documents Ltd');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Property Documents Ltd')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Property Documents Ltd', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0107',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Property Documents Ltd', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Property Documents Ltd', 'MOOV-0107', '0107', '107']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Accentura (DP1-0047) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'DP1-0047' OR dc_customer_id = '1')
    AND LOWER(business_name) != LOWER('Accentura');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Accentura')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Accentura', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'DP1-0047',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Accentura', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Accentura', 'DP1-0047', '1']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Direct Auto Electrics Ltd (MOOV-0108) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0108' OR dc_customer_id = '0108')
    AND LOWER(business_name) != LOWER('Direct Auto Electrics Ltd');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Direct Auto Electrics Ltd')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Direct Auto Electrics Ltd', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0108',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Direct Auto Electrics Ltd', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Direct Auto Electrics Ltd', 'MOOV-0108', '0108', '108']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Sampath Bank (DDJ1-0004) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'DDJ1-0004' OR dc_customer_id = '1')
    AND LOWER(business_name) != LOWER('Sampath Bank');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Sampath Bank')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Sampath Bank', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'DDJ1-0004',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Sampath Bank', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Sampath Bank', 'DDJ1-0004', '1']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── W J Jones Ltd T/A Zoar''s Ark (MOOV-0109) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0109' OR dc_customer_id = '0109')
    AND LOWER(business_name) != LOWER('W J Jones Ltd T/A Zoar''s Ark');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('W J Jones Ltd T/A Zoar''s Ark')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'W J Jones Ltd T/A Zoar''s Ark', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0109',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('W J Jones Ltd T/A Zoar''s Ark', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['W J Jones Ltd T/A Zoar''s Ark', 'MOOV-0109', '0109', '109']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Raycom Ltd (MOOV-0110) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0110' OR dc_customer_id = '0110')
    AND LOWER(business_name) != LOWER('Raycom Ltd');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Raycom Ltd')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Raycom Ltd', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0110',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Raycom Ltd', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Raycom Ltd', 'MOOV-0110', '0110', '110']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Michael kors (DQA1-0017) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'DQA1-0017' OR dc_customer_id = '1')
    AND LOWER(business_name) != LOWER('Michael kors');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Michael kors')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Michael kors', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'DQA1-0017',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Michael kors', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Michael kors', 'DQA1-0017', '1']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Vintsreet (Vintsreet) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'Vintsreet' )
    AND LOWER(business_name) != LOWER('Vintsreet');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Vintsreet')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Vintsreet', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'Vintsreet',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Vintsreet', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Vintsreet', 'Vintsreet']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Efutures Prod Test Account (DD2-0006) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'DD2-0006' OR dc_customer_id = '2')
    AND LOWER(business_name) != LOWER('Efutures Prod Test Account');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Efutures Prod Test Account')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Efutures Prod Test Account', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'DD2-0006',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Efutures Prod Test Account', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Efutures Prod Test Account', 'DD2-0006', '2']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Redo Commerce (Redo Commerce) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'Redo Commerce' )
    AND LOWER(business_name) != LOWER('Redo Commerce');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Redo Commerce')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Redo Commerce', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'Redo Commerce',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Redo Commerce', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Redo Commerce', 'Redo Commerce']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Empire Printing & Embroidery Ltd (MOOV-0111) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0111' OR dc_customer_id = '0111')
    AND LOWER(business_name) != LOWER('Empire Printing & Embroidery Ltd');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Empire Printing & Embroidery Ltd')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Empire Printing & Embroidery Ltd', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0111',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Empire Printing & Embroidery Ltd', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Empire Printing & Embroidery Ltd', 'MOOV-0111', '0111', '111']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── BARRY CARTER MOTOR PRODUCTS (MOOV-0113) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0113' OR dc_customer_id = '0113')
    AND LOWER(business_name) != LOWER('BARRY CARTER MOTOR PRODUCTS');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('BARRY CARTER MOTOR PRODUCTS')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'BARRY CARTER MOTOR PRODUCTS', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0113',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('BARRY CARTER MOTOR PRODUCTS', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['BARRY CARTER MOTOR PRODUCTS', 'MOOV-0113', '0113', '113']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Cranswick (Cranswick) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'Cranswick' )
    AND LOWER(business_name) != LOWER('Cranswick');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Cranswick')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Cranswick', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'Cranswick',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Cranswick', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Cranswick', 'Cranswick']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Vint Street Ltd. (MOOV-0114) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0114' OR dc_customer_id = '0114')
    AND LOWER(business_name) != LOWER('Vint Street Ltd.');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Vint Street Ltd.')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Vint Street Ltd.', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0114',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Vint Street Ltd.', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Vint Street Ltd.', 'MOOV-0114', '0114', '114']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Imagin Products Ltd (MOOV-0115) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0115' OR dc_customer_id = '0115')
    AND LOWER(business_name) != LOWER('Imagin Products Ltd');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Imagin Products Ltd')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Imagin Products Ltd', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0115',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Imagin Products Ltd', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Imagin Products Ltd', 'MOOV-0115', '0115', '115']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Efutures Prod Account Two (DD2-0007) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'DD2-0007' OR dc_customer_id = '2')
    AND LOWER(business_name) != LOWER('Efutures Prod Account Two');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Efutures Prod Account Two')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Efutures Prod Account Two', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'DD2-0007',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Efutures Prod Account Two', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Efutures Prod Account Two', 'DD2-0007', '2']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── EZZTECH (MOOV-0116) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0116' OR dc_customer_id = '0116')
    AND LOWER(business_name) != LOWER('EZZTECH');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('EZZTECH')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'EZZTECH', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0116',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('EZZTECH', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['EZZTECH', 'MOOV-0116', '0116', '116']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Tool Hub Ltd (MOOV-0117) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0117' OR dc_customer_id = '0117')
    AND LOWER(business_name) != LOWER('Tool Hub Ltd');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Tool Hub Ltd')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Tool Hub Ltd', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0117',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Tool Hub Ltd', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Tool Hub Ltd', 'MOOV-0117', '0117', '117']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Getplumb Reading Ltd (MOOV-0118) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0118' OR dc_customer_id = '0118')
    AND LOWER(business_name) != LOWER('Getplumb Reading Ltd');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Getplumb Reading Ltd')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Getplumb Reading Ltd', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0118',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Getplumb Reading Ltd', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Getplumb Reading Ltd', 'MOOV-0118', '0118', '118']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Vision Warehouse (MOOV-0112) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0112' OR dc_customer_id = '0112')
    AND LOWER(business_name) != LOWER('Vision Warehouse');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Vision Warehouse')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Vision Warehouse', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0112',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Vision Warehouse', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Vision Warehouse', 'MOOV-0112', '0112', '112']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── 608 Group Ltd (304 Clothing) (MOOV-0119) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0119' OR dc_customer_id = '0119')
    AND LOWER(business_name) != LOWER('608 Group Ltd (304 Clothing)');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('608 Group Ltd (304 Clothing)')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      '608 Group Ltd (304 Clothing)', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0119',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('608 Group Ltd (304 Clothing)', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['608 Group Ltd (304 Clothing)', 'MOOV-0119', '0119', '119']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Sky Chemicals (UK) Ltd (MOOV-0120) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0120' OR dc_customer_id = '0120')
    AND LOWER(business_name) != LOWER('Sky Chemicals (UK) Ltd');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Sky Chemicals (UK) Ltd')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Sky Chemicals (UK) Ltd', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0120',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Sky Chemicals (UK) Ltd', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Sky Chemicals (UK) Ltd', 'MOOV-0120', '0120', '120']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Wedcova Uk Ltd (MOOV-0121) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0121' OR dc_customer_id = '0121')
    AND LOWER(business_name) != LOWER('Wedcova Uk Ltd');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Wedcova Uk Ltd')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Wedcova Uk Ltd', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0121',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Wedcova Uk Ltd', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Wedcova Uk Ltd', 'MOOV-0121', '0121', '121']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Fosseway Parcels Ltd (MOOV-0122) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0122' OR dc_customer_id = '0122')
    AND LOWER(business_name) != LOWER('Fosseway Parcels Ltd');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Fosseway Parcels Ltd')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Fosseway Parcels Ltd', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0122',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Fosseway Parcels Ltd', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Fosseway Parcels Ltd', 'MOOV-0122', '0122', '122']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── ARIMAC (DDJ1-0005) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'DDJ1-0005' OR dc_customer_id = '1')
    AND LOWER(business_name) != LOWER('ARIMAC');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('ARIMAC')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'ARIMAC', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'DDJ1-0005',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('ARIMAC', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['ARIMAC', 'DDJ1-0005', '1']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── GPG - Getpersonalisedgifts Limited (MOOV-0123) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0123' OR dc_customer_id = '0123')
    AND LOWER(business_name) != LOWER('GPG - Getpersonalisedgifts Limited');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('GPG - Getpersonalisedgifts Limited')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'GPG - Getpersonalisedgifts Limited', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0123',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('GPG - Getpersonalisedgifts Limited', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['GPG - Getpersonalisedgifts Limited', 'MOOV-0123', '0123', '123']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Thirsty Soft Drinks (MOOV-0124) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0124' OR dc_customer_id = '0124')
    AND LOWER(business_name) != LOWER('Thirsty Soft Drinks');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Thirsty Soft Drinks')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Thirsty Soft Drinks', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0124',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Thirsty Soft Drinks', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Thirsty Soft Drinks', 'MOOV-0124', '0124', '124']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Gifts2Impress (MOOV-0125) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0125' OR dc_customer_id = '0125')
    AND LOWER(business_name) != LOWER('Gifts2Impress');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Gifts2Impress')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Gifts2Impress', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0125',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Gifts2Impress', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Gifts2Impress', 'MOOV-0125', '0125', '125']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Xylo LTD (MOOV-0126) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0126' OR dc_customer_id = '0126')
    AND LOWER(business_name) != LOWER('Xylo LTD');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Xylo LTD')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Xylo LTD', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0126',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Xylo LTD', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Xylo LTD', 'MOOV-0126', '0126', '126']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── The Saddlery Shop Ltd (MOOV-0127) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0127' OR dc_customer_id = '0127')
    AND LOWER(business_name) != LOWER('The Saddlery Shop Ltd');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('The Saddlery Shop Ltd')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'The Saddlery Shop Ltd', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0127',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('The Saddlery Shop Ltd', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['The Saddlery Shop Ltd', 'MOOV-0127', '0127', '127']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── EF TEST QA ACCOUNT (DD2-0008) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'DD2-0008' OR dc_customer_id = '2')
    AND LOWER(business_name) != LOWER('EF TEST QA ACCOUNT');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('EF TEST QA ACCOUNT')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'EF TEST QA ACCOUNT', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'DD2-0008',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('EF TEST QA ACCOUNT', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['EF TEST QA ACCOUNT', 'DD2-0008', '2']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Organax Ltd (MOOV-0128) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0128' OR dc_customer_id = '0128')
    AND LOWER(business_name) != LOWER('Organax Ltd');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Organax Ltd')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Organax Ltd', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0128',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Organax Ltd', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Organax Ltd', 'MOOV-0128', '0128', '128']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Gra Telford LTD (MOOV-0129) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0129' OR dc_customer_id = '0129')
    AND LOWER(business_name) != LOWER('Gra Telford LTD');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Gra Telford LTD')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Gra Telford LTD', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0129',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Gra Telford LTD', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Gra Telford LTD', 'MOOV-0129', '0129', '129']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Attapattu & Sons (123-0005) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = '123-0005' OR dc_customer_id = '123')
    AND LOWER(business_name) != LOWER('Attapattu & Sons');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Attapattu & Sons')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Attapattu & Sons', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), '123-0005',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Attapattu & Sons', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Attapattu & Sons', '123-0005', '123']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Jayasuriya & Sons (123-0006) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = '123-0006' OR dc_customer_id = '123')
    AND LOWER(business_name) != LOWER('Jayasuriya & Sons');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Jayasuriya & Sons')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Jayasuriya & Sons', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), '123-0006',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Jayasuriya & Sons', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Jayasuriya & Sons', '123-0006', '123']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── The Wall Lighting Company Ltd (MOOV-0130) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0130' OR dc_customer_id = '0130')
    AND LOWER(business_name) != LOWER('The Wall Lighting Company Ltd');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('The Wall Lighting Company Ltd')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'The Wall Lighting Company Ltd', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0130',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('The Wall Lighting Company Ltd', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['The Wall Lighting Company Ltd', 'MOOV-0130', '0130', '130']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Chilli Seating Ltd (MOOV-0131) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0131' OR dc_customer_id = '0131')
    AND LOWER(business_name) != LOWER('Chilli Seating Ltd');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Chilli Seating Ltd')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Chilli Seating Ltd', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0131',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Chilli Seating Ltd', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Chilli Seating Ltd', 'MOOV-0131', '0131', '131']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── ZARA Company (DDJ1-0006) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'DDJ1-0006' OR dc_customer_id = '1')
    AND LOWER(business_name) != LOWER('ZARA Company');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('ZARA Company')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'ZARA Company', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'DDJ1-0006',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('ZARA Company', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['ZARA Company', 'DDJ1-0006', '1']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── N70 (123-0007) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = '123-0007' OR dc_customer_id = '123')
    AND LOWER(business_name) != LOWER('N70');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('N70')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'N70', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), '123-0007',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('N70', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['N70', '123-0007', '123']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Mahela Co (123-0008) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = '123-0008' OR dc_customer_id = '123')
    AND LOWER(business_name) != LOWER('Mahela Co');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Mahela Co')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Mahela Co', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), '123-0008',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Mahela Co', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Mahela Co', '123-0008', '123']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── David Jones (DP1-0048) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'DP1-0048' OR dc_customer_id = '1')
    AND LOWER(business_name) != LOWER('David Jones');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('David Jones')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'David Jones', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'DP1-0048',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('David Jones', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['David Jones', 'DP1-0048', '1']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Deshi Delights Ltd (MOOV-0132) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0132' OR dc_customer_id = '0132')
    AND LOWER(business_name) != LOWER('Deshi Delights Ltd');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Deshi Delights Ltd')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Deshi Delights Ltd', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0132',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Deshi Delights Ltd', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Deshi Delights Ltd', 'MOOV-0132', '0132', '132']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── EFUTURES TEST COMPANY (DD2-0009) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'DD2-0009' OR dc_customer_id = '2')
    AND LOWER(business_name) != LOWER('EFUTURES TEST COMPANY');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('EFUTURES TEST COMPANY')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'EFUTURES TEST COMPANY', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'DD2-0009',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('EFUTURES TEST COMPANY', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['EFUTURES TEST COMPANY', 'DD2-0009', '2']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Bill''s Tool Store Ltd (MOOV-0133) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0133' OR dc_customer_id = '0133')
    AND LOWER(business_name) != LOWER('Bill''s Tool Store Ltd');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Bill''s Tool Store Ltd')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Bill''s Tool Store Ltd', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0133',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Bill''s Tool Store Ltd', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Bill''s Tool Store Ltd', 'MOOV-0133', '0133', '133']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Jaycee Engineering T/A Jaycee Trophies (MOOV-0134) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0134' OR dc_customer_id = '0134')
    AND LOWER(business_name) != LOWER('Jaycee Engineering T/A Jaycee Trophies');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Jaycee Engineering T/A Jaycee Trophies')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Jaycee Engineering T/A Jaycee Trophies', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0134',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Jaycee Engineering T/A Jaycee Trophies', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Jaycee Engineering T/A Jaycee Trophies', 'MOOV-0134', '0134', '134']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Arden Medical Limited (MOOV-0135) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0135' OR dc_customer_id = '0135')
    AND LOWER(business_name) != LOWER('Arden Medical Limited');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Arden Medical Limited')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Arden Medical Limited', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0135',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Arden Medical Limited', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Arden Medical Limited', 'MOOV-0135', '0135', '135']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── ORIGINAL SOURCE LIMITED (MOOV-0136) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0136' OR dc_customer_id = '0136')
    AND LOWER(business_name) != LOWER('ORIGINAL SOURCE LIMITED');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('ORIGINAL SOURCE LIMITED')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'ORIGINAL SOURCE LIMITED', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0136',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('ORIGINAL SOURCE LIMITED', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['ORIGINAL SOURCE LIMITED', 'MOOV-0136', '0136', '136']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Ransom Publishing Ltd (MOOV-0137) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0137' OR dc_customer_id = '0137')
    AND LOWER(business_name) != LOWER('Ransom Publishing Ltd');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Ransom Publishing Ltd')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Ransom Publishing Ltd', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0137',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Ransom Publishing Ltd', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Ransom Publishing Ltd', 'MOOV-0137', '0137', '137']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Webhook Test (123-0010) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = '123-0010' OR dc_customer_id = '123')
    AND LOWER(business_name) != LOWER('Webhook Test');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Webhook Test')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Webhook Test', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), '123-0010',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Webhook Test', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Webhook Test', '123-0010', '123']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Fortec Trading Ltd t/a Glowtopia (Fortec Trading Ltd t/a Glowtopia) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'Fortec Trading Ltd t/a Glowtopia' )
    AND LOWER(business_name) != LOWER('Fortec Trading Ltd t/a Glowtopia');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Fortec Trading Ltd t/a Glowtopia')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Fortec Trading Ltd t/a Glowtopia', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'Fortec Trading Ltd t/a Glowtopia',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Fortec Trading Ltd t/a Glowtopia', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Fortec Trading Ltd t/a Glowtopia', 'Fortec Trading Ltd t/a Glowtopia']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Alpha Cus (123-0011) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = '123-0011' OR dc_customer_id = '123')
    AND LOWER(business_name) != LOWER('Alpha Cus');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Alpha Cus')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Alpha Cus', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), '123-0011',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Alpha Cus', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Alpha Cus', '123-0011', '123']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Beta Cus (123-0012) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = '123-0012' OR dc_customer_id = '123')
    AND LOWER(business_name) != LOWER('Beta Cus');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Beta Cus')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Beta Cus', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), '123-0012',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Beta Cus', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Beta Cus', '123-0012', '123']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Vintstreet (Vintstreet) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'Vintstreet' )
    AND LOWER(business_name) != LOWER('Vintstreet');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Vintstreet')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Vintstreet', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'Vintstreet',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Vintstreet', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Vintstreet', 'Vintstreet']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Westcare Ltd T/A westcare Supply Zone (MOOV-0138) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0138' OR dc_customer_id = '0138')
    AND LOWER(business_name) != LOWER('Westcare Ltd T/A westcare Supply Zone');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Westcare Ltd T/A westcare Supply Zone')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Westcare Ltd T/A westcare Supply Zone', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0138',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Westcare Ltd T/A westcare Supply Zone', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Westcare Ltd T/A westcare Supply Zone', 'MOOV-0138', '0138', '138']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Talpa office products ltd (MOOV-0139) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0139' OR dc_customer_id = '0139')
    AND LOWER(business_name) != LOWER('Talpa office products ltd');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Talpa office products ltd')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Talpa office products ltd', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0139',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Talpa office products ltd', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Talpa office products ltd', 'MOOV-0139', '0139', '139']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── LED Smart Solutions Limited (MOOV-0140) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0140' OR dc_customer_id = '0140')
    AND LOWER(business_name) != LOWER('LED Smart Solutions Limited');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('LED Smart Solutions Limited')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'LED Smart Solutions Limited', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0140',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('LED Smart Solutions Limited', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['LED Smart Solutions Limited', 'MOOV-0140', '0140', '140']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── My Company (HOF-0013) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'HOF-0013' OR dc_customer_id = '0013')
    AND LOWER(business_name) != LOWER('My Company');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('My Company')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'My Company', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'HOF-0013',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('My Company', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['My Company', 'HOF-0013', '0013', '13']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── JST Supplies LTD (MOOV-0141) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0141' OR dc_customer_id = '0141')
    AND LOWER(business_name) != LOWER('JST Supplies LTD');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('JST Supplies LTD')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'JST Supplies LTD', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0141',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('JST Supplies LTD', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['JST Supplies LTD', 'MOOV-0141', '0141', '141']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Moov Diana Demo (MOOV-0142) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0142' OR dc_customer_id = '0142')
    AND LOWER(business_name) != LOWER('Moov Diana Demo');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Moov Diana Demo')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Moov Diana Demo', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0142',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Moov Diana Demo', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Moov Diana Demo', 'MOOV-0142', '0142', '142']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── OliArt Wood LTD (MOOV-0143) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0143' OR dc_customer_id = '0143')
    AND LOWER(business_name) != LOWER('OliArt Wood LTD');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('OliArt Wood LTD')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'OliArt Wood LTD', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0143',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('OliArt Wood LTD', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['OliArt Wood LTD', 'MOOV-0143', '0143', '143']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Bessette LTD (MOOV-0144) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0144' OR dc_customer_id = '0144')
    AND LOWER(business_name) != LOWER('Bessette LTD');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Bessette LTD')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Bessette LTD', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0144',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Bessette LTD', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Bessette LTD', 'MOOV-0144', '0144', '144']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── NDB (DDJ1-0007) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'DDJ1-0007' OR dc_customer_id = '1')
    AND LOWER(business_name) != LOWER('NDB');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('NDB')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'NDB', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'DDJ1-0007',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('NDB', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['NDB', 'DDJ1-0007', '1']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── CONTEXT PNEUMATIC SUPPLIES LIMITED (MOOV-0145) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0145' OR dc_customer_id = '0145')
    AND LOWER(business_name) != LOWER('CONTEXT PNEUMATIC SUPPLIES LIMITED');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('CONTEXT PNEUMATIC SUPPLIES LIMITED')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'CONTEXT PNEUMATIC SUPPLIES LIMITED', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0145',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('CONTEXT PNEUMATIC SUPPLIES LIMITED', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['CONTEXT PNEUMATIC SUPPLIES LIMITED', 'MOOV-0145', '0145', '145']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Bentley and Bo Interiors Ltd (MOOV-0146) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0146' OR dc_customer_id = '0146')
    AND LOWER(business_name) != LOWER('Bentley and Bo Interiors Ltd');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Bentley and Bo Interiors Ltd')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Bentley and Bo Interiors Ltd', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0146',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Bentley and Bo Interiors Ltd', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Bentley and Bo Interiors Ltd', 'MOOV-0146', '0146', '146']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── SME IT Solutions Limited (MOOV-0147) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0147' OR dc_customer_id = '0147')
    AND LOWER(business_name) != LOWER('SME IT Solutions Limited');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('SME IT Solutions Limited')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'SME IT Solutions Limited', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0147',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('SME IT Solutions Limited', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['SME IT Solutions Limited', 'MOOV-0147', '0147', '147']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── EFUTURES SMOKE TEST CUSTOMER (MOOV-0148) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0148' OR dc_customer_id = '0148')
    AND LOWER(business_name) != LOWER('EFUTURES SMOKE TEST CUSTOMER');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('EFUTURES SMOKE TEST CUSTOMER')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'EFUTURES SMOKE TEST CUSTOMER', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0148',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('EFUTURES SMOKE TEST CUSTOMER', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['EFUTURES SMOKE TEST CUSTOMER', 'MOOV-0148', '0148', '148']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Buffalo Systems Ltd (MOOV-0149) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0149' OR dc_customer_id = '0149')
    AND LOWER(business_name) != LOWER('Buffalo Systems Ltd');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Buffalo Systems Ltd')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Buffalo Systems Ltd', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0149',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Buffalo Systems Ltd', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Buffalo Systems Ltd', 'MOOV-0149', '0149', '149']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── East London Packaging Supplies Ltd (MOOV-0150) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0150' OR dc_customer_id = '0150')
    AND LOWER(business_name) != LOWER('East London Packaging Supplies Ltd');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('East London Packaging Supplies Ltd')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'East London Packaging Supplies Ltd', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0150',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('East London Packaging Supplies Ltd', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['East London Packaging Supplies Ltd', 'MOOV-0150', '0150', '150']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Metal Polishing Supplies Ltd (MOOV-0151) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0151' OR dc_customer_id = '0151')
    AND LOWER(business_name) != LOWER('Metal Polishing Supplies Ltd');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Metal Polishing Supplies Ltd')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Metal Polishing Supplies Ltd', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0151',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Metal Polishing Supplies Ltd', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Metal Polishing Supplies Ltd', 'MOOV-0151', '0151', '151']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Spokz Ltd (MOOV-0152) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0152' OR dc_customer_id = '0152')
    AND LOWER(business_name) != LOWER('Spokz Ltd');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Spokz Ltd')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Spokz Ltd', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0152',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Spokz Ltd', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Spokz Ltd', 'MOOV-0152', '0152', '152']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Youtheory (123-0013) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = '123-0013' OR dc_customer_id = '123')
    AND LOWER(business_name) != LOWER('Youtheory');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Youtheory')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Youtheory', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), '123-0013',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Youtheory', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Youtheory', '123-0013', '123']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── M. Criscuolo & Co Ltd (MOOV-0153) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0153' OR dc_customer_id = '0153')
    AND LOWER(business_name) != LOWER('M. Criscuolo & Co Ltd');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('M. Criscuolo & Co Ltd')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'M. Criscuolo & Co Ltd', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0153',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('M. Criscuolo & Co Ltd', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['M. Criscuolo & Co Ltd', 'MOOV-0153', '0153', '153']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Kettles Pottery Supplies Ltd (MOOV-0154) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0154' OR dc_customer_id = '0154')
    AND LOWER(business_name) != LOWER('Kettles Pottery Supplies Ltd');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Kettles Pottery Supplies Ltd')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Kettles Pottery Supplies Ltd', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0154',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Kettles Pottery Supplies Ltd', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Kettles Pottery Supplies Ltd', 'MOOV-0154', '0154', '154']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── East Coast Creations Ltd (MOOV-0155) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0155' OR dc_customer_id = '0155')
    AND LOWER(business_name) != LOWER('East Coast Creations Ltd');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('East Coast Creations Ltd')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'East Coast Creations Ltd', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0155',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('East Coast Creations Ltd', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['East Coast Creations Ltd', 'MOOV-0155', '0155', '155']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── ETA Solutions Limited (MOOV-0156) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0156' OR dc_customer_id = '0156')
    AND LOWER(business_name) != LOWER('ETA Solutions Limited');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('ETA Solutions Limited')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'ETA Solutions Limited', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0156',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('ETA Solutions Limited', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['ETA Solutions Limited', 'MOOV-0156', '0156', '156']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Security Trade Products Ltd (MOOV-0157) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0157' OR dc_customer_id = '0157')
    AND LOWER(business_name) != LOWER('Security Trade Products Ltd');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Security Trade Products Ltd')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Security Trade Products Ltd', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0157',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Security Trade Products Ltd', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Security Trade Products Ltd', 'MOOV-0157', '0157', '157']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Sarratt Online Ltd (MOOV-0158) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0158' OR dc_customer_id = '0158')
    AND LOWER(business_name) != LOWER('Sarratt Online Ltd');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Sarratt Online Ltd')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Sarratt Online Ltd', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0158',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Sarratt Online Ltd', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Sarratt Online Ltd', 'MOOV-0158', '0158', '158']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Agar Hygiene Ltd (MOOV-0159) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0159' OR dc_customer_id = '0159')
    AND LOWER(business_name) != LOWER('Agar Hygiene Ltd');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Agar Hygiene Ltd')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Agar Hygiene Ltd', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0159',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Agar Hygiene Ltd', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Agar Hygiene Ltd', 'MOOV-0159', '0159', '159']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Lesser Spotted Images Ltd (MOOV-0160) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0160' OR dc_customer_id = '0160')
    AND LOWER(business_name) != LOWER('Lesser Spotted Images Ltd');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Lesser Spotted Images Ltd')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Lesser Spotted Images Ltd', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0160',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Lesser Spotted Images Ltd', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Lesser Spotted Images Ltd', 'MOOV-0160', '0160', '160']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Just Cable Ties (MOOV-0161) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0161' OR dc_customer_id = '0161')
    AND LOWER(business_name) != LOWER('Just Cable Ties');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Just Cable Ties')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Just Cable Ties', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0161',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Just Cable Ties', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Just Cable Ties', 'MOOV-0161', '0161', '161']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Work and Wear Direct Ltd (Work and Wear Direct Ltd) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'Work and Wear Direct Ltd' )
    AND LOWER(business_name) != LOWER('Work and Wear Direct Ltd');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Work and Wear Direct Ltd')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Work and Wear Direct Ltd', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'Work and Wear Direct Ltd',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Work and Wear Direct Ltd', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Work and Wear Direct Ltd', 'Work and Wear Direct Ltd']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Exhale Boutique (Exhale Boutique) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'Exhale Boutique' )
    AND LOWER(business_name) != LOWER('Exhale Boutique');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Exhale Boutique')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Exhale Boutique', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'Exhale Boutique',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Exhale Boutique', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Exhale Boutique', 'Exhale Boutique']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Southdown Abrasives & Ind Chemicals Ltd (MOOV-0162) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0162' OR dc_customer_id = '0162')
    AND LOWER(business_name) != LOWER('Southdown Abrasives & Ind Chemicals Ltd');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Southdown Abrasives & Ind Chemicals Ltd')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Southdown Abrasives & Ind Chemicals Ltd', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0162',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Southdown Abrasives & Ind Chemicals Ltd', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Southdown Abrasives & Ind Chemicals Ltd', 'MOOV-0162', '0162', '162']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Tackl (Tackl) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'Tackl' )
    AND LOWER(business_name) != LOWER('Tackl');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Tackl')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Tackl', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'Tackl',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Tackl', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Tackl', 'Tackl']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Auto Test (Auto) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'Auto' )
    AND LOWER(business_name) != LOWER('Auto Test');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Auto Test')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Auto Test', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'Auto',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Auto Test', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Auto Test', 'Auto']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── HPSA Ltd (MOOV-0163) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0163' OR dc_customer_id = '0163')
    AND LOWER(business_name) != LOWER('HPSA Ltd');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('HPSA Ltd')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'HPSA Ltd', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0163',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('HPSA Ltd', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['HPSA Ltd', 'MOOV-0163', '0163', '163']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── ceravi (DP1-0051) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'DP1-0051' OR dc_customer_id = '1')
    AND LOWER(business_name) != LOWER('ceravi');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('ceravi')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'ceravi', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'DP1-0051',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('ceravi', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['ceravi', 'DP1-0051', '1']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── PWS Leeds Ltd (MOOV-0164) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0164' OR dc_customer_id = '0164')
    AND LOWER(business_name) != LOWER('PWS Leeds Ltd');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('PWS Leeds Ltd')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'PWS Leeds Ltd', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0164',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('PWS Leeds Ltd', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['PWS Leeds Ltd', 'MOOV-0164', '0164', '164']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Total Insignia Ltd (MOOV-0165) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0165' OR dc_customer_id = '0165')
    AND LOWER(business_name) != LOWER('Total Insignia Ltd');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Total Insignia Ltd')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Total Insignia Ltd', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0165',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Total Insignia Ltd', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Total Insignia Ltd', 'MOOV-0165', '0165', '165']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── USER (EFD1-0004) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'EFD1-0004' OR dc_customer_id = '1')
    AND LOWER(business_name) != LOWER('USER');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('USER')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'USER', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'EFD1-0004',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('USER', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['USER', 'EFD1-0004', '1']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── The Wild Meat Company ltd (MOOV-0166) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0166' OR dc_customer_id = '0166')
    AND LOWER(business_name) != LOWER('The Wild Meat Company ltd');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('The Wild Meat Company ltd')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'The Wild Meat Company ltd', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0166',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('The Wild Meat Company ltd', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['The Wild Meat Company ltd', 'MOOV-0166', '0166', '166']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Grace Test Account (MOOV-0167) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0167' OR dc_customer_id = '0167')
    AND LOWER(business_name) != LOWER('Grace Test Account');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Grace Test Account')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Grace Test Account', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0167',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Grace Test Account', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Grace Test Account', 'MOOV-0167', '0167', '167']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Bob AI (MOOV-0168) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0168' OR dc_customer_id = '0168')
    AND LOWER(business_name) != LOWER('Bob AI');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Bob AI')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Bob AI', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0168',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Bob AI', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Bob AI', 'MOOV-0168', '0168', '168']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Xplore Brands (MOOV-0169) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0169' OR dc_customer_id = '0169')
    AND LOWER(business_name) != LOWER('Xplore Brands');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Xplore Brands')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Xplore Brands', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0169',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Xplore Brands', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Xplore Brands', 'MOOV-0169', '0169', '169']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Medicube (DQA1-0018) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'DQA1-0018' OR dc_customer_id = '1')
    AND LOWER(business_name) != LOWER('Medicube');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Medicube')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Medicube', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'DQA1-0018',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Medicube', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Medicube', 'DQA1-0018', '1']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Sherwood Wholesale Foods Ltd (MOOV-0170) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0170' OR dc_customer_id = '0170')
    AND LOWER(business_name) != LOWER('Sherwood Wholesale Foods Ltd');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Sherwood Wholesale Foods Ltd')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Sherwood Wholesale Foods Ltd', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0170',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Sherwood Wholesale Foods Ltd', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Sherwood Wholesale Foods Ltd', 'MOOV-0170', '0170', '170']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── 2023 (QDP1-0001) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'QDP1-0001' OR dc_customer_id = '1')
    AND LOWER(business_name) != LOWER('2023');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('2023')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      '2023', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'QDP1-0001',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('2023', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['2023', 'QDP1-0001', '1']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── PROD EF COMPANY (TDP1-0001) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'TDP1-0001' OR dc_customer_id = '1')
    AND LOWER(business_name) != LOWER('PROD EF COMPANY');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('PROD EF COMPANY')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'PROD EF COMPANY', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'TDP1-0001',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('PROD EF COMPANY', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['PROD EF COMPANY', 'TDP1-0001', '1']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── EF (DE22-0009) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'DE22-0009' OR dc_customer_id = '22')
    AND LOWER(business_name) != LOWER('EF');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('EF')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'EF', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'DE22-0009',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('EF', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['EF', 'DE22-0009', '22']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── NNU (DE22-0011) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'DE22-0011' OR dc_customer_id = '22')
    AND LOWER(business_name) != LOWER('NNU');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('NNU')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'NNU', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'DE22-0011',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('NNU', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['NNU', 'DE22-0011', '22']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Non Ninja Company (QDP1-0003) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'QDP1-0003' OR dc_customer_id = '1')
    AND LOWER(business_name) != LOWER('Non Ninja Company');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Non Ninja Company')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Non Ninja Company', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'QDP1-0003',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Non Ninja Company', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Non Ninja Company', 'QDP1-0003', '1']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Test Ninja company (DP1-0053) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'DP1-0053' OR dc_customer_id = '1')
    AND LOWER(business_name) != LOWER('Test Ninja company');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Test Ninja company')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Test Ninja company', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'DP1-0053',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Test Ninja company', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Test Ninja company', 'DP1-0053', '1']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Efutures Non Ninja company (DE22-0015) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'DE22-0015' OR dc_customer_id = '22')
    AND LOWER(business_name) != LOWER('Efutures Non Ninja company');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Efutures Non Ninja company')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Efutures Non Ninja company', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'DE22-0015',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Efutures Non Ninja company', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Efutures Non Ninja company', 'DE22-0015', '22']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── EFUTURES TEST PORD NINJA COMPANY (TDP1-0005) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'TDP1-0005' OR dc_customer_id = '1')
    AND LOWER(business_name) != LOWER('EFUTURES TEST PORD NINJA COMPANY');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('EFUTURES TEST PORD NINJA COMPANY')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'EFUTURES TEST PORD NINJA COMPANY', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'TDP1-0005',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('EFUTURES TEST PORD NINJA COMPANY', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['EFUTURES TEST PORD NINJA COMPANY', 'TDP1-0005', '1']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Test Efutures Non Ninja comp (TDP1-0007) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'TDP1-0007' OR dc_customer_id = '1')
    AND LOWER(business_name) != LOWER('Test Efutures Non Ninja comp');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Test Efutures Non Ninja comp')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Test Efutures Non Ninja comp', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'TDP1-0007',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Test Efutures Non Ninja comp', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Test Efutures Non Ninja comp', 'TDP1-0007', '1']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Jamie Ferments Limited (MOOV-0171) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0171' OR dc_customer_id = '0171')
    AND LOWER(business_name) != LOWER('Jamie Ferments Limited');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Jamie Ferments Limited')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Jamie Ferments Limited', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0171',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Jamie Ferments Limited', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Jamie Ferments Limited', 'MOOV-0171', '0171', '171']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Jezaya UK Limited (MOOV-0172) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0172' OR dc_customer_id = '0172')
    AND LOWER(business_name) != LOWER('Jezaya UK Limited');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Jezaya UK Limited')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Jezaya UK Limited', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0172',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Jezaya UK Limited', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Jezaya UK Limited', 'MOOV-0172', '0172', '172']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Wine Buffs Ltd (MOOV-0173) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0173' OR dc_customer_id = '0173')
    AND LOWER(business_name) != LOWER('Wine Buffs Ltd');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Wine Buffs Ltd')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Wine Buffs Ltd', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0173',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Wine Buffs Ltd', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Wine Buffs Ltd', 'MOOV-0173', '0173', '173']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Doran Packaging Ltd (MOOV-0174) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0174' OR dc_customer_id = '0174')
    AND LOWER(business_name) != LOWER('Doran Packaging Ltd');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Doran Packaging Ltd')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Doran Packaging Ltd', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0174',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Doran Packaging Ltd', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Doran Packaging Ltd', 'MOOV-0174', '0174', '174']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Purozo Limited (MOOV-0175) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0175' OR dc_customer_id = '0175')
    AND LOWER(business_name) != LOWER('Purozo Limited');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Purozo Limited')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Purozo Limited', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0175',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Purozo Limited', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Purozo Limited', 'MOOV-0175', '0175', '175']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Wosi Wosi Foods Limited (MOOV-0176) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0176' OR dc_customer_id = '0176')
    AND LOWER(business_name) != LOWER('Wosi Wosi Foods Limited');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Wosi Wosi Foods Limited')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Wosi Wosi Foods Limited', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0176',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Wosi Wosi Foods Limited', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Wosi Wosi Foods Limited', 'MOOV-0176', '0176', '176', 'wasi wasi', 'wasiwasi', 'wosi wosi', 'wosiwosi', '0176']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── My Shadow Ltd (MOOV-0177) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0177' OR dc_customer_id = '0177')
    AND LOWER(business_name) != LOWER('My Shadow Ltd');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('My Shadow Ltd')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'My Shadow Ltd', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0177',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('My Shadow Ltd', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['My Shadow Ltd', 'MOOV-0177', '0177', '177']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── U-Telecom Ltd (MOOV-0178) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0178' OR dc_customer_id = '0178')
    AND LOWER(business_name) != LOWER('U-Telecom Ltd');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('U-Telecom Ltd')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'U-Telecom Ltd', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0178',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('U-Telecom Ltd', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['U-Telecom Ltd', 'MOOV-0178', '0178', '178']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Mala Leather (MOOV-0179) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0179' OR dc_customer_id = '0179')
    AND LOWER(business_name) != LOWER('Mala Leather');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Mala Leather')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Mala Leather', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0179',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Mala Leather', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Mala Leather', 'MOOV-0179', '0179', '179']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── CT Inc (DP1-0003) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'DP1-0003' OR dc_customer_id = '1')
    AND LOWER(business_name) != LOWER('CT Inc');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('CT Inc')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'CT Inc', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'DP1-0003',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('CT Inc', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['CT Inc', 'DP1-0003', '1']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Golf and Baby Limited (MOOV-0180) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0180' OR dc_customer_id = '0180')
    AND LOWER(business_name) != LOWER('Golf and Baby Limited');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Golf and Baby Limited')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Golf and Baby Limited', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0180',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Golf and Baby Limited', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Golf and Baby Limited', 'MOOV-0180', '0180', '180']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── IMEX China Trade Ltd (MOOV-0181) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0181' OR dc_customer_id = '0181')
    AND LOWER(business_name) != LOWER('IMEX China Trade Ltd');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('IMEX China Trade Ltd')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'IMEX China Trade Ltd', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0181',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('IMEX China Trade Ltd', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['IMEX China Trade Ltd', 'MOOV-0181', '0181', '181']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Tanalia Ltd (MOOV-0182) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0182' OR dc_customer_id = '0182')
    AND LOWER(business_name) != LOWER('Tanalia Ltd');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Tanalia Ltd')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Tanalia Ltd', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0182',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Tanalia Ltd', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Tanalia Ltd', 'MOOV-0182', '0182', '182']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Saturn Display Ltd (MOOV-0183) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0183' OR dc_customer_id = '0183')
    AND LOWER(business_name) != LOWER('Saturn Display Ltd');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Saturn Display Ltd')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Saturn Display Ltd', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0183',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Saturn Display Ltd', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Saturn Display Ltd', 'MOOV-0183', '0183', '183']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Fun Stickers Ltd (MOOV-0184) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0184' OR dc_customer_id = '0184')
    AND LOWER(business_name) != LOWER('Fun Stickers Ltd');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Fun Stickers Ltd')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Fun Stickers Ltd', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0184',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Fun Stickers Ltd', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Fun Stickers Ltd', 'MOOV-0184', '0184', '184']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Perex Group Ltd (MOOV-0185) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0185' OR dc_customer_id = '0185')
    AND LOWER(business_name) != LOWER('Perex Group Ltd');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Perex Group Ltd')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Perex Group Ltd', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0185',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Perex Group Ltd', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Perex Group Ltd', 'MOOV-0185', '0185', '185']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── TT Proturf Ltd (MOOV-0186) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0186' OR dc_customer_id = '0186')
    AND LOWER(business_name) != LOWER('TT Proturf Ltd');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('TT Proturf Ltd')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'TT Proturf Ltd', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0186',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('TT Proturf Ltd', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['TT Proturf Ltd', 'MOOV-0186', '0186', '186']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Decorative Gardens Ltd (MOOV-0187) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0187' OR dc_customer_id = '0187')
    AND LOWER(business_name) != LOWER('Decorative Gardens Ltd');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Decorative Gardens Ltd')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Decorative Gardens Ltd', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0187',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Decorative Gardens Ltd', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Decorative Gardens Ltd', 'MOOV-0187', '0187', '187']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Isoclean Ltd (MOOV-0188) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0188' OR dc_customer_id = '0188')
    AND LOWER(business_name) != LOWER('Isoclean Ltd');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Isoclean Ltd')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Isoclean Ltd', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0188',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Isoclean Ltd', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Isoclean Ltd', 'MOOV-0188', '0188', '188']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── C Com (DP1-0054) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'DP1-0054' OR dc_customer_id = '1')
    AND LOWER(business_name) != LOWER('C Com');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('C Com')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'C Com', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'DP1-0054',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('C Com', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['C Com', 'DP1-0054', '1']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Bodri Ltd (MOOV-0189) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0189' OR dc_customer_id = '0189')
    AND LOWER(business_name) != LOWER('Bodri Ltd');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Bodri Ltd')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Bodri Ltd', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0189',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Bodri Ltd', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Bodri Ltd', 'MOOV-0189', '0189', '189']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── 1st Class Uniforms & Workwear Ltd (MOOV-0190) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0190' OR dc_customer_id = '0190')
    AND LOWER(business_name) != LOWER('1st Class Uniforms & Workwear Ltd');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('1st Class Uniforms & Workwear Ltd')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      '1st Class Uniforms & Workwear Ltd', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0190',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('1st Class Uniforms & Workwear Ltd', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['1st Class Uniforms & Workwear Ltd', 'MOOV-0190', '0190', '190']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Carp Junky (MOOV-0191) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0191' OR dc_customer_id = '0191')
    AND LOWER(business_name) != LOWER('Carp Junky');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Carp Junky')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Carp Junky', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0191',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Carp Junky', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Carp Junky', 'MOOV-0191', '0191', '191']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Mackemshop Ltd (MOOV-0192) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0192' OR dc_customer_id = '0192')
    AND LOWER(business_name) != LOWER('Mackemshop Ltd');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Mackemshop Ltd')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Mackemshop Ltd', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0192',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Mackemshop Ltd', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Mackemshop Ltd', 'MOOV-0192', '0192', '192']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Test company CHN (TDP1-0009) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'TDP1-0009' OR dc_customer_id = '1')
    AND LOWER(business_name) != LOWER('Test company CHN');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Test company CHN')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Test company CHN', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'TDP1-0009',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Test company CHN', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Test company CHN', 'TDP1-0009', '1']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── UK Wedding Favours Ltd (MOOV-0193) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0193' OR dc_customer_id = '0193')
    AND LOWER(business_name) != LOWER('UK Wedding Favours Ltd');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('UK Wedding Favours Ltd')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'UK Wedding Favours Ltd', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0193',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('UK Wedding Favours Ltd', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['UK Wedding Favours Ltd', 'MOOV-0193', '0193', '193']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Pure Crimson Design Limited (MOOV-0194) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0194' OR dc_customer_id = '0194')
    AND LOWER(business_name) != LOWER('Pure Crimson Design Limited');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Pure Crimson Design Limited')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Pure Crimson Design Limited', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0194',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Pure Crimson Design Limited', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Pure Crimson Design Limited', 'MOOV-0194', '0194', '194']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── ID Dance school sport & leisure wear limited (MOOV-0195) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0195' OR dc_customer_id = '0195')
    AND LOWER(business_name) != LOWER('ID Dance school sport & leisure wear limited');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('ID Dance school sport & leisure wear limited')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'ID Dance school sport & leisure wear limited', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0195',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('ID Dance school sport & leisure wear limited', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['ID Dance school sport & leisure wear limited', 'MOOV-0195', '0195', '195']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Smilax Ltd (MOOV-0196) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0196' OR dc_customer_id = '0196')
    AND LOWER(business_name) != LOWER('Smilax Ltd');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Smilax Ltd')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Smilax Ltd', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0196',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Smilax Ltd', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Smilax Ltd', 'MOOV-0196', '0196', '196']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Slumba London (MOOV-0197) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0197' OR dc_customer_id = '0197')
    AND LOWER(business_name) != LOWER('Slumba London');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Slumba London')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Slumba London', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0197',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Slumba London', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Slumba London', 'MOOV-0197', '0197', '197']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Amba Hydraulics Ltd (MOOV-0198) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0198' OR dc_customer_id = '0198')
    AND LOWER(business_name) != LOWER('Amba Hydraulics Ltd');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Amba Hydraulics Ltd')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Amba Hydraulics Ltd', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0198',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Amba Hydraulics Ltd', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Amba Hydraulics Ltd', 'MOOV-0198', '0198', '198']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Ayurvedic Nature Care Ltd (MOOV-0199) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0199' OR dc_customer_id = '0199')
    AND LOWER(business_name) != LOWER('Ayurvedic Nature Care Ltd');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Ayurvedic Nature Care Ltd')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Ayurvedic Nature Care Ltd', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0199',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Ayurvedic Nature Care Ltd', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Ayurvedic Nature Care Ltd', 'MOOV-0199', '0199', '199']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Chopra Brothers Intl Group Ltd (MOOV-0200) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0200' OR dc_customer_id = '0200')
    AND LOWER(business_name) != LOWER('Chopra Brothers Intl Group Ltd');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Chopra Brothers Intl Group Ltd')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Chopra Brothers Intl Group Ltd', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0200',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Chopra Brothers Intl Group Ltd', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Chopra Brothers Intl Group Ltd', 'MOOV-0200', '0200', '200']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Sofa Scene Ltd (MOOV-0201) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0201' OR dc_customer_id = '0201')
    AND LOWER(business_name) != LOWER('Sofa Scene Ltd');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Sofa Scene Ltd')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Sofa Scene Ltd', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0201',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Sofa Scene Ltd', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Sofa Scene Ltd', 'MOOV-0201', '0201', '201']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Metal Work Supplies Ltd (MOOV-0202) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0202' OR dc_customer_id = '0202')
    AND LOWER(business_name) != LOWER('Metal Work Supplies Ltd');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Metal Work Supplies Ltd')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Metal Work Supplies Ltd', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0202',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Metal Work Supplies Ltd', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Metal Work Supplies Ltd', 'MOOV-0202', '0202', '202']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Meilleure Decor Ltd (MOOV-0203) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0203' OR dc_customer_id = '0203')
    AND LOWER(business_name) != LOWER('Meilleure Decor Ltd');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Meilleure Decor Ltd')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Meilleure Decor Ltd', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0203',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Meilleure Decor Ltd', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Meilleure Decor Ltd', 'MOOV-0203', '0203', '203']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Taunton Trailers (MOOV-0204) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0204' OR dc_customer_id = '0204')
    AND LOWER(business_name) != LOWER('Taunton Trailers');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Taunton Trailers')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Taunton Trailers', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0204',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Taunton Trailers', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Taunton Trailers', 'MOOV-0204', '0204', '204']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Kitloop (Kitloop) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'Kitloop' )
    AND LOWER(business_name) != LOWER('Kitloop');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Kitloop')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Kitloop', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'Kitloop',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Kitloop', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Kitloop', 'Kitloop']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Frith Holdings Ltd (MOOV-0205) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0205' OR dc_customer_id = '0205')
    AND LOWER(business_name) != LOWER('Frith Holdings Ltd');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Frith Holdings Ltd')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Frith Holdings Ltd', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0205',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Frith Holdings Ltd', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Frith Holdings Ltd', 'MOOV-0205', '0205', '205']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── 24Up Ltd (MOOV-0206) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0206' OR dc_customer_id = '0206')
    AND LOWER(business_name) != LOWER('24Up Ltd');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('24Up Ltd')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      '24Up Ltd', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0206',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('24Up Ltd', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['24Up Ltd', 'MOOV-0206', '0206', '206']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Scarlet Ltd (MOOV-0207) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0207' OR dc_customer_id = '0207')
    AND LOWER(business_name) != LOWER('Scarlet Ltd');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Scarlet Ltd')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Scarlet Ltd', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0207',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Scarlet Ltd', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Scarlet Ltd', 'MOOV-0207', '0207', '207']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── J Adams Ltd (MOOV-0208) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0208' OR dc_customer_id = '0208')
    AND LOWER(business_name) != LOWER('J Adams Ltd');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('J Adams Ltd')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'J Adams Ltd', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0208',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('J Adams Ltd', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['J Adams Ltd', 'MOOV-0208', '0208', '208']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Scarlet Ltd (Scarlet Ltd) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'Scarlet Ltd' )
    AND LOWER(business_name) != LOWER('Scarlet Ltd');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Scarlet Ltd')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Scarlet Ltd', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'Scarlet Ltd',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Scarlet Ltd', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Scarlet Ltd', 'Scarlet Ltd']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Wolf Cycles Limited (MOOV-0209) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0209' OR dc_customer_id = '0209')
    AND LOWER(business_name) != LOWER('Wolf Cycles Limited');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Wolf Cycles Limited')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Wolf Cycles Limited', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0209',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Wolf Cycles Limited', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Wolf Cycles Limited', 'MOOV-0209', '0209', '209']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Hilltop Boarding Kennels and Cat Hotel Ltd (MOOV-0210) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0210' OR dc_customer_id = '0210')
    AND LOWER(business_name) != LOWER('Hilltop Boarding Kennels and Cat Hotel Ltd');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Hilltop Boarding Kennels and Cat Hotel Ltd')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Hilltop Boarding Kennels and Cat Hotel Ltd', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0210',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Hilltop Boarding Kennels and Cat Hotel Ltd', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Hilltop Boarding Kennels and Cat Hotel Ltd', 'MOOV-0210', '0210', '210']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Tam Demo Account (MOOV-0211) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0211' OR dc_customer_id = '0211')
    AND LOWER(business_name) != LOWER('Tam Demo Account');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Tam Demo Account')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Tam Demo Account', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0211',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Tam Demo Account', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Tam Demo Account', 'MOOV-0211', '0211', '211']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Truck Cranes Ltd (MOOV-0212) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0212' OR dc_customer_id = '0212')
    AND LOWER(business_name) != LOWER('Truck Cranes Ltd');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Truck Cranes Ltd')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Truck Cranes Ltd', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0212',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Truck Cranes Ltd', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Truck Cranes Ltd', 'MOOV-0212', '0212', '212']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Simple Camper Vans Limited (MOOV-0213) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0213' OR dc_customer_id = '0213')
    AND LOWER(business_name) != LOWER('Simple Camper Vans Limited');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Simple Camper Vans Limited')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Simple Camper Vans Limited', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0213',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Simple Camper Vans Limited', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Simple Camper Vans Limited', 'MOOV-0213', '0213', '213']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Direct Imaging Supplies Limited (MOOV-0214) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0214' OR dc_customer_id = '0214')
    AND LOWER(business_name) != LOWER('Direct Imaging Supplies Limited');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Direct Imaging Supplies Limited')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Direct Imaging Supplies Limited', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0214',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Direct Imaging Supplies Limited', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Direct Imaging Supplies Limited', 'MOOV-0214', '0214', '214']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Bodies-in-Motion Dancewear (MOOV-0215) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0215' OR dc_customer_id = '0215')
    AND LOWER(business_name) != LOWER('Bodies-in-Motion Dancewear');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Bodies-in-Motion Dancewear')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Bodies-in-Motion Dancewear', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0215',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Bodies-in-Motion Dancewear', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Bodies-in-Motion Dancewear', 'MOOV-0215', '0215', '215']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Marvellous Mushrooms (MOOV-0216) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0216' OR dc_customer_id = '0216')
    AND LOWER(business_name) != LOWER('Marvellous Mushrooms');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Marvellous Mushrooms')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Marvellous Mushrooms', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0216',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Marvellous Mushrooms', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Marvellous Mushrooms', 'MOOV-0216', '0216', '216']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Blaze''s Bistro (MOOV-0217) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0217' OR dc_customer_id = '0217')
    AND LOWER(business_name) != LOWER('Blaze''s Bistro');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Blaze''s Bistro')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Blaze''s Bistro', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0217',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Blaze''s Bistro', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Blaze''s Bistro', 'MOOV-0217', '0217', '217']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Triumph Dorset Ltd (MOOV-0218) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0218' OR dc_customer_id = '0218')
    AND LOWER(business_name) != LOWER('Triumph Dorset Ltd');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Triumph Dorset Ltd')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Triumph Dorset Ltd', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0218',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Triumph Dorset Ltd', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Triumph Dorset Ltd', 'MOOV-0218', '0218', '218']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Cold Case Investigation Unit (MOOV-0219) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0219' OR dc_customer_id = '0219')
    AND LOWER(business_name) != LOWER('Cold Case Investigation Unit');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Cold Case Investigation Unit')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Cold Case Investigation Unit', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0219',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Cold Case Investigation Unit', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Cold Case Investigation Unit', 'MOOV-0219', '0219', '219']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── WPC Supplies Ltd (MOOV-0220) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0220' OR dc_customer_id = '0220')
    AND LOWER(business_name) != LOWER('WPC Supplies Ltd');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('WPC Supplies Ltd')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'WPC Supplies Ltd', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0220',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('WPC Supplies Ltd', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['WPC Supplies Ltd', 'MOOV-0220', '0220', '220']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── IOI Trading Ltd (MOOV-0221) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0221' OR dc_customer_id = '0221')
    AND LOWER(business_name) != LOWER('IOI Trading Ltd');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('IOI Trading Ltd')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'IOI Trading Ltd', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0221',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('IOI Trading Ltd', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['IOI Trading Ltd', 'MOOV-0221', '0221', '221']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Trembling Madness Ltd (MOOV-0222) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0222' OR dc_customer_id = '0222')
    AND LOWER(business_name) != LOWER('Trembling Madness Ltd');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Trembling Madness Ltd')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Trembling Madness Ltd', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0222',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Trembling Madness Ltd', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Trembling Madness Ltd', 'MOOV-0222', '0222', '222']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

  -- ── Ashley House Printing Co Ltd (MOOV-0224) ──
  UPDATE customers 
  SET dc_customer_id = NULL 
  WHERE (dc_customer_id = 'MOOV-0224' OR dc_customer_id = '0224')
    AND LOWER(business_name) != LOWER('Ashley House Printing Co Ltd');

  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(business_name) = LOWER('Ashley House Printing Co Ltd')
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
    INSERT INTO customers (
      business_name, account_number, dc_customer_id, 
      registered_address, postcode, phone_number, primary_email,
      account_status, tier, billing_aliases
    )
    VALUES (
      'Ashley House Printing Co Ltd', 'MOS-' || LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0'), 'MOOV-0224',
      'Registered Address', 'UK', '—', 'billing@' || LOWER(REGEXP_REPLACE('Ashley House Printing Co Ltd', '[^a-zA-Z0-9]', '', 'g')) || '.co.uk',
      'active', 'standard', ARRAY['Ashley House Printing Co Ltd', 'MOOV-0224', '0224', '224']
    )
    ON CONFLICT (account_number) DO NOTHING;
  END IF;

END $$;
