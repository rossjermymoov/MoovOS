-- ─── Migration 188 — Fix NI Clearance Charge surcharge rule operator ──────────
--
-- The "Clearance Charge" surcharge had a trigger rule with filter:
--   { "field": "ship_to_postcode", "op": "eq", "value": "BT" }
--
-- 'eq' requires an exact case-insensitive match, so "BT67 0WU" === "BT" → false.
-- The surcharge therefore never fired for any NI shipments.
--
-- Fix: change op from 'eq' to 'starts_with' so "BT67 0WU".startsWith("BT") → true.
-- billing.js testCondition() already handles 'starts_with' after migration 188 deploys.
--
-- Scope: only updates filter conditions that exactly match the broken pattern
-- (field=ship_to_postcode, op=eq, value=BT) to avoid touching unrelated rules.

UPDATE surcharge_rules
SET    filters    = (
         SELECT jsonb_agg(
           CASE
             WHEN (f->>'field' = 'ship_to_postcode'
               AND f->>'op'    = 'eq'
               AND UPPER(f->>'value') LIKE 'BT%'
               AND LENGTH(TRIM(f->>'value')) <= 4)
             THEN jsonb_set(f, '{op}', '"starts_with"')
             ELSE f
           END
         )
         FROM jsonb_array_elements(filters) AS f
       ),
       updated_at = NOW()
WHERE  EXISTS (
         SELECT 1
         FROM   jsonb_array_elements(filters) AS f
         WHERE  f->>'field' = 'ship_to_postcode'
           AND  f->>'op'    = 'eq'
           AND  UPPER(f->>'value') LIKE 'BT%'
           AND  LENGTH(TRIM(f->>'value')) <= 4
       );
