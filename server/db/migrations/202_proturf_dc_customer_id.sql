-- ─── Migration 202 — Set correct dc_customer_id for TT Pro Turf ──────────────
--
-- dc_customer_id was cleared in migration 201. Correct value is MOOV-0186
-- (their Moov account number, which is also the identifier used in the DC webhook).

UPDATE customers
SET    dc_customer_id = 'MOOV-0186'
WHERE  account_number = 'MOOV-0186';
