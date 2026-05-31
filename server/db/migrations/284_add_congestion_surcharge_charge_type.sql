-- Migration 284: Add 'congestion_surcharge' to the charge_type enum
--
-- The charges table charge_type column is an enum. carrier_direct lines
-- that have a congestion surcharge need to store charge_type='congestion_surcharge'
-- so the dashboard's dedicated congestion column can display correctly.
ALTER TYPE charge_type ADD VALUE IF NOT EXISTS 'congestion_surcharge';
