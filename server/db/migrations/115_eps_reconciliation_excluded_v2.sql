-- Migration 115: ensure EPS / Emergency Fuel Surcharge is reconciliation-excluded
-- Belt-and-suspenders in case 114 matched zero rows (code stored differently).
-- Matches by code OR by name containing "Emergency" and "Fuel".
UPDATE surcharges
SET reconciliation_excluded = true
WHERE UPPER(TRIM(code)) = 'EPS'
   OR (UPPER(name) LIKE '%EMERGENCY%' AND UPPER(name) LIKE '%FUEL%');
