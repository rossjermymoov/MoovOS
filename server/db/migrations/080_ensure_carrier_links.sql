-- 080: Guarantee carrier links exist for every customer with rate data
--
-- Previous migrations (078, 079) failed silently:
--   078 — wrong join (service_id instead of courier_code)
--   079 — INNER JOIN on carrier_rate_cards excluded couriers that have no
--          weight_bands, because master carrier_rate_cards are only created
--          by migration 023 when weight_bands exist. DPD/DHL may have no
--          weight_bands if carrier cost data was never imported, so those
--          couriers had no master rate card, so the join produced zero rows.
--
-- This migration:
--   Step 1 — Create a master carrier_rate_card for every courier that
--             appears in customer_rates but has no master card yet.
--   Step 2 — Backfill customer_carrier_links from customer_rates using
--             courier_code (not service_id) for the join.
--   Step 3 — Make carrier_rate_card_id nullable so future inserts are
--             safe even if a master card is somehow missing.

-- Step 3 first (schema change — needed before the backfill insert can use NULL)
ALTER TABLE customer_carrier_links
  ALTER COLUMN carrier_rate_card_id DROP NOT NULL;

-- Step 1: create missing master carrier_rate_cards
INSERT INTO carrier_rate_cards (courier_id, name, is_master, is_active)
SELECT DISTINCT c.id, 'Master', true, true
FROM customer_rates cr
JOIN couriers c ON c.code = cr.courier_code
WHERE NOT EXISTS (
  SELECT 1 FROM carrier_rate_cards crc2
  WHERE crc2.courier_id = c.id AND crc2.is_master = true
);

-- Step 2: backfill customer_carrier_links
INSERT INTO customer_carrier_links (customer_id, courier_id, carrier_rate_card_id)
SELECT DISTINCT ON (cr.customer_id, c.id)
  cr.customer_id,
  c.id,
  (SELECT id FROM carrier_rate_cards WHERE courier_id = c.id AND is_master = true LIMIT 1)
FROM customer_rates cr
JOIN couriers c ON c.code = cr.courier_code
ORDER BY cr.customer_id, c.id
ON CONFLICT (customer_id, courier_id) DO NOTHING;
