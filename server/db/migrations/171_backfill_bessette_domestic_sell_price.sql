-- ─── Migration 171 — Backfill Bessette domestic sell_price ────────────────────
--
-- PROBLEM:
--   Some Bessette domestic DPD shipments show 0 margin in the billing preview.
--   These charges have sell_price IS NULL (status = 'pricing_error') even though
--   Bessette's rate card has always existed for domestic services.
--
--   Root causes (any one is sufficient to produce NULL sell_price at booking time):
--     a) Zone name case mismatch between charges.zone_id → zones.name
--        and customer_rates.zone_name at the moment the webhook was processed.
--     b) Weight band gap — the charged weight fell between defined bands in
--        the rate card at the time (e.g. rate card had 0–2kg, 5–10kg, no 2–5kg).
--     c) Service code mismatch — charge was created with a service_code that
--        didn't match customer_rates.service_code at the time.
--
--   Because the user confirmed rates were always present, causes (a) or (b) are
--   most likely.  This migration re-runs the rate lookup for all affected charges
--   and backfills sell_price + price where a match is now found.
--
-- ── Diagnostic queries (run these first to understand the pattern) ─────────────
--
--   -- 1. How many Bessette domestic charges have NULL sell_price?
--   SELECT cs.service_type, COUNT(c.id) AS null_sell, MIN(c.weight_charged_kg), MAX(c.weight_charged_kg)
--   FROM   charges c
--   JOIN   customers cu ON cu.id = c.customer_id AND cu.business_name ILIKE '%Bessette%'
--   JOIN   courier_services cs ON cs.id = c.courier_service_id
--   WHERE  c.sell_price IS NULL
--     AND  cs.service_type NOT IN ('international')
--   GROUP  BY cs.service_type;
--
--   -- 2. Zone names on affected charges vs zone_names in customer_rates
--   SELECT DISTINCT z.name AS charge_zone_name, cr.zone_name AS rate_zone_name,
--                   cr.zone_name IS NULL AS no_rate_match
--   FROM   charges c
--   JOIN   customers cu ON cu.id = c.customer_id AND cu.business_name ILIKE '%Bessette%'
--   JOIN   courier_services cs ON cs.id = c.courier_service_id
--   JOIN   zones z ON z.id = c.zone_id
--   LEFT JOIN customer_rates cr ON cr.customer_id = c.customer_id
--             AND cr.zone_name ILIKE z.name
--   WHERE  c.sell_price IS NULL
--     AND  cs.service_type NOT IN ('international')
--   ORDER  BY z.name;
--
--   -- 3. Rate card coverage vs charged weights for unmatched charges
--   SELECT z.name AS zone_name, cr.service_code, cr.min_weight_kg, cr.max_weight_kg,
--          MIN(c.weight_charged_kg) AS min_charged, MAX(c.weight_charged_kg) AS max_charged,
--          COUNT(c.id) AS affected_charges
--   FROM   charges c
--   JOIN   customers cu ON cu.id = c.customer_id AND cu.business_name ILIKE '%Bessette%'
--   JOIN   courier_services cs ON cs.id = c.courier_service_id
--   JOIN   zones z ON z.id = c.zone_id
--   LEFT JOIN customer_rates cr ON cr.customer_id = c.customer_id AND cr.zone_name ILIKE z.name
--   WHERE  c.sell_price IS NULL
--     AND  cs.service_type NOT IN ('international')
--   GROUP  BY z.name, cr.service_code, cr.min_weight_kg, cr.max_weight_kg
--   ORDER  BY z.name, cr.min_weight_kg;
--
-- IDEMPOTENT: only updates rows where sell_price IS NULL and a rate is found.
--             Running twice has no effect (second run finds no NULL sell_prices
--             to update because the first run already backfilled them).

DO $$
DECLARE
  v_customer_id   UUID;
  v_rows_updated  INTEGER;
