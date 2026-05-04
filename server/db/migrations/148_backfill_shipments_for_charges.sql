-- ─── Migration 148 — Backfill shipment records for charges missing shipment_id ──
--
-- Root cause:
--   Charges created via the new Voila webhook path (POST /api/v1/webhooks/shipment-created
--   → pricingEngine.js) did not previously create a row in the shipments table.
--   The reconciliation engine's buildVerifiedPool query does:
--
--     FROM charges c JOIN shipments s ON s.id = c.shipment_id
--
--   This inner join silently excludes every charge where shipment_id IS NULL —
--   making them invisible to the pool. The engine sees them as "not in our system"
--   and routes them through the external_booking path, matching by rate card only.
--
--   DHL worked because those charges were ingested via the old billing.js path
--   which did create shipment records. DPD failed because it uses the new path.
--
-- Fix applied elsewhere:
--   - webhooks.js now calls createOrUpdateShipment() before insertCharges()
--   - insertCharges() now accepts shipmentId and stores it on charges
--   - buildVerifiedPool uses LEFT JOIN (safety net) + COALESCE for zone_id
--
-- This migration backfills the shipment records for all historical charges that
-- have shipment_id IS NULL and raw_payload IS NOT NULL (i.e. from the new path).
-- It then links ALL charges sharing that platform_shipment_id back to the new
-- shipment row (courier, fuel, surcharge charges all get shipment_id set).

DO $$
DECLARE
  v_created  INTEGER := 0;
  v_linked   INTEGER := 0;
BEGIN

  -- ── Step 1: Create shipment records from raw_payload ────────────────────────
  -- We use DISTINCT ON (platform_shipment_id) because multiple charges share the
  -- same Voila shipment ID. One shipment row per platform_shipment_id is created.
  -- ON CONFLICT handles the (rare) case where a shipment row was already created
  -- by an earlier run or by a billing.js call for the same shipment.

  WITH parsed AS (
    SELECT DISTINCT ON (NULLIF(raw_payload->'shipment'->>'id', '')::BIGINT)
      NULLIF(raw_payload->'shipment'->>'id', '')::BIGINT            AS platform_id,
      raw_payload->'shipment'->>'courier'                           AS courier,
      raw_payload->'shipment'->>'reference'                         AS reference,
      raw_payload->'shipment'->>'reference_2'                       AS reference_2,
      raw_payload->'shipment'->>'ship_to_name'                      AS ship_to_name,
      raw_payload->'shipment'->>'ship_to_postcode'                  AS ship_to_postcode,
      raw_payload->'shipment'->>'ship_to_country_iso'               AS ship_to_country_iso,
      NULLIF(raw_payload->'shipment'->>'collection_date', '')::DATE  AS collection_date,
      COALESCE((raw_payload->'shipment'->>'parcel_count')::INTEGER, 1) AS parcel_count,

      -- Tracking codes: create_label_parcels[*].tracking_code
      -- These are the DPD consignment/label numbers that appear on the invoice.
      ARRAY(
        SELECT elem->>'tracking_code'
        FROM   jsonb_array_elements(
          COALESCE(raw_payload->'shipment'->'create_label_parcels', '[]'::jsonb)
        ) AS elem
        WHERE  elem->>'tracking_code' IS NOT NULL
          AND  elem->>'tracking_code' <> ''
      )                                                              AS tracking_codes,

      -- dc_service_id from request_shipment JSON string
      CASE
        WHEN raw_payload->>'request_shipment' IS NOT NULL
         AND raw_payload->>'request_shipment' <> ''
         AND raw_payload->>'request_shipment' <> 'null'
        THEN (raw_payload->>'request_shipment')::jsonb->>'dc_service_id'
        ELSE NULL
      END                                                            AS dc_service_id,

      -- Total weight from create_label_parcels
      (
        SELECT NULLIF(
          COALESCE(SUM((elem->>'weight')::NUMERIC), 0), 0
        )
        FROM   jsonb_array_elements(
          COALESCE(raw_payload->'shipment'->'create_label_parcels', '[]'::jsonb)
        ) AS elem
      )                                                              AS total_weight_kg,

      customer_id,
      raw_payload->'shipment'->>'account_number'                    AS account_number,
      raw_payload                                                    AS raw_payload

    FROM   charges
    WHERE  shipment_id   IS NULL
      AND  raw_payload   IS NOT NULL
      AND  raw_payload->'shipment'->>'id' IS NOT NULL
      AND  raw_payload->'shipment'->>'id' <> ''
    ORDER BY NULLIF(raw_payload->'shipment'->>'id', '')::BIGINT, created_at ASC
  ),
  ins AS (
    INSERT INTO shipments (
      platform_shipment_id, event_type,
      customer_id, customer_account,
      courier, dc_service_id,
      ship_to_name, ship_to_postcode, ship_to_country_iso,
      reference, reference_2,
      parcel_count, total_weight_kg, collection_date,
      tracking_codes, raw_payload
    )
    SELECT
      p.platform_id,
      'shipment.created',
      p.customer_id,
      p.account_number,
      p.courier,
      p.dc_service_id,
      p.ship_to_name, p.ship_to_postcode, p.ship_to_country_iso,
      p.reference, p.reference_2,
      p.parcel_count, p.total_weight_kg, p.collection_date,
      NULLIF(p.tracking_codes, ARRAY[]::TEXT[]),
      p.raw_payload
    FROM parsed p
    WHERE p.platform_id IS NOT NULL
    ON CONFLICT (platform_shipment_id) DO UPDATE SET
      tracking_codes = COALESCE(EXCLUDED.tracking_codes, shipments.tracking_codes),
      dc_service_id  = COALESCE(EXCLUDED.dc_service_id,  shipments.dc_service_id),
      customer_id    = COALESCE(EXCLUDED.customer_id,    shipments.customer_id),
      updated_at     = NOW()
    RETURNING id, platform_shipment_id
  )
  SELECT COUNT(*) INTO v_created FROM ins;

  -- ── Step 2: Link all charges (of any type) to their new shipment rows ────────
  -- Courier, fuel, surcharge, congestion charges sharing the same voila_shipment_id
  -- all need shipment_id set so the pool's total_cost_price subquery can sum them.
  -- We match via platform_shipment_id → the Voila shipment id stored as a BIGINT.

  WITH linked AS (
    UPDATE charges c
    SET    shipment_id = s.id,
           updated_at  = NOW()
    FROM   shipments s
    WHERE  s.platform_shipment_id IS NOT NULL
      AND  s.platform_shipment_id::TEXT = c.raw_payload->'shipment'->>'id'
      AND  c.shipment_id IS NULL
      AND  c.raw_payload IS NOT NULL
    RETURNING c.id
  )
  SELECT COUNT(*) INTO v_linked FROM linked;

  RAISE NOTICE 'Migration 148: created/updated % shipment records, linked % charges', v_created, v_linked;
END
$$;
