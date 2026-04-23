-- 048_new_customers_jezaya_perex.sql
-- Creates two new customer records from signed account application forms.

DO $$
DECLARE
  v_next_seq  INTEGER;
  v_acct_1    VARCHAR(20);
  v_acct_2    VARCHAR(20);
BEGIN
  -- Find next available account number sequence
  SELECT COALESCE(
    MAX(CAST(REGEXP_REPLACE(account_number, '[^0-9]', '', 'g') AS INTEGER)), 0
  ) + 1
  INTO v_next_seq
  FROM customers
  WHERE account_number ~ '^MOOV-[0-9]+$';

  v_acct_1 := 'MOOV-' || LPAD(v_next_seq::text, 4, '0');
  v_acct_2 := 'MOOV-' || LPAD((v_next_seq + 1)::text, 4, '0');

  -- ── JEZAYA (UK) LIMITED ──────────────────────────────────────────────────────
  -- Signed 30 March 2026. Already in pricing CSV as "Jezaya UK Limited" (ID 2897).
  -- Authorised rep: Ammar Iqbal. Drop-off customer, ~20 parcels/week.
  INSERT INTO customers (
    account_number, business_name, company_type,
    company_reg_number, vat_number, eori_number,
    address_line_1, city, county, postcode, country,
    phone_number, primary_email, accounts_email,
    tier, account_status, billing_cycle, payment_terms_days,
    credit_limit, date_onboarded
  ) VALUES (
    v_acct_1, 'Jezaya UK Limited', 'limited_company',
    '07942567', '131409253', '131409253000',
    'Unit 9, Haywards Industrial Park, Orton Way', 'Birmingham', 'West Midlands', 'B35 7BT', 'United Kingdom',
    '03337721888', 'ammar@jezaya.com', 'accountsuk@jezaya.com',
    'bronze', 'active', 'monthly', 30,
    5000, '2026-03-30'
  )
  ON CONFLICT (account_number) DO NOTHING;

  -- ── PEREX GROUP LTD ──────────────────────────────────────────────────────────
  -- Signed 17 April 2026. 50–100 parcels/week. Perishable goods.
  -- Contact: Daniel Peresztegi. Preferred payment: bank transfer.
  INSERT INTO customers (
    account_number, business_name, company_type,
    company_reg_number, eori_number,
    address_line_1, city, county, postcode, country,
    phone_number, primary_email, accounts_email,
    tier, account_status, billing_cycle, payment_terms_days,
    credit_limit, date_onboarded
  ) VALUES (
    v_acct_2, 'Perex Group Ltd', 'limited_company',
    '15586120', '481593562',
    '69 Ashgrove Road', 'Bristol', 'Somerset', 'BS7 9LF', 'United Kingdom',
    '07903697189', 'info@perex.co.uk', 'info@perex.co.uk',
    'bronze', 'active', 'monthly', 30,
    5000, '2026-04-17'
  )
  ON CONFLICT (account_number) DO NOTHING;

  RAISE NOTICE 'Created customers: % (Jezaya UK Limited) and % (Perex Group Ltd)', v_acct_1, v_acct_2;
END $$;
