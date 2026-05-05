-- ─── Migration 153 — Backfill price column from sell_price ───────────────────
--
-- ROOT CAUSE:
--   insertCharges (pricingEngine.js) wrote sell_price and cost_price (new columns)
--   but never wrote price (the legacy column read by the UI, billing engine, and
--   full-reprice endpoint). Every charge created via the Voila webhook path had
--   price = NULL, making it appear as "unpriced" in the Finance page even when
--   fully costed and sellable.
--
-- FIX APPLIED (pricingEngine.js insertCharges):
--   Now writes price = sell_price alongside sell_price on every INSERT.
--
-- THIS MIGRATION:
--   Backfills price = sell_price for all existing pricingEngine charges where
--   price IS NULL but sell_price IS NOT NULL (i.e. successfully priced charges
--   that just never had price written).
--
--   Deliberately skips:
--     - pricing_error charges (sell_price IS NULL — price should stay NULL)
--     - cancelled charges
--     - billing.js charges (those already have price set via their own path)
--
-- IDEMPOTENT: SET price = sell_price WHERE price IS NULL is safe to re-run.

DO $$
DECLARE
  v_count INTEGER;
BEGIN

  UPDATE charges
  SET    price      = sell_price,
         updated_at = NOW()
  WHERE  price      IS NULL
    AND  sell_price IS NOT NULL
    AND  cancelled  = false;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE 'Migration 153: backfilled price on % charge(s)', v_count;

END $$;
