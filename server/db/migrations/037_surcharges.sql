-- 037_surcharges.sql
-- Surcharge definitions, rules, and customer overrides.
-- surcharges      → one per carrier, with code/name/calc_type/default_value
-- surcharge_rules → filter conditions (JSONB) that determine when a surcharge fires
-- customer_surcharge_overrides → customer-specific override price/percentage

-- ── surcharges ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS surcharges (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  courier_id    INTEGER     NOT NULL REFERENCES couriers(id) ON DELETE CASCADE,
  code          VARCHAR(50) NOT NULL,
  name          VARCHAR(200) NOT NULL,
  description   TEXT,
  calc_type     VARCHAR(20) NOT NULL DEFAULT 'flat',    -- 'flat' | 'percentage'
  calc_base     VARCHAR(20) NOT NULL DEFAULT 'fixed',   -- 'fixed' | 'base_rate'
  default_value NUMERIC(10,4) NOT NULL DEFAULT 0,
  active        BOOLEAN     NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (courier_id, code)
);

-- ── surcharge_rules ───────────────────────────────────────────────────────────
-- Each rule belongs to a surcharge. If ANY rule matches, the surcharge fires.
-- filters is a JSONB array of conditions:
--   [{ "field": "ship_to_country_iso", "op": "not_in", "value": ["GB"] }, ...]
-- Available fields: courier, dc_service_id, service_name,
--                   ship_to_country_iso, ship_to_postcode,
--                   parcel_count, total_weight_kg
-- Ops: eq, not_eq, in, not_in, gt, lt, gte, lte, contains
CREATE TABLE IF NOT EXISTS surcharge_rules (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  surcharge_id  UUID        NOT NULL REFERENCES surcharges(id) ON DELETE CASCADE,
  name          VARCHAR(200) NOT NULL,
  filters       JSONB       NOT NULL DEFAULT '[]',
  active        BOOLEAN     NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── customer_surcharge_overrides ──────────────────────────────────────────────
-- Override the default_value for a specific customer.
-- If an override exists for the customer + surcharge, it replaces default_value entirely.
CREATE TABLE IF NOT EXISTS customer_surcharge_overrides (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id    UUID        NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  surcharge_id   UUID        NOT NULL REFERENCES surcharges(id) ON DELETE CASCADE,
  override_value NUMERIC(10,4) NOT NULL,
  active         BOOLEAN     NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (customer_id, surcharge_id)
);

-- ── Add surcharge_id to charges so we can trace which surcharge created a row ─
ALTER TABLE charges
  ADD COLUMN IF NOT EXISTS surcharge_id UUID REFERENCES surcharges(id) ON DELETE SET NULL;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_surcharges_courier    ON surcharges(courier_id);
CREATE INDEX IF NOT EXISTS idx_surcharge_rules_parent ON surcharge_rules(surcharge_id);
CREATE INDEX IF NOT EXISTS idx_cso_customer           ON customer_surcharge_overrides(customer_id);
CREATE INDEX IF NOT EXISTS idx_charges_surcharge      ON charges(surcharge_id);
