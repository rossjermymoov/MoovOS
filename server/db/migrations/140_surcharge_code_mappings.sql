-- 140_surcharge_code_mappings.sql
-- Allow courier_service_code_mappings to resolve a raw carrier code to a SURCHARGE
-- (e.g. DHL "CONG" → congestion surcharge) in addition to a delivery service.
--
-- Exactly one of service_id or surcharge_id must be set on each row.
-- The existing NOT NULL on service_id is dropped and replaced with a CHECK.

ALTER TABLE courier_service_code_mappings
  ALTER COLUMN service_id DROP NOT NULL;

ALTER TABLE courier_service_code_mappings
  ADD COLUMN IF NOT EXISTS surcharge_id UUID REFERENCES surcharges(id) ON DELETE CASCADE;

ALTER TABLE courier_service_code_mappings
  ADD CONSTRAINT chk_service_or_surcharge
  CHECK (
    (service_id IS NOT NULL AND surcharge_id IS NULL)
    OR
    (service_id IS NULL AND surcharge_id IS NOT NULL)
  );

CREATE INDEX IF NOT EXISTS idx_cscm_surcharge ON courier_service_code_mappings(surcharge_id);

COMMENT ON COLUMN courier_service_code_mappings.surcharge_id IS
  'When set (instead of service_id), this raw carrier code maps to a known surcharge — e.g. DHL CONG → congestion surcharge.';
