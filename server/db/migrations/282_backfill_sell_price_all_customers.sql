-- Migration 282: Backfill sell_price from price column for all customers
--
-- The pricing engine writes to charges.price (legacy sell column) but never
-- populates charges.sell_price (the explicit sell field added later).
-- This means sell_price = NULL on virtually every pre-existing charge record,
-- causing the live ledger preview and any UI/query that reads sell_price to
-- show "—" or zero instead of the correct sell amount.
--
-- The resolve drawer's freight preview reads sell_price — this is why
-- "Base Freight" shows "—" on the cost/sell breakdown for every customer
-- when resolving a carrier surcharge line.
--
-- Fix: copy price → sell_price for every charge where sell_price is NULL
-- but price has a positive value. Safe to re-run (WHERE clause is idempotent).
-- The single remaining NULL per customer (where price is also NULL/zero)
-- is a zero-value or cancelled charge — intentionally left unchanged.

UPDATE charges
SET    sell_price = price
WHERE  sell_price IS NULL
  AND  price      IS NOT NULL
  AND  price      > 0;
