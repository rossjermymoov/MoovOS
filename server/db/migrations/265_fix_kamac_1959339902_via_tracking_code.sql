-- Migration 265: Fix Kammac 1959339902 — join via tracking_code not charge_id
--
-- Migration 264 attempted to fill corrected_cost/sell from the charges table
-- by joining on charge_id, but charge_id IS NULL on the reconciliation line,
-- so the UPDATE matched no rows.
--
-- This migration finds the charge by tracking_code instead and:
--   1. Links charge_id on the reconciliation line
--   2. Fills corrected_cost_price and corrected_sell_price from the charge
--   3. Links shipment_id on the charge if null so that Repair & Refresh
--      (POST /api/reconciliation/backfill-carrier-direct-surcharges) can
--      create the missing fuel and surcharge sub-charges.
--
-- Safe to re-run: COALESCE guards prevent overwriting existing values.

-- Step 1: Link charge_id and fill cost/sell on the reconciliation line
UPDATE reconciliation_lines rl
SET
  charge_id            = COALESCE(rl.charge_id, ch.id),
  corrected_cost_price = COALESCE(NULLIF(rl.corrected_cost_price, 0), ch.cost_price),
  corrected_sell_price = COALESCE(NULLIF(rl.corrected_sell_price, 0), ch.sell_price)
FROM (
  SELECT id, cost_price, sell_price
  FROM   charges
  WHERE  tracking_code = '1959339902'
    AND  charge_type   = 'courier'
    AND  cancelled     = false
  ORDER  BY created_at DESC
  LIMIT  1
) ch
WHERE  rl.tracking_number = '1959339902'
  AND  rl.surcharge_id   IS NULL
  AND  (
    rl.charge_id            IS NULL
    OR rl.corrected_cost_price IS NULL OR rl.corrected_cost_price = 0
    OR rl.corrected_sell_price IS NULL OR rl.corrected_sell_price = 0
  );

-- Step 2: Link shipment_id on the charge if it is null, so that
-- Repair & Refresh can create fuel and surcharge sub-charges.
UPDATE charges c
SET    shipment_id = s.id
FROM   shipments s
WHERE  '1959339902' = ANY(s.tracking_codes)
  AND  c.tracking_code = '1959339902'
  AND  c.cancelled     = false
  AND  c.shipment_id   IS NULL;
