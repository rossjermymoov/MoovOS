-- Migration 117: backfill EPS charges that have surcharge_id = NULL
--
-- Migration 116 only zeroed charges WHERE surcharge_id IN (...).
-- Any EPS charge rows written with surcharge_id = NULL were missed.
-- This catches them by matching service_name against the EPS code or name.

UPDATE charges
   SET cost_price = 0
 WHERE charge_type = 'surcharge'
   AND cancelled   = false
   AND cost_price != 0
   AND (
         UPPER(TRIM(service_name)) = 'EPS'
      OR UPPER(service_name) LIKE '%EMERGENCY%FUEL%'
       );
