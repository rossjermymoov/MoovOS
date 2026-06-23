-- ─── Migration 225 — Remove £0 Packet duplicates on Yodel Xpect Medium 48 ────
--
-- Migration 223 inserted Mainland·Packet (price=0) for all AGL/Yodel customers
-- missing Medium 48. But some customers still had their original Mainland·Parcel
-- row (e.g. £4.10), so they now have two rows for the same zone — causing the
-- UI to show "Mainland · Packet" and "Mainland · Parcel" as separate entries.
--
-- This migration deletes the £0 Packet row wherever a non-zero row already
-- exists for the same customer + service_code + zone. Customers who had ALL
-- their Medium 48 rows deleted (and only have the £0 row) are left untouched
-- so they can set their price manually.

DO $$
DECLARE
  v_deleted INT := 0;
BEGIN
  DELETE FROM customer_rates
  WHERE service_code = 'AGL-2VMN'
    AND weight_class_name ILIKE 'Packet'
    AND price = 0
    AND EXISTS (
      SELECT 1 FROM customer_rates cr2
      WHERE  cr2.customer_id  = customer_rates.customer_id
        AND  cr2.service_code = 'AGL-2VMN'
        AND  LOWER(cr2.zone_name) = LOWER(customer_rates.zone_name)
        AND  cr2.price > 0
        AND  cr2.id != customer_rates.id
    );

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RAISE NOTICE 'Migration 225: removed % duplicate £0 Packet row(s) for AGL-2VMN.', v_deleted;
END $$;
