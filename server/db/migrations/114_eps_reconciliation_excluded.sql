-- Migration 114: mark Emergency Fuel Surcharge (EPS) as reconciliation-excluded
-- This surcharge is charged to customers but is NOT billed by the carrier,
-- so it must be excluded when reconciling our cost prices against carrier invoices.
UPDATE surcharges
SET reconciliation_excluded = true
WHERE code = 'EPS';
