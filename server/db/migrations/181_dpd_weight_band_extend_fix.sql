-- ─── Migration 181 — DPD carrier weight band ceiling fix (180 corrected) ──────
--
-- Migration 180 used WHERE max_weight_kg = 30.01 which may not have matched
-- the stored NUMERIC(8,3) value (30.010) reliably on all Postgres versions.
-- This migration uses max_weight_kg < 999.0 instead to guarantee all non-max
-- DPD-11 and DPD-12 carrier bands are brought up to 999 kg regardless of their
-- current cap value.
--
-- Safe to run after 180 — bands already at 999.0 are excluded by the WHERE.
-- IDEMPOTENT: re-run is a no-op because max_weight_kg = 999.0 fails < 999.0.
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
DECLARE
  v_count INTEGER;
BEGIN

  UPDATE weight_bands
  SET    max_weight_kg = 999.0,
         updated_at    = NOW()
  WHERE  zone_id IN (
           SELECT z.id
           FROM   zones z
           JOIN   courier_services cs ON cs.id = z.courier_service_id
           WHERE  cs.service_code IN ('DPD-11', 'DPD-12')
         )
    AND  max_weight_kg < 999.0;

  GET DIAGNOSTICS v_count = ROW_COUNT;

  IF v_count > 0 THEN
    RAISE NOTICE 'Migration 181: extended % DPD-11/DPD-12 weight band(s) to 999 kg', v_count;
  ELSE
    RAISE NOTICE 'Migration 181: all DPD-11/DPD-12 bands already at 999 kg — no-op';
  END IF;

END;
$$;
