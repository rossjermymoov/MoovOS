-- Migration 330: Purge Corrupt Billing Aliases and Accurately Re-Link All Charges & Shipments
-- Ensures charges resolve strictly to the customer matching the webhook raw payload.

-- 1. Clean billing_aliases on all customers so old/loose codes (like 0220 on Hairbitz) are wiped
UPDATE customers 
SET billing_aliases = ARRAY[business_name, account_number, dc_customer_id]
WHERE billing_aliases IS NOT NULL AND array_length(billing_aliases, 1) > 0;

-- 2. Explicitly ensure Hairbitz has HOF-0029 and no MOOV-0220 references
UPDATE customers 
SET account_number = 'HOF-0029',
    dc_customer_id = 'HOF-0029',
    billing_aliases = ARRAY['Hairbitz Ltd', 'HOF-0029'],
    updated_at = NOW()
WHERE LOWER(business_name) LIKE '%hairbit%';

-- 3. Re-link charges directly from raw_payload
DO $$
BEGIN
  -- Reassign charges to the customer matching the exact customer_dc_id in raw_payload
  UPDATE charges ch
  SET customer_id = c.id
  FROM customers c
  WHERE (
      LOWER(TRIM(c.dc_customer_id)) = LOWER(TRIM(COALESCE(
        ch.raw_payload->'billing'->>'customer_dc_id',
        ch.raw_payload->>'customer_dc_id',
        ch.raw_payload->'shipment'->'billing'->>'customer_dc_id',
        ch.raw_payload->'request'->'shipment'->'billing'->>'customer_dc_id',
        ch.raw_payload->>'account_number'
      )))
      OR
      LOWER(TRIM(c.account_number)) = LOWER(TRIM(COALESCE(
        ch.raw_payload->'billing'->>'customer_dc_id',
        ch.raw_payload->>'customer_dc_id',
        ch.raw_payload->'shipment'->'billing'->>'customer_dc_id',
        ch.raw_payload->'request'->'shipment'->'billing'->>'customer_dc_id',
        ch.raw_payload->>'account_number'
      )))
    )
    AND COALESCE(
      ch.raw_payload->'billing'->>'customer_dc_id',
      ch.raw_payload->>'customer_dc_id',
      ch.raw_payload->'shipment'->'billing'->>'customer_dc_id',
      ch.raw_payload->'request'->'shipment'->'billing'->>'customer_dc_id',
      ch.raw_payload->>'account_number'
    ) IS NOT NULL
    AND COALESCE(
      ch.raw_payload->'billing'->>'customer_dc_id',
      ch.raw_payload->>'customer_dc_id',
      ch.raw_payload->'shipment'->'billing'->>'customer_dc_id',
      ch.raw_payload->'request'->'shipment'->'billing'->>'customer_dc_id',
      ch.raw_payload->>'account_number'
    ) != '';

  -- Unset customer_id for any charge whose raw_payload DC ID does not match any customer
  UPDATE charges ch
  SET customer_id = NULL
  WHERE COALESCE(
      ch.raw_payload->'billing'->>'customer_dc_id',
      ch.raw_payload->>'customer_dc_id',
      ch.raw_payload->'shipment'->'billing'->>'customer_dc_id',
      ch.raw_payload->'request'->'shipment'->'billing'->>'customer_dc_id',
      ch.raw_payload->>'account_number'
    ) IS NOT NULL
    AND COALESCE(
      ch.raw_payload->'billing'->>'customer_dc_id',
      ch.raw_payload->>'customer_dc_id',
      ch.raw_payload->'shipment'->'billing'->>'customer_dc_id',
      ch.raw_payload->'request'->'shipment'->'billing'->>'customer_dc_id',
      ch.raw_payload->>'account_number'
    ) != ''
    AND NOT EXISTS (
      SELECT 1 FROM customers c 
      WHERE LOWER(TRIM(c.dc_customer_id)) = LOWER(TRIM(COALESCE(
        ch.raw_payload->'billing'->>'customer_dc_id',
        ch.raw_payload->>'customer_dc_id',
        ch.raw_payload->'shipment'->'billing'->>'customer_dc_id',
        ch.raw_payload->'request'->'shipment'->'billing'->>'customer_dc_id',
        ch.raw_payload->>'account_number'
      )))
      OR LOWER(TRIM(c.account_number)) = LOWER(TRIM(COALESCE(
        ch.raw_payload->'billing'->>'customer_dc_id',
        ch.raw_payload->>'customer_dc_id',
        ch.raw_payload->'shipment'->'billing'->>'customer_dc_id',
        ch.raw_payload->'request'->'shipment'->'billing'->>'customer_dc_id',
        ch.raw_payload->>'account_number'
      )))
    );

  -- 4. Re-sync shipments with updated charges
  UPDATE shipments s
  SET customer_id = ch.customer_id
  FROM charges ch
  WHERE s.id = ch.shipment_id
    AND (s.customer_id IS DISTINCT FROM ch.customer_id);

END $$;
