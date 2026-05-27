-- Migration 238: Add Xero nominal codes to billing_settings
-- Domestic = GB→GB shipments (VAT applies), International = GB→non-GB (zero/exempt)

ALTER TABLE billing_settings
  ADD COLUMN IF NOT EXISTS xero_domestic_account_code    VARCHAR(20) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS xero_international_account_code VARCHAR(20) DEFAULT NULL;

COMMENT ON COLUMN billing_settings.xero_domestic_account_code
  IS 'Xero nominal code for domestic (GB→GB) invoice line items — VAT applies (OUTPUT2)';
COMMENT ON COLUMN billing_settings.xero_international_account_code
  IS 'Xero nominal code for international (GB→non-GB) invoice line items — no VAT (NONE)';
