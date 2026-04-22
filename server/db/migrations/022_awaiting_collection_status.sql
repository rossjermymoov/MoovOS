-- 022_awaiting_collection_status.sql
-- Adds awaiting_collection as a distinct parcel status.
-- Parcels at a drop/parcel shop waiting for the customer to collect them
-- were previously bucketed into on_hold — now tracked separately as a KPI.

ALTER TYPE parcel_status ADD VALUE IF NOT EXISTS 'awaiting_collection' AFTER 'on_hold';