BEGIN

  -- ── Find Bessette ───────────────────────────────────────────────────────────
  SELECT id INTO v_customer_id
  FROM   customers
  WHERE  business_name ILIKE '%Bessette%'
  LIMIT  1;

  IF v_customer_id IS NULL THEN
    RAISE NOTICE 'Migration 171: customer "Bessette" not found — skipping';
    RETURN;
  END IF;

  RAISE NOTICE 'Migration 171: customer_id = %', v_customer_id;

  -- ── Diagnostic: count affected charges before fix ───────────────────────────
  DECLARE
    v_before INTEGER;
  BEGIN
    SELECT COUNT(c.id) INTO v_before
    FROM   charges c
    JOIN   courier_services cs ON cs.id = c.courier_service_id
    WHERE  c.customer_id = v_customer_id
      AND  c.sell_price IS NULL
      AND  cs.service_type::text NOT IN ('international');

    RAISE NOTICE 'Migration 171: % domestic charges with NULL sell_price before fix', v_before;
  END;

  -- ── Pass 1: finite bands (weight falls within a bounded range) ──────────────
  -- Matches customer_rates rows where max_weight_kg IS NOT NULL and the
  -- charge weight falls within the band (exclusive lower, inclusive upper).
  -- Uses ILIKE for service_code and zone_name so minor case differences don't
  -- prevent a match.
  UPDATE charges c
  SET    sell_price = cr_match.price,
         price      = COALESCE(c.price, cr_match.price),  -- only set if legacy price also null
         status     = CASE WHEN c.status = 'pricing_error' THEN 'unverified' ELSE c.status END,
         updated_at = NOW()
  FROM (
    SELECT DISTINCT ON (c2.id)
           c2.id AS charge_id,
           cr.price
    FROM   charges c2
    JOIN   courier_services cs ON cs.id = c2.courier_service_id
    JOIN   zones z             ON z.id  = c2.zone_id
    JOIN   customer_rates cr
             ON  cr.customer_id  = c2.customer_id
             AND cr.service_code ILIKE cs.service_code
             AND cr.zone_name    ILIKE z.name
             AND cr.max_weight_kg IS NOT NULL
             AND c2.weight_charged_kg >  COALESCE(cr.min_weight_kg, 0)
             AND c2.weight_charged_kg <= cr.max_weight_kg
    WHERE  c2.customer_id = v_customer_id
      AND  c2.sell_price  IS NULL
      AND  cs.service_type::text NOT IN ('international')
    ORDER  BY c2.id, cr.min_weight_kg DESC  -- highest lower-bound wins (most specific band)
  ) AS cr_match
  WHERE c.id = cr_match.charge_id;

  GET DIAGNOSTICS v_rows_updated = ROW_COUNT;
  RAISE NOTICE 'Migration 171 Pass 1 (finite bands): updated % charges', v_rows_updated;

  -- ── Pass 2: open-ended top band (max IS NULL, weight > min) ─────────────────
  -- For charges whose weight exceeds all finite bands — pick the open-ended band
  -- with the highest min_weight_kg (most specific catch-all).
  UPDATE charges c
  SET    sell_price = cr_match.price,
         price      = COALESCE(c.price, cr_match.price),
         status     = CASE WHEN c.status = 'pricing_error' THEN 'unverified' ELSE c.status END,
         updated_at = NOW()
  FROM (
    SELECT DISTINCT ON (c2.id)
           c2.id AS charge_id,
           cr.price
    FROM   charges c2
    JOIN   courier_services cs ON cs.id = c2.courier_service_id
    JOIN   zones z             ON z.id  = c2.zone_id
    JOIN   customer_rates cr
             ON  cr.customer_id  = c2.customer_id
             AND cr.service_code ILIKE cs.service_code
             AND cr.zone_name    ILIKE z.name
             AND cr.max_weight_kg IS NULL
             AND c2.weight_charged_kg > COALESCE(cr.min_weight_kg, 0)
    WHERE  c2.customer_id = v_customer_id
      AND  c2.sell_price  IS NULL
      AND  cs.service_type::text NOT IN ('international')
    ORDER  BY c2.id, cr.min_weight_kg DESC NULLS LAST
  ) AS cr_match
  WHERE c.id = cr_match.charge_id;

  GET DIAGNOSTICS v_rows_updated = ROW_COUNT;
  RAISE NOTICE 'Migration 171 Pass 2 (open-ended bands): updated % charges', v_rows_updated;

  -- ── Summary ─────────────────────────────────────────────────────────────────
  DECLARE
    v_still_null INTEGER;
  BEGIN
    SELECT COUNT(c.id) INTO v_still_null
    FROM   charges c
    JOIN   courier_services cs ON cs.id = c.courier_service_id
    WHERE  c.customer_id = v_customer_id
      AND  c.sell_price IS NULL
      AND  cs.service_type::text NOT IN ('international');

    IF v_still_null > 0 THEN
      RAISE NOTICE 'Migration 171: % domestic charges still have NULL sell_price — likely weight band gaps or zone name mismatches not resolved by rate card. Investigate with diagnostic queries above.', v_still_null;
    ELSE
      RAISE NOTICE 'Migration 171: all Bessette domestic charges now have sell_price ✓';
    END IF;
  END;

END
$$;

-- ── Post-fix sanity check ─────────────────────────────────────────────────────
-- Shows zone-level sell vs cost margin for Bessette domestic charges.
-- Anything still NULL in sell_price needs manual investigation.
SELECT
  z.name                                              AS zone_name,
  cs.service_code,
  COUNT(c.id)                                         AS charge_count,
  SUM(CASE WHEN c.sell_price IS NULL THEN 1 ELSE 0 END) AS still_null,
  ROUND(AVG(c.sell_price)::numeric, 4)                AS avg_sell,
  ROUND(AVG(c.cost_price)::numeric, 4)                AS avg_cost,
  ROUND(AVG(c.sell_price - c.cost_price)::numeric, 4) AS avg_margin
FROM   charges c
JOIN   customers cu  ON cu.id = c.customer_id AND cu.business_name ILIKE '%Bessette%'
JOIN   courier_services cs ON cs.id = c.courier_service_id
LEFT JOIN zones z    ON z.id = c.zone_id
WHERE  cs.service_type::text NOT IN ('international')
GROUP  BY z.name, cs.service_code
ORDER  BY z.name, cs.service_code;
