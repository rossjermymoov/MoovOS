-- ─── Migration 235 ────────────────────────────────────────────────────────────
--
-- Fix: EPS (Emergency Fuel Surcharge) charges were written with price = 0
-- due to a logic error in billing.js that treated reconciliation_excluded = true
-- as "absorbed by us, don't charge customer". The correct interpretation of
-- reconciliation_excluded is "carrier doesn't invoice us for this surcharge"
-- (migration 111) — we still charge the customer the full default_value.
--
-- This migration backfills the sell price on all EPS charges where price = 0
-- by restoring it to the surcharge's default_value (15p per shipment).
-- Charges with price > 0 are left alone (correctly written before the bug).

DO $$
DECLARE
  v_eps_id   INTEGER;
  v_fixed    INTEGER := 0;
BEGIN

  SELECT id INTO v_eps_id
  FROM surcharges
  WHERE UPPER(TRIM(code)) = 'EPS'
     OR (UPPER(name) LIKE '%EMERGENCY%' AND UPPER(name) LIKE '%FUEL%')
  LIMIT 1;

  IF v_eps_id IS NULL THEN
    RAISE NOTICE 'Migration 235: EPS surcharge not found — nothing to fix.';
    RETURN;
  END IF;

  -- Restore sell price from surcharge default_value where it was zeroed out
  UPDATE charges c
  SET    price = s.default_value,
         updated_at = NOW()
  FROM   surcharges s
  WHERE  c.surcharge_id = v_eps_id
    AND  s.id           = v_eps_id
    AND  c.price        = 0
    AND  c.cancelled    = false;

  GET DIAGNOSTICS v_fixed = ROW_COUNT;

  RAISE NOTICE 'Migration 235: restored price on % EPS charge row(s) (surcharge_id=%).', v_fixed, v_eps_id;

END $$;
