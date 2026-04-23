-- 042_service_fuel_group.sql
--
-- courier_services.fuel_group_id already exists in production (added by carriers
-- route code without a formal migration). This migration is a no-op for that
-- column but records the intent and ensures the index exists.
--
-- No changes to the charges table — fuel charge idempotency is tracked by
-- checking for existing rows with charge_type='fuel' on the same shipment.

ALTER TABLE courier_services
  ADD COLUMN IF NOT EXISTS fuel_group_id INTEGER REFERENCES fuel_groups(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_courier_services_fuel_group ON courier_services(fuel_group_id);
