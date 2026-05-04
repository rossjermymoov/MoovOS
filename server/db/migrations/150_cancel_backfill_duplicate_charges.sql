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
-- SCOPE:
--   Two sweeps:
--   Sweep A — backfill charges where a billing.js charge exists for the same
--              consignment (tracking_code match against shipments.tracking_codes[]
--              or shipments.dc_service_id).  This catches every April 20-21
--              shipment that went through the DC webhook (i.e., all of them).
--   Sweep B — any remaining backfill charges created on 2026-04-30 (the date the
--              voila-backfill was executed) that Sweep A missed.  These would be
--              April 20-21 Voila shipments that the DC webhook never processed;
--              they lack a billing.js charge but are still wrong (no zone_id).
--
-- WHAT IS NOT TOUCHED:
--   • billing.js courier charges (voila_shipment_id IS NULL) → never cancelled here
--   • Webhook charges from April 22+ (voila_shipment_id IS NOT NULL, created before
--     2026-04-30) → outside Sweep B date window
--
-- IDEMPOTENT: SET cancelled = true WHERE cancelled = false is safe to re-run.

DO $$
DECLARE
  v_sweep_a_shipments  BIGINT[];
  v_sweep_b_shipments  BIGINT[];
  v_all_shipments      BIGINT[];
  v_courier_a          INTEGER := 0;
  v_aux_a              INTEGER := 0;
  v_courier_b          INTEGER := 0;
  v_aux_b              INTEGER := 0;
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
  -- SWEEP A — Backfill charges with a billing.js counterpart
  --
  -- A backfill courier charge is a confirmed duplicate when a billing.js
  -- courier charge exists whose shipment carries the same consignment number.
  -- We check three match patterns to cover DHL "60"-prefix variants:
  --   (a) tracking_code = ANY(s2.tracking_codes[])    — DPD + DHL direct
  --   (b) tracking_code = dc_service_id               — DHL exact
  --   (c) '60' || tracking_code = dc_service_id       — DHL: billing.js stored
  --                                                       with prefix, Voila bare
  -- ─────────────────────────────────────────────────────────────────────────

  SELECT ARRAY(
    SELECT DISTINCT c.shipment_id
    FROM   charges   c
    JOIN   charges   c2 ON (
             c2.voila_shipment_id IS NULL
             AND c2.cancelled     = false
             AND c2.charge_type   = 'courier'
           )
    JOIN   shipments s2 ON s2.id = c2.shipment_id
    WHERE  c.voila_shipment_id IS NOT NULL
      AND  c.cancelled         = false
      AND  c.charge_type       = 'courier'
      AND  c.tracking_code     IS NOT NULL
      AND  c.shipment_id       IS NOT NULL
      AND  (
        c.tracking_code = ANY(s2.tracking_codes)
        OR c.tracking_code = s2.dc_service_id
        OR '60' || c.tracking_code = s2.dc_service_id
      )
  ) INTO v_sweep_a_shipments;

  RAISE NOTICE 'SWEEP A — % backfill shipment records with confirmed billing.js duplicates',
    COALESCE(array_length(v_sweep_a_shipments, 1), 0);

  -- Cancel Sweep A backfill courier charges
  IF COALESCE(array_length(v_sweep_a_shipments, 1), 0) > 0 THEN
    UPDATE charges
    SET    cancelled   = true,
           updated_at  = NOW()
    WHERE  shipment_id        = ANY(v_sweep_a_shipments)
      AND  charge_type        = 'courier'
      AND  voila_shipment_id  IS NOT NULL
      AND  cancelled          = false;
    GET DIAGNOSTICS v_courier_a = ROW_COUNT;

    -- Cancel Sweep A associated fuel / surcharge charges
    UPDATE charges
    SET    cancelled   = true,
           updated_at  = NOW()
    WHERE  shipment_id = ANY(v_sweep_a_shipments)
      AND  charge_type IN ('fuel', 'surcharge')
      AND  cancelled   = false;
    GET DIAGNOSTICS v_aux_a = ROW_COUNT;

    RAISE NOTICE 'SWEEP A — Cancelled % courier + % fuel/surcharge charges',
      v_courier_a, v_aux_a;
  END IF;

  -- ─────────────────────────────────────────────────────────────────────────
  -- SWEEP B — Remaining backfill charges created on 2026-04-30
  --
  -- Any backfill charges that Sweep A missed (e.g., April 20-21 Voila shipments
  -- that the DC webhook never processed — so no billing.js counterpart exists).
  -- These are identified by creation date: the voila-backfill was executed on
  -- 2026-04-30.  Legitimate webhook charges from April 22-29 were created on
  -- their respective booking dates and are safely outside this window.
  -- ─────────────────────────────────────────────────────────────────────────

  SELECT ARRAY(
    SELECT DISTINCT c.shipment_id
    FROM   charges c
    WHERE  c.voila_shipment_id IS NOT NULL
      AND  c.cancelled         = false
      AND  c.charge_type       = 'courier'
      AND  c.shipment_id       IS NOT NULL
      AND  c.shipment_id       != ALL(COALESCE(v_sweep_a_shipments, ARRAY[]::BIGINT[]))
      AND  c.created_at::date  = '2026-04-30'
  ) INTO v_sweep_b_shipments;

  RAISE NOTICE 'SWEEP B — % additional backfill shipment records (no billing.js counterpart, created 2026-04-30)',
    COALESCE(array_length(v_sweep_b_shipments, 1), 0);

  IF COALESCE(array_length(v_sweep_b_shipments, 1), 0) > 0 THEN
    UPDATE charges
    SET    cancelled   = true,
           updated_at  = NOW()
    WHERE  shipment_id        = ANY(v_sweep_b_shipments)
      AND  charge_type        = 'courier'
      AND  voila_shipment_id  IS NOT NULL
      AND  cancelled          = false;
    GET DIAGNOSTICS v_courier_b = ROW_COUNT;

    UPDATE charges
    SET    cancelled   = true,
           updated_at  = NOW()
    WHERE  shipment_id = ANY(v_sweep_b_shipments)
      AND  charge_type IN ('fuel', 'surcharge')
      AND  cancelled   = false;
    GET DIAGNOSTICS v_aux_b = ROW_COUNT;

    RAISE NOTICE 'SWEEP B — Cancelled % courier + % fuel/surcharge charges',
      v_courier_b, v_aux_b;
  END IF;

  -- ─────────────────────────────────────────────────────────────────────────
  -- SUMMARY
  -- ─────────────────────────────────────────────────────────────────────────

  RAISE NOTICE '━━━ Migration 150 complete ━━━';
  RAISE NOTICE 'Total cancelled:  % courier charge(s)  |  % fuel/surcharge charge(s)',
    v_courier_a + v_courier_b, v_aux_a + v_aux_b;
  RAISE NOTICE 'billing.js charges remain ACTIVE and are the sole reconciliation pool entries.';
  RAISE NOTICE 'Next step: run reconciliation engine with ILIKE zone fallback REMOVED (migration 151 / engine patch).';

END $$;

-- ─── Post-run verification (run in Railway console) ───────────────────────────
--
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
