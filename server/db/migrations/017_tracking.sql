-- 017_tracking.sql
-- Parcel tracking: stores one row per consignment, updated on every event.
-- tracking_events holds the full immutable history.

CREATE TYPE parcel_status AS ENUM (
  'booked',
  'collected',
  'in_transit',
  'out_for_delivery',
  'delivered',
  'failed_delivery',
  'on_hold',
  'customs_hold',
  'exception',
  'returned',
  'unknown'
);

CREATE TABLE IF NOT EXISTS parcels (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consignment_number  VARCHAR(100) NOT NULL UNIQUE,

  -- Courier
  courier_name        VARCHAR(100),
  courier_code        VARCHAR(50),
  service_name        VARCHAR(200),

  -- Customer (optional link)
  customer_id         UUID REFERENCES customers(id) ON DELETE SET NULL,
  customer_name       VARCHAR(200),
  customer_account    VARCHAR(50),

  -- Recipient
  recipient_name      VARCHAR(200),
  recipient_postcode  VARCHAR(20),
  recipient_address   TEXT,

  -- Parcel details
  weight_kg           NUMERIC(8,3),
  estimated_delivery  DATE,
  delivered_at        TIMESTAMPTZ,

  -- Current status (denormalised from latest event)
  status              parcel_status NOT NULL DEFAULT 'unknown',
  status_description  TEXT,
  last_location       VARCHAR(200),
  last_event_at       TIMESTAMPTZ,

  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_parcels_status       ON parcels(status);
CREATE INDEX IF NOT EXISTS idx_parcels_courier      ON parcels(courier_code);
CREATE INDEX IF NOT EXISTS idx_parcels_customer     ON parcels(customer_id);
CREATE INDEX IF NOT EXISTS idx_parcels_postcode     ON parcels(recipient_postcode);
CREATE INDEX IF NOT EXISTS idx_parcels_last_event   ON parcels(last_event_at DESC);
CREATE INDEX IF NOT EXISTS idx_parcels_search
  ON parcels USING gin(
    to_tsvector('english',
      coalesce(consignment_number,'') || ' ' ||
      coalesce(customer_name,'')      || ' ' ||
      coalesce(recipient_name,'')     || ' ' ||
      coalesce(recipient_postcode,'') || ' ' ||
      coalesce(courier_name,'')
    )
  );

CREATE TABLE IF NOT EXISTS tracking_events (
  id                  BIGSERIAL PRIMARY KEY,
  parcel_id           UUID NOT NULL REFERENCES parcels(id) ON DELETE CASCADE,
  consignment_number  VARCHAR(100) NOT NULL,
  event_code          VARCHAR(100),
  status              parcel_status NOT NULL DEFAULT 'unknown',
  description         TEXT,
  location            VARCHAR(200),
  event_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  raw_payload         JSONB,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tracking_events_parcel ON tracking_events(parcel_id);
CREATE INDEX IF NOT EXISTS idx_tracking_events_consignment ON tracking_events(consignment_number);
CREATE INDEX IF NOT EXISTS idx_tracking_events_at ON tracking_events(event_at DESC);
