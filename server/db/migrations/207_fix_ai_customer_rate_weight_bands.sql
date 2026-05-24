-- ─── Migration 207 — Fix spurious weight bands in AI-onboarded customer rates ──
--
-- The AI rate extraction prompt was treating "Max Weight: 30kg" columns as
-- weight band boundaries, producing entries like:
--   zone="UK Mainland", weight_class="0-30kg", min=0, max=30, price=5.75
-- and sometimes a second overflow band:
--   zone="UK Mainland", weight_class="30-999kg", min=30, max=999, price=?
--
-- These customers are on flat-rate pricing — one price per service per zone
-- regardless of weight. The correct representation is:
--   zone="UK Mainland", weight_class="FlatRate", min=NULL, max=NULL, price=5.75
--
-- This migration:
--   1. For each (customer_id, service_id, zone_name) group that has a row with
--      weight_class_name != 'FlatRate' but NO FlatRate row yet:
--      → keeps the row with the LOWEST min_weight (i.e. the base band)
--      → sets weight_class_name='FlatRate', min_weight_kg=NULL, max_weight_kg=NULL
--      → deletes all other bands for that group (the extra overflow bands)
--
--   2. For each (customer_id, service_id, zone_name) group that already has a
--      FlatRate row AND also has other banded rows:
--      → deletes the extra banded rows (FlatRate takes precedence)
--
-- Groups that genuinely have multiple different prices at different weights
-- (real weight-banded pricing) are left untouched — detected by checking that
-- all prices in the group are identical before collapsing.

DO $$
DECLARE
  r             RECORD;
  v_keep_id     UUID;
  v_keep_price  NUMERIC;
  v_keep_sub    NUMERIC;
  v_collapsed   INT := 0;
  v_deleted     INT := 0;
  v_skipped     INT := 0;
BEGIN
  -- Find groups with more than one band (non-FlatRate) or a mix
  FOR r IN
    SELECT customer_id, service_id, zone_name,
           COUNT(*)                                  AS band_count,
           COUNT(DISTINCT price)                     AS distinct_prices,
           MIN(id::TEXT)                             AS first_id,  -- for ordering only
           BOOL_OR(weight_class_name = 'FlatRate')  AS has_flat,
           BOOL_OR(weight_class_name != 'FlatRate') AS has_banded
    FROM   customer_rates
    GROUP  BY customer_id, service_id, zone_name
    HAVING COUNT(*) > 1
       OR  (weight_class_name != 'FlatRate' AND max_weight_kg IS NOT NULL AND min_weight_kg IS NOT NULL)
  LOOP
    -- If the group has multiple distinct prices, it's real weight-banded pricing — skip
    IF r.distinct_prices > 1 THEN
      v_skipped := v_skipped + 1;
      CONTINUE;
    END IF;

    -- Get the price from the lowest band (or the FlatRate row if it exists)
    SELECT id, price, price_sub INTO v_keep_id, v_keep_price, v_keep_sub
    FROM   customer_rates
    WHERE  customer_id = r.customer_id
      AND  service_id  = r.service_id
      AND  zone_name   = r.zone_name
    ORDER  BY
      CASE WHEN weight_class_name = 'FlatRate' THEN 0 ELSE 1 END,  -- prefer existing FlatRate
      COALESCE(min_weight_kg, 0) ASC
    LIMIT 1;

    -- Delete all OTHER rows in this group
    DELETE FROM customer_rates
    WHERE  customer_id = r.customer_id
      AND  service_id  = r.service_id
      AND  zone_name   = r.zone_name
      AND  id         != v_keep_id;

    GET DIAGNOSTICS v_deleted = ROW_COUNT;
    v_deleted := v_deleted + v_deleted;  -- accumulate

    -- Normalise the kept row to FlatRate
    UPDATE customer_rates
    SET    weight_class_name = 'FlatRate',
           min_weight_kg     = NULL,
           max_weight_kg     = NULL
    WHERE  id = v_keep_id
      AND  (weight_class_name != 'FlatRate'
            OR min_weight_kg IS NOT NULL
            OR max_weight_kg IS NOT NULL);

    IF FOUND THEN v_collapsed := v_collapsed + 1; END IF;

    RAISE NOTICE 'Migration 207: normalised to FlatRate — customer=% service=% zone="%" price=%',
      r.customer_id, r.service_id, r.zone_name, v_keep_price;
  END LOOP;

  RAISE NOTICE 'Migration 207 complete: % group(s) collapsed to FlatRate, extra band rows deleted, % group(s) skipped (genuine multi-price).',
    v_collapsed, v_skipped;
END $$;
