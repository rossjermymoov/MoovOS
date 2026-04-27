-- Migration 118: zero cost_price on ALL charges linked to reconciliation_excluded surcharges
--
-- The EPS surcharge definition (id 3e24226e) has a typo in its name ("Emrgency")
-- so all name-pattern migrations missed its associated charge rows.
-- This uses the reconciliation_excluded flag directly — no name matching needed.

-- Step 1: ensure the surcharge definitions themselves have cost_price = 0
UPDATE surcharges
   SET cost_price = 0
 WHERE reconciliation_excluded = true;

-- Step 2: zero cost_price on all charge rows linked to these surcharges
UPDATE charges
   SET cost_price = 0
  FROM surcharges sx
 WHERE charges.surcharge_id = sx.id
   AND sx.reconciliation_excluded = true
   AND charges.cancelled = false
   AND charges.cost_price != 0;
