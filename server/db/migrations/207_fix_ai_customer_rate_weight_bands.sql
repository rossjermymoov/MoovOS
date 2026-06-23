-- ─── Migration 207 — Fix spurious weight bands in AI-onboarded customer rates ──
--
-- The AI rate extraction was treating "Max Weight: 30kg" as a band boundary,
-- producing entries like weight_class="0-30kg" min=0 max=30 instead of FlatRate.
-- Sometimes a second overflow band (30-999kg) was also created.
--
-- This migration:
--   Step 1 — For groups (customer_id, service_id, zone_name) with multiple rows
--            where ALL prices are identical: keep the best row, delete the rest,
--            normalise the kept row to FlatRate (null min/max).
--            Groups with genuinely different prices are left untouched.
--
--   Step 2 — For single rows where weight_class != 'FlatRate' and explicit
--            min/max weights exist: normalise to FlatRate.

DO $$
DECLARE
  r           RECORD;
  v_keep_id   BIGINT;
  v_del_count INT;
  v_collapsed INT := 0;
  v_deleted   INT := 0;
  v_fixed     INT := 0;
BEGIN

  -- ── Step 1: Collapse same-price multi-band groups ─────────────────────────
  FOR r IN
    SELECT customer_id,
           service_id,
           zone_name,
           COUNT(*)                              AS band_count,
           COUNT(DISTINCT COALESCE(price::TEXT, 'NULL')) AS distinct_prices
    FROM   customer_rates
    GROUP  BY customer_id, service_id, zone_name
    HAVING COUNT(*) > 1
      AND  COUNT(DISTINCT COALESCE(price::TEXT, 'NULL')) = 1
  LOOP
    -- Prefer an existing FlatRate row; otherwise take the lowest-min band
    SELECT id INTO v_keep_id
    FROM   customer_rates
    WHERE  customer_id = r.customer_id
      AND  service_id  = r.service_id
      AND  zone_name   = r.zone_name
    ORDER BY
      CASE WHEN weight_class_name = 'FlatRate' THEN 0 ELSE 1 END,
      COALESCE(min_weight_kg, 0) ASC
    LIMIT 1;

    -- Delete all other rows in this group
    DELETE FROM customer_rates
    WHERE  customer_id = r.customer_id
      AND  service_id  = r.service_id
      AND  zone_name   = r.zone_name
      AND  id         != v_keep_id;

    GET DIAGNOSTICS v_del_count = ROW_COUNT;
    v_deleted := v_deleted + v_del_count;

    -- Normalise the kept row to FlatRate
    UPDATE customer_rates
    SET    weight_class_name = 'FlatRate',
           min_weight_kg     = NULL,
           max_weight_kg     = NULL
    WHERE  id = v_keep_id;

    v_collapsed := v_collapsed + 1;

    RAISE NOTICE 'Migration 207 step1: collapsed % band(s) → FlatRate (service=%, zone="%")',
      r.band_count, r.service_id, r.zone_name;
  END LOOP;

  -- ── Step 2: Fix lone rows with explicit weight bounds ─────────────────────
  -- Single rows (no siblings) where weight_class != FlatRate and has min/max
  UPDATE customer_rates
  SET    weight_class_name = 'FlatRate',
         min_weight_kg     = NULL,
         max_weight_kg     = NULL
  WHERE  weight_class_name != 'FlatRate'
    AND  (max_weight_kg IS NOT NULL OR min_weight_kg IS NOT NULL)
    AND  NOT EXISTS (
           SELECT 1
           FROM   customer_rates cr2
           WHERE  cr2.customer_id = customer_rates.customer_id
             AND  cr2.service_id  = customer_rates.service_id
             AND  cr2.zone_name   = customer_rates.zone_name
             AND  cr2.id         != customer_rates.id
         );

  GET DIAGNOSTICS v_fixed = ROW_COUNT;

  RAISE NOTICE 'Migration 207 complete: % group(s) collapsed, % extra band row(s) deleted, % lone row(s) fixed.',
    v_collapsed, v_deleted, v_fixed;
END $$;
