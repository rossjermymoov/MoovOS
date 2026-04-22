-- 025: add price_failure_reason to charges
-- Stores a short human-readable reason when auto-pricing fails,
-- so the Finance UI can show exactly why a charge has no price.

ALTER TABLE charges ADD COLUMN IF NOT EXISTS price_failure_reason TEXT;
