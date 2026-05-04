-- ─── Migration 150 — Cancel voila-backfill April 20-21 duplicate charges ────────
--
-- MANDATE: Revert to billing.js charges as the single source of truth.
--   All charges created by the voila-backfill for April 20-21 shipments must be
--   cancelled.  billing.js charges carry correct zone_id (set at booking time via
--   the DC webhook) and must be the sole entries in the reconciliation pool.
--
-- WHY THE BACKFILL CHARGES ARE WRONG:
--   • pricingEngine resolves zone_id via matchZone(service, country, postcode).
--     When the Voila API payload lacks a delivery postcode, matchZone returns null,
--     and zone_id is stored as NULL on the charge.
--   • billing.js charges have zone_id set correctly (DC webhook provides it).
--   • Having two entries per consignment in the pool means poolHits[0] can be
--     the backfill charge (null zone_id), breaking the rate card comparison for
--     both DHL and DPD.
--
-- IDENTIFICATION:
--   Backfill charges = voila_shipment_id IS NOT NULL AND despatch_date is April 20-21.
--   despatch_date is set from shipment.collection_date in the Voila API payload, so
--   it reflects when the shipment was actually collected — not when the backfill ran.
--   Legitimate live-webhook charges (April 22+) have despatch_date >= April 22.
--
-- WHAT IS NOT TOUCHED:
--   • billing.js courier charges (voila_shipment_id IS NULL) → never cancelled here
--   • Live webhook charges April 22+ (despatch_date >= 2026-04-22) → safe
--
-- IDEMPOTENT: SET cancelled = true WHERE cancelled = false is safe to re-run.

DO $$
DECLARE
  v_target_shipments   UUID[];
  v_cancelled_courier  INTEGER := 0;
  v_cancelled_aux      INTEGER := 0;
  v_dpd_zone_set       INTEGER := 0;
  v_dpd_zone_null      INTEGER := 0;
