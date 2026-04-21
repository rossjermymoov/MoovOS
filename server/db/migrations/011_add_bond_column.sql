-- 011_add_bond_column.sql
-- Add bond_amount_held column to customers table.
-- Migration 010 already ran without this column, so it needs its own migration.

ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS bond_amount_held NUMERIC(12,2) NOT NULL DEFAULT 0;
