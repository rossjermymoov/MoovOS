-- 081_wine_buffs_customer_and_rates.sql
-- Creates/updates Wine Buffs Ltd (MOOV-0173) with full contact details,
-- company registration info, and their DHL domestic rate card from the
-- signed rate sheet (50 parcels/week volume tier).
--
-- Rate sources (from rate sheet):
--   DHL Next Day Zone A & B : £5.60 first / £3.90 sub
--   DHL Next Day Zone C     : £15.00 first / £8.00 sub
--   DHL Next Day Zone D     : £15.00 first / £8.00 sub
--   DHL Small BagIt  (1kg)  : £4.20 flat
--   DHL Medium BagIt (2kg)  : £4.30 flat
--   DHL Large BagIt  (5kg)  : £4.40 flat

DO $$
DECLARE
  v_customer_id       UUID;
  v_courier_id        INTEGER;
  v_svc_ndper         INTEGER;
  v_svc_1kg           INTEGER;
  v_svc_2kg           INTEGER;
  v_svc_5kg           INTEGER;
BEGIN

  -- ── 1. Upsert customer record ─────────────────────────────────────────────
  INSERT INTO customers (
    account_number, business_name, company_type,
    company_reg_number, vat_number, eori_number,
    address_line_1, city, county, postcode, country,
    phone_number, primary_email, accounts_email,
    tier, account_status, billing_cycle, payment_terms_days,
    credit_limit
  ) VALUES (
    'MOOV-0173', 'Wine Buffs Ltd', 'limited_company',
    '04749299', 'GB812467340', 'GB812467340000',
    '19 Hurleston Way', 'Nantwich', 'Cheshire', 'CW5 6XN', 'United Kingdom',
    '07740855990', 'info@auswinesonline.co.uk', 'info@auswinesonline.co.uk',
    'bronze', 'active', 'monthly', 30, 0
  )
  ON CONFLICT (account_number) DO UPDATE SET
    business_name      = EXCLUDED.business_name,
    company_reg_number = EXCLUDED.company_reg_number,
    vat_number         = EXCLUDED.vat_number,
    eori_number        = EXCLUDED.eori_number,
    address_line_1     = EXCLUDED.address_line_1,
    city               = EXCLUDED.city,
    county             = EXCLUDED.county,
    postcode           = EXCLUDED.postcode,
    country            = EXCLUDED.country,
    phone_number       = EXCLUDED.phone_number,
    primary_email      = EXCLUDED.primary_email,
    accounts_email     = EXCLUDED.accounts_email;

  SELECT id INTO v_customer_id FROM customers WHERE account_number = 'MOOV-0173';

  RAISE NOTICE '081: Wine Buffs Ltd customer_id = %', v_customer_id;

  -- ── 2. Primary & accounts contact — Brian Marshall ───────────────────────
  BEGIN
    INSERT INTO customer_contacts (
      customer_id, full_name, phone_number, email_address,
      is_main_contact, is_finance_contact
    ) VALUES (
      v_customer_id, 'Brian Marshall', '07740855990',
      'info@auswinesonline.co.uk', true, true
    );
  EXCEPTION WHEN unique_violation THEN
    UPDATE customer_contacts SET
      phone_number       = '07740855990',
      email_address      = 'info@auswinesonline.co.uk',
      is_finance_contact = true
    WHERE customer_id = v_customer_id
      AND LOWER(full_name) LIKE '%brian marshall%';
  END;

  -- ── 3. Look up DHL courier + service IDs from the new tables ─────────────
  SELECT id INTO v_courier_id FROM couriers WHERE UPPER(code) = 'DHL' LIMIT 1;

  SELECT id INTO v_svc_ndper FROM courier_services WHERE service_code ILIKE 'DHL-NDPER'  LIMIT 1;
  SELECT id INTO v_svc_1kg   FROM courier_services WHERE service_code ILIKE 'DHL-1KGC2C' LIMIT 1;
  SELECT id INTO v_svc_2kg   FROM courier_services WHERE service_code ILIKE 'DHL-2KGC2C' LIMIT 1;
  SELECT id INTO v_svc_5kg   FROM courier_services WHERE service_code ILIKE 'DHL-5KGC2C' LIMIT 1;

  IF v_courier_id IS NULL THEN
    RAISE EXCEPTION '081: DHL courier not found in couriers table — aborting';
  END IF;

  RAISE NOTICE '081: courier_id=%, ndper=%, 1kg=%, 2kg=%, 5kg=%',
    v_courier_id, v_svc_ndper, v_svc_1kg, v_svc_2kg, v_svc_5kg;

  -- ── 4. DHL Next Day (DHL-NDPER) rates — Zone A/B/C/D ────────────────────
  -- Zone A & B both priced at £5.60 / £3.90 sub
  INSERT INTO customer_rates (
    customer_id, courier_id, courier_code, courier_name,
    service_id, service_code, service_name,
    zone_id, zone_name, weight_class_id, weight_class_name,
    price, price_sub
  ) VALUES
    (v_customer_id, v_courier_id, 'DHL', 'DHL',
     COALESCE(v_svc_ndper, 0), 'DHL-NDPER', 'DHL Next Day Perishable',
     0, 'Zone A', 0, 'Parcel', 5.60, 3.90),
    (v_customer_id, v_courier_id, 'DHL', 'DHL',
     COALESCE(v_svc_ndper, 0), 'DHL-NDPER', 'DHL Next Day Perishable',
     0, 'Zone B', 0, 'Parcel', 5.60, 3.90),
    (v_customer_id, v_courier_id, 'DHL', 'DHL',
     COALESCE(v_svc_ndper, 0), 'DHL-NDPER', 'DHL Next Day Perishable',
     0, 'Zone C', 0, 'Parcel', 15.00, 8.00),
    (v_customer_id, v_courier_id, 'DHL', 'DHL',
     COALESCE(v_svc_ndper, 0), 'DHL-NDPER', 'DHL Next Day Perishable',
     0, 'Zone D', 0, 'Parcel', 15.00, 8.00)
  ON CONFLICT (customer_id, service_id, zone_name, weight_class_name)
  DO UPDATE SET
    price     = EXCLUDED.price,
    price_sub = EXCLUDED.price_sub;

  -- ── 5. DHL BagIt rates — flat, Zones A&B (Mainland) ─────────────────────
  -- Small BagIt 1kg: £4.20
  IF v_svc_1kg IS NOT NULL THEN
    INSERT INTO customer_rates (
      customer_id, courier_id, courier_code, courier_name,
      service_id, service_code, service_name,
      zone_id, zone_name, weight_class_id, weight_class_name,
      price, price_sub
    ) VALUES
      (v_customer_id, v_courier_id, 'DHL', 'DHL',
       v_svc_1kg, 'DHL-1KGC2C', 'DHL Small BagIt',
       0, 'Zone A', 0, 'Small BagIt', 4.20, NULL),
      (v_customer_id, v_courier_id, 'DHL', 'DHL',
       v_svc_1kg, 'DHL-1KGC2C', 'DHL Small BagIt',
       0, 'Zone B', 0, 'Small BagIt', 4.20, NULL)
    ON CONFLICT (customer_id, service_id, zone_name, weight_class_name)
    DO UPDATE SET price = EXCLUDED.price, price_sub = NULL;
  END IF;

  -- Medium BagIt 2kg: £4.30
  IF v_svc_2kg IS NOT NULL THEN
    INSERT INTO customer_rates (
      customer_id, courier_id, courier_code, courier_name,
      service_id, service_code, service_name,
      zone_id, zone_name, weight_class_id, weight_class_name,
      price, price_sub
    ) VALUES
      (v_customer_id, v_courier_id, 'DHL', 'DHL',
       v_svc_2kg, 'DHL-2KGC2C', 'DHL Medium BagIt',
       0, 'Zone A', 0, 'Medium BagIt', 4.30, NULL),
      (v_customer_id, v_courier_id, 'DHL', 'DHL',
       v_svc_2kg, 'DHL-2KGC2C', 'DHL Medium BagIt',
       0, 'Zone B', 0, 'Medium BagIt', 4.30, NULL)
    ON CONFLICT (customer_id, service_id, zone_name, weight_class_name)
    DO UPDATE SET price = EXCLUDED.price, price_sub = NULL;
  END IF;

  -- Large BagIt 5kg: £4.40
  IF v_svc_5kg IS NOT NULL THEN
    INSERT INTO customer_rates (
      customer_id, courier_id, courier_code, courier_name,
      service_id, service_code, service_name,
      zone_id, zone_name, weight_class_id, weight_class_name,
      price, price_sub
    ) VALUES
      (v_customer_id, v_courier_id, 'DHL', 'DHL',
       v_svc_5kg, 'DHL-5KGC2C', 'DHL Large BagIt',
       0, 'Zone A', 0, 'Large BagIt', 4.40, NULL),
      (v_customer_id, v_courier_id, 'DHL', 'DHL',
       v_svc_5kg, 'DHL-5KGC2C', 'DHL Large BagIt',
       0, 'Zone B', 0, 'Large BagIt', 4.40, NULL)
    ON CONFLICT (customer_id, service_id, zone_name, weight_class_name)
    DO UPDATE SET price = EXCLUDED.price, price_sub = NULL;
  END IF;

  -- ── 6. Carrier link so DHL shows active in the pricing tab ───────────────
  INSERT INTO customer_carrier_links (customer_id, courier_id, carrier_rate_card_id)
  SELECT
    v_customer_id,
    c.id,
    (SELECT id FROM carrier_rate_cards WHERE courier_id = c.id AND is_master = true LIMIT 1)
  FROM couriers c
  WHERE UPPER(c.code) = 'DHL'
  ON CONFLICT (customer_id, courier_id) DO NOTHING;

  RAISE NOTICE '081: Wine Buffs Ltd complete — customer_id=%', v_customer_id;

END $$;
