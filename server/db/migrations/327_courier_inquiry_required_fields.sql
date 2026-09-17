-- 327_courier_inquiry_required_fields.sql
-- Per the WISMO plan (docs/wismo-automation-solution.md §9.2, confirmed by Sam):
-- DPD, Yodel, and DHL will not investigate a query unless the inquiry includes a
-- parcel description, its contents, and its value. Functional testing (2026-09-17,
-- ticket MOOV-2462) confirmed the courier inquiry draft was going out without any
-- of the three. Records whether an outbound courier inquiry draft had all three
-- present at creation time, for ops visibility/audit — the actual gate lives in
-- courierAutomation.js's missing-context branch, which now withholds the courier
-- draft (and asks the customer instead) until these are known.
ALTER TABLE query_emails
  ADD COLUMN IF NOT EXISTS required_fields_present BOOLEAN;
