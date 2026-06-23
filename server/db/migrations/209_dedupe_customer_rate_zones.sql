-- ─── Migration 209 — Deduplicate customer rates: one row per customer+service+zone ──
--
-- A customer can only have ONE rate per (customer_id, service_id, zone_name).
-- Having e.g. "Mainland · Parcel" AND "Mainland · FlatRate" for the same
-- customer and service is invalid — it means two different weight classes exist
-- for the same zone. Only one can be used by the pricing engine.
--
-- Priority rules (which row to keep):
--   1. 'FlatRate' weight class — if one exists in the group, keep it.
--   2. Otherwise keep the row with the lowest min_weight_kg (base band).
--
-- All other rows in each conflicting group are hard-deleted.
-- Groups with a single row are untouched.
-- Groups with multiple rows ALL having different prices (genuine weight-banded
-- pricing) are also untouched — those are deliberate multi-band rate cards.

DO $$
DECLARE
  r           RECORD;
  v_keep_id   BIGINT;
  v_del_count INT;
  v_total_del INT := 0;
  v_groups    INT := 0;
BEGIN
  FOR r IN
    SELECT customer_id, service_id, zone_name, COUNT(*) AS cnt
    FROM   customer_rates
    GROUP  BY customer_id, service_id, zone_name
    HAVING COUNT(*) > 1
  LOOP
    -- Determine which row to keep
    SELECT id INTO v_keep_id
    FROM   customer_rates
    WHERE  customer_id = r.customer_id
      AND  service_id  = r.service_id
      AND  zone_name   = r.zone_name
    ORDER BY
      CASE WHEN weight_class_name = 'FlatRate' THEN 0 ELSE 1 END,
      COALESCE(min_weight_kg, 0) ASC,
      price DESC NULLS LAST   -- if still tied, prefer highest price (most specific)
    LIMIT 1;

    -- Delete all other rows
    DELETE FROM customer_rates
    WHERE  customer_id = r.customer_id
      AND  service_id  = r.service_id
      AND  zone_name   = r.zone_name
      AND  id         != v_keep_id;

    GET DIAGNOSTICS v_del_count = ROW_COUNT;
    v_total_del := v_total_del + v_del_count;
    v_groups    := v_groups + 1;

    RAISE NOTICE 'Migration 209: removed % duplicate(s) for zone="%" service=% — kept id=%',
      v_del_count, r.zone_name, r.service_id, v_keep_id;
  END LOOP;

  -- Also normalise any remaining rows that have explicit weight bounds
  -- but aren't part of a multi-band group (lone non-FlatRate rows with max set)
  UPDATE customer_rates
  SET    weight_class_name = 'FlatRate',
         min_weight_kg     = NULL,
         max_weight_kg     = NULL
  WHERE  weight_class_name NOT IN ('FlatRate')
    AND  max_weight_kg IS NOT NULL
    AND  NOT EXISTS (
           SELECT 1 FROM customer_rates cr2
           WHERE  cr2.customer_id = customer_rates.customer_id
             AND  cr2.service_id  = customer_rates.service_id
             AND  cr2.zone_name   = customer_rates.zone_name
             AND  cr2.id         != customer_rates.id
         );

  RAISE NOTICE 'Migration 209 complete: % duplicate row(s) deleted across % zone group(s).',
    v_total_del, v_groups;
END $$;
