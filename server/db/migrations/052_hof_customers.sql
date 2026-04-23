-- 052_hof_customers.sql
-- Creates 25 new customer records from HOF- prefixed entries in the pricing CSV.
-- HOF- prefix stripped for business_name; original HOF- name stored as billing alias
-- so legacy webhook routing continues to work.

DO $$
DECLARE
  v_max INTEGER;
  v_seq INTEGER;

  PROCEDURE make_customer(p_name TEXT, p_alias TEXT) AS $p$
  DECLARE v_id UUID; v_acct TEXT;
  BEGIN
    -- Skip if already exists by name
    IF EXISTS (SELECT 1 FROM customers WHERE LOWER(business_name) = LOWER(p_name)) THEN
      RAISE NOTICE 'Skipping % — already exists', p_name;
      RETURN;
    END IF;
    INSERT INTO customers (business_name, company_type, tier, account_status, billing_cycle, payment_terms_days, credit_limit, country)
    VALUES (p_name, 'limited_company', 'bronze', 'active', 'monthly', 30, 5000, 'United Kingdom')
    RETURNING id, account_number INTO v_id, v_acct;
    -- Store the HOF- original as a billing alias
    UPDATE customers SET billing_aliases = ARRAY[p_alias] WHERE id = v_id;
    RAISE NOTICE 'Created % as %', p_name, v_acct;
  END;
  $p$;

BEGIN
  CALL make_customer('Phils Plumbing',                              'HOF - Phils Plumbing');
  CALL make_customer('Chipex',                                      'HOF - Chipex');
  CALL make_customer('Clearance Car Parts Ltd',                     'HOF - Clearance Car Parts Ltd');
  CALL make_customer('Autotag Trading Ltd',                         'HOF - Autotag Trading Ltd');
  CALL make_customer('UK Optics Ltd',                               'HOF - UK Optics Ltd');
  CALL make_customer('Pics On Canvas',                              'HOF - Pics On Canvas');
  CALL make_customer('Sinatec UK',                                  'HOF - Sinatec UK');
  CALL make_customer('Vehicle Safety and Warning Distribution Ltd', 'HOF - Vehicle Safety and Warning Distribution Ltd');
  CALL make_customer('Granola Kitchen',                             'HOF - Granola Kitchen');
  CALL make_customer('Hairbitz Ltd',                                'HOF - Hairbitz Ltd');
  CALL make_customer('Marks Tey Discount Pet Foods',                'HOF - Marks Tey Discount Pet Foods');
  CALL make_customer('The Vapour Hut',                              'HOF - The Vapour Hut');
  CALL make_customer('Grupoerik',                                   'HOF-Grupoerik');
  CALL make_customer('JOY Asian Food and Grocery Limited',          'HOF - JOY Asian Food & Grocery Limited');
  CALL make_customer('MP Homewares Ltd',                            'HOF - MP Homewares Ltd');
  CALL make_customer('Edmundson Electrical Leeds',                  'HOF - EDMUNDSON ELECTRICAL LEEDS');
  CALL make_customer('Lifemax Limited',                             'HOF - Lifemax Limited');
  CALL make_customer('3Devices Ltd',                                'HOF - 3Devices ltd');
  CALL make_customer('Richard Wheatley Ltd',                        'HOF - RICHARD WHEATLEY LTD');
  CALL make_customer('Adrenalin 4x4 Ltd',                          'HOF - Adrenalin 4x4 Ltd');
  CALL make_customer('Candy Drops',                                 'HOF - Candy Drops');
  CALL make_customer('B2B Workwear and Janitorial Limited',         'HOF - B2B Workwear & Janitorial Limited');
  CALL make_customer('Lather Up UK',                                'HOF - Lather Up Uk');
  CALL make_customer('Raw Dog Store Ltd',                           'HOF - Raw Dog Store Ltd');
  CALL make_customer('DDPL Kings Farm Foods',                       'HOF - DDPL Kings Farm Foods');
END $$;
