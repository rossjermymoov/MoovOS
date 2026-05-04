-- ─── Migration 142 — DPD Default CSV Column Profile ───────────────────────────
--
-- Seeds the default carrier CSV column profile for DPD invoice reconciliation.
--
-- DPD invoice format (key differences from DHL):
--   • 4 preamble rows before the column header row (account info, nett/VAT/gross totals)
--   • Tracking key: "Consignment" column — the DPD consignment number stored in
--     shipments.tracking_codes via create_label_parcels[].tracking_code.
--     (Senders Ref was the original choice but is often blank or an internal customer
--     reference with no correspondence to charges.order_id.)
--   • Service Code: numeric (2=NXTDAY, 1=2DAY, 9=CLASIC, 0=EXPRSS)
--   • Multi-parcel: one "H" (header) row has all financial data; subsequent "S" (sub-parcel)
--     rows have blank financials. Filtering by Revenue > 0 naturally excludes sub-rows.
--   • Sub-parcel pricing: ALL parcels billed at the sub-rate when Items > 1 (not first at
--     full rate). parcel_pricing='all_sub' tells the engine to compute expected as n × price_sub.
--   • Revenue column = what DPD charges us (carrier amount). Fuel/Energy and Carriage are
--     excluded from reconciliation (auto-included in our charges). All other named surcharges
--     are passed through to customers.
--
-- Surcharge columns (add via UI after confirming surcharge UUIDs):
--   "Third Party Collection"    → DPD Third Party Collection surcharge
--   "Congestion Charge"         → DPD Congestion surcharge
--   "Clearance Charge"          → DPD NI/Clearance surcharge
--   "Oversized/Overweight Charge" → DPD Oversize surcharge
--   "Relabel Charge"            → DPD Relabel surcharge
--   NOTE: "Fuel and Energy Charge" and "Carriage Charge" are intentionally excluded.

INSERT INTO carrier_csv_profiles (carrier_id, profile_name, column_map, is_default)
SELECT
  cu.id,
  'DPD Standard Invoice',
  jsonb_build_object(
    -- ── Core fields ────────────────────────────────────────────────────────
    -- Use Consignment as the tracking key — it is the DPD consignment number
    -- (a 14-15 digit number). For Moov OS-booked DPD shipments this is stored
    -- in shipments.tracking_codes via create_label_parcels[].tracking_code.
    -- The pool indexes by tracking_codes, so this is the correct lookup key.
    -- (Senders Ref was the original choice but is frequently blank or an internal
    -- customer reference with no match in charges.order_id.)
    'tracking_number',   'consignment',
    'service_code',      'service code',
    'carrier_amount',    'revenue',
    'billed_weight_kg',  'weight',
    'parcel_count',      'items',

    -- DPD "Date" column = per-shipment collection/despatch date.
    -- Stored as shipment_date on reconciliation_lines; used by finalizationService
    -- as the despatch_date fallback for external_booking lines (no charge record).
    'shipment_date',     'date',

    -- invoice_ref is NOT a per-row column — it lives in the preamble (D1 / row 0 col 3).
    -- preamble_fields below auto-extracts it into the run's invoice_ref on upload.
    'invoice_ref',       '',

    -- DPD's "Date" column is the individual shipment date, not the invoice date.
    -- There is no invoice-level date field in the DPD CSV; leave blank so the
    -- user can enter it manually via the override field in the wizard if needed.
    'invoice_date',      '',

    -- Account number is in the preamble (B1 / row 0 col 1), not per-row.
    'account_number',    '',
    'charge_type',       '',

    -- ── DPD-specific parser options ─────────────────────────────────────
    -- Skip the 4 invoice summary rows that appear before the column header row.
    -- Row 0: "Account No", <acct>, "Invoice No", <inv_no>, ..., <company name>
    -- Row 1: "Nett Invoice Value", , <value>, "GBP"
    -- Row 2: "VAT", , <value>, "GBP"
    -- Row 3: "Gross Invoice Value", , <value>, "GBP"
    -- Row 4: actual column headers ("Date","Consignment","Header","Parcel No",...)
    'header_row_skip',   4,

    -- All parcels in a multi-parcel DPD consignment are billed at the sub-rate
    -- (price_sub), including the first. Expected = n × price_sub, not
    -- price_first + (n-1) × price_sub.
    'parcel_pricing',    'all_sub',

    -- ── Preamble field extraction ─────────────────────────────────────────
    -- Extract the invoice reference from the preamble (row 0, col 3 = invoice number).
    -- The frontend auto-populates invoiceRefOverride from this when the file is loaded.
    'preamble_fields',   jsonb_build_array(
      jsonb_build_object('field', 'invoice_ref', 'row', 0, 'col', 3)
    ),

    -- Surcharge columns are left empty here and should be added via the UI
    -- once the DPD surcharge IDs are confirmed in the reconciliation resolver.
    'surcharge_columns', '[]'::jsonb
  ),
  true  -- set as default profile for DPD
FROM couriers cu
WHERE cu.code ILIKE 'DPD'
   OR cu.name ILIKE 'DPD'
   OR cu.name ILIKE 'DPD Parcel%'
ORDER BY cu.id
LIMIT 1
ON CONFLICT (carrier_id, profile_name)
DO UPDATE SET
  column_map = EXCLUDED.column_map,
  updated_at = NOW();
