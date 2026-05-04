-- ─── Migration 142 — DPD Default CSV Column Profile ───────────────────────────
--
-- Seeds the default carrier CSV column profile for DPD invoice reconciliation.
--
-- DPD invoice format (key differences from DHL):
--   • 4 preamble rows before the column header row (account info, nett/VAT/gross totals)
--   • Tracking key: "Senders Ref" column — maps to shipments.reference (e.g. MP-XXXXXXXX)
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
    -- Use Senders Ref as the tracking key — it maps to shipments.reference
    -- (both MP-XXXXXXXX Voila refs and plain Shopify numeric refs).
    -- The pool indexes by order_id = charges.order_id = shipments.reference.
    'tracking_number',   'senders ref',
    'service_code',      'service code',
    'carrier_amount',    'revenue',
    'billed_weight_kg',  'weight',
    'parcel_count',      'items',
    'invoice_ref',       '',
    'invoice_date',      'date',
    'account_number',    '',
    'charge_type',       '',

    -- ── DPD-specific parser options ─────────────────────────────────────
    -- Skip the 4 invoice summary rows that appear before the column header row.
    'header_row_skip',   4,

    -- All parcels in a multi-parcel DPD consignment are billed at the sub-rate
    -- (price_sub), including the first. Expected = n × price_sub, not
    -- price_first + (n-1) × price_sub.
    'parcel_pricing',    'all_sub',

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
