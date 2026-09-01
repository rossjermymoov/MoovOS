-- Migration 327: Synchronise account_number and dc_customer_id on existing customers
-- Strictly updates existing customers. Sets account_number = dc_customer_id = target_id.
-- Zero inserts, leaves existing billing_aliases untouched.

DO $$
DECLARE
  v_cust_id UUID;
BEGIN

  -- ── Developer Testing (1) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Developer Testing'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Developer Testing'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Developer Testing')) || '%'
       OR LOWER('Developer Testing') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = '1' OR account_number = '1')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = '1',
        dc_customer_id = '1',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Cloud 9 Fulfilment (Cloud9) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Cloud 9 Fulfilment'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Cloud 9 Fulfilment'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Cloud 9 Fulfilment')) || '%'
       OR LOWER('Cloud 9 Fulfilment') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'Cloud9' OR account_number = 'Cloud9')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'Cloud9',
        dc_customer_id = 'Cloud9',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── WXM - Greenplant UK Ltd (WXM-0004) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('WXM - Greenplant UK Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('WXM - Greenplant UK Ltd'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('WXM - Greenplant UK Ltd')) || '%'
       OR LOWER('WXM - Greenplant UK Ltd') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'WXM-0004' OR account_number = 'WXM-0004')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'WXM-0004',
        dc_customer_id = 'WXM-0004',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── WXM - Projekt Indigo Studio Ltd (WXM-0005) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('WXM - Projekt Indigo Studio Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('WXM - Projekt Indigo Studio Ltd'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('WXM - Projekt Indigo Studio Ltd')) || '%'
       OR LOWER('WXM - Projekt Indigo Studio Ltd') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'WXM-0005' OR account_number = 'WXM-0005')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'WXM-0005',
        dc_customer_id = 'WXM-0005',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Floship-Returns (FLOSHIP) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Floship-Returns'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Floship-Returns'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Floship-Returns')) || '%'
       OR LOWER('Floship-Returns') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'FLOSHIP' OR account_number = 'FLOSHIP')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'FLOSHIP',
        dc_customer_id = 'FLOSHIP',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Keells (DP1-0201) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Keells'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Keells'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Keells')) || '%'
       OR LOWER('Keells') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'DP1-0201' OR account_number = 'DP1-0201')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'DP1-0201',
        dc_customer_id = 'DP1-0201',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── MoreHustl (HOF-0031) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('MoreHustl'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('MoreHustl'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('MoreHustl')) || '%'
       OR LOWER('MoreHustl') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'HOF-0031' OR account_number = 'HOF-0031')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'HOF-0031',
        dc_customer_id = 'HOF-0031',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Suresh Deepal Herath 12 (Dep2-0006) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Suresh Deepal Herath 12'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Suresh Deepal Herath 12'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Suresh Deepal Herath 12')) || '%'
       OR LOWER('Suresh Deepal Herath 12') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'Dep2-0006' OR account_number = 'Dep2-0006')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'Dep2-0006',
        dc_customer_id = 'Dep2-0006',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── The Chosen Baller LLC (001-0002) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('The Chosen Baller LLC'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('The Chosen Baller LLC'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('The Chosen Baller LLC')) || '%'
       OR LOWER('The Chosen Baller LLC') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = '001-0002' OR account_number = '001-0002')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = '001-0002',
        dc_customer_id = '001-0002',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── SND Electrical (HOF-0054) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('SND Electrical'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('SND Electrical'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('SND Electrical')) || '%'
       OR LOWER('SND Electrical') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'HOF-0054' OR account_number = 'HOF-0054')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'HOF-0054',
        dc_customer_id = 'HOF-0054',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── E & L Trading Ltd (HOF-0055) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('E & L Trading Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('E & L Trading Ltd'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('E & L Trading Ltd')) || '%'
       OR LOWER('E & L Trading Ltd') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'HOF-0055' OR account_number = 'HOF-0055')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'HOF-0055',
        dc_customer_id = 'HOF-0055',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Britalitez Limited (HOF-0056) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Britalitez Limited'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Britalitez Limited'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Britalitez Limited')) || '%'
       OR LOWER('Britalitez Limited') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'HOF-0056' OR account_number = 'HOF-0056')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'HOF-0056',
        dc_customer_id = 'HOF-0056',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Moov Prod Admin two (DD2-0003) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Moov Prod Admin two'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Moov Prod Admin two'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Moov Prod Admin two')) || '%'
       OR LOWER('Moov Prod Admin two') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'DD2-0003' OR account_number = 'DD2-0003')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'DD2-0003',
        dc_customer_id = 'DD2-0003',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Danny Snelson (HOF-0008) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Danny Snelson'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Danny Snelson'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Danny Snelson')) || '%'
       OR LOWER('Danny Snelson') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'HOF-0008' OR account_number = 'HOF-0008')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'HOF-0008',
        dc_customer_id = 'HOF-0008',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Spare and Square (HOF-GONE) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Spare and Square'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Spare and Square'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Spare and Square')) || '%'
       OR LOWER('Spare and Square') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'HOF-GONE' OR account_number = 'HOF-GONE')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'HOF-GONE',
        dc_customer_id = 'HOF-GONE',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Crystal Nails (HOF-0009) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Crystal Nails'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Crystal Nails'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Crystal Nails')) || '%'
       OR LOWER('Crystal Nails') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'HOF-0009' OR account_number = 'HOF-0009')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'HOF-0009',
        dc_customer_id = 'HOF-0009',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Fight Outlet (HOF-0010) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Fight Outlet'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Fight Outlet'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Fight Outlet')) || '%'
       OR LOWER('Fight Outlet') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'HOF-0010' OR account_number = 'HOF-0010')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'HOF-0010',
        dc_customer_id = 'HOF-0010',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Prophecy Cricket Ltd (HOF-0011) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Prophecy Cricket Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Prophecy Cricket Ltd'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Prophecy Cricket Ltd')) || '%'
       OR LOWER('Prophecy Cricket Ltd') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'HOF-0011' OR account_number = 'HOF-0011')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'HOF-0011',
        dc_customer_id = 'HOF-0011',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Seedball Limited (HOF-0012) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Seedball Limited'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Seedball Limited'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Seedball Limited')) || '%'
       OR LOWER('Seedball Limited') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'HOF-0012' OR account_number = 'HOF-0012')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'HOF-0012',
        dc_customer_id = 'HOF-0012',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Saloos Ltd (MOOV-0002) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Saloos Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Saloos Ltd'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Saloos Ltd')) || '%'
       OR LOWER('Saloos Ltd') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0002' OR account_number = 'MOOV-0002')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0002',
        dc_customer_id = 'MOOV-0002',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── MP Homewares Ltd (MOOV-0003) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('MP Homewares Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('MP Homewares Ltd'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('MP Homewares Ltd')) || '%'
       OR LOWER('MP Homewares Ltd') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0003' OR account_number = 'MOOV-0003')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0003',
        dc_customer_id = 'MOOV-0003',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── I Luv Designer (MOOV-0004) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('I Luv Designer'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('I Luv Designer'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('I Luv Designer')) || '%'
       OR LOWER('I Luv Designer') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0004' OR account_number = 'MOOV-0004')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0004',
        dc_customer_id = 'MOOV-0004',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── 3 Devices Ltd (MOOV-0005) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('3 Devices Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('3 Devices Ltd'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('3 Devices Ltd')) || '%'
       OR LOWER('3 Devices Ltd') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0005' OR account_number = 'MOOV-0005')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0005',
        dc_customer_id = 'MOOV-0005',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── EF TEST CUSTOMER QA EIGHT (DF1-0004) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('EF TEST CUSTOMER QA EIGHT'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('EF TEST CUSTOMER QA EIGHT'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('EF TEST CUSTOMER QA EIGHT')) || '%'
       OR LOWER('EF TEST CUSTOMER QA EIGHT') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'DF1-0004' OR account_number = 'DF1-0004')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'DF1-0004',
        dc_customer_id = 'DF1-0004',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Yayo Familia Ltd (MOOV-0006) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Yayo Familia Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Yayo Familia Ltd'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Yayo Familia Ltd')) || '%'
       OR LOWER('Yayo Familia Ltd') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0006' OR account_number = 'MOOV-0006')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0006',
        dc_customer_id = 'MOOV-0006',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Capatex Limited (MOOV-0007) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Capatex Limited'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Capatex Limited'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Capatex Limited')) || '%'
       OR LOWER('Capatex Limited') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0007' OR account_number = 'MOOV-0007')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0007',
        dc_customer_id = 'MOOV-0007',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Trident Pumps (MOOV-0008) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Trident Pumps'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Trident Pumps'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Trident Pumps')) || '%'
       OR LOWER('Trident Pumps') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0008' OR account_number = 'MOOV-0008')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0008',
        dc_customer_id = 'MOOV-0008',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Tribal Society (MOOV-0009) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Tribal Society'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Tribal Society'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Tribal Society')) || '%'
       OR LOWER('Tribal Society') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0009' OR account_number = 'MOOV-0009')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0009',
        dc_customer_id = 'MOOV-0009',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Millvill Industrial Supplies Ltd (MOOV-0010) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Millvill Industrial Supplies Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Millvill Industrial Supplies Ltd'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Millvill Industrial Supplies Ltd')) || '%'
       OR LOWER('Millvill Industrial Supplies Ltd') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0010' OR account_number = 'MOOV-0010')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0010',
        dc_customer_id = 'MOOV-0010',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── B2B Workwear & Janitorial Ltd (MOOV-0011) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('B2B Workwear & Janitorial Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('B2B Workwear & Janitorial Ltd'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('B2B Workwear & Janitorial Ltd')) || '%'
       OR LOWER('B2B Workwear & Janitorial Ltd') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0011' OR account_number = 'MOOV-0011')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0011',
        dc_customer_id = 'MOOV-0011',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Britalitez Ltd (MOOV-0012) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Britalitez Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Britalitez Ltd'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Britalitez Ltd')) || '%'
       OR LOWER('Britalitez Ltd') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0012' OR account_number = 'MOOV-0012')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0012',
        dc_customer_id = 'MOOV-0012',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Code Nine UK Ltd (MOOV-0013) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Code Nine UK Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Code Nine UK Ltd'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Code Nine UK Ltd')) || '%'
       OR LOWER('Code Nine UK Ltd') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0013' OR account_number = 'MOOV-0013')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0013',
        dc_customer_id = 'MOOV-0013',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Edmunson Electrical Leeds (MOOV-0014) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Edmunson Electrical Leeds'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Edmunson Electrical Leeds'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Edmunson Electrical Leeds')) || '%'
       OR LOWER('Edmunson Electrical Leeds') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0014' OR account_number = 'MOOV-0014')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0014',
        dc_customer_id = 'MOOV-0014',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Green Footprint Services Ltd (MOOV-0015) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Green Footprint Services Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Green Footprint Services Ltd'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Green Footprint Services Ltd')) || '%'
       OR LOWER('Green Footprint Services Ltd') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0015' OR account_number = 'MOOV-0015')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0015',
        dc_customer_id = 'MOOV-0015',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── EF QA CUSTOMER HS (DP1-0011) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('EF QA CUSTOMER HS'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('EF QA CUSTOMER HS'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('EF QA CUSTOMER HS')) || '%'
       OR LOWER('EF QA CUSTOMER HS') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'DP1-0011' OR account_number = 'DP1-0011')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'DP1-0011',
        dc_customer_id = 'DP1-0011',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── hjko (1233-0001) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('hjko'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('hjko'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('hjko')) || '%'
       OR LOWER('hjko') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = '1233-0001' OR account_number = '1233-0001')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = '1233-0001',
        dc_customer_id = '1233-0001',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── qwerty (DF1-0007) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('qwerty'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('qwerty'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('qwerty')) || '%'
       OR LOWER('qwerty') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'DF1-0007' OR account_number = 'DF1-0007')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'DF1-0007',
        dc_customer_id = 'DF1-0007',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Norfolk Saw Services (MOOV-0016) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Norfolk Saw Services'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Norfolk Saw Services'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Norfolk Saw Services')) || '%'
       OR LOWER('Norfolk Saw Services') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0016' OR account_number = 'MOOV-0016')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0016',
        dc_customer_id = 'MOOV-0016',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Rilco Electrical Supplies (MOOV-0017) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Rilco Electrical Supplies'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Rilco Electrical Supplies'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Rilco Electrical Supplies')) || '%'
       OR LOWER('Rilco Electrical Supplies') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0017' OR account_number = 'MOOV-0017')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0017',
        dc_customer_id = 'MOOV-0017',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── asdfg (DF1-0008) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('asdfg'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('asdfg'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('asdfg')) || '%'
       OR LOWER('asdfg') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'DF1-0008' OR account_number = 'DF1-0008')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'DF1-0008',
        dc_customer_id = 'DF1-0008',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Passion Accessories Ltd (MOOV-0018) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Passion Accessories Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Passion Accessories Ltd'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Passion Accessories Ltd')) || '%'
       OR LOWER('Passion Accessories Ltd') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0018' OR account_number = 'MOOV-0018')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0018',
        dc_customer_id = 'MOOV-0018',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Spare and Square Ltd (MOOV-0019) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Spare and Square Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Spare and Square Ltd'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Spare and Square Ltd')) || '%'
       OR LOWER('Spare and Square Ltd') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0019' OR account_number = 'MOOV-0019')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0019',
        dc_customer_id = 'MOOV-0019',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── nnmm (DF1-0009) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('nnmm'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('nnmm'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('nnmm')) || '%'
       OR LOWER('nnmm') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'DF1-0009' OR account_number = 'DF1-0009')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'DF1-0009',
        dc_customer_id = 'DF1-0009',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── check (1233-0002) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('check'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('check'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('check')) || '%'
       OR LOWER('check') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = '1233-0002' OR account_number = '1233-0002')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = '1233-0002',
        dc_customer_id = '1233-0002',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── SND ELECTRICAL WHOLESALERS (UK) LTD (MOOV-0020) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('SND ELECTRICAL WHOLESALERS (UK) LTD'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('SND ELECTRICAL WHOLESALERS (UK) LTD'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('SND ELECTRICAL WHOLESALERS (UK) LTD')) || '%'
       OR LOWER('SND ELECTRICAL WHOLESALERS (UK) LTD') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0020' OR account_number = 'MOOV-0020')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0020',
        dc_customer_id = 'MOOV-0020',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Efutures (DP1-0014) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Efutures'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Efutures'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Efutures')) || '%'
       OR LOWER('Efutures') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'DP1-0014' OR account_number = 'DP1-0014')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'DP1-0014',
        dc_customer_id = 'DP1-0014',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Lifemax Limited (MOOV-0021) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Lifemax Limited'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Lifemax Limited'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Lifemax Limited')) || '%'
       OR LOWER('Lifemax Limited') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0021' OR account_number = 'MOOV-0021')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0021',
        dc_customer_id = 'MOOV-0021',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── IFS (DD2-0005) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('IFS'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('IFS'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('IFS')) || '%'
       OR LOWER('IFS') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'DD2-0005' OR account_number = 'DD2-0005')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'DD2-0005',
        dc_customer_id = 'DD2-0005',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── M and J Brothers Ltd (MOOV-0022) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('M and J Brothers Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('M and J Brothers Ltd'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('M and J Brothers Ltd')) || '%'
       OR LOWER('M and J Brothers Ltd') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0022' OR account_number = 'MOOV-0022')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0022',
        dc_customer_id = 'MOOV-0022',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Beacons and Lightbars (MOOV-0023) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Beacons and Lightbars'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Beacons and Lightbars'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Beacons and Lightbars')) || '%'
       OR LOWER('Beacons and Lightbars') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0023' OR account_number = 'MOOV-0023')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0023',
        dc_customer_id = 'MOOV-0023',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── DDUP International Ltd (MOOV-0024) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('DDUP International Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('DDUP International Ltd'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('DDUP International Ltd')) || '%'
       OR LOWER('DDUP International Ltd') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0024' OR account_number = 'MOOV-0024')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0024',
        dc_customer_id = 'MOOV-0024',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Granola Kitchen Ltd (MOOV-0025) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Granola Kitchen Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Granola Kitchen Ltd'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Granola Kitchen Ltd')) || '%'
       OR LOWER('Granola Kitchen Ltd') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0025' OR account_number = 'MOOV-0025')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0025',
        dc_customer_id = 'MOOV-0025',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Pet & Grooming Supplies Ltd (MOOV-0026) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Pet & Grooming Supplies Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Pet & Grooming Supplies Ltd'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Pet & Grooming Supplies Ltd')) || '%'
       OR LOWER('Pet & Grooming Supplies Ltd') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0026' OR account_number = 'MOOV-0026')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0026',
        dc_customer_id = 'MOOV-0026',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── SRR3 (DF1-0010) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('SRR3'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('SRR3'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('SRR3')) || '%'
       OR LOWER('SRR3') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'DF1-0010' OR account_number = 'DF1-0010')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'DF1-0010',
        dc_customer_id = 'DF1-0010',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Uni4mers (Uni4mers) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Uni4mers'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Uni4mers'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Uni4mers')) || '%'
       OR LOWER('Uni4mers') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'Uni4mers' OR account_number = 'Uni4mers')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'Uni4mers',
        dc_customer_id = 'Uni4mers',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Efutures4 (DP1-0016) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Efutures4'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Efutures4'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Efutures4')) || '%'
       OR LOWER('Efutures4') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'DP1-0016' OR account_number = 'DP1-0016')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'DP1-0016',
        dc_customer_id = 'DP1-0016',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── EFtures5 (DP1-0017) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('EFtures5'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('EFtures5'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('EFtures5')) || '%'
       OR LOWER('EFtures5') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'DP1-0017' OR account_number = 'DP1-0017')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'DP1-0017',
        dc_customer_id = 'DP1-0017',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Sharkeye Wheel Aligners UK Ltd (MOOV-0027) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Sharkeye Wheel Aligners UK Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Sharkeye Wheel Aligners UK Ltd'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Sharkeye Wheel Aligners UK Ltd')) || '%'
       OR LOWER('Sharkeye Wheel Aligners UK Ltd') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0027' OR account_number = 'MOOV-0027')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0027',
        dc_customer_id = 'MOOV-0027',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Efutures5 (DDJ1-0001) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Efutures5'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Efutures5'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Efutures5')) || '%'
       OR LOWER('Efutures5') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'DDJ1-0001' OR account_number = 'DDJ1-0001')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'DDJ1-0001',
        dc_customer_id = 'DDJ1-0001',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── The Hanger Store (MOOV-0028) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('The Hanger Store'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('The Hanger Store'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('The Hanger Store')) || '%'
       OR LOWER('The Hanger Store') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0028' OR account_number = 'MOOV-0028')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0028',
        dc_customer_id = 'MOOV-0028',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── How High Brands (MOOV-0029) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('How High Brands'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('How High Brands'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('How High Brands')) || '%'
       OR LOWER('How High Brands') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0029' OR account_number = 'MOOV-0029')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0029',
        dc_customer_id = 'MOOV-0029',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── SQA (DP1-0019) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('SQA'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('SQA'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('SQA')) || '%'
       OR LOWER('SQA') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'DP1-0019' OR account_number = 'DP1-0019')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'DP1-0019',
        dc_customer_id = 'DP1-0019',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── SINGER (DP1-0021) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('SINGER'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('SINGER'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('SINGER')) || '%'
       OR LOWER('SINGER') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'DP1-0021' OR account_number = 'DP1-0021')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'DP1-0021',
        dc_customer_id = 'DP1-0021',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Greenplant UK Ltd (MOOV-0030) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Greenplant UK Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Greenplant UK Ltd'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Greenplant UK Ltd')) || '%'
       OR LOWER('Greenplant UK Ltd') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0030' OR account_number = 'MOOV-0030')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0030',
        dc_customer_id = 'MOOV-0030',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Assetee (DP1-0024) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Assetee'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Assetee'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Assetee')) || '%'
       OR LOWER('Assetee') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'DP1-0024' OR account_number = 'DP1-0024')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'DP1-0024',
        dc_customer_id = 'DP1-0024',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Mobberley Cakes Ltd (MOOV-0031) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Mobberley Cakes Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Mobberley Cakes Ltd'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Mobberley Cakes Ltd')) || '%'
       OR LOWER('Mobberley Cakes Ltd') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0031' OR account_number = 'MOOV-0031')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0031',
        dc_customer_id = 'MOOV-0031',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Ecom Group UK Limited (MOOV-0032) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Ecom Group UK Limited'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Ecom Group UK Limited'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Ecom Group UK Limited')) || '%'
       OR LOWER('Ecom Group UK Limited') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0032' OR account_number = 'MOOV-0032')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0032',
        dc_customer_id = 'MOOV-0032',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Heaven Scent Incense Ltd (MOOV-0033) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Heaven Scent Incense Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Heaven Scent Incense Ltd'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Heaven Scent Incense Ltd')) || '%'
       OR LOWER('Heaven Scent Incense Ltd') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0033' OR account_number = 'MOOV-0033')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0033',
        dc_customer_id = 'MOOV-0033',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── EFUTURES6 (DP1-0025) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('EFUTURES6'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('EFUTURES6'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('EFUTURES6')) || '%'
       OR LOWER('EFUTURES6') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'DP1-0025' OR account_number = 'DP1-0025')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'DP1-0025',
        dc_customer_id = 'DP1-0025',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── AJP1 (AJP1) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('AJP1'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('AJP1'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('AJP1')) || '%'
       OR LOWER('AJP1') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'AJP1' OR account_number = 'AJP1')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'AJP1',
        dc_customer_id = 'AJP1',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── AJP2 (AJP2) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('AJP2'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('AJP2'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('AJP2')) || '%'
       OR LOWER('AJP2') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'AJP2' OR account_number = 'AJP2')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'AJP2',
        dc_customer_id = 'AJP2',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── AJP3 (AJP3) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('AJP3'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('AJP3'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('AJP3')) || '%'
       OR LOWER('AJP3') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'AJP3' OR account_number = 'AJP3')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'AJP3',
        dc_customer_id = 'AJP3',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── AJP4 (AJP4) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('AJP4'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('AJP4'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('AJP4')) || '%'
       OR LOWER('AJP4') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'AJP4' OR account_number = 'AJP4')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'AJP4',
        dc_customer_id = 'AJP4',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── AJP5 (AJP5) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('AJP5'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('AJP5'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('AJP5')) || '%'
       OR LOWER('AJP5') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'AJP5' OR account_number = 'AJP5')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'AJP5',
        dc_customer_id = 'AJP5',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Info Technology Supply (MOOV-0034) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Info Technology Supply'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Info Technology Supply'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Info Technology Supply')) || '%'
       OR LOWER('Info Technology Supply') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0034' OR account_number = 'MOOV-0034')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0034',
        dc_customer_id = 'MOOV-0034',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── 99X (DP1-0027) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('99X'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('99X'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('99X')) || '%'
       OR LOWER('99X') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'DP1-0027' OR account_number = 'DP1-0027')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'DP1-0027',
        dc_customer_id = 'DP1-0027',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Aegean Sea Ltd (MOOV-0035) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Aegean Sea Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Aegean Sea Ltd'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Aegean Sea Ltd')) || '%'
       OR LOWER('Aegean Sea Ltd') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0035' OR account_number = 'MOOV-0035')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0035',
        dc_customer_id = 'MOOV-0035',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── LB Finance (DP1-0028) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('LB Finance'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('LB Finance'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('LB Finance')) || '%'
       OR LOWER('LB Finance') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'DP1-0028' OR account_number = 'DP1-0028')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'DP1-0028',
        dc_customer_id = 'DP1-0028',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── DM AGENCY AND DISTRIBUTION (MOOV-0036) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('DM AGENCY AND DISTRIBUTION'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('DM AGENCY AND DISTRIBUTION'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('DM AGENCY AND DISTRIBUTION')) || '%'
       OR LOWER('DM AGENCY AND DISTRIBUTION') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0036' OR account_number = 'MOOV-0036')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0036',
        dc_customer_id = 'MOOV-0036',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── DDPL (DDPL) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('DDPL'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('DDPL'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('DDPL')) || '%'
       OR LOWER('DDPL') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'DDPL' OR account_number = 'DDPL')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'DDPL',
        dc_customer_id = 'DDPL',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Aglory MERCHANT ENTERPRISES LIMITED (Aglory MERCHANT ENTERPRISES LIMITED) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Aglory MERCHANT ENTERPRISES LIMITED'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Aglory MERCHANT ENTERPRISES LIMITED'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Aglory MERCHANT ENTERPRISES LIMITED')) || '%'
       OR LOWER('Aglory MERCHANT ENTERPRISES LIMITED') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'Aglory MERCHANT ENTERPRISES LIMITED' OR account_number = 'Aglory MERCHANT ENTERPRISES LIMITED')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'Aglory MERCHANT ENTERPRISES LIMITED',
        dc_customer_id = 'Aglory MERCHANT ENTERPRISES LIMITED',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── HCL (DP1-0029) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('HCL'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('HCL'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('HCL')) || '%'
       OR LOWER('HCL') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'DP1-0029' OR account_number = 'DP1-0029')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'DP1-0029',
        dc_customer_id = 'DP1-0029',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── NEXT (DP1-0030) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('NEXT'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('NEXT'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('NEXT')) || '%'
       OR LOWER('NEXT') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'DP1-0030' OR account_number = 'DP1-0030')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'DP1-0030',
        dc_customer_id = 'DP1-0030',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── E Square (E Square) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('E Square'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('E Square'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('E Square')) || '%'
       OR LOWER('E Square') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'E Square' OR account_number = 'E Square')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'E Square',
        dc_customer_id = 'E Square',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Natural Spa Supplies Ltd (MOOV-0037) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Natural Spa Supplies Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Natural Spa Supplies Ltd'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Natural Spa Supplies Ltd')) || '%'
       OR LOWER('Natural Spa Supplies Ltd') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0037' OR account_number = 'MOOV-0037')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0037',
        dc_customer_id = 'MOOV-0037',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── JOY ASIAN FOOD & GROCERY LIMITED (MOOV-0038) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('JOY ASIAN FOOD & GROCERY LIMITED'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('JOY ASIAN FOOD & GROCERY LIMITED'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('JOY ASIAN FOOD & GROCERY LIMITED')) || '%'
       OR LOWER('JOY ASIAN FOOD & GROCERY LIMITED') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0038' OR account_number = 'MOOV-0038')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0038',
        dc_customer_id = 'MOOV-0038',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Bakers Street Limited (MOOV-0039) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Bakers Street Limited'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Bakers Street Limited'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Bakers Street Limited')) || '%'
       OR LOWER('Bakers Street Limited') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0039' OR account_number = 'MOOV-0039')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0039',
        dc_customer_id = 'MOOV-0039',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── 8ack (8ack) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('8ack'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('8ack'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('8ack')) || '%'
       OR LOWER('8ack') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = '8ack' OR account_number = '8ack')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = '8ack',
        dc_customer_id = '8ack',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Jane Scott Ceramics (MOOV-0040) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Jane Scott Ceramics'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Jane Scott Ceramics'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Jane Scott Ceramics')) || '%'
       OR LOWER('Jane Scott Ceramics') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0040' OR account_number = 'MOOV-0040')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0040',
        dc_customer_id = 'MOOV-0040',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── SCR DISTRIBUTION (MOOV-0041) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('SCR DISTRIBUTION'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('SCR DISTRIBUTION'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('SCR DISTRIBUTION')) || '%'
       OR LOWER('SCR DISTRIBUTION') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0041' OR account_number = 'MOOV-0041')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0041',
        dc_customer_id = 'MOOV-0041',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Megway (Megway Parcels) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Megway'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Megway'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Megway')) || '%'
       OR LOWER('Megway') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'Megway Parcels' OR account_number = 'Megway Parcels')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'Megway Parcels',
        dc_customer_id = 'Megway Parcels',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Lather Up (MOOV-0042) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Lather Up'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Lather Up'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Lather Up')) || '%'
       OR LOWER('Lather Up') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0042' OR account_number = 'MOOV-0042')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0042',
        dc_customer_id = 'MOOV-0042',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Impoxer LTD T/A Makrom (MOOV-0043) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Impoxer LTD T/A Makrom'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Impoxer LTD T/A Makrom'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Impoxer LTD T/A Makrom')) || '%'
       OR LOWER('Impoxer LTD T/A Makrom') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0043' OR account_number = 'MOOV-0043')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0043',
        dc_customer_id = 'MOOV-0043',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Vertura Ltd (MOOV-0045) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Vertura Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Vertura Ltd'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Vertura Ltd')) || '%'
       OR LOWER('Vertura Ltd') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0045' OR account_number = 'MOOV-0045')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0045',
        dc_customer_id = 'MOOV-0045',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Roar Gill Ltd (MOOV-0046) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Roar Gill Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Roar Gill Ltd'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Roar Gill Ltd')) || '%'
       OR LOWER('Roar Gill Ltd') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0046' OR account_number = 'MOOV-0046')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0046',
        dc_customer_id = 'MOOV-0046',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Oriental Mart (Oriental Mart) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Oriental Mart'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Oriental Mart'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Oriental Mart')) || '%'
       OR LOWER('Oriental Mart') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'Oriental Mart' OR account_number = 'Oriental Mart')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'Oriental Mart',
        dc_customer_id = 'Oriental Mart',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Reevo (MOOV-0047) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Reevo'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Reevo'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Reevo')) || '%'
       OR LOWER('Reevo') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0047' OR account_number = 'MOOV-0047')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0047',
        dc_customer_id = 'MOOV-0047',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Lace and Favour Ltd (MOOV-0048) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Lace and Favour Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Lace and Favour Ltd'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Lace and Favour Ltd')) || '%'
       OR LOWER('Lace and Favour Ltd') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0048' OR account_number = 'MOOV-0048')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0048',
        dc_customer_id = 'MOOV-0048',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Andersen EV (Andersen EV) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Andersen EV'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Andersen EV'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Andersen EV')) || '%'
       OR LOWER('Andersen EV') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'Andersen EV' OR account_number = 'Andersen EV')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'Andersen EV',
        dc_customer_id = 'Andersen EV',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Henry And Tosh Limited (MOOV-0050) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Henry And Tosh Limited'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Henry And Tosh Limited'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Henry And Tosh Limited')) || '%'
       OR LOWER('Henry And Tosh Limited') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0050' OR account_number = 'MOOV-0050')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0050',
        dc_customer_id = 'MOOV-0050',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── March Laboratories Ltd / Ace Canine Healthcare (MOOV-0051) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('March Laboratories Ltd / Ace Canine Healthcare'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('March Laboratories Ltd / Ace Canine Healthcare'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('March Laboratories Ltd / Ace Canine Healthcare')) || '%'
       OR LOWER('March Laboratories Ltd / Ace Canine Healthcare') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0051' OR account_number = 'MOOV-0051')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0051',
        dc_customer_id = 'MOOV-0051',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── May2024 (DF1-0012) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('May2024'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('May2024'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('May2024')) || '%'
       OR LOWER('May2024') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'DF1-0012' OR account_number = 'DF1-0012')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'DF1-0012',
        dc_customer_id = 'DF1-0012',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── test 2024 (DF1-0013) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('test 2024'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('test 2024'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('test 2024')) || '%'
       OR LOWER('test 2024') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'DF1-0013' OR account_number = 'DF1-0013')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'DF1-0013',
        dc_customer_id = 'DF1-0013',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── testii (DF1-0014) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('testii'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('testii'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('testii')) || '%'
       OR LOWER('testii') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'DF1-0014' OR account_number = 'DF1-0014')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'DF1-0014',
        dc_customer_id = 'DF1-0014',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Abans Company (DQA1-0001) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Abans Company'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Abans Company'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Abans Company')) || '%'
       OR LOWER('Abans Company') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'DQA1-0001' OR account_number = 'DQA1-0001')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'DQA1-0001',
        dc_customer_id = 'DQA1-0001',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Neil Test (MOOV-0053) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Neil Test'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Neil Test'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Neil Test')) || '%'
       OR LOWER('Neil Test') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0053' OR account_number = 'MOOV-0053')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0053',
        dc_customer_id = 'MOOV-0053',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Moov Parcel (MOOV-0054) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Moov Parcel'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Moov Parcel'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Moov Parcel')) || '%'
       OR LOWER('Moov Parcel') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0054' OR account_number = 'MOOV-0054')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0054',
        dc_customer_id = 'MOOV-0054',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Ultra Soft Water Softeners Ltd (MOOV-0056) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Ultra Soft Water Softeners Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Ultra Soft Water Softeners Ltd'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Ultra Soft Water Softeners Ltd')) || '%'
       OR LOWER('Ultra Soft Water Softeners Ltd') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0056' OR account_number = 'MOOV-0056')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0056',
        dc_customer_id = 'MOOV-0056',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── UK Optics Ltd (MOOV-0057) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('UK Optics Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('UK Optics Ltd'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('UK Optics Ltd')) || '%'
       OR LOWER('UK Optics Ltd') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0057' OR account_number = 'MOOV-0057')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0057',
        dc_customer_id = 'MOOV-0057',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── CLIPHER LTD (MOOV-0058) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('CLIPHER LTD'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('CLIPHER LTD'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('CLIPHER LTD')) || '%'
       OR LOWER('CLIPHER LTD') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0058' OR account_number = 'MOOV-0058')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0058',
        dc_customer_id = 'MOOV-0058',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Damro (DF1-0015) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Damro'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Damro'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Damro')) || '%'
       OR LOWER('Damro') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'DF1-0015' OR account_number = 'DF1-0015')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'DF1-0015',
        dc_customer_id = 'DF1-0015',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Teleseen (DP1-0034) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Teleseen'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Teleseen'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Teleseen')) || '%'
       OR LOWER('Teleseen') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'DP1-0034' OR account_number = 'DP1-0034')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'DP1-0034',
        dc_customer_id = 'DP1-0034',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Live Quote Testing (LQT) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Live Quote Testing'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Live Quote Testing'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Live Quote Testing')) || '%'
       OR LOWER('Live Quote Testing') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'LQT' OR account_number = 'LQT')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'LQT',
        dc_customer_id = 'LQT',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── P&S Products & Refreshening Ltd (MOOV-0059) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('P&S Products & Refreshening Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('P&S Products & Refreshening Ltd'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('P&S Products & Refreshening Ltd')) || '%'
       OR LOWER('P&S Products & Refreshening Ltd') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0059' OR account_number = 'MOOV-0059')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0059',
        dc_customer_id = 'MOOV-0059',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── HOME AND HAVEN LIMITED (MOOV-0060) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('HOME AND HAVEN LIMITED'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('HOME AND HAVEN LIMITED'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('HOME AND HAVEN LIMITED')) || '%'
       OR LOWER('HOME AND HAVEN LIMITED') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0060' OR account_number = 'MOOV-0060')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0060',
        dc_customer_id = 'MOOV-0060',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── 2024 (DP1-0037) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('2024'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('2024'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('2024')) || '%'
       OR LOWER('2024') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'DP1-0037' OR account_number = 'DP1-0037')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'DP1-0037',
        dc_customer_id = 'DP1-0037',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Jetstar Airways (DP1-0038) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Jetstar Airways'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Jetstar Airways'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Jetstar Airways')) || '%'
       OR LOWER('Jetstar Airways') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'DP1-0038' OR account_number = 'DP1-0038')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'DP1-0038',
        dc_customer_id = 'DP1-0038',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Rifai UK Ltd (MOOV-0061) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Rifai UK Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Rifai UK Ltd'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Rifai UK Ltd')) || '%'
       OR LOWER('Rifai UK Ltd') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0061' OR account_number = 'MOOV-0061')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0061',
        dc_customer_id = 'MOOV-0061',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Giga Distributors (MOOV-0062) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Giga Distributors'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Giga Distributors'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Giga Distributors')) || '%'
       OR LOWER('Giga Distributors') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0062' OR account_number = 'MOOV-0062')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0062',
        dc_customer_id = 'MOOV-0062',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── TKS NATURALS LTD (MOOV-0063) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('TKS NATURALS LTD'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('TKS NATURALS LTD'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('TKS NATURALS LTD')) || '%'
       OR LOWER('TKS NATURALS LTD') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0063' OR account_number = 'MOOV-0063')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0063',
        dc_customer_id = 'MOOV-0063',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Mini La Mode (MOOV-0064) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Mini La Mode'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Mini La Mode'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Mini La Mode')) || '%'
       OR LOWER('Mini La Mode') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0064' OR account_number = 'MOOV-0064')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0064',
        dc_customer_id = 'MOOV-0064',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── TCS Worldwide (TCS) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('TCS Worldwide'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('TCS Worldwide'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('TCS Worldwide')) || '%'
       OR LOWER('TCS Worldwide') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'TCS' OR account_number = 'TCS')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'TCS',
        dc_customer_id = 'TCS',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── ERTECH LTD (MOOV-0066) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('ERTECH LTD'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('ERTECH LTD'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('ERTECH LTD')) || '%'
       OR LOWER('ERTECH LTD') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0066' OR account_number = 'MOOV-0066')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0066',
        dc_customer_id = 'MOOV-0066',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── D S Engineering (MOOV-0067) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('D S Engineering'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('D S Engineering'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('D S Engineering')) || '%'
       OR LOWER('D S Engineering') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0067' OR account_number = 'MOOV-0067')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0067',
        dc_customer_id = 'MOOV-0067',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── kol (1233-0003) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('kol'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('kol'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('kol')) || '%'
       OR LOWER('kol') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = '1233-0003' OR account_number = '1233-0003')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = '1233-0003',
        dc_customer_id = '1233-0003',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Hairways (Hair & Beauty) Ltd (MOOV-0068) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Hairways (Hair & Beauty) Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Hairways (Hair & Beauty) Ltd'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Hairways (Hair & Beauty) Ltd')) || '%'
       OR LOWER('Hairways (Hair & Beauty) Ltd') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0068' OR account_number = 'MOOV-0068')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0068',
        dc_customer_id = 'MOOV-0068',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Soghaat Gifts & Fragrances Ltd. (MOOV-0069) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Soghaat Gifts & Fragrances Ltd.'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Soghaat Gifts & Fragrances Ltd.'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Soghaat Gifts & Fragrances Ltd.')) || '%'
       OR LOWER('Soghaat Gifts & Fragrances Ltd.') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0069' OR account_number = 'MOOV-0069')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0069',
        dc_customer_id = 'MOOV-0069',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Lampfix (MOOV-0070) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Lampfix'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Lampfix'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Lampfix')) || '%'
       OR LOWER('Lampfix') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0070' OR account_number = 'MOOV-0070')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0070',
        dc_customer_id = 'MOOV-0070',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Bentley Photographic (MOOV-0071) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Bentley Photographic'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Bentley Photographic'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Bentley Photographic')) || '%'
       OR LOWER('Bentley Photographic') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0071' OR account_number = 'MOOV-0071')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0071',
        dc_customer_id = 'MOOV-0071',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Creative Solution (DQA1-0005) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Creative Solution'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Creative Solution'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Creative Solution')) || '%'
       OR LOWER('Creative Solution') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'DQA1-0005' OR account_number = 'DQA1-0005')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'DQA1-0005',
        dc_customer_id = 'DQA1-0005',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Gapstar (DP1-0043) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Gapstar'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Gapstar'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Gapstar')) || '%'
       OR LOWER('Gapstar') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'DP1-0043' OR account_number = 'DP1-0043')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'DP1-0043',
        dc_customer_id = 'DP1-0043',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── TestCompany11 (DDK1-0002) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('TestCompany11'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('TestCompany11'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('TestCompany11')) || '%'
       OR LOWER('TestCompany11') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'DDK1-0002' OR account_number = 'DDK1-0002')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'DDK1-0002',
        dc_customer_id = 'DDK1-0002',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Virtusa (DQA1-0007) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Virtusa'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Virtusa'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Virtusa')) || '%'
       OR LOWER('Virtusa') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'DQA1-0007' OR account_number = 'DQA1-0007')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'DQA1-0007',
        dc_customer_id = 'DQA1-0007',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Toyota (DQA1-0009) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Toyota'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Toyota'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Toyota')) || '%'
       OR LOWER('Toyota') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'DQA1-0009' OR account_number = 'DQA1-0009')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'DQA1-0009',
        dc_customer_id = 'DQA1-0009',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Brandix (DQA1-0011) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Brandix'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Brandix'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Brandix')) || '%'
       OR LOWER('Brandix') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'DQA1-0011' OR account_number = 'DQA1-0011')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'DQA1-0011',
        dc_customer_id = 'DQA1-0011',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Softlogic (DQA1-0012) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Softlogic'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Softlogic'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Softlogic')) || '%'
       OR LOWER('Softlogic') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'DQA1-0012' OR account_number = 'DQA1-0012')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'DQA1-0012',
        dc_customer_id = 'DQA1-0012',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Daraz (DQA1-0013) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Daraz'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Daraz'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Daraz')) || '%'
       OR LOWER('Daraz') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'DQA1-0013' OR account_number = 'DQA1-0013')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'DQA1-0013',
        dc_customer_id = 'DQA1-0013',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Impact Particles (MOOV-0072) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Impact Particles'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Impact Particles'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Impact Particles')) || '%'
       OR LOWER('Impact Particles') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0072' OR account_number = 'MOOV-0072')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0072',
        dc_customer_id = 'MOOV-0072',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Garden Greatness LTD (MOOV-0073) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Garden Greatness LTD'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Garden Greatness LTD'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Garden Greatness LTD')) || '%'
       OR LOWER('Garden Greatness LTD') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0073' OR account_number = 'MOOV-0073')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0073',
        dc_customer_id = 'MOOV-0073',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Major Brushes Ltd (MOOV-0074) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Major Brushes Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Major Brushes Ltd'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Major Brushes Ltd')) || '%'
       OR LOWER('Major Brushes Ltd') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0074' OR account_number = 'MOOV-0074')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0074',
        dc_customer_id = 'MOOV-0074',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Ottone Hardware (MOOV-0065) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Ottone Hardware'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Ottone Hardware'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Ottone Hardware')) || '%'
       OR LOWER('Ottone Hardware') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0065' OR account_number = 'MOOV-0065')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0065',
        dc_customer_id = 'MOOV-0065',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Europa (Europa) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Europa'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Europa'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Europa')) || '%'
       OR LOWER('Europa') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'Europa' OR account_number = 'Europa')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'Europa',
        dc_customer_id = 'Europa',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── TELESONIC (DQA1-0014) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('TELESONIC'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('TELESONIC'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('TELESONIC')) || '%'
       OR LOWER('TELESONIC') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'DQA1-0014' OR account_number = 'DQA1-0014')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'DQA1-0014',
        dc_customer_id = 'DQA1-0014',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── ALDO (DQA1-0015) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('ALDO'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('ALDO'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('ALDO')) || '%'
       OR LOWER('ALDO') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'DQA1-0015' OR account_number = 'DQA1-0015')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'DQA1-0015',
        dc_customer_id = 'DQA1-0015',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Barry AI (Barry AI) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Barry AI'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Barry AI'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Barry AI')) || '%'
       OR LOWER('Barry AI') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'Barry AI' OR account_number = 'Barry AI')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'Barry AI',
        dc_customer_id = 'Barry AI',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── NECTR (MOOV-0075) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('NECTR'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('NECTR'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('NECTR')) || '%'
       OR LOWER('NECTR') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0075' OR account_number = 'MOOV-0075')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0075',
        dc_customer_id = 'MOOV-0075',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Ray Wai-Shing (HOF-0007) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Ray Wai-Shing'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Ray Wai-Shing'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Ray Wai-Shing')) || '%'
       OR LOWER('Ray Wai-Shing') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'HOF-0007' OR account_number = 'HOF-0007')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'HOF-0007',
        dc_customer_id = 'HOF-0007',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Michael Chadburn (HOF-0003) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Michael Chadburn'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Michael Chadburn'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Michael Chadburn')) || '%'
       OR LOWER('Michael Chadburn') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'HOF-0003' OR account_number = 'HOF-0003')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'HOF-0003',
        dc_customer_id = 'HOF-0003',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── UK Demo (DD2-0002) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('UK Demo'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('UK Demo'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('UK Demo')) || '%'
       OR LOWER('UK Demo') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'DD2-0002' OR account_number = 'DD2-0002')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'DD2-0002',
        dc_customer_id = 'DD2-0002',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Ninja UK Production (HOF-0002) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Ninja UK Production'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Ninja UK Production'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Ninja UK Production')) || '%'
       OR LOWER('Ninja UK Production') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'HOF-0002' OR account_number = 'HOF-0002')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'HOF-0002',
        dc_customer_id = 'HOF-0002',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Prod Chinthaka (HOF-0001) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Prod Chinthaka'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Prod Chinthaka'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Prod Chinthaka')) || '%'
       OR LOWER('Prod Chinthaka') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'HOF-0001' OR account_number = 'HOF-0001')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'HOF-0001',
        dc_customer_id = 'HOF-0001',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── EFUTURES1 (DP1-0001) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('EFUTURES1'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('EFUTURES1'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('EFUTURES1')) || '%'
       OR LOWER('EFUTURES1') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'DP1-0001' OR account_number = 'DP1-0001')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'DP1-0001',
        dc_customer_id = 'DP1-0001',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Moreyeah Foods Ltd (MOOV-0076) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Moreyeah Foods Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Moreyeah Foods Ltd'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Moreyeah Foods Ltd')) || '%'
       OR LOWER('Moreyeah Foods Ltd') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0076' OR account_number = 'MOOV-0076')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0076',
        dc_customer_id = 'MOOV-0076',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── S Smith & Sons Carpets Ltd (MOOV-0077) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('S Smith & Sons Carpets Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('S Smith & Sons Carpets Ltd'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('S Smith & Sons Carpets Ltd')) || '%'
       OR LOWER('S Smith & Sons Carpets Ltd') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0077' OR account_number = 'MOOV-0077')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0077',
        dc_customer_id = 'MOOV-0077',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── The Railway Shop Ltd (MOOV-0078) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('The Railway Shop Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('The Railway Shop Ltd'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('The Railway Shop Ltd')) || '%'
       OR LOWER('The Railway Shop Ltd') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0078' OR account_number = 'MOOV-0078')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0078',
        dc_customer_id = 'MOOV-0078',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Pex Ltd (MOOV-0079) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Pex Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Pex Ltd'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Pex Ltd')) || '%'
       OR LOWER('Pex Ltd') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0079' OR account_number = 'MOOV-0079')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0079',
        dc_customer_id = 'MOOV-0079',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Finger on Pulse Ltd (MOOV-0080) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Finger on Pulse Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Finger on Pulse Ltd'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Finger on Pulse Ltd')) || '%'
       OR LOWER('Finger on Pulse Ltd') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0080' OR account_number = 'MOOV-0080')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0080',
        dc_customer_id = 'MOOV-0080',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Iglu Meal Prep (Iglu Meal Prep) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Iglu Meal Prep'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Iglu Meal Prep'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Iglu Meal Prep')) || '%'
       OR LOWER('Iglu Meal Prep') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'Iglu Meal Prep' OR account_number = 'Iglu Meal Prep')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'Iglu Meal Prep',
        dc_customer_id = 'Iglu Meal Prep',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Yourbookstore (Yourbookstore) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Yourbookstore'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Yourbookstore'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Yourbookstore')) || '%'
       OR LOWER('Yourbookstore') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'Yourbookstore' OR account_number = 'Yourbookstore')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'Yourbookstore',
        dc_customer_id = 'Yourbookstore',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Carnivore Cartel Ltd (MOOV-0081) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Carnivore Cartel Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Carnivore Cartel Ltd'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Carnivore Cartel Ltd')) || '%'
       OR LOWER('Carnivore Cartel Ltd') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0081' OR account_number = 'MOOV-0081')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0081',
        dc_customer_id = 'MOOV-0081',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Igluu Ltd (MOOV-0082) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Igluu Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Igluu Ltd'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Igluu Ltd')) || '%'
       OR LOWER('Igluu Ltd') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0082' OR account_number = 'MOOV-0082')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0082',
        dc_customer_id = 'MOOV-0082',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── E-Health Pharmacy Ltd (MOOV-0083) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('E-Health Pharmacy Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('E-Health Pharmacy Ltd'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('E-Health Pharmacy Ltd')) || '%'
       OR LOWER('E-Health Pharmacy Ltd') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0083' OR account_number = 'MOOV-0083')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0083',
        dc_customer_id = 'MOOV-0083',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Techworknetwork LTD (MOOV-0084) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Techworknetwork LTD'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Techworknetwork LTD'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Techworknetwork LTD')) || '%'
       OR LOWER('Techworknetwork LTD') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0084' OR account_number = 'MOOV-0084')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0084',
        dc_customer_id = 'MOOV-0084',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Matrix Seating Limited (MOOV-0085) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Matrix Seating Limited'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Matrix Seating Limited'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Matrix Seating Limited')) || '%'
       OR LOWER('Matrix Seating Limited') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0085' OR account_number = 'MOOV-0085')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0085',
        dc_customer_id = 'MOOV-0085',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── test (DP1-0044) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('test'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('test'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('test')) || '%'
       OR LOWER('test') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'DP1-0044' OR account_number = 'DP1-0044')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'DP1-0044',
        dc_customer_id = 'DP1-0044',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Test company name (DP1-0045) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Test company name'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Test company name'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Test company name')) || '%'
       OR LOWER('Test company name') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'DP1-0045' OR account_number = 'DP1-0045')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'DP1-0045',
        dc_customer_id = 'DP1-0045',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Zesta (DP2-0001) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Zesta'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Zesta'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Zesta')) || '%'
       OR LOWER('Zesta') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'DP2-0001' OR account_number = 'DP2-0001')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'DP2-0001',
        dc_customer_id = 'DP2-0001',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── HSBC (DDJ1-0002) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('HSBC'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('HSBC'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('HSBC')) || '%'
       OR LOWER('HSBC') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'DDJ1-0002' OR account_number = 'DDJ1-0002')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'DDJ1-0002',
        dc_customer_id = 'DDJ1-0002',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Danijels Parcels (MOOV-0087) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Danijels Parcels'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Danijels Parcels'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Danijels Parcels')) || '%'
       OR LOWER('Danijels Parcels') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0087' OR account_number = 'MOOV-0087')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0087',
        dc_customer_id = 'MOOV-0087',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── TCS Express Worldwide UK Limited (MOOV-0088) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('TCS Express Worldwide UK Limited'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('TCS Express Worldwide UK Limited'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('TCS Express Worldwide UK Limited')) || '%'
       OR LOWER('TCS Express Worldwide UK Limited') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0088' OR account_number = 'MOOV-0088')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0088',
        dc_customer_id = 'MOOV-0088',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Clearance Stock Supplies Limited (MOOV-0089) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Clearance Stock Supplies Limited'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Clearance Stock Supplies Limited'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Clearance Stock Supplies Limited')) || '%'
       OR LOWER('Clearance Stock Supplies Limited') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0089' OR account_number = 'MOOV-0089')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0089',
        dc_customer_id = 'MOOV-0089',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Octopus (DP1-0046) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Octopus'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Octopus'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Octopus')) || '%'
       OR LOWER('Octopus') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'DP1-0046' OR account_number = 'DP1-0046')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'DP1-0046',
        dc_customer_id = 'DP1-0046',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Matt Test (MOOV-0090) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Matt Test'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Matt Test'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Matt Test')) || '%'
       OR LOWER('Matt Test') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0090' OR account_number = 'MOOV-0090')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0090',
        dc_customer_id = 'MOOV-0090',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Test company (DQA1-0016) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Test company'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Test company'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Test company')) || '%'
       OR LOWER('Test company') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'DQA1-0016' OR account_number = 'DQA1-0016')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'DQA1-0016',
        dc_customer_id = 'DQA1-0016',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Pet Food Online LTD (MOOV-0091) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Pet Food Online LTD'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Pet Food Online LTD'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Pet Food Online LTD')) || '%'
       OR LOWER('Pet Food Online LTD') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0091' OR account_number = 'MOOV-0091')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0091',
        dc_customer_id = 'MOOV-0091',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Aromina (DDJ1-0003) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Aromina'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Aromina'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Aromina')) || '%'
       OR LOWER('Aromina') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'DDJ1-0003' OR account_number = 'DDJ1-0003')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'DDJ1-0003',
        dc_customer_id = 'DDJ1-0003',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Paragon Design Joinery Ltd (MOOV-0092) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Paragon Design Joinery Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Paragon Design Joinery Ltd'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Paragon Design Joinery Ltd')) || '%'
       OR LOWER('Paragon Design Joinery Ltd') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0092' OR account_number = 'MOOV-0092')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0092',
        dc_customer_id = 'MOOV-0092',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Macchiato Bar Ltd (MOOV-0093) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Macchiato Bar Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Macchiato Bar Ltd'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Macchiato Bar Ltd')) || '%'
       OR LOWER('Macchiato Bar Ltd') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0093' OR account_number = 'MOOV-0093')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0093',
        dc_customer_id = 'MOOV-0093',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Soothe Limited t/a Luxury Skincare Brands (MOOV-0094) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Soothe Limited t/a Luxury Skincare Brands'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Soothe Limited t/a Luxury Skincare Brands'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Soothe Limited t/a Luxury Skincare Brands')) || '%'
       OR LOWER('Soothe Limited t/a Luxury Skincare Brands') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0094' OR account_number = 'MOOV-0094')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0094',
        dc_customer_id = 'MOOV-0094',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── MAD baits supplies Ltd (MOOV-0095) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('MAD baits supplies Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('MAD baits supplies Ltd'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('MAD baits supplies Ltd')) || '%'
       OR LOWER('MAD baits supplies Ltd') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0095' OR account_number = 'MOOV-0095')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0095',
        dc_customer_id = 'MOOV-0095',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Sam Scotts Limited (MOOV-0097) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Sam Scotts Limited'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Sam Scotts Limited'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Sam Scotts Limited')) || '%'
       OR LOWER('Sam Scotts Limited') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0097' OR account_number = 'MOOV-0097')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0097',
        dc_customer_id = 'MOOV-0097',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Crytec Limited (MOOV-0098) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Crytec Limited'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Crytec Limited'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Crytec Limited')) || '%'
       OR LOWER('Crytec Limited') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0098' OR account_number = 'MOOV-0098')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0098',
        dc_customer_id = 'MOOV-0098',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Hairways (Hair & Beauty) Ltd Site B (MOOV-0099) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Hairways (Hair & Beauty) Ltd Site B'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Hairways (Hair & Beauty) Ltd Site B'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Hairways (Hair & Beauty) Ltd Site B')) || '%'
       OR LOWER('Hairways (Hair & Beauty) Ltd Site B') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0099' OR account_number = 'MOOV-0099')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0099',
        dc_customer_id = 'MOOV-0099',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── WoodUbend Ltd (MOOV-0101) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('WoodUbend Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('WoodUbend Ltd'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('WoodUbend Ltd')) || '%'
       OR LOWER('WoodUbend Ltd') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0101' OR account_number = 'MOOV-0101')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0101',
        dc_customer_id = 'MOOV-0101',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── TMK Trading Ltd t/a Nexus Modelling Supplies (MOOV-0102) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('TMK Trading Ltd t/a Nexus Modelling Supplies'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('TMK Trading Ltd t/a Nexus Modelling Supplies'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('TMK Trading Ltd t/a Nexus Modelling Supplies')) || '%'
       OR LOWER('TMK Trading Ltd t/a Nexus Modelling Supplies') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0102' OR account_number = 'MOOV-0102')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0102',
        dc_customer_id = 'MOOV-0102',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Brexons Workwear (MOOV-0103) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Brexons Workwear'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Brexons Workwear'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Brexons Workwear')) || '%'
       OR LOWER('Brexons Workwear') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0103' OR account_number = 'MOOV-0103')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0103',
        dc_customer_id = 'MOOV-0103',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Sing Ko (MOOV-0105) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Sing Ko'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Sing Ko'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Sing Ko')) || '%'
       OR LOWER('Sing Ko') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0105' OR account_number = 'MOOV-0105')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0105',
        dc_customer_id = 'MOOV-0105',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Boori (Europe) LTD (MOOV-0106) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Boori (Europe) LTD'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Boori (Europe) LTD'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Boori (Europe) LTD')) || '%'
       OR LOWER('Boori (Europe) LTD') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0106' OR account_number = 'MOOV-0106')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0106',
        dc_customer_id = 'MOOV-0106',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── mike (123-0001) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('mike'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('mike'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('mike')) || '%'
       OR LOWER('mike') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = '123-0001' OR account_number = '123-0001')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = '123-0001',
        dc_customer_id = '123-0001',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── sdfdsf (11-2002) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('sdfdsf'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('sdfdsf'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('sdfdsf')) || '%'
       OR LOWER('sdfdsf') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = '11-2002' OR account_number = '11-2002')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = '11-2002',
        dc_customer_id = '11-2002',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── MV (123-0002) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('MV'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('MV'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('MV')) || '%'
       OR LOWER('MV') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = '123-0002' OR account_number = '123-0002')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = '123-0002',
        dc_customer_id = '123-0002',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── SYNTAXGENIE (123-0003) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('SYNTAXGENIE'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('SYNTAXGENIE'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('SYNTAXGENIE')) || '%'
       OR LOWER('SYNTAXGENIE') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = '123-0003' OR account_number = '123-0003')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = '123-0003',
        dc_customer_id = '123-0003',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── sdgsd (123-0004) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('sdgsd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('sdgsd'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('sdgsd')) || '%'
       OR LOWER('sdgsd') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = '123-0004' OR account_number = '123-0004')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = '123-0004',
        dc_customer_id = '123-0004',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── cf (11-2001) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('cf'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('cf'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('cf')) || '%'
       OR LOWER('cf') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = '11-2001' OR account_number = '11-2001')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = '11-2001',
        dc_customer_id = '11-2001',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Property Documents Ltd (MOOV-0107) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Property Documents Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Property Documents Ltd'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Property Documents Ltd')) || '%'
       OR LOWER('Property Documents Ltd') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0107' OR account_number = 'MOOV-0107')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0107',
        dc_customer_id = 'MOOV-0107',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Accentura (DP1-0047) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Accentura'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Accentura'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Accentura')) || '%'
       OR LOWER('Accentura') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'DP1-0047' OR account_number = 'DP1-0047')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'DP1-0047',
        dc_customer_id = 'DP1-0047',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Direct Auto Electrics Ltd (MOOV-0108) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Direct Auto Electrics Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Direct Auto Electrics Ltd'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Direct Auto Electrics Ltd')) || '%'
       OR LOWER('Direct Auto Electrics Ltd') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0108' OR account_number = 'MOOV-0108')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0108',
        dc_customer_id = 'MOOV-0108',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Sampath Bank (DDJ1-0004) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Sampath Bank'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Sampath Bank'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Sampath Bank')) || '%'
       OR LOWER('Sampath Bank') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'DDJ1-0004' OR account_number = 'DDJ1-0004')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'DDJ1-0004',
        dc_customer_id = 'DDJ1-0004',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── W J Jones Ltd T/A Zoar''s Ark (MOOV-0109) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('W J Jones Ltd T/A Zoar''s Ark'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('W J Jones Ltd T/A Zoar''s Ark'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('W J Jones Ltd T/A Zoar''s Ark')) || '%'
       OR LOWER('W J Jones Ltd T/A Zoar''s Ark') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0109' OR account_number = 'MOOV-0109')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0109',
        dc_customer_id = 'MOOV-0109',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Raycom Ltd (MOOV-0110) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Raycom Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Raycom Ltd'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Raycom Ltd')) || '%'
       OR LOWER('Raycom Ltd') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0110' OR account_number = 'MOOV-0110')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0110',
        dc_customer_id = 'MOOV-0110',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Michael kors (DQA1-0017) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Michael kors'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Michael kors'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Michael kors')) || '%'
       OR LOWER('Michael kors') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'DQA1-0017' OR account_number = 'DQA1-0017')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'DQA1-0017',
        dc_customer_id = 'DQA1-0017',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Vintsreet (Vintsreet) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Vintsreet'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Vintsreet'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Vintsreet')) || '%'
       OR LOWER('Vintsreet') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'Vintsreet' OR account_number = 'Vintsreet')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'Vintsreet',
        dc_customer_id = 'Vintsreet',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Efutures Prod Test Account (DD2-0006) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Efutures Prod Test Account'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Efutures Prod Test Account'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Efutures Prod Test Account')) || '%'
       OR LOWER('Efutures Prod Test Account') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'DD2-0006' OR account_number = 'DD2-0006')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'DD2-0006',
        dc_customer_id = 'DD2-0006',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Redo Commerce (Redo Commerce) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Redo Commerce'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Redo Commerce'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Redo Commerce')) || '%'
       OR LOWER('Redo Commerce') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'Redo Commerce' OR account_number = 'Redo Commerce')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'Redo Commerce',
        dc_customer_id = 'Redo Commerce',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Empire Printing & Embroidery Ltd (MOOV-0111) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Empire Printing & Embroidery Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Empire Printing & Embroidery Ltd'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Empire Printing & Embroidery Ltd')) || '%'
       OR LOWER('Empire Printing & Embroidery Ltd') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0111' OR account_number = 'MOOV-0111')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0111',
        dc_customer_id = 'MOOV-0111',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── BARRY CARTER MOTOR PRODUCTS (MOOV-0113) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('BARRY CARTER MOTOR PRODUCTS'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('BARRY CARTER MOTOR PRODUCTS'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('BARRY CARTER MOTOR PRODUCTS')) || '%'
       OR LOWER('BARRY CARTER MOTOR PRODUCTS') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0113' OR account_number = 'MOOV-0113')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0113',
        dc_customer_id = 'MOOV-0113',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Cranswick (Cranswick) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Cranswick'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Cranswick'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Cranswick')) || '%'
       OR LOWER('Cranswick') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'Cranswick' OR account_number = 'Cranswick')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'Cranswick',
        dc_customer_id = 'Cranswick',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Vint Street Ltd. (MOOV-0114) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Vint Street Ltd.'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Vint Street Ltd.'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Vint Street Ltd.')) || '%'
       OR LOWER('Vint Street Ltd.') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0114' OR account_number = 'MOOV-0114')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0114',
        dc_customer_id = 'MOOV-0114',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Imagin Products Ltd (MOOV-0115) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Imagin Products Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Imagin Products Ltd'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Imagin Products Ltd')) || '%'
       OR LOWER('Imagin Products Ltd') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0115' OR account_number = 'MOOV-0115')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0115',
        dc_customer_id = 'MOOV-0115',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Efutures Prod Account Two (DD2-0007) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Efutures Prod Account Two'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Efutures Prod Account Two'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Efutures Prod Account Two')) || '%'
       OR LOWER('Efutures Prod Account Two') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'DD2-0007' OR account_number = 'DD2-0007')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'DD2-0007',
        dc_customer_id = 'DD2-0007',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── EZZTECH (MOOV-0116) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('EZZTECH'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('EZZTECH'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('EZZTECH')) || '%'
       OR LOWER('EZZTECH') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0116' OR account_number = 'MOOV-0116')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0116',
        dc_customer_id = 'MOOV-0116',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Tool Hub Ltd (MOOV-0117) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Tool Hub Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Tool Hub Ltd'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Tool Hub Ltd')) || '%'
       OR LOWER('Tool Hub Ltd') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0117' OR account_number = 'MOOV-0117')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0117',
        dc_customer_id = 'MOOV-0117',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Getplumb Reading Ltd (MOOV-0118) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Getplumb Reading Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Getplumb Reading Ltd'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Getplumb Reading Ltd')) || '%'
       OR LOWER('Getplumb Reading Ltd') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0118' OR account_number = 'MOOV-0118')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0118',
        dc_customer_id = 'MOOV-0118',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Vision Warehouse (MOOV-0112) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Vision Warehouse'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Vision Warehouse'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Vision Warehouse')) || '%'
       OR LOWER('Vision Warehouse') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0112' OR account_number = 'MOOV-0112')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0112',
        dc_customer_id = 'MOOV-0112',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── 608 Group Ltd (304 Clothing) (MOOV-0119) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('608 Group Ltd (304 Clothing)'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('608 Group Ltd (304 Clothing)'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('608 Group Ltd (304 Clothing)')) || '%'
       OR LOWER('608 Group Ltd (304 Clothing)') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0119' OR account_number = 'MOOV-0119')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0119',
        dc_customer_id = 'MOOV-0119',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Sky Chemicals (UK) Ltd (MOOV-0120) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Sky Chemicals (UK) Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Sky Chemicals (UK) Ltd'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Sky Chemicals (UK) Ltd')) || '%'
       OR LOWER('Sky Chemicals (UK) Ltd') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0120' OR account_number = 'MOOV-0120')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0120',
        dc_customer_id = 'MOOV-0120',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Wedcova Uk Ltd (MOOV-0121) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Wedcova Uk Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Wedcova Uk Ltd'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Wedcova Uk Ltd')) || '%'
       OR LOWER('Wedcova Uk Ltd') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0121' OR account_number = 'MOOV-0121')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0121',
        dc_customer_id = 'MOOV-0121',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Fosseway Parcels Ltd (MOOV-0122) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Fosseway Parcels Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Fosseway Parcels Ltd'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Fosseway Parcels Ltd')) || '%'
       OR LOWER('Fosseway Parcels Ltd') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0122' OR account_number = 'MOOV-0122')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0122',
        dc_customer_id = 'MOOV-0122',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── ARIMAC (DDJ1-0005) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('ARIMAC'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('ARIMAC'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('ARIMAC')) || '%'
       OR LOWER('ARIMAC') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'DDJ1-0005' OR account_number = 'DDJ1-0005')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'DDJ1-0005',
        dc_customer_id = 'DDJ1-0005',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── GPG - Getpersonalisedgifts Limited (MOOV-0123) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('GPG - Getpersonalisedgifts Limited'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('GPG - Getpersonalisedgifts Limited'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('GPG - Getpersonalisedgifts Limited')) || '%'
       OR LOWER('GPG - Getpersonalisedgifts Limited') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0123' OR account_number = 'MOOV-0123')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0123',
        dc_customer_id = 'MOOV-0123',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Thirsty Soft Drinks (MOOV-0124) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Thirsty Soft Drinks'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Thirsty Soft Drinks'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Thirsty Soft Drinks')) || '%'
       OR LOWER('Thirsty Soft Drinks') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0124' OR account_number = 'MOOV-0124')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0124',
        dc_customer_id = 'MOOV-0124',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Gifts2Impress (MOOV-0125) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Gifts2Impress'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Gifts2Impress'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Gifts2Impress')) || '%'
       OR LOWER('Gifts2Impress') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0125' OR account_number = 'MOOV-0125')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0125',
        dc_customer_id = 'MOOV-0125',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Xylo LTD (MOOV-0126) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Xylo LTD'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Xylo LTD'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Xylo LTD')) || '%'
       OR LOWER('Xylo LTD') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0126' OR account_number = 'MOOV-0126')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0126',
        dc_customer_id = 'MOOV-0126',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── The Saddlery Shop Ltd (MOOV-0127) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('The Saddlery Shop Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('The Saddlery Shop Ltd'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('The Saddlery Shop Ltd')) || '%'
       OR LOWER('The Saddlery Shop Ltd') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0127' OR account_number = 'MOOV-0127')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0127',
        dc_customer_id = 'MOOV-0127',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── EF TEST QA ACCOUNT (DD2-0008) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('EF TEST QA ACCOUNT'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('EF TEST QA ACCOUNT'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('EF TEST QA ACCOUNT')) || '%'
       OR LOWER('EF TEST QA ACCOUNT') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'DD2-0008' OR account_number = 'DD2-0008')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'DD2-0008',
        dc_customer_id = 'DD2-0008',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Organax Ltd (MOOV-0128) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Organax Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Organax Ltd'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Organax Ltd')) || '%'
       OR LOWER('Organax Ltd') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0128' OR account_number = 'MOOV-0128')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0128',
        dc_customer_id = 'MOOV-0128',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Gra Telford LTD (MOOV-0129) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Gra Telford LTD'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Gra Telford LTD'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Gra Telford LTD')) || '%'
       OR LOWER('Gra Telford LTD') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0129' OR account_number = 'MOOV-0129')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0129',
        dc_customer_id = 'MOOV-0129',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Attapattu & Sons (123-0005) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Attapattu & Sons'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Attapattu & Sons'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Attapattu & Sons')) || '%'
       OR LOWER('Attapattu & Sons') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = '123-0005' OR account_number = '123-0005')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = '123-0005',
        dc_customer_id = '123-0005',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Jayasuriya & Sons (123-0006) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Jayasuriya & Sons'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Jayasuriya & Sons'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Jayasuriya & Sons')) || '%'
       OR LOWER('Jayasuriya & Sons') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = '123-0006' OR account_number = '123-0006')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = '123-0006',
        dc_customer_id = '123-0006',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── The Wall Lighting Company Ltd (MOOV-0130) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('The Wall Lighting Company Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('The Wall Lighting Company Ltd'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('The Wall Lighting Company Ltd')) || '%'
       OR LOWER('The Wall Lighting Company Ltd') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0130' OR account_number = 'MOOV-0130')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0130',
        dc_customer_id = 'MOOV-0130',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Chilli Seating Ltd (MOOV-0131) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Chilli Seating Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Chilli Seating Ltd'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Chilli Seating Ltd')) || '%'
       OR LOWER('Chilli Seating Ltd') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0131' OR account_number = 'MOOV-0131')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0131',
        dc_customer_id = 'MOOV-0131',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── ZARA Company (DDJ1-0006) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('ZARA Company'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('ZARA Company'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('ZARA Company')) || '%'
       OR LOWER('ZARA Company') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'DDJ1-0006' OR account_number = 'DDJ1-0006')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'DDJ1-0006',
        dc_customer_id = 'DDJ1-0006',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── N70 (123-0007) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('N70'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('N70'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('N70')) || '%'
       OR LOWER('N70') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = '123-0007' OR account_number = '123-0007')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = '123-0007',
        dc_customer_id = '123-0007',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Mahela Co (123-0008) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Mahela Co'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Mahela Co'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Mahela Co')) || '%'
       OR LOWER('Mahela Co') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = '123-0008' OR account_number = '123-0008')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = '123-0008',
        dc_customer_id = '123-0008',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── David Jones (DP1-0048) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('David Jones'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('David Jones'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('David Jones')) || '%'
       OR LOWER('David Jones') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'DP1-0048' OR account_number = 'DP1-0048')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'DP1-0048',
        dc_customer_id = 'DP1-0048',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Deshi Delights Ltd (MOOV-0132) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Deshi Delights Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Deshi Delights Ltd'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Deshi Delights Ltd')) || '%'
       OR LOWER('Deshi Delights Ltd') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0132' OR account_number = 'MOOV-0132')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0132',
        dc_customer_id = 'MOOV-0132',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── EFUTURES TEST COMPANY (DD2-0009) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('EFUTURES TEST COMPANY'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('EFUTURES TEST COMPANY'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('EFUTURES TEST COMPANY')) || '%'
       OR LOWER('EFUTURES TEST COMPANY') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'DD2-0009' OR account_number = 'DD2-0009')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'DD2-0009',
        dc_customer_id = 'DD2-0009',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Bill''s Tool Store Ltd (MOOV-0133) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Bill''s Tool Store Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Bill''s Tool Store Ltd'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Bill''s Tool Store Ltd')) || '%'
       OR LOWER('Bill''s Tool Store Ltd') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0133' OR account_number = 'MOOV-0133')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0133',
        dc_customer_id = 'MOOV-0133',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Jaycee Engineering T/A Jaycee Trophies (MOOV-0134) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Jaycee Engineering T/A Jaycee Trophies'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Jaycee Engineering T/A Jaycee Trophies'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Jaycee Engineering T/A Jaycee Trophies')) || '%'
       OR LOWER('Jaycee Engineering T/A Jaycee Trophies') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0134' OR account_number = 'MOOV-0134')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0134',
        dc_customer_id = 'MOOV-0134',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Arden Medical Limited (MOOV-0135) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Arden Medical Limited'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Arden Medical Limited'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Arden Medical Limited')) || '%'
       OR LOWER('Arden Medical Limited') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0135' OR account_number = 'MOOV-0135')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0135',
        dc_customer_id = 'MOOV-0135',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── ORIGINAL SOURCE LIMITED (MOOV-0136) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('ORIGINAL SOURCE LIMITED'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('ORIGINAL SOURCE LIMITED'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('ORIGINAL SOURCE LIMITED')) || '%'
       OR LOWER('ORIGINAL SOURCE LIMITED') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0136' OR account_number = 'MOOV-0136')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0136',
        dc_customer_id = 'MOOV-0136',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Ransom Publishing Ltd (MOOV-0137) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Ransom Publishing Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Ransom Publishing Ltd'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Ransom Publishing Ltd')) || '%'
       OR LOWER('Ransom Publishing Ltd') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0137' OR account_number = 'MOOV-0137')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0137',
        dc_customer_id = 'MOOV-0137',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Webhook Test (123-0010) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Webhook Test'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Webhook Test'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Webhook Test')) || '%'
       OR LOWER('Webhook Test') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = '123-0010' OR account_number = '123-0010')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = '123-0010',
        dc_customer_id = '123-0010',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Fortec Trading Ltd t/a Glowtopia (Fortec Trading Ltd t/a Glowtopia) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Fortec Trading Ltd t/a Glowtopia'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Fortec Trading Ltd t/a Glowtopia'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Fortec Trading Ltd t/a Glowtopia')) || '%'
       OR LOWER('Fortec Trading Ltd t/a Glowtopia') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'Fortec Trading Ltd t/a Glowtopia' OR account_number = 'Fortec Trading Ltd t/a Glowtopia')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'Fortec Trading Ltd t/a Glowtopia',
        dc_customer_id = 'Fortec Trading Ltd t/a Glowtopia',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Alpha Cus (123-0011) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Alpha Cus'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Alpha Cus'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Alpha Cus')) || '%'
       OR LOWER('Alpha Cus') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = '123-0011' OR account_number = '123-0011')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = '123-0011',
        dc_customer_id = '123-0011',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Beta Cus (123-0012) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Beta Cus'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Beta Cus'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Beta Cus')) || '%'
       OR LOWER('Beta Cus') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = '123-0012' OR account_number = '123-0012')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = '123-0012',
        dc_customer_id = '123-0012',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Vintstreet (Vintstreet) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Vintstreet'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Vintstreet'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Vintstreet')) || '%'
       OR LOWER('Vintstreet') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'Vintstreet' OR account_number = 'Vintstreet')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'Vintstreet',
        dc_customer_id = 'Vintstreet',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Westcare Ltd T/A westcare Supply Zone (MOOV-0138) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Westcare Ltd T/A westcare Supply Zone'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Westcare Ltd T/A westcare Supply Zone'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Westcare Ltd T/A westcare Supply Zone')) || '%'
       OR LOWER('Westcare Ltd T/A westcare Supply Zone') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0138' OR account_number = 'MOOV-0138')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0138',
        dc_customer_id = 'MOOV-0138',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Talpa office products ltd (MOOV-0139) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Talpa office products ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Talpa office products ltd'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Talpa office products ltd')) || '%'
       OR LOWER('Talpa office products ltd') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0139' OR account_number = 'MOOV-0139')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0139',
        dc_customer_id = 'MOOV-0139',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── LED Smart Solutions Limited (MOOV-0140) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('LED Smart Solutions Limited'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('LED Smart Solutions Limited'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('LED Smart Solutions Limited')) || '%'
       OR LOWER('LED Smart Solutions Limited') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0140' OR account_number = 'MOOV-0140')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0140',
        dc_customer_id = 'MOOV-0140',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── My Company (HOF-0013) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('My Company'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('My Company'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('My Company')) || '%'
       OR LOWER('My Company') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'HOF-0013' OR account_number = 'HOF-0013')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'HOF-0013',
        dc_customer_id = 'HOF-0013',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── JST Supplies LTD (MOOV-0141) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('JST Supplies LTD'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('JST Supplies LTD'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('JST Supplies LTD')) || '%'
       OR LOWER('JST Supplies LTD') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0141' OR account_number = 'MOOV-0141')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0141',
        dc_customer_id = 'MOOV-0141',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Moov Diana Demo (MOOV-0142) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Moov Diana Demo'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Moov Diana Demo'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Moov Diana Demo')) || '%'
       OR LOWER('Moov Diana Demo') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0142' OR account_number = 'MOOV-0142')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0142',
        dc_customer_id = 'MOOV-0142',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── OliArt Wood LTD (MOOV-0143) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('OliArt Wood LTD'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('OliArt Wood LTD'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('OliArt Wood LTD')) || '%'
       OR LOWER('OliArt Wood LTD') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0143' OR account_number = 'MOOV-0143')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0143',
        dc_customer_id = 'MOOV-0143',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Bessette LTD (MOOV-0144) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Bessette LTD'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Bessette LTD'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Bessette LTD')) || '%'
       OR LOWER('Bessette LTD') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0144' OR account_number = 'MOOV-0144')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0144',
        dc_customer_id = 'MOOV-0144',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── NDB (DDJ1-0007) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('NDB'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('NDB'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('NDB')) || '%'
       OR LOWER('NDB') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'DDJ1-0007' OR account_number = 'DDJ1-0007')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'DDJ1-0007',
        dc_customer_id = 'DDJ1-0007',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── CONTEXT PNEUMATIC SUPPLIES LIMITED (MOOV-0145) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('CONTEXT PNEUMATIC SUPPLIES LIMITED'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('CONTEXT PNEUMATIC SUPPLIES LIMITED'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('CONTEXT PNEUMATIC SUPPLIES LIMITED')) || '%'
       OR LOWER('CONTEXT PNEUMATIC SUPPLIES LIMITED') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0145' OR account_number = 'MOOV-0145')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0145',
        dc_customer_id = 'MOOV-0145',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Bentley and Bo Interiors Ltd (MOOV-0146) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Bentley and Bo Interiors Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Bentley and Bo Interiors Ltd'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Bentley and Bo Interiors Ltd')) || '%'
       OR LOWER('Bentley and Bo Interiors Ltd') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0146' OR account_number = 'MOOV-0146')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0146',
        dc_customer_id = 'MOOV-0146',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── SME IT Solutions Limited (MOOV-0147) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('SME IT Solutions Limited'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('SME IT Solutions Limited'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('SME IT Solutions Limited')) || '%'
       OR LOWER('SME IT Solutions Limited') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0147' OR account_number = 'MOOV-0147')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0147',
        dc_customer_id = 'MOOV-0147',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── EFUTURES SMOKE TEST CUSTOMER (MOOV-0148) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('EFUTURES SMOKE TEST CUSTOMER'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('EFUTURES SMOKE TEST CUSTOMER'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('EFUTURES SMOKE TEST CUSTOMER')) || '%'
       OR LOWER('EFUTURES SMOKE TEST CUSTOMER') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0148' OR account_number = 'MOOV-0148')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0148',
        dc_customer_id = 'MOOV-0148',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Buffalo Systems Ltd (MOOV-0149) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Buffalo Systems Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Buffalo Systems Ltd'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Buffalo Systems Ltd')) || '%'
       OR LOWER('Buffalo Systems Ltd') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0149' OR account_number = 'MOOV-0149')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0149',
        dc_customer_id = 'MOOV-0149',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── East London Packaging Supplies Ltd (MOOV-0150) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('East London Packaging Supplies Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('East London Packaging Supplies Ltd'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('East London Packaging Supplies Ltd')) || '%'
       OR LOWER('East London Packaging Supplies Ltd') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0150' OR account_number = 'MOOV-0150')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0150',
        dc_customer_id = 'MOOV-0150',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Metal Polishing Supplies Ltd (MOOV-0151) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Metal Polishing Supplies Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Metal Polishing Supplies Ltd'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Metal Polishing Supplies Ltd')) || '%'
       OR LOWER('Metal Polishing Supplies Ltd') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0151' OR account_number = 'MOOV-0151')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0151',
        dc_customer_id = 'MOOV-0151',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Spokz Ltd (MOOV-0152) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Spokz Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Spokz Ltd'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Spokz Ltd')) || '%'
       OR LOWER('Spokz Ltd') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0152' OR account_number = 'MOOV-0152')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0152',
        dc_customer_id = 'MOOV-0152',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Youtheory (123-0013) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Youtheory'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Youtheory'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Youtheory')) || '%'
       OR LOWER('Youtheory') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = '123-0013' OR account_number = '123-0013')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = '123-0013',
        dc_customer_id = '123-0013',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── M. Criscuolo & Co Ltd (MOOV-0153) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('M. Criscuolo & Co Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('M. Criscuolo & Co Ltd'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('M. Criscuolo & Co Ltd')) || '%'
       OR LOWER('M. Criscuolo & Co Ltd') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0153' OR account_number = 'MOOV-0153')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0153',
        dc_customer_id = 'MOOV-0153',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Kettles Pottery Supplies Ltd (MOOV-0154) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Kettles Pottery Supplies Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Kettles Pottery Supplies Ltd'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Kettles Pottery Supplies Ltd')) || '%'
       OR LOWER('Kettles Pottery Supplies Ltd') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0154' OR account_number = 'MOOV-0154')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0154',
        dc_customer_id = 'MOOV-0154',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── East Coast Creations Ltd (MOOV-0155) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('East Coast Creations Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('East Coast Creations Ltd'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('East Coast Creations Ltd')) || '%'
       OR LOWER('East Coast Creations Ltd') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0155' OR account_number = 'MOOV-0155')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0155',
        dc_customer_id = 'MOOV-0155',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── ETA Solutions Limited (MOOV-0156) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('ETA Solutions Limited'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('ETA Solutions Limited'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('ETA Solutions Limited')) || '%'
       OR LOWER('ETA Solutions Limited') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0156' OR account_number = 'MOOV-0156')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0156',
        dc_customer_id = 'MOOV-0156',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Security Trade Products Ltd (MOOV-0157) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Security Trade Products Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Security Trade Products Ltd'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Security Trade Products Ltd')) || '%'
       OR LOWER('Security Trade Products Ltd') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0157' OR account_number = 'MOOV-0157')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0157',
        dc_customer_id = 'MOOV-0157',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Sarratt Online Ltd (MOOV-0158) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Sarratt Online Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Sarratt Online Ltd'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Sarratt Online Ltd')) || '%'
       OR LOWER('Sarratt Online Ltd') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0158' OR account_number = 'MOOV-0158')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0158',
        dc_customer_id = 'MOOV-0158',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Agar Hygiene Ltd (MOOV-0159) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Agar Hygiene Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Agar Hygiene Ltd'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Agar Hygiene Ltd')) || '%'
       OR LOWER('Agar Hygiene Ltd') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0159' OR account_number = 'MOOV-0159')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0159',
        dc_customer_id = 'MOOV-0159',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Lesser Spotted Images Ltd (MOOV-0160) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Lesser Spotted Images Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Lesser Spotted Images Ltd'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Lesser Spotted Images Ltd')) || '%'
       OR LOWER('Lesser Spotted Images Ltd') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0160' OR account_number = 'MOOV-0160')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0160',
        dc_customer_id = 'MOOV-0160',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Just Cable Ties (MOOV-0161) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Just Cable Ties'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Just Cable Ties'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Just Cable Ties')) || '%'
       OR LOWER('Just Cable Ties') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0161' OR account_number = 'MOOV-0161')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0161',
        dc_customer_id = 'MOOV-0161',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Work and Wear Direct Ltd (Work and Wear Direct Ltd) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Work and Wear Direct Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Work and Wear Direct Ltd'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Work and Wear Direct Ltd')) || '%'
       OR LOWER('Work and Wear Direct Ltd') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'Work and Wear Direct Ltd' OR account_number = 'Work and Wear Direct Ltd')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'Work and Wear Direct Ltd',
        dc_customer_id = 'Work and Wear Direct Ltd',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Exhale Boutique (Exhale Boutique) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Exhale Boutique'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Exhale Boutique'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Exhale Boutique')) || '%'
       OR LOWER('Exhale Boutique') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'Exhale Boutique' OR account_number = 'Exhale Boutique')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'Exhale Boutique',
        dc_customer_id = 'Exhale Boutique',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Southdown Abrasives & Ind Chemicals Ltd (MOOV-0162) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Southdown Abrasives & Ind Chemicals Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Southdown Abrasives & Ind Chemicals Ltd'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Southdown Abrasives & Ind Chemicals Ltd')) || '%'
       OR LOWER('Southdown Abrasives & Ind Chemicals Ltd') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0162' OR account_number = 'MOOV-0162')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0162',
        dc_customer_id = 'MOOV-0162',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Tackl (Tackl) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Tackl'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Tackl'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Tackl')) || '%'
       OR LOWER('Tackl') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'Tackl' OR account_number = 'Tackl')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'Tackl',
        dc_customer_id = 'Tackl',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Auto Test (Auto) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Auto Test'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Auto Test'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Auto Test')) || '%'
       OR LOWER('Auto Test') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'Auto' OR account_number = 'Auto')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'Auto',
        dc_customer_id = 'Auto',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── HPSA Ltd (MOOV-0163) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('HPSA Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('HPSA Ltd'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('HPSA Ltd')) || '%'
       OR LOWER('HPSA Ltd') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0163' OR account_number = 'MOOV-0163')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0163',
        dc_customer_id = 'MOOV-0163',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── ceravi (DP1-0051) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('ceravi'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('ceravi'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('ceravi')) || '%'
       OR LOWER('ceravi') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'DP1-0051' OR account_number = 'DP1-0051')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'DP1-0051',
        dc_customer_id = 'DP1-0051',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── PWS Leeds Ltd (MOOV-0164) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('PWS Leeds Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('PWS Leeds Ltd'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('PWS Leeds Ltd')) || '%'
       OR LOWER('PWS Leeds Ltd') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0164' OR account_number = 'MOOV-0164')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0164',
        dc_customer_id = 'MOOV-0164',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Total Insignia Ltd (MOOV-0165) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Total Insignia Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Total Insignia Ltd'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Total Insignia Ltd')) || '%'
       OR LOWER('Total Insignia Ltd') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0165' OR account_number = 'MOOV-0165')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0165',
        dc_customer_id = 'MOOV-0165',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── USER (EFD1-0004) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('USER'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('USER'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('USER')) || '%'
       OR LOWER('USER') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'EFD1-0004' OR account_number = 'EFD1-0004')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'EFD1-0004',
        dc_customer_id = 'EFD1-0004',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── The Wild Meat Company ltd (MOOV-0166) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('The Wild Meat Company ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('The Wild Meat Company ltd'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('The Wild Meat Company ltd')) || '%'
       OR LOWER('The Wild Meat Company ltd') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0166' OR account_number = 'MOOV-0166')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0166',
        dc_customer_id = 'MOOV-0166',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Grace Test Account (MOOV-0167) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Grace Test Account'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Grace Test Account'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Grace Test Account')) || '%'
       OR LOWER('Grace Test Account') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0167' OR account_number = 'MOOV-0167')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0167',
        dc_customer_id = 'MOOV-0167',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Bob AI (MOOV-0168) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Bob AI'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Bob AI'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Bob AI')) || '%'
       OR LOWER('Bob AI') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0168' OR account_number = 'MOOV-0168')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0168',
        dc_customer_id = 'MOOV-0168',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Xplore Brands (MOOV-0169) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Xplore Brands'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Xplore Brands'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Xplore Brands')) || '%'
       OR LOWER('Xplore Brands') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0169' OR account_number = 'MOOV-0169')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0169',
        dc_customer_id = 'MOOV-0169',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Medicube (DQA1-0018) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Medicube'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Medicube'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Medicube')) || '%'
       OR LOWER('Medicube') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'DQA1-0018' OR account_number = 'DQA1-0018')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'DQA1-0018',
        dc_customer_id = 'DQA1-0018',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Sherwood Wholesale Foods Ltd (MOOV-0170) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Sherwood Wholesale Foods Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Sherwood Wholesale Foods Ltd'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Sherwood Wholesale Foods Ltd')) || '%'
       OR LOWER('Sherwood Wholesale Foods Ltd') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0170' OR account_number = 'MOOV-0170')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0170',
        dc_customer_id = 'MOOV-0170',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── 2023 (QDP1-0001) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('2023'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('2023'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('2023')) || '%'
       OR LOWER('2023') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'QDP1-0001' OR account_number = 'QDP1-0001')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'QDP1-0001',
        dc_customer_id = 'QDP1-0001',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── PROD EF COMPANY (TDP1-0001) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('PROD EF COMPANY'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('PROD EF COMPANY'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('PROD EF COMPANY')) || '%'
       OR LOWER('PROD EF COMPANY') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'TDP1-0001' OR account_number = 'TDP1-0001')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'TDP1-0001',
        dc_customer_id = 'TDP1-0001',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── EF (DE22-0009) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('EF'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('EF'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('EF')) || '%'
       OR LOWER('EF') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'DE22-0009' OR account_number = 'DE22-0009')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'DE22-0009',
        dc_customer_id = 'DE22-0009',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── NNU (DE22-0011) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('NNU'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('NNU'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('NNU')) || '%'
       OR LOWER('NNU') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'DE22-0011' OR account_number = 'DE22-0011')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'DE22-0011',
        dc_customer_id = 'DE22-0011',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Non Ninja Company (QDP1-0003) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Non Ninja Company'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Non Ninja Company'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Non Ninja Company')) || '%'
       OR LOWER('Non Ninja Company') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'QDP1-0003' OR account_number = 'QDP1-0003')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'QDP1-0003',
        dc_customer_id = 'QDP1-0003',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Test Ninja company (DP1-0053) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Test Ninja company'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Test Ninja company'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Test Ninja company')) || '%'
       OR LOWER('Test Ninja company') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'DP1-0053' OR account_number = 'DP1-0053')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'DP1-0053',
        dc_customer_id = 'DP1-0053',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Efutures Non Ninja company (DE22-0015) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Efutures Non Ninja company'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Efutures Non Ninja company'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Efutures Non Ninja company')) || '%'
       OR LOWER('Efutures Non Ninja company') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'DE22-0015' OR account_number = 'DE22-0015')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'DE22-0015',
        dc_customer_id = 'DE22-0015',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── EFUTURES TEST PORD NINJA COMPANY (TDP1-0005) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('EFUTURES TEST PORD NINJA COMPANY'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('EFUTURES TEST PORD NINJA COMPANY'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('EFUTURES TEST PORD NINJA COMPANY')) || '%'
       OR LOWER('EFUTURES TEST PORD NINJA COMPANY') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'TDP1-0005' OR account_number = 'TDP1-0005')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'TDP1-0005',
        dc_customer_id = 'TDP1-0005',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Test Efutures Non Ninja comp (TDP1-0007) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Test Efutures Non Ninja comp'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Test Efutures Non Ninja comp'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Test Efutures Non Ninja comp')) || '%'
       OR LOWER('Test Efutures Non Ninja comp') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'TDP1-0007' OR account_number = 'TDP1-0007')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'TDP1-0007',
        dc_customer_id = 'TDP1-0007',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Jamie Ferments Limited (MOOV-0171) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Jamie Ferments Limited'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Jamie Ferments Limited'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Jamie Ferments Limited')) || '%'
       OR LOWER('Jamie Ferments Limited') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0171' OR account_number = 'MOOV-0171')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0171',
        dc_customer_id = 'MOOV-0171',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Jezaya UK Limited (MOOV-0172) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Jezaya UK Limited'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Jezaya UK Limited'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Jezaya UK Limited')) || '%'
       OR LOWER('Jezaya UK Limited') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0172' OR account_number = 'MOOV-0172')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0172',
        dc_customer_id = 'MOOV-0172',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Wine Buffs Ltd (MOOV-0173) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Wine Buffs Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Wine Buffs Ltd'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Wine Buffs Ltd')) || '%'
       OR LOWER('Wine Buffs Ltd') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0173' OR account_number = 'MOOV-0173')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0173',
        dc_customer_id = 'MOOV-0173',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Doran Packaging Ltd (MOOV-0174) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Doran Packaging Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Doran Packaging Ltd'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Doran Packaging Ltd')) || '%'
       OR LOWER('Doran Packaging Ltd') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0174' OR account_number = 'MOOV-0174')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0174',
        dc_customer_id = 'MOOV-0174',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Purozo Limited (MOOV-0175) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Purozo Limited'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Purozo Limited'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Purozo Limited')) || '%'
       OR LOWER('Purozo Limited') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0175' OR account_number = 'MOOV-0175')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0175',
        dc_customer_id = 'MOOV-0175',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── My Shadow Ltd (MOOV-0177) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('My Shadow Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('My Shadow Ltd'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('My Shadow Ltd')) || '%'
       OR LOWER('My Shadow Ltd') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0177' OR account_number = 'MOOV-0177')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0177',
        dc_customer_id = 'MOOV-0177',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── U-Telecom Ltd (MOOV-0178) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('U-Telecom Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('U-Telecom Ltd'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('U-Telecom Ltd')) || '%'
       OR LOWER('U-Telecom Ltd') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0178' OR account_number = 'MOOV-0178')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0178',
        dc_customer_id = 'MOOV-0178',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Mala Leather (MOOV-0179) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Mala Leather'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Mala Leather'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Mala Leather')) || '%'
       OR LOWER('Mala Leather') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0179' OR account_number = 'MOOV-0179')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0179',
        dc_customer_id = 'MOOV-0179',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── CT Inc (DP1-0003) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('CT Inc'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('CT Inc'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('CT Inc')) || '%'
       OR LOWER('CT Inc') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'DP1-0003' OR account_number = 'DP1-0003')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'DP1-0003',
        dc_customer_id = 'DP1-0003',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Golf and Baby Limited (MOOV-0180) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Golf and Baby Limited'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Golf and Baby Limited'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Golf and Baby Limited')) || '%'
       OR LOWER('Golf and Baby Limited') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0180' OR account_number = 'MOOV-0180')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0180',
        dc_customer_id = 'MOOV-0180',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── IMEX China Trade Ltd (MOOV-0181) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('IMEX China Trade Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('IMEX China Trade Ltd'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('IMEX China Trade Ltd')) || '%'
       OR LOWER('IMEX China Trade Ltd') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0181' OR account_number = 'MOOV-0181')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0181',
        dc_customer_id = 'MOOV-0181',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Tanalia Ltd (MOOV-0182) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Tanalia Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Tanalia Ltd'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Tanalia Ltd')) || '%'
       OR LOWER('Tanalia Ltd') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0182' OR account_number = 'MOOV-0182')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0182',
        dc_customer_id = 'MOOV-0182',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Saturn Display Ltd (MOOV-0183) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Saturn Display Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Saturn Display Ltd'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Saturn Display Ltd')) || '%'
       OR LOWER('Saturn Display Ltd') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0183' OR account_number = 'MOOV-0183')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0183',
        dc_customer_id = 'MOOV-0183',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Fun Stickers Ltd (MOOV-0184) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Fun Stickers Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Fun Stickers Ltd'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Fun Stickers Ltd')) || '%'
       OR LOWER('Fun Stickers Ltd') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0184' OR account_number = 'MOOV-0184')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0184',
        dc_customer_id = 'MOOV-0184',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Perex Group Ltd (MOOV-0185) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Perex Group Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Perex Group Ltd'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Perex Group Ltd')) || '%'
       OR LOWER('Perex Group Ltd') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0185' OR account_number = 'MOOV-0185')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0185',
        dc_customer_id = 'MOOV-0185',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── TT Proturf Ltd (MOOV-0186) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('TT Proturf Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('TT Proturf Ltd'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('TT Proturf Ltd')) || '%'
       OR LOWER('TT Proturf Ltd') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0186' OR account_number = 'MOOV-0186')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0186',
        dc_customer_id = 'MOOV-0186',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Decorative Gardens Ltd (MOOV-0187) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Decorative Gardens Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Decorative Gardens Ltd'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Decorative Gardens Ltd')) || '%'
       OR LOWER('Decorative Gardens Ltd') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0187' OR account_number = 'MOOV-0187')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0187',
        dc_customer_id = 'MOOV-0187',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Isoclean Ltd (MOOV-0188) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Isoclean Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Isoclean Ltd'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Isoclean Ltd')) || '%'
       OR LOWER('Isoclean Ltd') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0188' OR account_number = 'MOOV-0188')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0188',
        dc_customer_id = 'MOOV-0188',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── C Com (DP1-0054) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('C Com'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('C Com'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('C Com')) || '%'
       OR LOWER('C Com') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'DP1-0054' OR account_number = 'DP1-0054')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'DP1-0054',
        dc_customer_id = 'DP1-0054',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Bodri Ltd (MOOV-0189) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Bodri Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Bodri Ltd'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Bodri Ltd')) || '%'
       OR LOWER('Bodri Ltd') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0189' OR account_number = 'MOOV-0189')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0189',
        dc_customer_id = 'MOOV-0189',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── 1st Class Uniforms & Workwear Ltd (MOOV-0190) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('1st Class Uniforms & Workwear Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('1st Class Uniforms & Workwear Ltd'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('1st Class Uniforms & Workwear Ltd')) || '%'
       OR LOWER('1st Class Uniforms & Workwear Ltd') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0190' OR account_number = 'MOOV-0190')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0190',
        dc_customer_id = 'MOOV-0190',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Carp Junky (MOOV-0191) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Carp Junky'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Carp Junky'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Carp Junky')) || '%'
       OR LOWER('Carp Junky') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0191' OR account_number = 'MOOV-0191')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0191',
        dc_customer_id = 'MOOV-0191',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Mackemshop Ltd (MOOV-0192) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Mackemshop Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Mackemshop Ltd'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Mackemshop Ltd')) || '%'
       OR LOWER('Mackemshop Ltd') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0192' OR account_number = 'MOOV-0192')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0192',
        dc_customer_id = 'MOOV-0192',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Test company CHN (TDP1-0009) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Test company CHN'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Test company CHN'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Test company CHN')) || '%'
       OR LOWER('Test company CHN') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'TDP1-0009' OR account_number = 'TDP1-0009')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'TDP1-0009',
        dc_customer_id = 'TDP1-0009',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── UK Wedding Favours Ltd (MOOV-0193) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('UK Wedding Favours Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('UK Wedding Favours Ltd'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('UK Wedding Favours Ltd')) || '%'
       OR LOWER('UK Wedding Favours Ltd') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0193' OR account_number = 'MOOV-0193')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0193',
        dc_customer_id = 'MOOV-0193',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Pure Crimson Design Limited (MOOV-0194) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Pure Crimson Design Limited'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Pure Crimson Design Limited'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Pure Crimson Design Limited')) || '%'
       OR LOWER('Pure Crimson Design Limited') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0194' OR account_number = 'MOOV-0194')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0194',
        dc_customer_id = 'MOOV-0194',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── ID Dance school sport & leisure wear limited (MOOV-0195) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('ID Dance school sport & leisure wear limited'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('ID Dance school sport & leisure wear limited'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('ID Dance school sport & leisure wear limited')) || '%'
       OR LOWER('ID Dance school sport & leisure wear limited') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0195' OR account_number = 'MOOV-0195')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0195',
        dc_customer_id = 'MOOV-0195',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Smilax Ltd (MOOV-0196) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Smilax Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Smilax Ltd'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Smilax Ltd')) || '%'
       OR LOWER('Smilax Ltd') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0196' OR account_number = 'MOOV-0196')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0196',
        dc_customer_id = 'MOOV-0196',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Slumba London (MOOV-0197) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Slumba London'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Slumba London'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Slumba London')) || '%'
       OR LOWER('Slumba London') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0197' OR account_number = 'MOOV-0197')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0197',
        dc_customer_id = 'MOOV-0197',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Amba Hydraulics Ltd (MOOV-0198) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Amba Hydraulics Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Amba Hydraulics Ltd'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Amba Hydraulics Ltd')) || '%'
       OR LOWER('Amba Hydraulics Ltd') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0198' OR account_number = 'MOOV-0198')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0198',
        dc_customer_id = 'MOOV-0198',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Ayurvedic Nature Care Ltd (MOOV-0199) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Ayurvedic Nature Care Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Ayurvedic Nature Care Ltd'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Ayurvedic Nature Care Ltd')) || '%'
       OR LOWER('Ayurvedic Nature Care Ltd') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0199' OR account_number = 'MOOV-0199')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0199',
        dc_customer_id = 'MOOV-0199',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Chopra Brothers Intl Group Ltd (MOOV-0200) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Chopra Brothers Intl Group Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Chopra Brothers Intl Group Ltd'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Chopra Brothers Intl Group Ltd')) || '%'
       OR LOWER('Chopra Brothers Intl Group Ltd') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0200' OR account_number = 'MOOV-0200')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0200',
        dc_customer_id = 'MOOV-0200',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Sofa Scene Ltd (MOOV-0201) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Sofa Scene Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Sofa Scene Ltd'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Sofa Scene Ltd')) || '%'
       OR LOWER('Sofa Scene Ltd') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0201' OR account_number = 'MOOV-0201')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0201',
        dc_customer_id = 'MOOV-0201',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Metal Work Supplies Ltd (MOOV-0202) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Metal Work Supplies Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Metal Work Supplies Ltd'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Metal Work Supplies Ltd')) || '%'
       OR LOWER('Metal Work Supplies Ltd') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0202' OR account_number = 'MOOV-0202')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0202',
        dc_customer_id = 'MOOV-0202',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Meilleure Decor Ltd (MOOV-0203) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Meilleure Decor Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Meilleure Decor Ltd'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Meilleure Decor Ltd')) || '%'
       OR LOWER('Meilleure Decor Ltd') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0203' OR account_number = 'MOOV-0203')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0203',
        dc_customer_id = 'MOOV-0203',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Taunton Trailers (MOOV-0204) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Taunton Trailers'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Taunton Trailers'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Taunton Trailers')) || '%'
       OR LOWER('Taunton Trailers') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0204' OR account_number = 'MOOV-0204')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0204',
        dc_customer_id = 'MOOV-0204',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Kitloop (Kitloop) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Kitloop'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Kitloop'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Kitloop')) || '%'
       OR LOWER('Kitloop') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'Kitloop' OR account_number = 'Kitloop')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'Kitloop',
        dc_customer_id = 'Kitloop',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Frith Holdings Ltd (MOOV-0205) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Frith Holdings Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Frith Holdings Ltd'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Frith Holdings Ltd')) || '%'
       OR LOWER('Frith Holdings Ltd') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0205' OR account_number = 'MOOV-0205')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0205',
        dc_customer_id = 'MOOV-0205',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── 24Up Ltd (MOOV-0206) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('24Up Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('24Up Ltd'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('24Up Ltd')) || '%'
       OR LOWER('24Up Ltd') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0206' OR account_number = 'MOOV-0206')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0206',
        dc_customer_id = 'MOOV-0206',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Scarlet Ltd (MOOV-0207) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Scarlet Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Scarlet Ltd'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Scarlet Ltd')) || '%'
       OR LOWER('Scarlet Ltd') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0207' OR account_number = 'MOOV-0207')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0207',
        dc_customer_id = 'MOOV-0207',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── J Adams Ltd (MOOV-0208) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('J Adams Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('J Adams Ltd'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('J Adams Ltd')) || '%'
       OR LOWER('J Adams Ltd') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0208' OR account_number = 'MOOV-0208')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0208',
        dc_customer_id = 'MOOV-0208',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Scarlet Ltd (Scarlet Ltd) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Scarlet Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Scarlet Ltd'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Scarlet Ltd')) || '%'
       OR LOWER('Scarlet Ltd') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'Scarlet Ltd' OR account_number = 'Scarlet Ltd')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'Scarlet Ltd',
        dc_customer_id = 'Scarlet Ltd',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Wolf Cycles Limited (MOOV-0209) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Wolf Cycles Limited'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Wolf Cycles Limited'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Wolf Cycles Limited')) || '%'
       OR LOWER('Wolf Cycles Limited') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0209' OR account_number = 'MOOV-0209')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0209',
        dc_customer_id = 'MOOV-0209',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Hilltop Boarding Kennels and Cat Hotel Ltd (MOOV-0210) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Hilltop Boarding Kennels and Cat Hotel Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Hilltop Boarding Kennels and Cat Hotel Ltd'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Hilltop Boarding Kennels and Cat Hotel Ltd')) || '%'
       OR LOWER('Hilltop Boarding Kennels and Cat Hotel Ltd') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0210' OR account_number = 'MOOV-0210')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0210',
        dc_customer_id = 'MOOV-0210',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Tam Demo Account (MOOV-0211) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Tam Demo Account'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Tam Demo Account'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Tam Demo Account')) || '%'
       OR LOWER('Tam Demo Account') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0211' OR account_number = 'MOOV-0211')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0211',
        dc_customer_id = 'MOOV-0211',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Truck Cranes Ltd (MOOV-0212) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Truck Cranes Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Truck Cranes Ltd'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Truck Cranes Ltd')) || '%'
       OR LOWER('Truck Cranes Ltd') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0212' OR account_number = 'MOOV-0212')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0212',
        dc_customer_id = 'MOOV-0212',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Simple Camper Vans Limited (MOOV-0213) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Simple Camper Vans Limited'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Simple Camper Vans Limited'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Simple Camper Vans Limited')) || '%'
       OR LOWER('Simple Camper Vans Limited') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0213' OR account_number = 'MOOV-0213')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0213',
        dc_customer_id = 'MOOV-0213',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Direct Imaging Supplies Limited (MOOV-0214) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Direct Imaging Supplies Limited'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Direct Imaging Supplies Limited'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Direct Imaging Supplies Limited')) || '%'
       OR LOWER('Direct Imaging Supplies Limited') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0214' OR account_number = 'MOOV-0214')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0214',
        dc_customer_id = 'MOOV-0214',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Bodies-in-Motion Dancewear (MOOV-0215) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Bodies-in-Motion Dancewear'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Bodies-in-Motion Dancewear'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Bodies-in-Motion Dancewear')) || '%'
       OR LOWER('Bodies-in-Motion Dancewear') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0215' OR account_number = 'MOOV-0215')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0215',
        dc_customer_id = 'MOOV-0215',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Marvellous Mushrooms (MOOV-0216) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Marvellous Mushrooms'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Marvellous Mushrooms'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Marvellous Mushrooms')) || '%'
       OR LOWER('Marvellous Mushrooms') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0216' OR account_number = 'MOOV-0216')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0216',
        dc_customer_id = 'MOOV-0216',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Blaze''s Bistro (MOOV-0217) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Blaze''s Bistro'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Blaze''s Bistro'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Blaze''s Bistro')) || '%'
       OR LOWER('Blaze''s Bistro') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0217' OR account_number = 'MOOV-0217')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0217',
        dc_customer_id = 'MOOV-0217',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Triumph Dorset Ltd (MOOV-0218) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Triumph Dorset Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Triumph Dorset Ltd'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Triumph Dorset Ltd')) || '%'
       OR LOWER('Triumph Dorset Ltd') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0218' OR account_number = 'MOOV-0218')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0218',
        dc_customer_id = 'MOOV-0218',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Cold Case Investigation Unit (MOOV-0219) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Cold Case Investigation Unit'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Cold Case Investigation Unit'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Cold Case Investigation Unit')) || '%'
       OR LOWER('Cold Case Investigation Unit') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0219' OR account_number = 'MOOV-0219')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0219',
        dc_customer_id = 'MOOV-0219',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── WPC Supplies Ltd (MOOV-0220) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('WPC Supplies Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('WPC Supplies Ltd'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('WPC Supplies Ltd')) || '%'
       OR LOWER('WPC Supplies Ltd') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0220' OR account_number = 'MOOV-0220')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0220',
        dc_customer_id = 'MOOV-0220',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── IOI Trading Ltd (MOOV-0221) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('IOI Trading Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('IOI Trading Ltd'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('IOI Trading Ltd')) || '%'
       OR LOWER('IOI Trading Ltd') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0221' OR account_number = 'MOOV-0221')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0221',
        dc_customer_id = 'MOOV-0221',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Trembling Madness Ltd (MOOV-0222) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Trembling Madness Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Trembling Madness Ltd'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Trembling Madness Ltd')) || '%'
       OR LOWER('Trembling Madness Ltd') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0222' OR account_number = 'MOOV-0222')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0222',
        dc_customer_id = 'MOOV-0222',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- ── Ashley House Printing Co Ltd (MOOV-0224) ──
  -- Step 1: Find matching existing customer (exact, normalised, or word match)
  SELECT id INTO v_cust_id FROM customers 
  WHERE LOWER(TRIM(business_name)) = LOWER(TRIM('Ashley House Printing Co Ltd'))
  LIMIT 1;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE REGEXP_REPLACE(LOWER(business_name), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g') = 
          REGEXP_REPLACE(LOWER('Ashley House Printing Co Ltd'), '(limited|ltd|plc|llc|uk|t/a|[^a-z0-9])', '', 'g')
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  IF v_cust_id IS NULL THEN
    SELECT id INTO v_cust_id FROM customers 
    WHERE LOWER(business_name) LIKE '%' || LOWER(TRIM('Ashley House Printing Co Ltd')) || '%'
       OR LOWER('Ashley House Printing Co Ltd') LIKE '%' || LOWER(TRIM(business_name)) || '%'
    ORDER BY LENGTH(business_name) ASC LIMIT 1;
  END IF;

  -- Step 2: Update existing customer ONLY
  IF v_cust_id IS NOT NULL THEN
    -- Clear target ID from any other record to avoid duplicate conflicts
    UPDATE customers 
    SET dc_customer_id = NULL 
    WHERE (dc_customer_id = 'MOOV-0224' OR account_number = 'MOOV-0224')
      AND id != v_cust_id;

    -- Set both account_number and dc_customer_id to the exact target ID
    UPDATE customers 
    SET account_number = 'MOOV-0224',
        dc_customer_id = 'MOOV-0224',
        updated_at = NOW()
    WHERE id = v_cust_id;
  END IF;

  -- Ensure Europa PLC is explicitly set to 'Europa'
  UPDATE customers 
  SET account_number = 'Europa',
      dc_customer_id = 'Europa',
      updated_at = NOW()
  WHERE LOWER(business_name) LIKE '%europa%';

END $$;
