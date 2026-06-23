-- ─── Migration 195 — Remove Europa reconciliation charges from 23 May 22:08 ───
--
-- Ross ran a reconciliation for Europa on the evening of 2026-05-23.
-- The charges created during that run need to be removed entirely.
-- They are identifiable by:
--   customer_id  = Europa's customer record
--   created_at   between 22:00 and 23:00 on 2026-05-23 (UTC)
--
-- Steps:
--   1. Capture the affected charge IDs.
--   2. NULL out charge_id on any reconciliation_lines that reference them
--      (charge_id is a plain integer — no FK constraint — but good hygiene).
--   3. DELETE the charges.

DO $$
DECLARE
  v_customer_id  UUID;
  v_charge_count INT;
BEGIN
  -- Find Europa's customer ID
  SELECT id INTO v_customer_id
  FROM   customers
  WHERE  business_name ILIKE '%europa%'
  LIMIT  1;

  IF v_customer_id IS NULL THEN
    RAISE NOTICE 'Migration 195: Europa customer not found — nothing to do.';
    RETURN;
  END IF;

  -- Count what we are about to remove
  SELECT COUNT(*) INTO v_charge_count
  FROM   charges
  WHERE  customer_id = v_customer_id
    AND  created_at >= '2026-05-23 22:00:00+00'
    AND  created_at <  '2026-05-23 23:00:00+00';

  RAISE NOTICE 'Migration 195: found % Europa charge(s) created between 22:00 and 23:00 on 2026-05-23 (customer_id=%)', v_charge_count, v_customer_id;

  -- Detach from any reconciliation lines first (no FK, but keeps data consistent)
  UPDATE reconciliation_lines
  SET    charge_id = NULL
  WHERE  charge_id IN (
    SELECT id FROM charges
    WHERE  customer_id = v_customer_id
      AND  created_at >= '2026-05-23 22:00:00+00'
      AND  created_at <  '2026-05-23 23:00:00+00'
  );

  -- Remove the charges
  DELETE FROM charges
  WHERE  customer_id = v_customer_id
    AND  created_at >= '2026-05-23 22:00:00+00'
    AND  created_at <  '2026-05-23 23:00:00+00';

  RAISE NOTICE 'Migration 195: deleted % Europa charge(s).', v_charge_count;
END $$;
