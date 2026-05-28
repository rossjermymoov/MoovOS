-- Migration 260: Set London Grow to multi-parcel pricing mode
--
-- London Grow ship multiple parcels per consignment and their rate card uses
-- a single sub rate for all boxes (not a first+subsequent model).
-- Setting parcel_pricing_mode = 'multi' means every parcel on a multi-parcel
-- shipment is billed at price_sub, not at price for the first and price_sub
-- for subsequent ones.
--
-- This also reprices any existing unverified/unbilled charges for London Grow
-- that were created with the wrong first-parcel rate so their next invoice
-- reflects the correct multi-parcel pricing.

-- 1. Switch the customer to multi-parcel mode
UPDATE customers
SET    parcel_pricing_mode = 'multi',
       updated_at          = NOW()
WHERE  business_name ILIKE '%london grow%';

DO $$
DECLARE
  v_customer_id UUID;
  v_updated     INTEGER;
BEGIN
  SELECT id INTO v_customer_id
  FROM   customers
  WHERE  business_name ILIKE '%london grow%'
  LIMIT  1;

  IF v_customer_id IS NULL THEN
    RAISE NOTICE 'Migration 260: London Grow customer not found — skipping charge reprice';
    RETURN;
  END IF;

  RAISE NOTICE 'Migration 260: London Grow customer_id = %', v_customer_id;

  -- 2. Reprice unbilled, unverified courier charges where price_sub was available
  --    but the first-parcel rate (price) was used instead.
  --    We update sell_price/price on charges that:
  --      - belong to London Grow
  --      - are unverified (not yet invoiced)
  --      - are not cancelled
  --      - are charge_type = 'courier' (base freight)
  --      - have a matching customer_rate with a price_sub set
  --    We set price = price_sub so that the next invoice reflects multi pricing.
  --
  --    NOTE: This only touches charges that were priced at the first-parcel
  --    rate AND have a sub rate available. Charges already at the sub rate
  --    (or with no sub rate) are untouched.
  UPDATE charges ch
  SET    price      = cr.price_sub,
         sell_price = cr.price_sub,
         updated_at = NOW()
  FROM   customer_rates cr
  WHERE  ch.customer_id  = v_customer_id
    AND  ch.charge_type  = 'courier'
    AND  ch.verified     = false
    AND  ch.cancelled    = false
    AND  ch.billed       = false
    AND  cr.customer_id  = v_customer_id
    AND  cr.service_code = ch.service_code
    AND  cr.price_sub    IS NOT NULL
    AND  ch.price        = cr.price        -- was charged at the first-parcel rate
    AND  cr.price_sub    < cr.price;       -- sub rate is actually cheaper

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RAISE NOTICE 'Migration 260: repriced % unbilled London Grow charge(s) to sub rate', v_updated;

  RAISE NOTICE 'Migration 260 complete.';
END $$;
