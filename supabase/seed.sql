-- ============================================================
-- KOSHA - Seed Data (Demo)
-- Run AFTER schema.sql and policies.sql
-- Replace 'YOUR_USER_ID' with actual auth.users id
-- ============================================================

-- Usage:
-- 1. Create account in Kosha app
-- 2. Get your user ID from Supabase Dashboard > Auth > Users
-- 3. Replace all instances of 'YOUR_USER_ID' below
-- 4. Run this file in Supabase SQL editor

DO $$
DECLARE
    v_user_id UUID := 'YOUR_USER_ID'::UUID; -- <-- REPLACE THIS
    v_cust1 UUID := uuid_generate_v4();
    v_cust2 UUID := uuid_generate_v4();
    v_cust3 UUID := uuid_generate_v4();
    v_cust4 UUID := uuid_generate_v4();
    v_cust5 UUID := uuid_generate_v4();
    v_prod1 UUID := uuid_generate_v4();
    v_prod2 UUID := uuid_generate_v4();
    v_prod3 UUID := uuid_generate_v4();
    v_prod4 UUID := uuid_generate_v4();
    v_prod5 UUID := uuid_generate_v4();
    v_inv1 UUID := uuid_generate_v4();
    v_inv2 UUID := uuid_generate_v4();
    v_inv3 UUID := uuid_generate_v4();
BEGIN

-- ============================================================
-- Business Profile
-- ============================================================
INSERT INTO public.business_profile (
    user_id, business_name, business_email, business_phone,
    business_address, business_city, business_state, business_pincode,
    gstin, pan, invoice_prefix, invoice_counter,
    currency_code, currency_symbol, default_tax_rate,
    bank_name, bank_account, bank_ifsc, bank_branch
) VALUES (
    v_user_id, 'Kosha Demo Business', 'demo@kosha.in', '+91-9876543210',
    '123, Business Park, MG Road', 'Bengaluru', 'Karnataka', '560001',
    '29ABCDE1234F1Z5', 'ABCDE1234F', 'INV', 4,
    'INR', '₹', 18.00,
    'State Bank of India', '1234567890', 'SBIN0001234', 'MG Road Bengaluru'
) ON CONFLICT (user_id) DO UPDATE SET
    business_name = EXCLUDED.business_name,
    business_email = EXCLUDED.business_email;

-- ============================================================
-- Customers
-- ============================================================
INSERT INTO public.customers (id, user_id, name, email, phone, address, city, state, pincode, gstin) VALUES
(v_cust1, v_user_id, 'Acme Technologies Pvt. Ltd.', 'accounts@acmetech.in', '+91-9800001111',
 '45, Tech Hub, Whitefield', 'Bengaluru', 'Karnataka', '560066', '29AABCA1234A1Z3'),
(v_cust2, v_user_id, 'Sunrise Exports', 'billing@sunriseexports.com', '+91-9800002222',
 '12, Export Zone, MIDC', 'Pune', 'Maharashtra', '411018', '27BBSCS5678B2Z1'),
(v_cust3, v_user_id, 'NextGen Solutions', 'finance@nextgensol.io', '+91-9800003333',
 '78, IT Park, Phase 2', 'Hyderabad', 'Telangana', '500081', '36CCCDE9012C3Z7'),
(v_cust4, v_user_id, 'Global Traders India', 'purchase@globaltraders.in', '+91-9800004444',
 '99, Industrial Area, Sector 6', 'Gurugram', 'Haryana', '122001', '06DDDEF3456D4Z2'),
(v_cust5, v_user_id, 'Bright Horizon School', 'admin@brighthorizon.edu', '+91-9800005555',
 '5, Education Colony, Koramangala', 'Bengaluru', 'Karnataka', '560034', '');

-- ============================================================
-- Products
-- ============================================================
INSERT INTO public.products (id, user_id, name, description, sku, hsn_code, unit, price, cost_price, tax_rate, stock_quantity, category) VALUES
(v_prod1, v_user_id, 'Web Design Services', 'Custom website design and development', 'SVC-WD-001', '998314', 'Hr', 2500.00, 1500.00, 18.00, 999, 'Services'),
(v_prod2, v_user_id, 'SEO Package - Monthly', 'Complete SEO optimization and reporting', 'SVC-SEO-001', '998313', 'Month', 15000.00, 8000.00, 18.00, 999, 'Services'),
(v_prod3, v_user_id, 'Logo Design', 'Professional brand identity and logo design', 'SVC-LOGO-001', '998312', 'Nos', 5000.00, 2000.00, 18.00, 999, 'Design'),
(v_prod4, v_user_id, 'Laptop - ProBook 450', 'HP ProBook 450 G9, i5, 16GB RAM, 512 SSD', 'HW-LP-001', '847130', 'Nos', 75000.00, 60000.00, 18.00, 15, 'Hardware'),
(v_prod5, v_user_id, 'Cloud Hosting - Annual', '1-year managed cloud hosting plan', 'SVC-HOST-001', '998315', 'Year', 12000.00, 5000.00, 18.00, 999, 'Hosting');

