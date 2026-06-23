-- ─── Migration 227 — Fix Medium service weight class and zones ────────────────
--
-- Migrations 223 and 226 inserted rows with weight_class_name='Packet' for
-- AGL Medium services. Medium uses 'Parcel', Mini uses 'Packet'. This migration:
--
--   1. UPDATE  — set weight_class_name='Parcel' for all AGL-1VMN and AGL-2VMN rows
--   2. DEDUP   — remove duplicate (customer, service_code, zone_name) rows,
--                keeping the one with the best (highest non-zero) price
--   3. FILL    — add Out of Area for AGL-2VMN (Medium 48) customers who are missing it,
--                using their Mainland price as template

DO $$
DECLARE
  v_updated  INT := 0;
  v_deleted  INT := 0;
  v_inserted INT := 0;
BEGIN
  -- Step 1: Fix weight class — Medium services use Parcel, not Packet
  UPDATE customer_rates
  SET    weight_class_name = 'Parcel'
  WHERE  service_code IN ('AGL-1VMN', 'AGL-2VMN')
    AND  weight_class_name NOT ILIKE 'Parcel';

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RAISE NOTICE 'Migration 227 step1: updated % row(s) weight_class to Parcel.', v_updated;

  -- Step 2: Deduplicate — keep best row per (customer, service_code, zone_name)
  -- "Best" = non-zero price preferred, then highest price
  DELETE FROM customer_rates
  WHERE service_code IN ('AGL-1VMN', 'AGL-2VMN')
    AND id NOT IN (
      SELECT DISTINCT ON (customer_id, service_code, zone_name) id
      FROM   customer_rates
      WHERE  service_code IN ('AGL-1VMN', 'AGL-2VMN')
      ORDER BY
        customer_id,
        service_code,
        zone_name,
        CASE WHEN price IS NULL OR price = 0 THEN 1 ELSE 0 END ASC,
        price DESC NULLS LAST
    );

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RAISE NOTICE 'Migration 227 step2: removed % duplicate row(s).', v_deleted;

  -- Step 3: Add Out of Area for AGL-2VMN (Medium 48) where missing
  -- Medium 24 (AGL-1VMN) is mainland-only — not touched here
  INSERT INTO customer_rates
    (customer_id, courier_id, courier_code, courier_name,
     service_id, service_code, service_name,
     zone_name, weight_class_name,
     min_weight_kg, max_weight_kg,
     price, price_sub)

  SELECT DISTINCT ON (cr.customer_id)
    cr.customer_id, cr.courier_id, cr.courier_code, cr.courier_name,
    cr.service_id, cr.service_code, cr.service_name,
    'Out of Area', 'Parcel',
    cr.min_weight_kg, cr.max_weight_kg,
    cr.price, cr.price_sub
  FROM customer_rates cr
  WHERE cr.service_code = 'AGL-2VMN'
    AND NOT EXISTS (
      SELECT 1 FROM customer_rates cr2
      WHERE  cr2.customer_id  = cr.customer_id
        AND  cr2.service_code = 'AGL-2VMN'
        AND  LOWER(cr2.zone_name) = 'out of area'
    )
  ORDER BY
    cr.customer_id,
    CASE WHEN cr.price IS NULL OR cr.price = 0 THEN 1 ELSE 0 END ASC,
    cr.price DESC NULLS LAST;

  GET DIAGNOSTICS v_inserted = ROW_COUNT;
  RAISE NOTICE 'Migration 227 step3: added Out of Area for % customer(s) missing it.', v_inserted;
END $$;
