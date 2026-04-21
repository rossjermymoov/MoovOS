-- 014_customer_rates_editable.sql
-- Change unique constraint from zone_id/weight_class_id (billing system IDs)
-- to zone_name/weight_class_name (meaningful text) so manually-added rates
-- can be created without needing a billing system zone ID.

ALTER TABLE customer_rates
  DROP CONSTRAINT IF EXISTS customer_rates_customer_id_service_id_zone_id_weight_class_id_key;

ALTER TABLE customer_rates
  ADD CONSTRAINT customer_rates_unique_name
  UNIQUE (customer_id, service_id, zone_name, weight_class_name);

-- zone_id / weight_class_id become optional (0 for manually added rows)
ALTER TABLE customer_rates ALTER COLUMN zone_id       SET DEFAULT 0;
ALTER TABLE customer_rates ALTER COLUMN weight_class_id SET DEFAULT 0;
