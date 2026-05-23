-- ─── Migration 187 — Set standard_sell_pct on DPD Classic Air fuel group ──────
--
-- Migration 043 set standard_sell_pct for four DPD fuel groups:
--   Classic Road (12%), Domestic (7.9%), International Express (18%),
--   International Postal (12%).
-- It missed the 'Classic Air' fuel group, which has fuel_surcharge_pct = 18%
-- (cost) but standard_sell_pct was left NULL.
--
-- When NULL, the pricing engine's COALESCE(cfgp.sell_pct, fg.standard_sell_pct, 0)
-- falls back to 0, meaning new bookings on DPD-60 apply 0% fuel sell.
-- The weight-correction recalculation also reads this value, so corrected
-- lines show stale or zero fuel instead of the correct 18%.

UPDATE fuel_groups
SET    standard_sell_pct = 18.0,
       updated_at        = NOW()
WHERE  name       = 'Classic Air'
  AND  courier_id = (SELECT id FROM couriers WHERE LOWER(code) = 'dpd' LIMIT 1)
  AND  (standard_sell_pct IS NULL OR standard_sell_pct = 0);
