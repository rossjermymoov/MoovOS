-- 018_add_at_depot_status.sql
-- Adds 'at_depot' to the parcel_status enum so hub/sorting-facility
-- scans are distinct from general in-transit movement.
-- NOTE: ALTER TYPE ADD VALUE cannot run inside a transaction block.

ALTER TYPE parcel_status ADD VALUE IF NOT EXISTS 'at_depot' AFTER 'collected';
