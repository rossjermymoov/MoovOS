-- 031: Add numeric weight bounds to customer_rates
--
-- Adds min_weight_kg / max_weight_kg so billing can match shipment weights
-- numerically instead of parsing the text weight_class_name.
-- dc_weight_class_id links back to the DC reference table so the UI can
-- offer a picker when building rate cards.

ALTER TABLE customer_rates
  ADD COLUMN IF NOT EXISTS min_weight_kg       NUMERIC(8,3),
  ADD COLUMN IF NOT EXISTS max_weight_kg       NUMERIC(8,3),
  ADD COLUMN IF NOT EXISTS dc_weight_class_id  INTEGER;

-- Back-fill bounds from dc_weight_classes where service_code + band name match
UPDATE customer_rates cr
SET
  min_weight_kg      = wc.min_weight_kg,
  max_weight_kg      = wc.max_weight_kg,
  dc_weight_class_id = wc.dc_weight_class_id
FROM dc_weight_classes wc
WHERE cr.service_code  = wc.service_code
  AND cr.weight_class_name = wc.weight_class_name
  AND cr.min_weight_kg IS NULL;

CREATE INDEX IF NOT EXISTS customer_rates_weight_bounds_idx
  ON customer_rates(service_code, min_weight_kg, max_weight_kg)
  WHERE min_weight_kg IS NOT NULL;
