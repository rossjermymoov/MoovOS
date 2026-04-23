-- 044_charge_type_fuel.sql
-- Adds 'fuel' to the charge_type enum so fuel surcharge rows can be inserted.
ALTER TYPE charge_type ADD VALUE IF NOT EXISTS 'fuel';
