-- ─── Migration 200 — Free MOOV-0183 (direct SQL, no PL/pgSQL) ────────────────
--
-- Migration 199 used a PL/pgSQL DO block with a RECORD IS NULL guard that
-- may not have fired correctly when no rows were found. This replaces it with
-- a plain UPDATE that handles both cases (0 or 1 matching rows) correctly.

UPDATE customers
SET    account_number = 'MOOV-' || LPAD(nextval('customer_account_seq')::TEXT, 4, '0')
WHERE  account_number = 'MOOV-0183';
