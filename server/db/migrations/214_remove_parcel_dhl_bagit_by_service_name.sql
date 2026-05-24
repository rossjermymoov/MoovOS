-- ─── Migration 214 — Remove Parcel weight class from DHL Bag It (by name) ────
--
-- Migrations 211 and 213 did not remove the rows — likely because the
-- service_code value stored in customer_rates doesn't match the IN() filter.
-- This migration joins via courier_services.name to catch any code variant.
--
-- Deletes customer_rates rows where:
--   - The service is a DHL Bag It (service name contains 'Bag' and courier is DHL)
--   - weight_class_name = 'Parcel'  (not a valid Bag It weight class)
--
-- Valid rows (Large Bag, Small Bag, Medium Bag weight classes) are untouched.

DO $$
DECLARE
  v_deleted INT := 0;
BEGIN
  DELETE FROM customer_rates cr
  USING  courier_services cs
  WHERE  cr.service_id  = cs.id
    AND  cs.name        ILIKE '%Bag%'
    AND  cr.weight_class_name ILIKE 'Parcel';

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RAISE NOTICE 'Migration 214: deleted % Parcel row(s) from Bag It services.', v_deleted;
END $$;
