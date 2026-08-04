-- ============================================================
-- KOSHA - Row Level Security Policies
-- Version: 1.0.0
-- ============================================================

-- ============================================================
-- Enable RLS on all tables
-- ============================================================
ALTER TABLE public.business_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- business_profile policies
-- ============================================================
DROP POLICY IF EXISTS "business_profile_select_own" ON public.business_profile;
CREATE POLICY "business_profile_select_own"
    ON public.business_profile FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "business_profile_insert_own" ON public.business_profile;
CREATE POLICY "business_profile_insert_own"
    ON public.business_profile FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "business_profile_update_own" ON public.business_profile;
CREATE POLICY "business_profile_update_own"
    ON public.business_profile FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "business_profile_delete_own" ON public.business_profile;
CREATE POLICY "business_profile_delete_own"
    ON public.business_profile FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================================
-- customers policies
-- ============================================================
DROP POLICY IF EXISTS "customers_select_own" ON public.customers;
CREATE POLICY "customers_select_own"
    ON public.customers FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "customers_insert_own" ON public.customers;
CREATE POLICY "customers_insert_own"
    ON public.customers FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "customers_update_own" ON public.customers;
CREATE POLICY "customers_update_own"
    ON public.customers FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "customers_delete_own" ON public.customers;
CREATE POLICY "customers_delete_own"
    ON public.customers FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================================
-- products policies
-- ============================================================
DROP POLICY IF EXISTS "products_select_own" ON public.products;
CREATE POLICY "products_select_own"
    ON public.products FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "products_insert_own" ON public.products;
CREATE POLICY "products_insert_own"
    ON public.products FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "products_update_own" ON public.products;
CREATE POLICY "products_update_own"
    ON public.products FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "products_delete_own" ON public.products;
CREATE POLICY "products_delete_own"
    ON public.products FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================================
-- invoices policies
-- ============================================================
DROP POLICY IF EXISTS "invoices_select_own" ON public.invoices;
CREATE POLICY "invoices_select_own"
    ON public.invoices FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "invoices_insert_own" ON public.invoices;
CREATE POLICY "invoices_insert_own"
    ON public.invoices FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "invoices_update_own" ON public.invoices;
CREATE POLICY "invoices_update_own"
    ON public.invoices FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "invoices_delete_own" ON public.invoices;
CREATE POLICY "invoices_delete_own"
    ON public.invoices FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================================
-- invoice_items policies
-- ============================================================
DROP POLICY IF EXISTS "invoice_items_select_own" ON public.invoice_items;
CREATE POLICY "invoice_items_select_own"
    ON public.invoice_items FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "invoice_items_insert_own" ON public.invoice_items;
CREATE POLICY "invoice_items_insert_own"
    ON public.invoice_items FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "invoice_items_update_own" ON public.invoice_items;
CREATE POLICY "invoice_items_update_own"
    ON public.invoice_items FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "invoice_items_delete_own" ON public.invoice_items;
CREATE POLICY "invoice_items_delete_own"
    ON public.invoice_items FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================================
-- payments policies
-- ============================================================
DROP POLICY IF EXISTS "payments_select_own" ON public.payments;
CREATE POLICY "payments_select_own"
    ON public.payments FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "payments_insert_own" ON public.payments;
CREATE POLICY "payments_insert_own"
    ON public.payments FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "payments_update_own" ON public.payments;
CREATE POLICY "payments_update_own"
    ON public.payments FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "payments_delete_own" ON public.payments;
CREATE POLICY "payments_delete_own"
    ON public.payments FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================================
-- settings policies
-- ============================================================
DROP POLICY IF EXISTS "settings_select_own" ON public.settings;
CREATE POLICY "settings_select_own"
    ON public.settings FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "settings_insert_own" ON public.settings;
CREATE POLICY "settings_insert_own"
    ON public.settings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "settings_update_own" ON public.settings;
CREATE POLICY "settings_update_own"
    ON public.settings FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- activity_logs policies
-- ============================================================
DROP POLICY IF EXISTS "activity_logs_select_own" ON public.activity_logs;
CREATE POLICY "activity_logs_select_own"
    ON public.activity_logs FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "activity_logs_insert_own" ON public.activity_logs;
CREATE POLICY "activity_logs_insert_own"
    ON public.activity_logs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- Storage bucket policies
-- ============================================================
-- Run after creating buckets in Supabase dashboard:
-- 1. Create bucket: 'kosha-assets' (private)
-- 2. Apply policies below

-- Allow users to upload their own files
-- INSERT: auth.uid()::text = (storage.foldername(name))[1]
-- SELECT: auth.uid()::text = (storage.foldername(name))[1]
-- UPDATE: auth.uid()::text = (storage.foldername(name))[1]
-- DELETE: auth.uid()::text = (storage.foldername(name))[1]

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'kosha-assets',
    'kosha-assets',
    FALSE,
    5242880, -- 5MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'application/pdf']
) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "kosha_assets_select" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'kosha-assets' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "kosha_assets_insert" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'kosha-assets' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "kosha_assets_update" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'kosha-assets' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "kosha_assets_delete" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'kosha-assets' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );
