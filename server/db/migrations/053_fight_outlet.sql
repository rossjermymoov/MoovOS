-- 053_fight_outlet.sql
-- Creates Fight Outlet customer (CSV ID 1633, 27 DPD rate rows).

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM customers WHERE LOWER(business_name) = 'fight outlet') THEN
    INSERT INTO customers (
      business_name, company_type, tier, account_status,
      billing_cycle, payment_terms_days, credit_limit,
      country, postcode
    ) VALUES (
      'Fight Outlet', 'limited_company', 'bronze', 'active',
      'monthly', 30, 5000, 'United Kingdom', 'TBC'
    );
    RAISE NOTICE 'Created: Fight Outlet';
  ELSE
    RAISE NOTICE 'Skipped (exists): Fight Outlet';
  END IF;
END $$;
