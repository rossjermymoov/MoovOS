-- Migration 129: Per-service volumetric divisor on courier_services
--
-- The volumetric_rules shared-table approach (migration 121) required a JOIN
-- to calculate dimensional weight. Ross needs the divisor configurable per
-- service without creating a shared rule template. Adding a direct column is
-- simpler, faster (no JOIN), and easier to manage in the UI.
--
-- Logic in pricingEngine.js:
--   IF volumetric_divisor IS NULL OR volumetric_divisor = 0
--     → skip dimensional calculation, use physical weight only
--   ELSE
--     → dimKg = (L × W × H) / volumetric_divisor; charged = max(actual, dim)
--
-- The volumetric_rules table and courier_services.volumetric_rule_id are
-- retained (not dropped) for backward-compat — pricingEngine no longer uses them.

-- ── 1. Add the column ─────────────────────────────────────────────────────────
ALTER TABLE courier_services
  ADD COLUMN IF NOT EXISTS volumetric_divisor INTEGER
    CHECK (volumetric_divisor IS NULL OR volumetric_divisor > 0);

-- ── 2. Backfill from existing volumetric_rules link ───────────────────────────
-- Any service already assigned a volumetric rule gets its divisor copied across.
UPDATE courier_services cs
SET    volumetric_divisor = vr.divisor
FROM   volumetric_rules vr
WHERE  vr.id = cs.volumetric_rule_id
  AND  cs.volumetric_divisor IS NULL;

-- ── 3. Pre-seed international / air services with 5000 ────────────────────────
-- DPD Air Classic DDP (DDP = Delivery Duty Paid, always volumetric air)
UPDATE courier_services
SET    volumetric_divisor = 5000
WHERE  service_code = 'DPD-60DDP'
  AND  (volumetric_divisor IS NULL OR volumetric_divisor = 0);

-- DPD Classic Air (non-DDP variant)
UPDATE courier_services
SET    volumetric_divisor = 5000
WHERE  service_code = 'DPD-60'
  AND  (volumetric_divisor IS NULL OR volumetric_divisor = 0);

-- DHL Worldwide Air
UPDATE courier_services
SET    volumetric_divisor = 5000
WHERE  service_code = 'DHLPCUK-101'
  AND  (volumetric_divisor IS NULL OR volumetric_divisor = 0);

-- DHL Ecommerce International Economy Road
UPDATE courier_services
SET    volumetric_divisor = 5000
WHERE  service_code = 'DHLPCUK-204'
  AND  (volumetric_divisor IS NULL OR volumetric_divisor = 0);
