-- ─── Migration 147 — DPD Profile: add account_number to preamble_fields ───────
--
-- The DPD invoice preamble (the 4 rows before the column header) contains the
-- carrier account number at row 0, column 1 (cell B1):
--
--   Row 0: "Account No", <acct_no>, "Invoice No", <inv_no>, ..., <company name>
--           col 0          col 1      col 2          col 3
--
-- Migration 142 only extracted invoice_ref (col 3). This migration adds the
-- account_number extraction (col 1) so the frontend can inject it as a constant
-- on every invoice line — enabling the customer lookup in the reconciliation engine
-- to resolve Europa (or any future DPD accounts) without a per-row account column.
--
-- The frontend handles pf.field === 'account_number' by storing the value in
-- preambleAccountNumber state and injecting it onto every line in buildLines()
-- when the per-row account_number column is unmapped (account_number: '' in colMap).

UPDATE carrier_csv_profiles
SET column_map = column_map
  || jsonb_build_object(
      'preamble_fields', jsonb_build_array(
        jsonb_build_object('field', 'invoice_ref',     'row', 0, 'col', 3),
        jsonb_build_object('field', 'account_number',  'row', 0, 'col', 1)
      )
     )
FROM couriers cu
WHERE carrier_csv_profiles.carrier_id = cu.id
  AND carrier_csv_profiles.profile_name = 'DPD Standard Invoice'
  AND (cu.code ILIKE 'DPD' OR cu.name ILIKE 'DPD');
