-- ─── Migration 167 — DHL profile: map shipment_date to "Job Date" column ──────
--
-- Problem:
--   The DHL invoice CSV contains a "Job Date" column (column G) which holds
--   the per-shipment despatch date. The DHL default carrier_csv_profiles row
--   did not include a shipment_date mapping, so reconciliation_lines.shipment_date
--   was always NULL for DHL lines. This left the date blank in the pre-
--   finalization customer billing preview drill-down.
--
-- Fix:
--   Add "shipment_date": "Job Date" to the DHL default profile's column_map.
--   The reconciliation upload wizard's mapToInvoiceLine() reads column_map
--   .shipment_date to find the CSV column header, then stores the parsed
--   ISO date in reconciliation_lines.shipment_date via the engine.
--
-- IDEMPOTENT: uses || to merge only when the key is absent.

DO $$
DECLARE
  v_carrier_id INTEGER;
BEGIN
  SELECT id INTO v_carrier_id
  FROM   couriers
  WHERE  code ILIKE 'DHL' OR name ILIKE 'DHL%'
  ORDER  BY id
  LIMIT  1;

  IF v_carrier_id IS NULL THEN
    RAISE NOTICE 'DHL carrier not found — skipping migration 167';
    RETURN;
  END IF;

  UPDATE carrier_csv_profiles
  SET    column_map = column_map || '{"shipment_date": "Job Date"}'::jsonb,
         updated_at = NOW()
  WHERE  carrier_id = v_carrier_id
    AND  is_default = true
    AND  NOT (column_map ? 'shipment_date');

  RAISE NOTICE 'Migration 167 complete: shipment_date="Job Date" mapped for DHL carrier_id=%', v_carrier_id;
END;
$$;
