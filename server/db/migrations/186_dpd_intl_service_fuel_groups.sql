-- ─── Migration 186 — Assign fuel groups to DPD international air services ─────
--
-- DPD Classic Air (DPD-60), DPD Air Classic DDP (DPD-60DDP),
-- DPD Air Express (DPD-10), and DPD Air Express DDP (DPD-10DDP) had no
-- fuel_group_id set in courier_services. This meant:
--   - The pricing engine applied 0% fuel sell for new bookings
--   - The reconciliation weight-correction engine could not recalculate
--     the fuel charge after correcting weight (fuel remained at original
--     booking-time value, showing ~11% instead of the correct 18%)
--
-- Fix: assign all four services to the 'International Express' fuel group
-- (standard_sell_pct = 18.0, set in migration 043).
-- Only updates rows where fuel_group_id is currently NULL to avoid
-- overwriting any intentional manual assignment.

DO $$
DECLARE
  v_dpd_id         INTEGER;
  v_fuel_group_id  INTEGER;
BEGIN
  -- Get DPD courier id
  SELECT id INTO v_dpd_id FROM couriers WHERE LOWER(code) = 'dpd' LIMIT 1;
  IF v_dpd_id IS NULL THEN
    RAISE NOTICE 'DPD courier not found — skipping migration 186';
    RETURN;
  END IF;

  -- Get the International Express fuel group for DPD
  SELECT id INTO v_fuel_group_id
  FROM   fuel_groups
  WHERE  courier_id = v_dpd_id
    AND  name       = 'International Express'
  LIMIT 1;

  IF v_fuel_group_id IS NULL THEN
    RAISE NOTICE 'DPD International Express fuel group not found — skipping migration 186';
    RETURN;
  END IF;

  -- Assign to all DPD international air services where not already set
  UPDATE courier_services
  SET    fuel_group_id = v_fuel_group_id,
         updated_at    = NOW()
  WHERE  courier_id    = v_dpd_id
    AND  service_code  IN ('DPD-60', 'DPD-60DDP', 'DPD-10', 'DPD-10DDP')
    AND  fuel_group_id IS NULL;

  RAISE NOTICE 'Migration 186: assigned DPD International Express fuel group (id=%) to DPD-60, DPD-60DDP, DPD-10, DPD-10DDP (NULL rows only)', v_fuel_group_id;
END $$;
