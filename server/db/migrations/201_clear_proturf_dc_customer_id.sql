-- ─── Migration 201 — Clear erroneous dc_customer_id from TT Pro Turf ─────────
--
-- When TT-Proturf was onboarded via the old AI form, 'MOOV-0183' was entered
-- into the DC Account Number field (which was labelled ambiguously and was
-- storing into dc_id, not the Moov account number). Migration 198 copied
-- dc_id → dc_customer_id, so TT-Proturf ended up with dc_customer_id = 'MOOV-0183'.
--
-- 'MOOV-0183' is a Moov account number format — it was never a real DC webhook
-- identifier. Clearing it so the new customer can use it as their DC account ID.

UPDATE customers
SET    dc_customer_id = NULL,
       dc_id          = NULL
WHERE  dc_customer_id = 'MOOV-0183';
