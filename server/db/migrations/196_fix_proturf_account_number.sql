-- ─── Migration 196 — Correct TT-Proturf account number ───────────────────────
--
-- Migration 193 set this to MOOV-0183 in error. Correct value is MOOV-0186.

UPDATE customers
SET    account_number = 'MOOV-0186'
WHERE  business_name ILIKE '%proturf%'
  AND  account_number = 'MOOV-0183';
