-- 042_service_fuel_group.sql
--
-- Links each courier service to a fuel group so the billing engine knows
-- which fuel % to apply when a shipment uses that service.
--
-- e.g. DPD-12 (Next Day) → DPD Domestic fuel group
--      DPD-19 (Classic Parcel, international) → DPD International fuel group
--
-- The engine reads fuel_groups.standard_sell_pct as the default sell rate,
-- overridden per-customer by customer_fuel_group_pricing.sell_pct.
-- Idempotency is tracked on charges by (shipment_id, fuel_group_id).

ALTER TABLE courier_services
  ADD COLUMN IF NOT EXISTS fuel_group_id INTEGER REFERENCES fuel_groups(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_courier_services_fuel_group ON courier_services(fuel_group_id);

-- Idempotency column on charges: tracks which fuel group was applied so we
-- never double-charge (separate from surcharge_id which references surcharges table).
ALTER TABLE charges
  ADD COLUMN IF NOT EXISTS fuel_group_id INTEGER REFERENCES fuel_groups(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_charges_fuel_group ON charges(fuel_group_id);
