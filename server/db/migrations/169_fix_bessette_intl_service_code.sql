-- ─── Migration 169 — Fix Bessette international service_code mismatch ──────────
--
-- PROBLEM:
--   Bessette's customer_rates rows for DPD international services are stored with
--   a service_code ("DPD International Express DDP" or similar) that doesn't match
--   any courier_services.service_code. When lookupCustomerSellPrice is called with
--   the ACTUAL courier_services.service_code, the ILIKE match fails → sell = null
--   → 0 margin on all international lines.
--
-- ── Step 1: diagnostic — shows exactly what's in Bessette's rates vs what ──────
-- ── courier_services has for DPD international. Run this FIRST to verify. ──────
--
--   SELECT cr.service_code        AS rate_service_code,
--          cr.service_name        AS rate_service_name,
--          cs.service_code        AS matched_courier_service_code,
--          cs.id                  AS matched_courier_service_id,
--          COUNT(cr.id)           AS rate_rows
--   FROM   customer_rates cr
--   JOIN   customers cu ON cu.id = cr.customer_id AND cu.business_name ILIKE '%Bessette%'
--   LEFT JOIN courier_services cs ON cs.service_code ILIKE cr.service_code
--   WHERE  cr.service_code ILIKE '%international%'
--   GROUP  BY cr.service_code, cr.service_name, cs.service_code, cs.id;
--
--   Any row where matched_courier_service_code IS NULL is orphaned.
--   The fix renames it to the real DPD international service_code below.
--
--   Also check what DPD international services actually exist:
--   SELECT id, service_code, name, service_type
--   FROM   courier_services cs
--   JOIN   couriers c ON c.id = cs.courier_id AND (c.code ILIKE 'DPD' OR c.name ILIKE 'DPD')
--   WHERE  cs.service_code ILIKE '%international%'
--      OR  cs.name         ILIKE '%international%';

DO $$
DECLARE
  v_customer_id       UUID;
  v_orphaned_code     TEXT;
  v_real_service_code TEXT;
  v_real_service_name TEXT;
  v_rows_updated      INTEGER;
BEGIN

  -- ── Find Bessette ──────────────────────────────────────────────────────────
  SELECT id INTO v_customer_id
  FROM   customers
  WHERE  business_name ILIKE '%Bessette%'
  LIMIT  1;

  IF v_customer_id IS NULL THEN
    RAISE NOTICE 'Migration 169: customer "Bessette" not found — skipping';
    RETURN;
  END IF;

  -- ── Find the orphaned international service_code ───────────────────────────
  -- An orphaned code is one where no courier_services row matches.
  SELECT cr.service_code INTO v_orphaned_code
  FROM   customer_rates cr
  LEFT JOIN courier_services cs ON cs.service_code ILIKE cr.service_code
  WHERE  cr.customer_id = v_customer_id
    AND  cr.service_code ILIKE '%international%'
    AND  cs.id IS NULL
  GROUP  BY cr.service_code
  ORDER  BY COUNT(cr.id) DESC
  LIMIT  1;

  IF v_orphaned_code IS NULL THEN
    RAISE NOTICE 'Migration 169: no orphaned international service_code for Bessette — nothing to fix';
    RETURN;
  END IF;

  -- ── Find the real DPD international courier_services entry ─────────────────
  -- Prefer the service whose name or code most closely matches what was stored.
  -- Prefers rows where service_type = 'international'.
  SELECT cs.service_code, cs.name INTO v_real_service_code, v_real_service_name
  FROM   courier_services cs
  JOIN   couriers c ON c.id = cs.courier_id
  WHERE  (c.code ILIKE 'DPD' OR c.name ILIKE 'DPD')
    AND  (
      cs.service_code ILIKE '%international%'
      OR cs.name      ILIKE '%international%'
      OR cs.service_type::text = 'international'
    )
  ORDER  BY
    -- Prefer "International Express" over generic "International" if both exist
    (cs.name ILIKE '%express%')::int DESC,
    cs.service_type::text = 'international' DESC
  LIMIT  1;

  IF v_real_service_code IS NULL THEN
    RAISE NOTICE 'Migration 169: could not find a DPD international courier_service — check courier_services table manually';
    RETURN;
  END IF;

  RAISE NOTICE 'Migration 169: remapping Bessette service_code "%" → "%" (%)',
    v_orphaned_code, v_real_service_code, v_real_service_name;

  -- ── Apply the fix ──────────────────────────────────────────────────────────
  UPDATE customer_rates
  SET    service_code = v_real_service_code,
         service_name = v_real_service_name
  WHERE  customer_id  = v_customer_id
    AND  service_code = v_orphaned_code;

  GET DIAGNOSTICS v_rows_updated = ROW_COUNT;
  RAISE NOTICE 'Migration 169: updated % customer_rates row(s) for Bessette', v_rows_updated;

END
$$;

-- ── Post-fix sanity check ─────────────────────────────────────────────────────
SELECT
  cr.service_code,
  cr.service_name,
  cs.id           AS courier_service_id,
  COUNT(cr.id)    AS rate_rows,
  CASE WHEN cs.id IS NULL THEN '🔴 STILL ORPHANED' ELSE '🟢 OK' END AS status
FROM   customer_rates cr
JOIN   customers cu ON cu.id = cr.customer_id AND cu.business_name ILIKE '%Bessette%'
LEFT JOIN courier_services cs ON cs.service_code ILIKE cr.service_code
WHERE  cr.service_code ILIKE '%international%'
GROUP  BY cr.service_code, cr.service_name, cs.id;
