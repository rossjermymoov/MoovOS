-- ─── Migration 170 — rate_fallback_service_id on courier_services ─────────────
--
-- WHY:
--   Some carriers offer both a standard and a DDP (Delivered Duty Paid) variant
--   of the same service (e.g. "International Express" vs "International Express DDP").
--   Customers almost always use ONE variant exclusively — they either book DDP or
--   they don't. Setting up a separate rate card for each variant would duplicate
--   every zone/weight-band row needlessly.
--
--   Instead, we allow a service to declare a fallback: when lookupCustomerSellPrice
--   finds no rate card for "International Express DDP", it retries automatically
--   using the fallback service ("International Express"), and vice versa.
--
--   This is set per-carrier-service and managed via the Carriers admin UI
--   (PATCH /api/courier-services/:id) so no hardcoding is needed.
--
-- COLUMN:
--   rate_fallback_service_id — nullable FK to another courier_services row.
--     When a customer rate card lookup returns no match for this service, the
--     engine tries again using the fallback service's service_code.
--     NULL = no fallback (default behaviour).
--
-- SEED DATA:
--   Tries to link DPD International Express DDP ↔ International Express.
--   Only runs if both services exist and neither fallback is already set.
--   The seed sets DDP→standard; the reverse (standard→DDP) is left unset
--   because a customer on the standard service should NOT fall back to DDP
--   pricing (different duty treatment). Only DDP customers fall back to
--   standard rates.
--
-- IDEMPOTENT: ADD COLUMN IF NOT EXISTS; seed uses a conditional DO block.

ALTER TABLE courier_services
  ADD COLUMN IF NOT EXISTS rate_fallback_service_id INTEGER
    REFERENCES courier_services(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_courier_services_rate_fallback
  ON courier_services(rate_fallback_service_id)
  WHERE rate_fallback_service_id IS NOT NULL;

-- ── Seed: DPD International Express DDP → International Express ───────────────
DO $$
DECLARE
  v_ddp_id      INTEGER;
  v_standard_id INTEGER;
BEGIN

  -- Find the DPD courier
  -- Find DPD International Express DDP (any casing)
  SELECT cs.id INTO v_ddp_id
  FROM   courier_services cs
  JOIN   couriers c ON c.id = cs.courier_id
  WHERE  (c.code ILIKE 'DPD' OR c.name ILIKE 'DPD')
    AND  (cs.service_code ILIKE '%ddp%' OR cs.name ILIKE '%ddp%')
    AND  (cs.service_code ILIKE '%international%' OR cs.name ILIKE '%international%')
  ORDER  BY cs.id
  LIMIT  1;

  -- Find DPD International Express (without DDP)
  SELECT cs.id INTO v_standard_id
  FROM   courier_services cs
  JOIN   couriers c ON c.id = cs.courier_id
  WHERE  (c.code ILIKE 'DPD' OR c.name ILIKE 'DPD')
    AND  cs.service_code NOT ILIKE '%ddp%'
    AND  cs.name         NOT ILIKE '%ddp%'
    AND  (cs.service_code ILIKE '%international%' OR cs.name ILIKE '%international%')
  ORDER  BY cs.id
  LIMIT  1;

  IF v_ddp_id IS NULL OR v_standard_id IS NULL THEN
    RAISE NOTICE 'Migration 170 seed: DPD DDP or standard international service not found — skipping auto-link (set rate_fallback_service_id manually)';
    RETURN;
  END IF;

  IF v_ddp_id = v_standard_id THEN
    RAISE NOTICE 'Migration 170 seed: DDP and standard resolved to same service (id=%) — skipping', v_ddp_id;
    RETURN;
  END IF;

  -- Only set if not already configured
  UPDATE courier_services
  SET    rate_fallback_service_id = v_standard_id
  WHERE  id = v_ddp_id
    AND  rate_fallback_service_id IS NULL;

  RAISE NOTICE 'Migration 170 seed: set DPD International Express DDP (id=%) → fallback to International Express (id=%)', v_ddp_id, v_standard_id;

END
$$;

-- ── Verify ────────────────────────────────────────────────────────────────────
SELECT
  cs.id,
  cs.service_code,
  cs.name,
  fb.service_code AS fallback_service_code,
  fb.name         AS fallback_name
FROM   courier_services cs
JOIN   couriers c ON c.id = cs.courier_id
LEFT JOIN courier_services fb ON fb.id = cs.rate_fallback_service_id
WHERE  (c.code ILIKE 'DPD' OR c.name ILIKE 'DPD')
  AND  (cs.service_code ILIKE '%international%' OR cs.name ILIKE '%international%')
ORDER  BY cs.service_code;
