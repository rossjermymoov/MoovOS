-- ─── Migration 182 — DPD profile: add sender_ref column mapping ──────────────
--
-- The DPD CSV has a "Senders Ref" column on every row (H and S rows).
-- For consolidated consignments (multiple OMS shipments grouped under one DPD
-- consignment at manifest time) each S-row carries the Senders Ref of the
-- individual shipment that contributed that parcel.
--
-- Mapping sender_ref → 'senders ref' lets the CSV parser extract this value
-- per row. buildLines() then collects S-row sender refs and attaches them to
-- the parent H-row as consolidated_refs so the reconciliation engine can
-- look up the individual OMS charges for consolidation matching.
--
-- IDEMPOTENT: jsonb merge with ||; running twice produces same result.
-- ─────────────────────────────────────────────────────────────────────────────

UPDATE carrier_csv_profiles
SET    column_map = column_map || '{"sender_ref": "senders ref"}'::jsonb,
       updated_at = NOW()
WHERE  carrier_id = (
         SELECT cu.id FROM couriers cu
         WHERE  cu.code ILIKE 'DPD' OR cu.name ILIKE 'DPD%'
         ORDER  BY cu.id LIMIT 1
       )
  AND  is_default = true
  AND  (column_map->>'sender_ref') IS NULL;

DO $$
BEGIN
  IF FOUND THEN
    RAISE NOTICE 'Migration 182: added sender_ref → "senders ref" to DPD default CSV profile';
  ELSE
    RAISE NOTICE 'Migration 182: sender_ref already mapped — no-op';
  END IF;
END;
$$;
