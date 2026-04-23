-- 049_new_customer_contacts.sql
-- Adds primary contacts for Jezaya UK Limited and Perex Group Ltd.

INSERT INTO customer_contacts (customer_id, full_name, email_address, phone_number, job_title, is_main_contact, is_finance_contact)
SELECT id, 'Ammar Iqbal', 'ammar@jezaya.com', '03337721888', 'Director', true, true
FROM customers WHERE business_name = 'Jezaya UK Limited'
ON CONFLICT DO NOTHING;

INSERT INTO customer_contacts (customer_id, full_name, email_address, phone_number, job_title, is_main_contact, is_finance_contact)
SELECT id, 'Daniel Peresztegi', 'info@perex.co.uk', '07903697189', 'Director', true, true
FROM customers WHERE business_name = 'Perex Group Ltd'
ON CONFLICT DO NOTHING;
