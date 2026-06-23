-- Migration 240: Add DPD service code '3' → DPD Next Day Parcel 2Kg mapping
--
-- DPD uses service code '3' in their invoice CSV for the DPD Next Day Parcel 2Kg
-- service (service_id=81, internal code DPD-ND2KG).  Without this mapping the
-- reconciliation engine was silently auto-accepting these lines as carrier_overhead
-- (because separateFuelRows=true), giving them customer=NULL and hiding them from
-- operators.  Adding this row causes the engine to find the charge in the pool and
-- compare amounts normally.

INSERT INTO courier_service_code_mappings (carrier_id, courier_code, service_id, is_active)
VALUES (1, '3', 81, true)
ON CONFLICT DO NOTHING;
