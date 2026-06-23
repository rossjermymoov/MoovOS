-- ─── Migration 199 — Free MOOV-0183 and reassign its holder ──────────────────
--
-- MOOV-0183 is showing as a duplicate but no customer appears in the UI search.
-- This migration identifies the holder, reassigns them to the next sequence
-- number, and logs the details to the Railway console for audit purposes.

DO $$
DECLARE
  v_row    RECORD;
  v_new_no VARCHAR(20);
BEGIN
  SELECT id, business_name, account_number, account_status, date_onboarded
  INTO   v_row
  FROM   customers
  WHERE  account_number = 'MOOV-0183'
  LIMIT  1;

  IF v_row IS NULL THEN
    RAISE NOTICE 'Migration 199: no customer found with MOOV-0183 — nothing to do.';
    RETURN;
  END IF;

  -- Generate a fresh account number from the sequence
  v_new_no := 'MOOV-' || LPAD(nextval('customer_account_seq')::TEXT, 4, '0');

  RAISE NOTICE 'Migration 199: MOOV-0183 held by "%" (id=%, status=%, onboarded=%) — reassigning to %',
    v_row.business_name, v_row.id, v_row.account_status, v_row.date_onboarded, v_new_no;

  UPDATE customers
  SET    account_number = v_new_no
  WHERE  id = v_row.id;

  RAISE NOTICE 'Migration 199: done — MOOV-0183 is now free.';
END $$;
