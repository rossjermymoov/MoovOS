-- ─── Migration 198 — Copy dc_id → dc_customer_id for AI-onboarded customers ──
--
-- Background:
--   customers.dc_id      (VARCHAR 50, UNIQUE) — added in migration 003.
--   customers.dc_customer_id (VARCHAR 100)    — added in migration 026.
--
-- The billing webhook resolves customers exclusively via dc_customer_id.
-- The AI onboarding route (POST /api/customers/ai-onboard) was incorrectly
-- storing the DC account number into dc_id instead of dc_customer_id, meaning
-- webhook shipments were never matching those customers.
--
-- This migration copies dc_id → dc_customer_id for every customer that has a
-- dc_id set but no dc_customer_id, fixing webhook matching for existing records.
-- The ai-onboard route has also been corrected to write dc_customer_id going
-- forward (dc_id is left NULL on new records).

UPDATE customers
SET    dc_customer_id = dc_id
WHERE  dc_id          IS NOT NULL
  AND  dc_customer_id IS NULL;
