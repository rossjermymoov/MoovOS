-- 029: DC weight class reference data
--
-- Stores the courier platform's own weight band definitions, imported from
-- the DC weight_classes CSV export.  These are the authoritative numeric
-- bounds (min_weight_kg / max_weight_kg) for each service.
--
-- customer_rates rows link back here so the billing engine can match
-- shipment weights numerically rather than parsing text band names.

CREATE TABLE IF NOT EXISTS dc_weight_classes (
  id                  SERIAL PRIMARY KEY,
  dc_weight_class_id  INTEGER       UNIQUE NOT NULL,
  weight_class_name   VARCHAR(100),
  courier_code        VARCHAR(20)   NOT NULL,
  service_code        VARCHAR(30)   NOT NULL,
  service_name        VARCHAR(100),
  min_weight_kg       NUMERIC(8,3)  NOT NULL DEFAULT 0,
  max_weight_kg       NUMERIC(8,3)  NOT NULL,
  max_cubic_volume    NUMERIC(10,4),
  created_at          TIMESTAMPTZ   DEFAULT NOW(),
  updated_at          TIMESTAMPTZ   DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS dc_weight_classes_service_idx
  ON dc_weight_classes(courier_code, service_code);
