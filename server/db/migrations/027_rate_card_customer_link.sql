-- 027: add customer_account_number to carrier_rate_cards
-- Links a cost rate card to a specific Moov customer account.
-- Used when manually importing carrier bills — the account number on the rate
-- card tells you which customer to charge.

ALTER TABLE carrier_rate_cards
  ADD COLUMN IF NOT EXISTS customer_account_number VARCHAR(20);

CREATE INDEX IF NOT EXISTS carrier_rate_cards_customer_acct_idx
  ON carrier_rate_cards(customer_account_number)
  WHERE customer_account_number IS NOT NULL;
