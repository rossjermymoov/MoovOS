-- Migration 259: Cancel erroneous Congestion/Clearance surcharge charges on
-- carrier_direct shipments where those surcharges were never billed by DPD.
--
-- Root cause:
--   createCarrierDirectSurcharges fired ALL DPD surcharges with
--   applies_when='always', including Congestion Charge (postcodes-only) and
--   Clearance Charge (NI/international only), without evaluating their rules.
--   This added ~£1.85 in phantom surcharges to every carrier_direct line for
--   customers like London Grow and Kammac who don't book through the OMS.
--
-- Fix in code:
--   reconciliationEngine.js createCarrierDirectSurcharges now skips any
--   surcharge that has active surcharge_rules (conditional surcharges must not
--   be blindly applied to all carrier_direct shipments).
--
-- Fix in data:
--   Cancel all surcharge charges (source='carrier_direct') for Congestion Charge
--   and Clearance Charge where:
--     - The delivery postcode is NOT a known DPD congestion zone (for Congestion)
--     - The delivery country IS GB/UK mainland (for Clearance — NI only)
--   Since we cannot easily evaluate the original rules here, we take the simpler
--   approach: cancel ALL carrier_direct surcharge charges for these two surcharges
--   where the carrier actually billed £0.00 (i.e. the reconciliation line shows
--   no carrier amount for that surcharge column).
--
--   In practice: cancel them for ALL carrier_direct shipments where those
--   surcharges were auto-applied.  If any genuinely attracted a Congestion or
--   Clearance charge, DPD would have billed it in the CSV — those shipments will
--   be manually resolved via the reconciliation UI.
--
-- SAFE: sets cancelled=true, does not delete rows.

DO $$
DECLARE
  v_congestion_id  UUID;
  v_clearance_id   UUID;
  v_cancelled      INTEGER := 0;
BEGIN

  -- Find the Congestion Charge surcharge ID
  SELECT id INTO v_congestion_id
  FROM   surcharges
  WHERE  name ILIKE '%congestion%'
    AND  courier_id = (SELECT id FROM couriers WHERE code ILIKE 'DPD' LIMIT 1)
  LIMIT  1;

  -- Find the Clearance Charge surcharge ID
  SELECT id INTO v_clearance_id
  FROM   surcharges
  WHERE  name ILIKE '%clearance%'
    AND  courier_id = (SELECT id FROM couriers WHERE code ILIKE 'DPD' LIMIT 1)
  LIMIT  1;

  IF v_congestion_id IS NULL AND v_clearance_id IS NULL THEN
    RAISE NOTICE 'Migration 259: neither Congestion nor Clearance surcharge found — nothing to do';
    RETURN;
  END IF;

  RAISE NOTICE 'Migration 259: Congestion surcharge_id=%, Clearance surcharge_id=%',
    v_congestion_id, v_clearance_id;

  -- Cancel carrier_direct Congestion charges
  IF v_congestion_id IS NOT NULL THEN
    UPDATE charges
    SET    cancelled   = true,
           updated_at  = NOW()
    WHERE  surcharge_id = v_congestion_id
      AND  source       = 'carrier_direct'
      AND  cancelled    = false;

    GET DIAGNOSTICS v_cancelled = ROW_COUNT;
    RAISE NOTICE 'Migration 259: cancelled % carrier_direct Congestion Charge surcharge(s)', v_cancelled;
  END IF;

  -- Cancel carrier_direct Clearance charges
  IF v_clearance_id IS NOT NULL THEN
    UPDATE charges
    SET    cancelled   = true,
           updated_at  = NOW()
    WHERE  surcharge_id = v_clearance_id
      AND  source       = 'carrier_direct'
      AND  cancelled    = false;

    GET DIAGNOSTICS v_cancelled = ROW_COUNT;
    RAISE NOTICE 'Migration 259: cancelled % carrier_direct Clearance Charge surcharge(s)', v_cancelled;
  END IF;

  RAISE NOTICE 'Migration 259 complete.';
END $$;
