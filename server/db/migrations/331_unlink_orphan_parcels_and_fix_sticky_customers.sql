-- Migration 331: Strict unlinking of mismatched customer parcels & charges
-- Ensures webhooks from other/unassigned customers (like MOOV-0220 / WPC Supplies)
-- are completely unlinked from Hairbitz (HOF-0029) or any other mismatched account.

DO $$
DECLARE
  v_hairbitz_id UUID;
BEGIN
  SELECT id INTO v_hairbitz_id FROM customers 
  WHERE dc_customer_id = 'HOF-0029' OR account_number = 'HOF-0029' LIMIT 1;

  -- 1. Unlink any charges assigned to Hairbitz where payload specifies a different DC ID (e.g. MOOV-0220)
  IF v_hairbitz_id IS NOT NULL THEN
    UPDATE charges ch
    SET customer_id = NULL,
        price = NULL,
        price_auto = false,
        price_failure_reason = 'Customer not found: ' || COALESCE(
          ch.raw_payload->'billing'->>'customer_dc_id',
          ch.raw_payload->'shipment'->'billing'->>'customer_dc_id',
          ch.raw_payload->'request'->'shipment'->'billing'->>'customer_dc_id',
          ch.raw_payload->>'customer_dc_id',
          ch.raw_payload->>'account_number',
          'unassigned'
        ),
        updated_at = NOW()
    WHERE ch.customer_id = v_hairbitz_id
      AND (
        COALESCE(
          ch.raw_payload->'billing'->>'customer_dc_id',
          ch.raw_payload->'shipment'->'billing'->>'customer_dc_id',
          ch.raw_payload->'request'->'shipment'->'billing'->>'customer_dc_id',
          ch.raw_payload->>'customer_dc_id',
          ch.raw_payload->>'account_number'
        ) IS NOT NULL
        AND COALESCE(
          ch.raw_payload->'billing'->>'customer_dc_id',
          ch.raw_payload->'shipment'->'billing'->>'customer_dc_id',
          ch.raw_payload->'request'->'shipment'->'billing'->>'customer_dc_id',
          ch.raw_payload->>'customer_dc_id',
          ch.raw_payload->>'account_number'
        ) NOT IN ('HOF-0029', 'HOF0029')
      );

    -- 2. Unlink shipments assigned to Hairbitz where payload specifies a different DC ID
    UPDATE shipments s
    SET customer_id = NULL,
        customer_account = COALESCE(
          s.raw_payload->'billing'->>'customer_dc_id',
          s.raw_payload->'shipment'->'billing'->>'customer_dc_id',
          s.raw_payload->'request'->'shipment'->'billing'->>'customer_dc_id',
          s.raw_payload->>'customer_dc_id',
          s.raw_payload->>'account_number'
        ),
        updated_at = NOW()
    WHERE s.customer_id = v_hairbitz_id
      AND (
        COALESCE(
          s.raw_payload->'billing'->>'customer_dc_id',
          s.raw_payload->'shipment'->'billing'->>'customer_dc_id',
          s.raw_payload->'request'->'shipment'->'billing'->>'customer_dc_id',
          s.raw_payload->>'customer_dc_id',
          s.raw_payload->>'account_number'
        ) IS NOT NULL
        AND COALESCE(
          s.raw_payload->'billing'->>'customer_dc_id',
          s.raw_payload->'shipment'->'billing'->>'customer_dc_id',
          s.raw_payload->'request'->'shipment'->'billing'->>'customer_dc_id',
          s.raw_payload->>'customer_dc_id',
          s.raw_payload->>'account_number'
        ) NOT IN ('HOF-0029', 'HOF0029')
      );
  END IF;

  -- 3. Also sweep across ALL charges and shipments where customer_id was assigned to a customer whose dc_customer_id does not match the payload dc_id
  UPDATE charges ch
  SET customer_id = NULL,
      price = NULL,
      price_auto = false,
      price_failure_reason = 'Customer mismatch: expected ' || COALESCE(
        ch.raw_payload->'billing'->>'customer_dc_id',
        ch.raw_payload->'shipment'->'billing'->>'customer_dc_id',
        ch.raw_payload->'request'->'shipment'->'billing'->>'customer_dc_id',
        ch.raw_payload->>'customer_dc_id',
        ch.raw_payload->>'account_number'
      ),
      updated_at = NOW()
  FROM customers c
  WHERE ch.customer_id = c.id
    AND COALESCE(
      ch.raw_payload->'billing'->>'customer_dc_id',
      ch.raw_payload->'shipment'->'billing'->>'customer_dc_id',
      ch.raw_payload->'request'->'shipment'->'billing'->>'customer_dc_id',
      ch.raw_payload->>'customer_dc_id',
      ch.raw_payload->>'account_number'
    ) IS NOT NULL
    AND COALESCE(
      ch.raw_payload->'billing'->>'customer_dc_id',
      ch.raw_payload->'shipment'->'billing'->>'customer_dc_id',
      ch.raw_payload->'request'->'shipment'->'billing'->>'customer_dc_id',
      ch.raw_payload->>'customer_dc_id',
      ch.raw_payload->>'account_number'
    ) != c.dc_customer_id
    AND COALESCE(
      ch.raw_payload->'billing'->>'customer_dc_id',
      ch.raw_payload->'shipment'->'billing'->>'customer_dc_id',
      ch.raw_payload->'request'->'shipment'->'billing'->>'customer_dc_id',
      ch.raw_payload->>'customer_dc_id',
      ch.raw_payload->>'account_number'
    ) != c.account_number;

  UPDATE shipments s
  SET customer_id = NULL,
      customer_account = COALESCE(
        s.raw_payload->'billing'->>'customer_dc_id',
        s.raw_payload->'shipment'->'billing'->>'customer_dc_id',
        s.raw_payload->'request'->'shipment'->'billing'->>'customer_dc_id',
        s.raw_payload->>'customer_dc_id',
        s.raw_payload->>'account_number'
      ),
      updated_at = NOW()
  FROM customers c
  WHERE s.customer_id = c.id
    AND COALESCE(
      s.raw_payload->'billing'->>'customer_dc_id',
      s.raw_payload->'shipment'->'billing'->>'customer_dc_id',
      s.raw_payload->'request'->'shipment'->'billing'->>'customer_dc_id',
      s.raw_payload->>'customer_dc_id',
      s.raw_payload->>'account_number'
    ) IS NOT NULL
    AND COALESCE(
      s.raw_payload->'billing'->>'customer_dc_id',
      s.raw_payload->'shipment'->'billing'->>'customer_dc_id',
      s.raw_payload->'request'->'shipment'->'billing'->>'customer_dc_id',
      s.raw_payload->>'customer_dc_id',
      s.raw_payload->>'account_number'
    ) != c.dc_customer_id
    AND COALESCE(
      s.raw_payload->'billing'->>'customer_dc_id',
      s.raw_payload->'shipment'->'billing'->>'customer_dc_id',
      s.raw_payload->'request'->'shipment'->'billing'->>'customer_dc_id',
      s.raw_payload->>'customer_dc_id',
      s.raw_payload->>'account_number'
    ) != c.account_number;

END $$;
