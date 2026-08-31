-- 324_dpd_carriage_surcharge_always.sql
-- Set Carriage Surcharge (HGV) to applies_when = 'always', default_value = 0.00 (sell price), cost_price = 0.22 (buy cost)

UPDATE surcharges
SET applies_when = 'always',
    default_value = 0.00,
    cost_price = 0.22,
    active = true
WHERE name ILIKE '%carriage%'
   OR code ILIKE '%carriage%'
   OR name ILIKE '%hgv%'
   OR code ILIKE '%hgv%';
