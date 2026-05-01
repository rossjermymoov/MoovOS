-- Migration 139: store Xero contact name alongside contact ID
-- Previously only xero_contact_id was stored; the display name was lost on save.

ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS xero_contact_name VARCHAR(255);
