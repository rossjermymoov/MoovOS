-- Migration 264: Fix reconciliation line for Kamac tracking 1959339902
--
-- The line is showing corrected_cost_price = 0 / NULL and no corrected_sell_price,
-- but the charge record has a real cost and sell attached.
-- This pulls the values through from the charge so cost and sell display correctly.
--
-- Safe to re-run: only touches the one tracking number and only if
-- the values are still missing/zero.

UPDATE reconciliation_lines rl
SET
  corrected_cost_price = COALESCE(
    NULLIF(rl.corrected_cost_price, 0),
    ch.cost_price
  ),
  corrected_sell_price = COALESCE(
    NULLIF(rl.corrected_sell_price, 0),
    ch.sell_price
  ),
  updated_at = NOW()
FROM charges ch
WHERE rl.tracking_number = '1959339902'
  AND rl.charge_id       = ch.id
  AND (
    rl.corrected_cost_price IS NULL OR rl.corrected_cost_price = 0
    OR rl.corrected_sell_price IS NULL OR rl.corrected_sell_price = 0
  );
