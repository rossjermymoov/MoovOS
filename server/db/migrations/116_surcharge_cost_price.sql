-- Migration 116: split surcharge cost_price from sell price (default_value)
--
-- Previously default_value served as both the carrier cost and the default
-- sell price. This works for pass-through surcharges (HGV, remote area etc.)
-- but breaks for surcharges we charge customers but don't pay the carrier
-- (e.g. Emergency Fuel Surcharge / EPS).
--
-- Now each surcharge has an explicit cost_price (what the carrier charges us)
-- and default_value remains the default sell price (what we charge customers).
-- Customer overrides only ever affect the sell side.
-- Reconciliation only ever looks at cost_price on charge rows.

ALTER TABLE surcharges
  ADD COLUMN IF NOT EXISTS cost_price NUMERIC(10,4);

-- Default: cost = sell (pass-through) for all existing surcharges
UPDATE surcharges
   SET cost_price = default_value
 WHERE cost_price IS NULL;

ALTER TABLE surcharges
  ALTER COLUMN cost_price SET NOT NULL,
  ALTER COLUMN cost_price SET DEFAULT 0;

-- EPS is charged to customers but NOT billed by the carrier — cost = £0
UPDATE surcharges
   SET cost_price = 0
 WHERE UPPER(TRIM(code)) = 'EPS'
    OR (UPPER(name) LIKE '%EMERGENCY%' AND UPPER(name) LIKE '%FUEL%');

-- Backfill: fix existing EPS charge rows in the charges table
-- (previously written with cost_price = 0.15 from default_value)
UPDATE charges
   SET cost_price = 0
 WHERE charge_type = 'surcharge'
   AND cancelled   = false
   AND surcharge_id IN (
         SELECT id FROM surcharges
          WHERE UPPER(TRIM(code)) = 'EPS'
             OR (UPPER(name) LIKE '%EMERGENCY%' AND UPPER(name) LIKE '%FUEL%')
       );
