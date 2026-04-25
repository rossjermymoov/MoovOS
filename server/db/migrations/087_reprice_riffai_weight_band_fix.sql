-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 087 — Fix weight band bounds + reprice Riffai charges
--
-- Root cause: customer_rates.min_weight_kg / max_weight_kg are NULL for some
-- customers (including Riffai).  The billing engine fell through to a
-- NULL/NULL = "flat-rate" path, so every parcel was priced at the first
-- alphabetically sorted band ("10KG") regardless of actual weight.
--
-- This migration:
--   1. Backfills min/max_weight_kg across ALL customers from dc_weight_classes
--      (the carrier rate card — correct source of truth).
--   2. Reprices unverified/verified charges for Riffai where sell_price is
--      wrong given the actual weight_charged_kg.
--   3. Reports invoiced charges that need a manual credit note.
-- ─────────────────────────────────────────────────────────────────────────────

BEGIN;

-- ── Step 1: Global backfill of weight bounds from dc_weight_classes ──────────
-- Safe to run on all customers — COALESCE means existing non-NULL values are
-- never overwritten.
UPDATE customer_rates cr
SET
  min_weight_kg      = wc.min_weight_kg,
  max_weight_kg      = wc.max_weight_kg
FROM dc_weight_classes wc
WHERE cr.service_code      = wc.service_code
  AND cr.weight_class_name = wc.weight_class_name
  AND cr.min_weight_kg     IS NULL;

-- ── Step 2: Reprice Riffai uninvoiced charges ────────────────────────────────
DO $$
DECLARE
  v_customer_id UUID;
  v_corrected    INT;
  v_invoiced     INT;
BEGIN
  SELECT id INTO v_customer_id
  FROM customers
  WHERE business_name ILIKE '%riffai%'
  LIMIT 1;

  IF v_customer_id IS NULL THEN
    RAISE NOTICE 'Customer "Riffai" not found — skipping reprice step';
    RETURN;
  END IF;

  RAISE NOTICE 'Riffai customer_id: %', v_customer_id;

  -- Count invoiced charges that are wrong (need credit note)
  SELECT COUNT(*) INTO v_invoiced
  FROM charges c
  JOIN courier_services cs ON cs.id = c.courier_service_id
  WHERE c.customer_id        = v_customer_id
    AND c.status             = 'invoiced'
    AND c.weight_charged_kg  IS NOT NULL
    AND c.weight_charged_kg  > 0
    AND EXISTS (
      -- A cheaper band exists that covers this weight
      SELECT 1 FROM customer_rates cr2
      WHERE cr2.customer_id   = v_customer_id
        AND cr2.service_code  = cs.service_code
        AND cr2.max_weight_kg >= c.weight_charged_kg
        AND cr2.min_weight_kg <  c.weight_charged_kg
        AND cr2.price         <  c.sell_price
    );

  -- Correct unverified/verified charges
  WITH correct_price AS (
    SELECT
      c.id AS charge_id,
      (
        SELECT cr.price
        FROM customer_rates cr
        JOIN courier_services cs2 ON cs2.service_code = cr.service_code
        WHERE cr.customer_id   = v_customer_id
          AND cs2.id           = c.courier_service_id
          AND cr.max_weight_kg >= c.weight_charged_kg
          AND cr.min_weight_kg <  c.weight_charged_kg
        ORDER BY cr.max_weight_kg ASC
        LIMIT 1
      ) AS right_price
    FROM charges c
    JOIN courier_services cs ON cs.id = c.courier_service_id
    WHERE c.customer_id       = v_customer_id
      AND c.status           IN ('unverified', 'verified')
      AND c.weight_charged_kg IS NOT NULL
      AND c.weight_charged_kg  > 0
  )
  UPDATE charges c
  SET sell_price = cp.right_price, updated_at = NOW()
  FROM correct_price cp
  WHERE c.id           = cp.charge_id
    AND cp.right_price IS NOT NULL
    AND cp.right_price <> c.sell_price;

  GET DIAGNOSTICS v_corrected = ROW_COUNT;

  RAISE NOTICE 'Riffai charges corrected (unverified/verified): %', v_corrected;
  RAISE NOTICE 'Riffai invoiced charges needing credit note: %', v_invoiced;
  IF v_invoiced > 0 THEN
    RAISE NOTICE 'ACTION REQUIRED: raise a credit note for the % invoiced charges above.', v_invoiced;
  END IF;
END $$;

COMMIT;
