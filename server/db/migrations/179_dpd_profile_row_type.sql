-- ─── Migration 179 — DPD profile: map row_type to "Header" column ───────────
--
-- Problem:
--   ReconciliationPage.jsx buildLines() filters invoice rows using:
--
--       .filter(l => l.carrier_amount > 0)
--
--   This was intended to remove DPD sub-parcel (S) rows, which share the same
--   Consignment number as the H-row but have blank Revenue (carrier_amount = 0).
--   Letting S-rows through would create spurious zero-amount reconciliation lines.
--
--   However, the same filter also silently drops any DPD H-row (header row) where
--   Revenue = 0 or is negative — for example:
--     • DPD credit notes (carrier refund for a previous overcharge)
--     • Free-delivery shipments billed at £0
--     • Adjustment rows
--
--   These should reach the reconciliation engine so operators can review them.
--   The tracking number 1548908643 is an example of this: it produces "no charge
--   at all from the engine" because buildLines() drops it before the engine runs.
--
-- Fix (two-part — this migration is part 1):
--
--   Part 1 (this migration): add 'row_type' → 'header' to the DPD default CSV
--   profile. The DPD "Header" column (col 2 in the data rows) contains 'H' for
--   header/billing rows and 'S' for sub-parcel rows. mapToInvoiceLine already
--   reads any key present in colMap and exposes it as line.row_type.
--
--   Part 2 (ReconciliationPage.jsx, committed alongside this migration):
--   buildLines() now uses row_type instead of carrier_amount = 0 to identify
--   and filter S-rows. H-rows with zero/negative Revenue pass through so the
--   engine can surface them as unmatched/corrected for operator review.
--
-- IDEMPOTENT: guards on NOT (column_map ? 'row_type') so a re-run is a no-op.
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
DECLARE
  v_carrier_id INTEGER;
BEGIN
  SELECT id INTO v_carrier_id
  FROM   couriers
  WHERE  code ILIKE 'DPD' OR name ILIKE 'DPD%'
  ORDER  BY id LIMIT 1;

  IF v_carrier_id IS NULL THEN
    RAISE NOTICE 'Migration 179: DPD carrier not found — skipping';
    RETURN;
  END IF;

  UPDATE carrier_csv_profiles
  SET    column_map = column_map || jsonb_build_object(
           -- 'Header' is the DPD CSV column (col 2 in data rows, after the 4 preamble rows).
           -- Values: 'H' = header/billing row (all financial columns populated)
           --         'S' = sub-parcel row (same Consignment number, financial columns blank)
           'row_type', 'header'
         ),
         updated_at = NOW()
  WHERE  carrier_id  = v_carrier_id
    AND  is_default  = true
    AND  NOT (column_map ? 'row_type');

  IF FOUND THEN
    RAISE NOTICE 'Migration 179: added row_type → "header" mapping to DPD default CSV profile';
  ELSE
    RAISE NOTICE 'Migration 179: DPD profile already has row_type — skipped (idempotent)';
  END IF;
END;
$$;
