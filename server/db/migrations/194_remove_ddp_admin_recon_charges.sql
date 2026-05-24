-- ─── Migration 194 — Remove premature ddp_admin charges ──────────────────────
--
-- A previous deploy inserted ddp_admin charges directly from the reconciliation
-- engine (source = 'ddp_admin_recon'). This was wrong — charges should only be
-- created at Finalize Run time, not during reconciliation.
--
-- The bad charges are identifiable by ALL of:
--   charge_type = 'ddp_admin'
--   source      = 'ddp_admin_recon'
--   order_id    IS NULL
--   tracking_code IS NULL
--
-- The corrected flow (source = 'ddp_admin_finalized') is unaffected.
-- Any manually-created ddp_admin charges are also unaffected (they would
-- not have source = 'ddp_admin_recon').

DO $$
DECLARE
  v_count INT;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM   charges
  WHERE  charge_type    = 'ddp_admin'
    AND  source         = 'ddp_admin_recon'
    AND  order_id       IS NULL
    AND  tracking_code  IS NULL;

  RAISE NOTICE 'Migration 194: removing % premature ddp_admin_recon charge(s)', v_count;

  DELETE FROM charges
  WHERE  charge_type    = 'ddp_admin'
    AND  source         = 'ddp_admin_recon'
    AND  order_id       IS NULL
    AND  tracking_code  IS NULL;

  RAISE NOTICE 'Migration 194: done.';
END $$;