BEGIN

  -- ─────────────────────────────────────────────────────────────────────────
  -- DIAGNOSTIC: billing.js DPD charge zone coverage
  --
  -- After this migration the pool relies solely on billing.js charges.
  -- Confirm that zone_id is set on billing.js DPD charges so the pool can
  -- resolve correct rate card bands without any ILIKE fallback.
  -- ─────────────────────────────────────────────────────────────────────────

  SELECT COUNT(*) INTO v_dpd_zone_set
  FROM   charges c
  JOIN   shipments s ON s.id = c.shipment_id
  WHERE  c.voila_shipment_id IS NULL
    AND  c.cancelled   = false
    AND  c.charge_type = 'courier'
    AND  c.verified    = true
    AND  s.courier     ILIKE '%dpd%'
    AND  c.zone_id     IS NOT NULL;

  SELECT COUNT(*) INTO v_dpd_zone_null
  FROM   charges c
  JOIN   shipments s ON s.id = c.shipment_id
  WHERE  c.voila_shipment_id IS NULL
    AND  c.cancelled   = false
    AND  c.charge_type = 'courier'
    AND  c.verified    = true
    AND  s.courier     ILIKE '%dpd%'
    AND  c.zone_id     IS NULL;

  RAISE NOTICE 'DIAGNOSTIC — billing.js DPD verified charges: zone_id SET = %, zone_id NULL = %',
    v_dpd_zone_set, v_dpd_zone_null;

  IF v_dpd_zone_null > 0 THEN
    RAISE NOTICE 'WARNING: % billing.js DPD charges have zone_id=NULL and will surface as DATA_ERROR in the new strict engine.',
      v_dpd_zone_null;
  END IF;

  -- ─────────────────────────────────────────────────────────────────────────
  -- TARGET: collect shipment UUIDs for backfill charges
  --
  -- A charge is a backfill charge for April 20-21 when:
  --   (a) voila_shipment_id IS NOT NULL  — created via pricingEngine (not billing.js)
  --   (b) despatch_date BETWEEN April 20-21 — the Voila collection_date confirms the
  --       shipment was despatched on those days, distinguishing it from April 22+
  --       live webhook charges which have despatch_date on the booking day.
  --
  -- charges.shipment_id is UUID (migration 020_billing.sql).
  -- ─────────────────────────────────────────────────────────────────────────

  SELECT ARRAY(
    SELECT DISTINCT c.shipment_id
    FROM   charges c
    WHERE  c.voila_shipment_id  IS NOT NULL
      AND  c.cancelled          = false
      AND  c.charge_type        = 'courier'
      AND  c.shipment_id        IS NOT NULL
      AND  c.despatch_date::date BETWEEN '2026-04-20' AND '2026-04-21'
  ) INTO v_target_shipments;

  RAISE NOTICE 'TARGET — % backfill shipments identified (April 20-21 by despatch_date)',
    COALESCE(array_length(v_target_shipments, 1), 0);

  IF COALESCE(array_length(v_target_shipments, 1), 0) = 0 THEN
    RAISE NOTICE 'No April 20-21 backfill charges found — checking for charges with NULL despatch_date...';

    -- Fallback notice: if despatch_date is null on all backfill charges, show count for manual review
    DECLARE
      v_null_despatch INTEGER;
    BEGIN
      SELECT COUNT(*) INTO v_null_despatch
      FROM   charges
      WHERE  voila_shipment_id IS NOT NULL
        AND  cancelled   = false
        AND  charge_type = 'courier'
        AND  despatch_date IS NULL;

      IF v_null_despatch > 0 THEN
        RAISE NOTICE 'NOTE: % backfill courier charges have NULL despatch_date and were not targeted.',
          v_null_despatch;
        RAISE NOTICE 'Run the post-run diagnostic to identify these charges by voila_shipment_id range.';
      END IF;
    END;
  END IF;

  -- ─────────────────────────────────────────────────────────────────────────
  -- CANCEL BACKFILL CHARGES
  -- ─────────────────────────────────────────────────────────────────────────

  IF COALESCE(array_length(v_target_shipments, 1), 0) > 0 THEN

    -- Cancel backfill courier charges only (billing.js charges guarded by voila_shipment_id IS NOT NULL)
    UPDATE charges
    SET    cancelled   = true,
           updated_at  = NOW()
    WHERE  shipment_id        = ANY(v_target_shipments)
      AND  charge_type        = 'courier'
      AND  voila_shipment_id  IS NOT NULL
      AND  cancelled          = false;
    GET DIAGNOSTICS v_cancelled_courier = ROW_COUNT;

    -- Cancel associated fuel / surcharge charges for the same shipments
    -- (no voila_shipment_id guard here — fuel/surcharge charges may predate the
    -- pricingEngine path and won't have voila_shipment_id set)
    UPDATE charges
    SET    cancelled   = true,
           updated_at  = NOW()
    WHERE  shipment_id  = ANY(v_target_shipments)
      AND  charge_type  IN ('fuel', 'surcharge')
      AND  cancelled    = false;
    GET DIAGNOSTICS v_cancelled_aux = ROW_COUNT;

    RAISE NOTICE 'CANCELLED: % courier charge(s) + % fuel/surcharge charge(s)',
      v_cancelled_courier, v_cancelled_aux;

  END IF;

  -- ─────────────────────────────────────────────────────────────────────────
  -- SUMMARY
  -- ─────────────────────────────────────────────────────────────────────────

  RAISE NOTICE '━━━ Migration 150 complete ━━━';
  RAISE NOTICE 'Total cancelled: % courier | % fuel/surcharge', v_cancelled_courier, v_cancelled_aux;
  RAISE NOTICE 'billing.js charges remain ACTIVE and are the sole reconciliation pool entries.';

END $$;

-- ─── Post-run verification (run in Railway console) ───────────────────────────
--
-- 1. Source/status breakdown:
-- SELECT
--   CASE WHEN c.voila_shipment_id IS NULL THEN 'billing.js' ELSE 'backfill' END AS source,
--   s.courier,
--   COUNT(*) FILTER (WHERE NOT c.cancelled)  AS active,
--   COUNT(*) FILTER (WHERE     c.cancelled)  AS cancelled,
--   COUNT(*)                                  AS total
-- FROM charges c
-- JOIN shipments s ON s.id = c.shipment_id
-- WHERE c.charge_type = 'courier'
--   AND (s.courier ILIKE '%dpd%' OR s.courier ILIKE '%dhl%')
-- GROUP BY 1, 2
-- ORDER BY 2, 1;
--
-- 2. billing.js DPD zone coverage:
-- SELECT c.zone_id IS NOT NULL AS has_zone_id, COUNT(*) AS charge_count
-- FROM charges c JOIN shipments s ON s.id = c.shipment_id
-- WHERE c.voila_shipment_id IS NULL AND c.cancelled = false
--   AND c.charge_type = 'courier' AND c.verified = true
--   AND s.courier ILIKE '%dpd%'
-- GROUP BY 1;
--
-- 3. If backfill charges remain (despatch_date fallback):
-- SELECT c.despatch_date, c.created_at::date, COUNT(*)
-- FROM charges c
-- WHERE c.voila_shipment_id IS NOT NULL AND c.cancelled = false AND c.charge_type = 'courier'
-- GROUP BY 1, 2 ORDER BY 1 DESC NULLS FIRST;
