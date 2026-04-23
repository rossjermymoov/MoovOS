-- 047_backfill_weight_bounds.sql
--
-- Migration 031 joined on service_code = wc.service_code, which missed
-- services like DPD12-DROP (not in dc_weight_classes but sharing the same
-- weight_class_ids as DPD-12). This migration re-runs the backfill using
-- dc_weight_class_id alone — the integer ID from the DC platform is unique
-- per band regardless of service code.

UPDATE customer_rates cr
SET
  min_weight_kg      = wc.min_weight_kg,
  max_weight_kg      = wc.max_weight_kg,
  dc_weight_class_id = wc.dc_weight_class_id
FROM dc_weight_classes wc
WHERE cr.weight_class_id = wc.dc_weight_class_id
  AND cr.min_weight_kg IS NULL;
