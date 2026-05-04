-- ─── Migration 148 — Add missing charges columns + backfill shipment records ───
--
-- Root cause of DPD reconciliation failure:
--   pricingEngine.js (new Voila webhook path) inserts charges without creating a
--   shipments record. The reconciliation pool queries via INNER JOIN shipments,
--   so charges with shipment_id = NULL were completely invisible to the pool.
--   All DPD invoice lines became "not in our system" → external_booking path.
--
-- This migration does two things:
--
--   Part A: Add columns that pricingEngine.js needs on the charges table.
--           Uses ADD COLUMN IF NOT EXISTS so safe to re-run or run on any DB.
--
--   Part B: Create shipment records for charges that have voila_shipment_id but
--           no shipment_id, and link all those charges back to their new shipment.
--           Uses charges.tracking_code (singular) where available.
--
-- Note: raw_payload on charges was not added by prior migrations.
--       We add it here. Historical charges will have NULL raw_payload — that is
--       expected and harmless. Going forward, webhooks.js creates the shipment
--       record before insertCharges() is called, so raw_payload on charges is
--       no longer the critical path for the reconciliation fix.

-- ── Part A: Schema corrections ────────────────────────────────────────────────

-- pricingEngine.js charge fields (new webhook path)
ALTER TABLE charges ADD COLUMN IF NOT EXISTS voila_shipment_id     VARCHAR(50);
ALTER TABLE charges ADD COLUMN IF NOT EXISTS tracking_code         VARCHAR(100);
ALTER TABLE charges ADD COLUMN IF NOT EXISTS courier_service_id    INTEGER REFERENCES courier_services(id) ON DELETE SET NULL;
ALTER TABLE charges ADD COLUMN IF NOT EXISTS zone_id               INTEGER REFERENCES zones(id) ON DELETE SET NULL;
ALTER TABLE charges ADD COLUMN IF NOT EXISTS parcel_number         INTEGER;
ALTER TABLE charges ADD COLUMN IF NOT EXISTS weight_actual_kg      NUMERIC(8,3);
ALTER TABLE charges ADD COLUMN IF NOT EXISTS weight_dimensional_kg NUMERIC(8,3);
ALTER TABLE charges ADD COLUMN IF NOT EXISTS weight_charged_kg     NUMERIC(8,3);
ALTER TABLE charges ADD COLUMN IF NOT EXISTS sell_price            NUMERIC(10,4);
ALTER TABLE charges ADD COLUMN IF NOT EXISTS status                VARCHAR(30);
ALTER TABLE charges ADD COLUMN IF NOT EXISTS despatch_date         DATE;
ALTER TABLE charges ADD COLUMN IF NOT EXISTS ship_to_postcode      VARCHAR(20);
ALTER TABLE charges ADD COLUMN IF NOT EXISTS ship_to_country_iso   VARCHAR(5);
ALTER TABLE charges ADD COLUMN IF NOT EXISTS ship_to_name          VARCHAR(200);
ALTER TABLE charges ADD COLUMN IF NOT EXISTS parcel_count          INTEGER;
ALTER TABLE charges ADD COLUMN IF NOT EXISTS raw_payload           JSONB;
ALTER TABLE charges ADD COLUMN IF NOT EXISTS pricing_logic_trace   JSONB;

-- Reconciliation fields (may already exist from migration 132 / 133)
ALTER TABLE charges ADD COLUMN IF NOT EXISTS recon_corrected       BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE charges ADD COLUMN IF NOT EXISTS zone_name             VARCHAR(100);

-- Index for reconciliation engine lookups
CREATE INDEX IF NOT EXISTS idx_charges_voila_shipment ON charges(voila_shipment_id);
CREATE INDEX IF NOT EXISTS idx_charges_tracking_code  ON charges(tracking_code);
CREATE INDEX IF NOT EXISTS idx_charges_courier_service ON charges(courier_service_id);

-- ── Part B: Backfill shipment records ─────────────────────────────────────────

DO $$
DECLARE
  v_created INTEGER := 0;
  v_linked  INTEGER := 0;
BEGIN

  -- Create one shipment record per unique voila_shipment_id.
  -- All fields come directly from the charges table (no raw_payload needed).
  -- tracking_codes is built from charges.tracking_code where available.

  WITH charge_groups AS (
    SELECT DISTINCT ON (c.voila_shipment_id)
      c.voila_shipment_id                                AS platform_id_str,
      c.customer_id,
      c.ship_to_name,
      c.ship_to_postcode,
      c.ship_to_country_iso,
      c.order_id                                         AS reference,
      c.parcel_count,
      c.despatch_date                                    AS collection_date,
      CASE
        WHEN c.tracking_code IS NOT NULL AND c.tracking_code <> ''
        THEN ARRAY[c.tracking_code]
        ELSE NULL
      END                                                AS tracking_codes
    FROM   charges c
    WHERE  c.shipment_id      IS NULL
      AND  c.voila_shipment_id IS NOT NULL
      AND  c.charge_type       = 'courier'
    ORDER BY c.voila_shipment_id, c.created_at ASC
  ),
  ins AS (
    INSERT INTO shipments (
      platform_shipment_id, event_type,
      customer_id,
      ship_to_name, ship_to_postcode, ship_to_country_iso,
      reference, parcel_count, collection_date,
      tracking_codes
    )
    SELECT
      NULLIF(cg.platform_id_str, '')::BIGINT,
      'shipment.created',
      cg.customer_id,
      cg.ship_to_name,
      cg.ship_to_postcode,
      cg.ship_to_country_iso,
      cg.reference,
      cg.parcel_count,
      cg.collection_date,
      cg.tracking_codes
    FROM charge_groups cg
    WHERE NULLIF(cg.platform_id_str, '') IS NOT NULL
    ON CONFLICT (platform_shipment_id) DO UPDATE SET
      tracking_codes = COALESCE(EXCLUDED.tracking_codes, shipments.tracking_codes),
      customer_id    = COALESCE(EXCLUDED.customer_id,    shipments.customer_id),
      updated_at     = NOW()
    RETURNING id, platform_shipment_id
  )
  SELECT COUNT(*) INTO v_created FROM ins;

  -- Link ALL charge types (courier, fuel, surcharge, congestion, etc.) that share
  -- the same voila_shipment_id to their new shipment row.
  -- This is needed so the pool's total_cost_price subquery can sum fuel charges.
  WITH linked AS (
    UPDATE charges c
    SET    shipment_id = s.id,
           updated_at  = NOW()
    FROM   shipments s
    WHERE  s.platform_shipment_id IS NOT NULL
      AND  s.platform_shipment_id = NULLIF(c.voila_shipment_id, '')::BIGINT
      AND  c.shipment_id      IS NULL
      AND  c.voila_shipment_id IS NOT NULL
    RETURNING c.id
  )
  SELECT COUNT(*) INTO v_linked FROM linked;

  RAISE NOTICE 'Migration 148: created/updated % shipment records, linked % charges', v_created, v_linked;
END
$$;
