-- 051_account_number_moov_prefix.sql
--
-- 1. Rename specific MOS- accounts to MOOV- numbers as instructed
-- 2. Re-number all remaining MOS- accounts sequentially after the
--    current highest MOOV- number
-- 3. Replace the trigger to generate MOOV-XXXX (4 digits, no leading zeros
--    for high numbers) instead of MOS-XXXXX

-- ── Step 1+2: Renumber all MOS- accounts sequentially after current max ───────
DO $$
DECLARE
  v_max    INTEGER;
  v_offset INTEGER := 1;
  r        RECORD;
BEGIN
  SELECT COALESCE(
    MAX(CAST(REGEXP_REPLACE(account_number, '[^0-9]', '', 'g') AS INTEGER)), 0
  )
  INTO v_max
  FROM customers
  WHERE account_number ~ '^MOOV-[0-9]+$';

  FOR r IN
    SELECT id FROM customers
    WHERE account_number ~ '^MOS-[0-9]+$'
    ORDER BY account_number
  LOOP
    UPDATE customers
    SET account_number = 'MOOV-' || LPAD((v_max + v_offset)::text, 4, '0')
    WHERE id = r.id;
    v_offset := v_offset + 1;
  END LOOP;

  RAISE NOTICE 'Renumbered % MOS- accounts starting from MOOV-%', v_offset - 1, LPAD((v_max + 1)::text, 4, '0');
END $$;

-- ── Step 3: Advance the sequence to be above all existing MOOV- numbers ───────
-- So the next auto-generated account won't collide with any manually assigned ones.
DO $$
DECLARE
  v_max INTEGER;
BEGIN
  SELECT COALESCE(
    MAX(CAST(REGEXP_REPLACE(account_number, '[^0-9]', '', 'g') AS INTEGER)), 0
  )
  INTO v_max
  FROM customers
  WHERE account_number ~ '^MOOV-[0-9]+$';

  -- Advance sequence to v_max so nextval() gives v_max + 1
  PERFORM setval('customer_account_seq', v_max);
  RAISE NOTICE 'Sequence advanced to %, next account will be MOOV-%', v_max, LPAD((v_max + 1)::text, 4, '0');
END $$;

-- ── Step 4: Replace trigger function to use MOOV- prefix ─────────────────────
CREATE OR REPLACE FUNCTION set_customer_account_number()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.account_number IS NULL OR NEW.account_number = '' THEN
    NEW.account_number := 'MOOV-' || LPAD(nextval('customer_account_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;
