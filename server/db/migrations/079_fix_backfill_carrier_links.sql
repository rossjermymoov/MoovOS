-- 079: Fix backfill of customer_carrier_links from existing customer_rates
--
-- Migration 078 had a broken JOIN: it joined courier_services on cs.id = cr.service_id
-- but customer_rates.service_id stores the old billing system ID (e.g. 764 for DPD Next Day),
-- NOT our auto-generated courier_services.id values. The join found nothing → nothing inserted.
--
-- This migration uses the correct join: couriers c ON c.code = cr.courier_code
-- (courier_code is stored directly in customer_rates, e.g. 'DPD', 'DHL').
--
-- Also uses INNER JOIN with carrier_rate_cards to guarantee NOT NULL on carrier_rate_card_id
-- (the column is NOT NULL per migration 040's table definition).
--
-- Safe to run multiple times: ON CONFLICT DO NOTHING.

INSERT INTO customer_carrier_links (customer_id, courier_id, carrier_rate_card_id)
SELECT DISTINCT ON (cr.customer_id, c.id)
  cr.customer_id,
  c.id                AS courier_id,
  crc.id              AS carrier_rate_card_id
FROM customer_rates cr
JOIN couriers c          ON c.code = cr.courier_code
JOIN carrier_rate_cards crc
                         ON crc.courier_id = c.id
                        AND crc.is_master  = true
ORDER BY cr.customer_id, c.id
ON CONFLICT (customer_id, courier_id) DO NOTHING;
