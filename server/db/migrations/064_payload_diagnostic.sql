-- 064: Payload diagnostic — create a queryable table showing raw_payload field names
-- After this runs, open Railway → your DB → Data → run:
--   SELECT * FROM _payload_diagnostic ORDER BY event_count DESC;
-- This tells us exactly what field names Dispatch Cloud uses.

CREATE TABLE IF NOT EXISTS _payload_diagnostic (
  field_name      TEXT,
  sample_value    TEXT,
  event_count     INTEGER,
  sample_consignment TEXT
);

TRUNCATE _payload_diagnostic;

-- Top-level keys present in raw_payload
INSERT INTO _payload_diagnostic (field_name, sample_value, event_count, sample_consignment)
SELECT
  key,
  MAX(value) AS sample_value,
  COUNT(*)   AS event_count,
  MAX(consignment_number) AS sample_consignment
FROM tracking_events,
     jsonb_each_text(raw_payload) AS kv(key, value)
WHERE raw_payload IS NOT NULL
  AND jsonb_typeof(raw_payload) = 'object'
GROUP BY key
ORDER BY event_count DESC;
