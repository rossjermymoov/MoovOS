-- Migration 262: Repair surcharge charges for already-resolved recon lines where
-- the charge was never created (charge_id IS NULL).
--
-- Root cause: the resolve endpoint's charge-creation block was guarded with
-- `if (line.customer_id)` which silently skipped unattributed surcharge lines
-- (where the DPD account number isn't in billing_aliases).  The customer can be
-- inherited from the freight counterpart line in the same run.  This migration
-- back-fills the missing charges and links them on the recon line so they appear
-- in the customer preview panel immediately.

DO $$
DECLARE
  r              RECORD;
  sc_customer_id UUID;
  sc_shipment_id UUID;
  sc_despatch    DATE;
  override_val   NUMERIC;
  sc_sell        NUMERIC;
  sc_cost        NUMERIC;
  parcels        INT;
  new_charge_id  UUID;
BEGIN

  FOR r IN
    SELECT
      rl.id          AS line_id,
      rl.run_id,
      rl.tracking_number,
      rl.customer_id,
      rl.carrier_amount,
      rl.parcel_count,
      rl.shipment_date,
      rl.surcharge_id,
      s.default_value,
      s.calc_type,
      s.charge_per
    FROM   reconciliation_lines rl
    JOIN   surcharges            s  ON s.id = rl.surcharge_id
    WHERE  rl.surcharge_id IS NOT NULL
      AND  rl.status        = 'corrected'
      AND  rl.charge_id    IS NULL
  LOOP

    -- 1. Determine customer_id (direct or inherited from freight counterpart)
    sc_customer_id := r.customer_id;
    IF sc_customer_id IS NULL THEN
      SELECT customer_id INTO sc_customer_id
      FROM   reconciliation_lines
      WHERE  run_id          = r.run_id
        AND  tracking_number = r.tracking_number
        AND  surcharge_id   IS NULL
        AND  customer_id    IS NOT NULL
      LIMIT 1;
    END IF;

    CONTINUE WHEN sc_customer_id IS NULL;  -- still can't determine customer, skip

    -- 2. Determine shipment_id from the freight counterpart's charge
    sc_shipment_id := NULL;
    sc_despatch    := NULL;

    SELECT ch.shipment_id, sh.despatch_date
    INTO   sc_shipment_id, sc_despatch
    FROM   reconciliation_lines rl2
    JOIN   charges ch  ON ch.id = rl2.charge_id
    LEFT JOIN shipments sh ON sh.id = ch.shipment_id
    WHERE  rl2.run_id          = r.run_id
      AND  rl2.tracking_number = r.tracking_number
      AND  rl2.surcharge_id   IS NULL
      AND  rl2.charge_id      IS NOT NULL
    LIMIT 1;

    -- Fallback: look up by tracking_codes array
    IF sc_shipment_id IS NULL THEN
      SELECT s2.id, s2.despatch_date
      INTO   sc_shipment_id, sc_despatch
      FROM   shipments s2
      WHERE  r.tracking_number = ANY(s2.tracking_codes)
      LIMIT  1;
    END IF;

    -- Use shipment_date from the recon line if despatch still unknown
    IF sc_despatch IS NULL THEN
      sc_despatch := r.shipment_date;
    END IF;

    -- 3. Resolve sell price: customer override → surcharge default_value
    SELECT COALESCE(cso.override_value, r.default_value)
    INTO   override_val
    FROM   surcharges ss
    LEFT JOIN customer_surcharge_overrides cso
           ON cso.surcharge_id = ss.id
          AND cso.customer_id  = sc_customer_id
          AND cso.active       = true
    WHERE  ss.id = r.surcharge_id;

    override_val := COALESCE(override_val, r.default_value, 0);
    parcels      := GREATEST(1, COALESCE(r.parcel_count, 1));

    IF r.calc_type = 'percentage' THEN
      sc_sell := ROUND(COALESCE(r.carrier_amount, 0) * (override_val / 100.0), 2);
    ELSIF r.charge_per = 'parcel' THEN
      sc_sell := ROUND(override_val * parcels, 2);
    ELSE
      sc_sell := override_val;
    END IF;

    sc_cost := COALESCE(r.carrier_amount, 0);

    CONTINUE WHEN sc_sell IS NULL OR sc_sell <= 0;  -- no sell price, skip

    -- 4. Idempotency check — charge may already exist from a previous partial run
    SELECT id INTO new_charge_id
    FROM   charges
    WHERE  customer_id  = sc_customer_id
      AND  surcharge_id = r.surcharge_id
      AND  charge_type  = 'surcharge'
      AND  cancelled    = false
      AND  (sc_shipment_id IS NULL OR shipment_id = sc_shipment_id)
    LIMIT 1;

    IF new_charge_id IS NULL THEN
      INSERT INTO charges (
        customer_id, shipment_id, charge_type,
        surcharge_id, cost_price, sell_price, price,
        status, verified, despatch_date, source
      ) VALUES (
        sc_customer_id, sc_shipment_id, 'surcharge',
        r.surcharge_id, sc_cost, sc_sell, sc_sell,
        'verified', true, sc_despatch, 'recon_surcharge'
      )
      RETURNING id INTO new_charge_id;
    END IF;

    -- 5. Link the charge back to the recon line (and set customer_id if still null)
    UPDATE reconciliation_lines
    SET    charge_id   = new_charge_id,
           customer_id = COALESCE(customer_id, sc_customer_id)
    WHERE  id = r.line_id;

    RAISE NOTICE 'Migration 262: linked charge % to recon line % (tracking %, sell £%)',
      new_charge_id, r.line_id, r.tracking_number, sc_sell;

  END LOOP;

END $$;