-- ============================================================
-- Invoices
-- ============================================================
INSERT INTO public.invoices (
    id, user_id, customer_id, invoice_number, invoice_type, status,
    invoice_date, due_date, customer_name, customer_email, customer_phone, customer_address, customer_gstin,
    business_name, business_gstin,
    subtotal, discount_amount, tax_amount, grand_total, amount_paid, amount_due,
    currency_code, currency_symbol, template, notes, terms, is_draft
) VALUES
(v_inv1, v_user_id, v_cust1, 'INV-0001', 'invoice', 'paid',
 CURRENT_DATE - 30, CURRENT_DATE - 20, 'Acme Technologies Pvt. Ltd.', 'accounts@acmetech.in', '+91-9800001111',
 '45, Tech Hub, Whitefield, Bengaluru', '29AABCA1234A1Z3',
 'Kosha Demo Business', '29ABCDE1234F1Z5',
 42500.00, 0.00, 7650.00, 50150.00, 50150.00, 0.00,
 'INR', '₹', 'modern', 'Thank you for your business!',
 'Payment is due within 30 days.', FALSE),

(v_inv2, v_user_id, v_cust2, 'INV-0002', 'invoice', 'sent',
 CURRENT_DATE - 10, CURRENT_DATE + 20, 'Sunrise Exports', 'billing@sunriseexports.com', '+91-9800002222',
 '12, Export Zone, MIDC, Pune', '27BBSCS5678B2Z1',
 'Kosha Demo Business', '29ABCDE1234F1Z5',
 15000.00, 750.00, 2565.00, 16815.00, 0.00, 16815.00,
 'INR', '₹', 'professional', 'Thank you for your business!',
 'Payment is due within 30 days.', FALSE),

(v_inv3, v_user_id, v_cust3, 'INV-0003', 'invoice', 'draft',
 CURRENT_DATE, CURRENT_DATE + 30, 'NextGen Solutions', 'finance@nextgensol.io', '+91-9800003333',
 '78, IT Park, Phase 2, Hyderabad', '36CCCDE9012C3Z7',
 'Kosha Demo Business', '29ABCDE1234F1Z5',
 75000.00, 3750.00, 12825.00, 84075.00, 0.00, 84075.00,
 'INR', '₹', 'minimal', 'Thank you for your business!',
 'Payment is due within 30 days.', TRUE);

-- ============================================================
-- Invoice Items
-- ============================================================
INSERT INTO public.invoice_items (invoice_id, user_id, product_id, name, description, hsn_code, unit, quantity, rate, tax_rate, tax_amount, amount) VALUES
-- INV-0001 items
(v_inv1, v_user_id, v_prod1, 'Web Design Services', 'Custom website - 17 hours', '998314', 'Hr', 10, 2500.00, 18.00, 4500.00, 25000.00),
(v_inv1, v_user_id, v_prod3, 'Logo Design', 'Brand identity package', '998312', 'Nos', 1, 5000.00, 18.00, 900.00, 5000.00),
(v_inv1, v_user_id, v_prod2, 'SEO Package - Monthly', 'Monthly SEO services', '998313', 'Month', 1, 12500.00, 18.00, 2250.00, 12500.00),
-- INV-0002 items
(v_inv2, v_user_id, v_prod2, 'SEO Package - Monthly', 'Monthly SEO', '998313', 'Month', 1, 15000.00, 18.00, 2700.00, 15000.00),
-- INV-0003 items
(v_inv3, v_user_id, v_prod4, 'Laptop - ProBook 450', 'HP ProBook 450 G9', '847130', 'Nos', 1, 75000.00, 18.00, 13500.00, 75000.00);

-- ============================================================
-- Payments
-- ============================================================
INSERT INTO public.payments (user_id, invoice_id, amount, payment_date, payment_method, reference_number, notes) VALUES
(v_user_id, v_inv1, 50150.00, CURRENT_DATE - 18, 'bank_transfer', 'TXN123456789', 'Full payment received');

-- ============================================================
-- Settings
-- ============================================================
INSERT INTO public.settings (user_id, dark_mode, default_invoice_notes, default_invoice_terms, invoice_due_days) VALUES
(v_user_id, FALSE, 'Thank you for your business! We appreciate your trust in our services.', 
 'Payment is due within 30 days of the invoice date. For queries, contact our billing team.', 30)
ON CONFLICT (user_id) DO UPDATE SET
    default_invoice_notes = EXCLUDED.default_invoice_notes,
    default_invoice_terms = EXCLUDED.default_invoice_terms;

END $$;
