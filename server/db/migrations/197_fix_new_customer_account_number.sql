-- ─── Migration 197 — Correct account number MOOV-0239 → MOOV-0187 ────────────
--
-- A customer was onboarded via the AI flow and requested MOOV-0187.
-- The frontend did not pass account_number in the request body, so the
-- auto-generate trigger assigned MOOV-0239 (next in sequence) instead.
-- Root cause fixed in CustomerAI.jsx (Moov Account Number field now sent).

UPDATE customers
SET    account_number = 'MOOV-0187'
WHERE  account_number = 'MOOV-0239';
