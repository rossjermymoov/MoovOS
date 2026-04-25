-- 078: Backfill customer_carrier_links from existing customer_rates
--
-- The customer_carrier_links table was introduced in migration 077 but
-- no data was seeded. All historical customer rate data still exists in
-- customer_rates (keyed by service_id which belongs to a courier via
-- courier_services). This migration derives which couriers each customer
-- is linked to from their existing rates, and activates the master
-- carrier rate card for each link.
--
-- Result: every customer with rate data will have their carriers shown
-- as "active" in the pricing tab, restoring the previous behaviour.

INSERT INTO customer_carrier_links (customer_id, courier_id, carrier_rate_card_id)
SELECT DISTINCT ON (cr.customer_id, cs.courier_id)
  cr.customer_id,
  cs.courier_id,
  crc.id AS carrier_rate_card_id
FROM customer_rates cr
JOIN courier_services cs ON cs.id = cr.service_id
LEFT JOIN carrier_rate_cards crc
       ON crc.courier_id = cs.courier_id
      AND crc.is_master = true
ORDER BY cr.customer_id, cs.courier_id
ON CONFLICT (customer_id, courier_id) DO NOTHING;

-- Also seed customer_rate_card_assignments from customer_rate_card_assignments
-- if any manual assignments existed (they reference customer_rate_cards, not
-- carrier_rate_cards, so they don't affect carrier_rate_card_id above).
-- No action needed — those records are already present and unaffected.
