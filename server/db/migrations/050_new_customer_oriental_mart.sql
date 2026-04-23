-- 050_new_customer_oriental_mart.sql
-- Creates Oriental Mart from signed account application form (22 July 2024).
-- Legal name: Orientalmart UK Limited. Trading as: Oriental Mart.
-- business_name stored as "Oriental Mart" to match pricing CSV (ID 1836)
-- so rates seed automatically on next restart.

DO $$
DECLARE
  v_next_seq  INTEGER;
  v_acct      VARCHAR(20);
  v_cust_id   UUID;
BEGIN
  SELECT COALESCE(
    MAX(CAST(REGEXP_REPLACE(account_number, '[^0-9]', '', 'g') AS INTEGER)), 0
  ) + 1
  INTO v_next_seq
  FROM customers
  WHERE account_number ~ '^MOOV-[0-9]+$';

  v_acct := 'MOOV-' || LPAD(v_next_seq::text, 4, '0');

  INSERT INTO customers (
    account_number, business_name, company_type,
    company_reg_number, vat_number,
    address_line_1, city, county, postcode, country,
    phone_number, primary_email, accounts_email,
    tier, account_status, billing_cycle, payment_terms_days,
    credit_limit, date_onboarded
  ) VALUES (
    v_acct, 'Oriental Mart', 'limited_company',
    '6443285', '934662996',
    'Trent Lane', 'Nottingham', 'Nottinghamshire', 'NG2 4DS', 'United Kingdom',
    '01156487755', 'sales@orientalmart.co.uk', 'accounts@orientalmart.co.uk',
    'silver', 'active', 'monthly', 30,
    10000, '2024-07-22'
  )
  ON CONFLICT (account_number) DO NOTHING
  RETURNING id INTO v_cust_id;

  -- Two contacts: primary (Amanda Yuen) and accounts (Sherman Cheung)
  IF v_cust_id IS NOT NULL THEN
    INSERT INTO customer_contacts (customer_id, full_name, email_address, phone_number, job_title, is_main_contact, is_finance_contact)
    VALUES
      (v_cust_id, 'Amanda Yuen',   'sales@orientalmart.co.uk',    '01156487755', 'Sales Contact',   true,  false),
      (v_cust_id, 'Sherman Cheung','accounts@orientalmart.co.uk', '01159509680', 'Accounts Contact',false, true);
  END IF;

  RAISE NOTICE 'Created Oriental Mart as %', v_acct;
END $$;
