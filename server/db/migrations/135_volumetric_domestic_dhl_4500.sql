-- Migration 135: Volumetric rules for domestic services
--
-- DHL applies volumetric billing to domestic parcels using a 4500 divisor
-- (L cm × W cm × H cm) ÷ 4500 = volumetric kg).
-- International air services use 5000 (already seeded in migration 129).
--
-- Insert the shared rule if it does not already exist, then assign all
-- DHL domestic courier services to it.

INSERT INTO volumetric_rules (name, divisor)
VALUES ('DHL Domestic 4500', 4500)
ON CONFLICT DO NOTHING;

-- Assign DHL domestic services (DHL-220, DHL-230, DHL-1 return, etc.)
-- Targets all courier_services belonging to a courier whose code or name
-- contains 'DHL', that are domestic or untyped, and have no divisor yet.
UPDATE courier_services cs
SET    volumetric_rule_id = vr.id,
       volumetric_divisor = vr.divisor
FROM   volumetric_rules vr,
       couriers         c
WHERE  vr.name                   = 'DHL Domestic 4500'
  AND  c.id                      = cs.courier_id
  AND  (c.code ILIKE '%DHL%' OR c.name ILIKE '%DHL%')
  AND  (cs.service_type IS NULL OR cs.service_type = 'domestic')
  AND  (cs.volumetric_divisor IS NULL OR cs.volumetric_divisor = 0);
