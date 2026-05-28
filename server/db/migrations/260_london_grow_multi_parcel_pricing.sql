-- Migration 260: Set London Grow to multi-parcel pricing mode
--
-- London Grow ship multiple parcels per consignment and their rate card is
-- priced with all parcels at the sub rate (not a first+subsequent model).
-- Setting parcel_pricing_mode = 'multi' means billing.js will charge every
-- parcel at price_sub rather than the first at price and the rest at price_sub.
--
-- To correct already-finalized billing lines for existing runs, use the
-- "Refresh" button on the finalized run's Customer Billing Summary panel.

UPDATE customers
SET    parcel_pricing_mode = 'multi',
       updated_at          = NOW()
WHERE  business_name ILIKE '%london grow%';

DO $$
DECLARE
  v_updated INTEGER;
BEGIN
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  IF v_updated = 0 THEN
    RAISE NOTICE 'Migration 260: London Grow customer not found — nothing updated';
  ELSE
    RAISE NOTICE 'Migration 260: Set % London Grow customer(s) to multi-parcel pricing mode', v_updated;
  END IF;
  RAISE NOTICE 'Migration 260 complete.';
END $$;
