-- 052_hof_customers.sql
-- Creates 25 new customer records from HOF- pricing CSV entries.
-- HOF- prefix stripped for business_name; original stored as billing alias.

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT * FROM (VALUES
    ('Phils Plumbing',                              'HOF - Phils Plumbing'),
    ('Chipex',                                      'HOF - Chipex'),
    ('Clearance Car Parts Ltd',                     'HOF - Clearance Car Parts Ltd'),
    ('Autotag Trading Ltd',                         'HOF - Autotag Trading Ltd'),
    ('UK Optics Ltd',                               'HOF - UK Optics Ltd'),
    ('Pics On Canvas',                              'HOF - Pics On Canvas'),
    ('Sinatec UK',                                  'HOF - Sinatec UK'),
    ('Vehicle Safety and Warning Distribution Ltd', 'HOF - Vehicle Safety and Warning Distribution Ltd'),
    ('Granola Kitchen',                             'HOF - Granola Kitchen'),
    ('Hairbitz Ltd',                                'HOF - Hairbitz Ltd'),
    ('Marks Tey Discount Pet Foods',                'HOF - Marks Tey Discount Pet Foods'),
    ('The Vapour Hut',                              'HOF - The Vapour Hut'),
    ('Grupoerik',                                   'HOF-Grupoerik'),
    ('JOY Asian Food and Grocery Limited',          'HOF - JOY Asian Food & Grocery Limited'),
    ('MP Homewares Ltd',                            'HOF - MP Homewares Ltd'),
    ('Edmundson Electrical Leeds',                  'HOF - EDMUNDSON ELECTRICAL LEEDS'),
    ('Lifemax Limited',                             'HOF - Lifemax Limited'),
    ('3Devices Ltd',                                'HOF - 3Devices ltd'),
    ('Richard Wheatley Ltd',                        'HOF - RICHARD WHEATLEY LTD'),
    ('Adrenalin 4x4 Ltd',                           'HOF - Adrenalin 4x4 Ltd'),
    ('Candy Drops',                                 'HOF - Candy Drops'),
    ('B2B Workwear and Janitorial Limited',         'HOF - B2B Workwear & Janitorial Limited'),
    ('Lather Up UK',                                'HOF - Lather Up Uk'),
    ('Raw Dog Store Ltd',                           'HOF - Raw Dog Store Ltd'),
    ('DDPL Kings Farm Foods',                       'HOF - DDPL Kings Farm Foods')
  ) AS t(biz_name, alias)
  LOOP
    IF NOT EXISTS (SELECT 1 FROM customers WHERE LOWER(business_name) = LOWER(r.biz_name)) THEN
      INSERT INTO customers (
        business_name, company_type, tier, account_status,
        billing_cycle, payment_terms_days, credit_limit,
        country, billing_aliases
      ) VALUES (
        r.biz_name, 'limited_company', 'bronze', 'active',
        'monthly', 30, 5000,
        'United Kingdom', ARRAY[r.alias]
      );
      RAISE NOTICE 'Created: %', r.biz_name;
    ELSE
      RAISE NOTICE 'Skipped (exists): %', r.biz_name;
    END IF;
  END LOOP;
END $$;
