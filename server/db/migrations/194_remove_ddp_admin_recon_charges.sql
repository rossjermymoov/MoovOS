-- ─── Migration 194 — Add ddp_admin enum value + remove premature charges ──────
--
-- charge_type is an ENUM. 'ddp_admin' was never added to it, which means:
--   a) Any ddp_admin charges inserted by the bad reconciliation code would have
--      silently failed (the INSERT would have errored), so there may be nothing
--      to delete — but we run the cleanup anyway to be safe.
--   b) Future charge inserts at Finalize Run time need the value to exist.
--
-- Step 1: add 'ddp_admin' to the enum (committed as a separate statement by
--         the migration runner, which is required for ALTER TYPE ADD VALUE).
-- Step 2: remove any premature charges that somehow made it in (uses ::text
--         cast as a belt-and-braces guard in case of edge-case timing).

ALTER TYPE charge_type ADD VALUE IF NOT EXISTS 'ddp_admin';

DO $$
DECLARE
  v_count INT;
BEGIN
  -- ::text cast avoids enum validation issues if the ADD VALUE above and this
  -- block ever end up in the same transaction on older Postgres versions.
  SELECT COUNT(*) INTO v_count
  FROM   charges
  WHERE  charge_type::text = 'ddp_admin'
    AND  source             = 'ddp_admin_recon'
    AND  order_id           IS NULL
    AND  tracking_code      IS NULL;

  RAISE NOTICE 'Migration 194: removing % premature ddp_admin_recon charge(s)', v_count;

  DELETE FROM charges
  WHERE  charge_type::text = 'ddp_admin'
    AND  source             = 'ddp_admin_recon'
    AND  order_id           IS NULL
    AND  tracking_code      IS NULL;

  RAISE NOTICE 'Migration 194: done.';
END $$;
