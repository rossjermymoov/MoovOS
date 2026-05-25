-- ─── Migration 234 ────────────────────────────────────────────────────────────
--
-- Two cleanup tasks:
--
-- 1. TENALIA LIMITED — remove customer_service_pricing rows.
--    The reprice endpoint checks customer_service_pricing FIRST (carrier rate
--    card + markup model) before customer_rates. Tanalia has an entry here that
--    keeps returning a price even after their customer_rates were cleared.
--    Removing it allows reprice to correctly return "no matching rate found".
--
-- 2. EUROPA — delete carrier_direct charges added during reconciliation test runs.
--    source='carrier_direct' charges are created for shipments the carrier
--    invoiced but Moov OS had no existing charge record for. These were generated
--    during reconciliation testing and should not be in the finance table.
--    Also removes the associated shipment rows and reconciliation lines.

DO $$
DECLARE
  v_tenalia_id     UUID;
  v_europa_id      UUID;
  v_csp_removed    INT := 0;
  v_recon_removed  INT := 0;
  v_charges_removed INT := 0;
  v_ships_removed  INT := 0;
BEGIN

  -- ── 1. Tanalia: remove customer_service_pricing ──────────────────────────────
  SELECT id INTO v_tenalia_id
  FROM customers
  WHERE business_name ILIKE '%tanalia%'
  LIMIT 1;

  IF v_tenalia_id IS NOT NULL THEN
    DELETE FROM customer_service_pricing
    WHERE customer_id = v_tenalia_id;
    GET DIAGNOSTICS v_csp_removed = ROW_COUNT;
    RAISE NOTICE 'Migration 234: removed % customer_service_pricing row(s) for Tanalia (%).', v_csp_removed, v_tenalia_id;
  ELSE
    RAISE NOTICE 'Migration 234: Tanalia customer not found — skipping service pricing removal.';
  END IF;

  -- ── 2. Europa: delete carrier_direct charges and their shipments ─────────────
  SELECT id INTO v_europa_id
  FROM customers
  WHERE business_name ILIKE '%europa%'
  LIMIT 1;

  IF v_europa_id IS NOT NULL THEN
    -- Clear reconciliation_lines referencing these charges first
    DELETE FROM reconciliation_lines
    WHERE charge_id IN (
      SELECT id FROM charges
      WHERE customer_id = v_europa_id
        AND source = 'carrier_direct'
    );
    GET DIAGNOSTICS v_recon_removed = ROW_COUNT;

    -- Delete the carrier_direct charges (cascades courier_queries)
    DELETE FROM charges
    WHERE customer_id = v_europa_id
      AND source = 'carrier_direct';
    GET DIAGNOSTICS v_charges_removed = ROW_COUNT;

    -- Clean up orphaned shipments (no remaining charges) for Europa
    DELETE FROM shipments
    WHERE customer_id = v_europa_id
      AND id NOT IN (SELECT DISTINCT shipment_id FROM charges WHERE shipment_id IS NOT NULL);
    GET DIAGNOSTICS v_ships_removed = ROW_COUNT;

    RAISE NOTICE 'Migration 234: removed % recon line(s), % carrier_direct charge(s), % orphaned shipment(s) for Europa (%).',
      v_recon_removed, v_charges_removed, v_ships_removed, v_europa_id;
  ELSE
    RAISE NOTICE 'Migration 234: Europa customer not found — skipping carrier_direct cleanup.';
  END IF;

END $$;
