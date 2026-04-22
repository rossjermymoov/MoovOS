-- 020_billing.sql
-- Shipments (one per create_shipment webhook) and charges (one per shipment,
-- one charge line per type). Invoices table stub for later.
--
-- Note: drops and recreates charges / shipments if they exist from an earlier
-- migration stub (003_billing_system.sql used different columns).

-- ── Safely create charge_type ENUM ────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'charge_type') THEN
    CREATE TYPE charge_type AS ENUM (
      'courier', 'surcharge', 'picking', 'packaging', 'return',
      'rule', 'ad_hoc', 'delivery', 'recurring', 'storage', 'assembly'
    );
  END IF;
END
$$;

-- ── Drop old stub tables if they exist (cascade removes indexes/constraints) ──
DROP TABLE IF EXISTS charges  CASCADE;
DROP TABLE IF EXISTS shipments CASCADE;
DROP TABLE IF EXISTS invoices  CASCADE;

-- ── Shipments ─────────────────────────────────────────────────────────────────

CREATE TABLE shipments (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  platform_shipment_id BIGINT      UNIQUE,
  event_type           VARCHAR(50) NOT NULL DEFAULT 'shipment.created',

  customer_id          UUID        REFERENCES customers(id) ON DELETE SET NULL,
  customer_account     VARCHAR(100),
  customer_name        VARCHAR(200),

  courier              VARCHAR(100),
  dc_service_id        VARCHAR(50),
  service_name         VARCHAR(200),

  ship_to_name         VARCHAR(200),
  ship_to_postcode     VARCHAR(20),
  ship_to_country_iso  VARCHAR(5),

  reference            VARCHAR(100),
  reference_2          VARCHAR(100),
  parcel_count         INT         NOT NULL DEFAULT 1,
  total_weight_kg      NUMERIC(10,3),
  collection_date      DATE,
  tracking_codes       TEXT[],

  cancelled            BOOLEAN     NOT NULL DEFAULT false,
  cancelled_at         TIMESTAMPTZ,

  raw_payload          JSONB,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_shipments_customer    ON shipments(customer_id);
CREATE INDEX idx_shipments_account     ON shipments(customer_account);
CREATE INDEX idx_shipments_platform_id ON shipments(platform_shipment_id);
CREATE INDEX idx_shipments_created     ON shipments(created_at DESC);

-- ── Charges ───────────────────────────────────────────────────────────────────

CREATE TABLE charges (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id   UUID        REFERENCES shipments(id) ON DELETE CASCADE,
  customer_id   UUID        REFERENCES customers(id) ON DELETE SET NULL,

  charge_type   charge_type NOT NULL DEFAULT 'courier',

  order_id      VARCHAR(100),
  parcel_qty    INT         NOT NULL DEFAULT 1,
  service_name  VARCHAR(200),

  price         NUMERIC(10,2),
  cost_price    NUMERIC(10,2),
  vat_rate      NUMERIC(6,4) NOT NULL DEFAULT 0.20,
  vat_amount    NUMERIC(10,2) GENERATED ALWAYS AS
                  (ROUND(COALESCE(price,0) * vat_rate, 2)) STORED,

  zone_name          VARCHAR(100),
  weight_class_name  VARCHAR(100),
  rate_id            UUID,
  price_auto         BOOLEAN NOT NULL DEFAULT false,

  billed        BOOLEAN     NOT NULL DEFAULT false,
  verified      BOOLEAN     NOT NULL DEFAULT false,
  cancelled     BOOLEAN     NOT NULL DEFAULT false,

  invoice_id    UUID,

  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_charges_customer    ON charges(customer_id);
CREATE INDEX idx_charges_shipment    ON charges(shipment_id);
CREATE INDEX idx_charges_type        ON charges(charge_type);
CREATE INDEX idx_charges_billed      ON charges(billed);
CREATE INDEX idx_charges_created     ON charges(created_at DESC);

-- ── Invoices stub ─────────────────────────────────────────────────────────────

CREATE TABLE invoices (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id    UUID        REFERENCES customers(id) ON DELETE SET NULL,
  invoice_number VARCHAR(50) UNIQUE,
  period_start   DATE,
  period_end     DATE,
  subtotal       NUMERIC(10,2),
  vat_total      NUMERIC(10,2),
  total          NUMERIC(10,2),
  status         VARCHAR(20)  NOT NULL DEFAULT 'draft',
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
