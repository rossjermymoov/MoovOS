-- Migration 244: Fix DPD invoice service code '3' mapping
--
-- DPD invoice service code '3' is DPD's standard Next Day service (DPD-12).
-- "DPD Next Day 2Kg" (DPD-ND2KG, service_id=81) is an internal Moov pricing
-- construct only — it does not exist as a real DPD service code, so it must
-- never appear in reconciliation service mappings.
-- DPD Next Day 12.00 (DPD-13, service_id=57) is a separate timed service;
-- invoice code '3' does not correspond to it.
--
-- Correct mapping: invoice code '3' → DPD Next Day (DPD-12, service_id=53)

UPDATE courier_service_code_mappings
SET    service_id = 53,
       notes      = 'DPD Next Day (DPD-12) — corrected from erroneous mapping to internal 2Kg service'
WHERE  carrier_id  = 1
  AND  courier_code = '3'
  AND  customer_id IS NULL;
