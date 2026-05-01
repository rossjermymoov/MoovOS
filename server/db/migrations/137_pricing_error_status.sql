-- Migration 137: pricing_error charge status
--
-- Adds a 'pricing_error' value to the charge_status enum so that charges
-- that fail zone/band/sell lookups can be persisted with NULL prices and a
-- visible error status, rather than being silently dropped or priced at £0.
--
-- Also drops the NOT NULL constraint on cost_price / sell_price so that
-- pricing_error charges can store NULL.  The generated margin column
-- becomes NULL on those rows automatically.

ALTER TYPE charge_status ADD VALUE IF NOT EXISTS 'pricing_error';

-- Drop NOT NULL on cost_price / sell_price so pricing_error charges can store NULL.
-- Uses conditional blocks because older production DBs may use 'price'/'price_auto'
-- column names rather than the newer 'cost_price'/'sell_price' naming.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'charges' AND column_name = 'cost_price'
  ) THEN
    ALTER TABLE charges ALTER COLUMN cost_price DROP NOT NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'charges' AND column_name = 'sell_price'
  ) THEN
    ALTER TABLE charges ALTER COLUMN sell_price DROP NOT NULL;
  END IF;
END $$;
