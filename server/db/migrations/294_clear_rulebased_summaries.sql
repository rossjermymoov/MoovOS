-- Migration 294: Null out short rule-based summaries so AI backfill regenerates them.
-- Rule-based summaries are typically under 60 chars (e.g. "General query", 
-- "Missing parcel, customer frustrated"). AI summaries are 150+ chars.
UPDATE queries SET description = NULL WHERE description IS NOT NULL AND LENGTH(description) < 80;
