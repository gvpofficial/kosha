-- ============================================================
-- KOSHA - Invoice Management System
-- Supabase PostgreSQL Schema
-- Version: 1.0.0
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- TABLE: business_profile
-- Stores business info per user
-- ============================================================
CREATE TABLE IF NOT EXISTS public.business_profile (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    business_name TEXT NOT NULL DEFAULT '',
    business_email TEXT DEFAULT '',
    business_phone TEXT DEFAULT '',
    business_address TEXT DEFAULT '',
    business_city TEXT DEFAULT '',
    business_state TEXT DEFAULT '',
    business_pincode TEXT DEFAULT '',
    business_country TEXT DEFAULT 'India',
    gstin TEXT DEFAULT '',
    pan TEXT DEFAULT '',
    logo_url TEXT DEFAULT '',
    signature_url TEXT DEFAULT '',
    invoice_prefix TEXT DEFAULT 'INV',
    invoice_counter INTEGER DEFAULT 1,
    currency_code TEXT DEFAULT 'INR',
    currency_symbol TEXT DEFAULT '₹',
    default_tax_rate NUMERIC(5,2) DEFAULT 18.00,
    default_discount NUMERIC(5,2) DEFAULT 0.00,
    theme_color TEXT DEFAULT '#3B82F6',
    website TEXT DEFAULT '',
    bank_name TEXT DEFAULT '',
    bank_account TEXT DEFAULT '',
    bank_ifsc TEXT DEFAULT '',
    bank_branch TEXT DEFAULT '',
    upi_id TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- ============================================================
-- TABLE: customers
-- ============================================================
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT DEFAULT '',
    phone TEXT DEFAULT '',
    address TEXT DEFAULT '',
    city TEXT DEFAULT '',
    state TEXT DEFAULT '',
    pincode TEXT DEFAULT '',
    country TEXT DEFAULT 'India',
    gstin TEXT DEFAULT '',
    pan TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: products
-- ============================================================
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    sku TEXT DEFAULT '',
    hsn_code TEXT DEFAULT '',
    barcode TEXT DEFAULT '',
    unit TEXT DEFAULT 'Nos',
    price NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    cost_price NUMERIC(12,2) DEFAULT 0.00,
    tax_rate NUMERIC(5,2) DEFAULT 18.00,
    discount NUMERIC(5,2) DEFAULT 0.00,
    stock_quantity INTEGER DEFAULT 0,
    low_stock_alert INTEGER DEFAULT 5,
    category TEXT DEFAULT '',
    image_url TEXT DEFAULT '',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: invoices
-- ============================================================
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    invoice_number TEXT NOT NULL,
    invoice_type TEXT DEFAULT 'invoice' CHECK (invoice_type IN ('invoice', 'quotation', 'receipt', 'proforma', 'credit_note')),
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'partial', 'overdue', 'cancelled')),
    invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE,
    po_number TEXT DEFAULT '',
    -- Customer snapshot at invoice time
    customer_name TEXT NOT NULL DEFAULT '',
    customer_email TEXT DEFAULT '',
    customer_phone TEXT DEFAULT '',
    customer_address TEXT DEFAULT '',
    customer_gstin TEXT DEFAULT '',
    -- Business snapshot at invoice time
    business_name TEXT DEFAULT '',
    business_address TEXT DEFAULT '',
    business_gstin TEXT DEFAULT '',
    business_pan TEXT DEFAULT '',
    -- Financial
    subtotal NUMERIC(12,2) DEFAULT 0.00,
    discount_type TEXT DEFAULT 'percent' CHECK (discount_type IN ('percent', 'fixed')),
    discount_value NUMERIC(10,2) DEFAULT 0.00,
    discount_amount NUMERIC(12,2) DEFAULT 0.00,
    tax_amount NUMERIC(12,2) DEFAULT 0.00,
    shipping_charge NUMERIC(10,2) DEFAULT 0.00,
    other_charges NUMERIC(10,2) DEFAULT 0.00,
    grand_total NUMERIC(12,2) DEFAULT 0.00,
    amount_paid NUMERIC(12,2) DEFAULT 0.00,
    amount_due NUMERIC(12,2) DEFAULT 0.00,
    currency_code TEXT DEFAULT 'INR',
    currency_symbol TEXT DEFAULT '₹',
    -- Template & display
    template TEXT DEFAULT 'modern',
    theme_color TEXT DEFAULT '#3B82F6',
    -- Notes
    notes TEXT DEFAULT '',
    terms TEXT DEFAULT '',
    -- Meta
    is_draft BOOLEAN DEFAULT TRUE,
    sent_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: invoice_items
-- ============================================================
CREATE TABLE IF NOT EXISTS public.invoice_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    hsn_code TEXT DEFAULT '',
    unit TEXT DEFAULT 'Nos',
    quantity NUMERIC(10,3) DEFAULT 1,
    rate NUMERIC(12,2) DEFAULT 0.00,
    discount NUMERIC(5,2) DEFAULT 0.00,
    discount_amount NUMERIC(12,2) DEFAULT 0.00,
    tax_rate NUMERIC(5,2) DEFAULT 0.00,
    tax_amount NUMERIC(12,2) DEFAULT 0.00,
    amount NUMERIC(12,2) DEFAULT 0.00,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: payments
-- ============================================================
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
    amount NUMERIC(12,2) NOT NULL,
    payment_date DATE DEFAULT CURRENT_DATE,
    payment_method TEXT DEFAULT 'cash' CHECK (payment_method IN ('cash', 'bank_transfer', 'upi', 'cheque', 'card', 'online', 'other')),
    reference_number TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: settings
-- Per-user app settings
-- ============================================================
CREATE TABLE IF NOT EXISTS public.settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    dark_mode BOOLEAN DEFAULT FALSE,
    sidebar_collapsed BOOLEAN DEFAULT FALSE,
    default_invoice_notes TEXT DEFAULT 'Thank you for your business!',
    default_invoice_terms TEXT DEFAULT 'Payment is due within 30 days. Late payments may incur additional charges.',
    email_notifications BOOLEAN DEFAULT TRUE,
    auto_save_draft BOOLEAN DEFAULT TRUE,
    date_format TEXT DEFAULT 'DD/MM/YYYY',
    time_zone TEXT DEFAULT 'Asia/Kolkata',
    fiscal_year_start INTEGER DEFAULT 4,
    invoice_due_days INTEGER DEFAULT 30,
    low_stock_alerts BOOLEAN DEFAULT TRUE,
    pdf_page_size TEXT DEFAULT 'A4' CHECK (pdf_page_size IN ('A4', 'Letter', 'A5')),
    show_bank_details BOOLEAN DEFAULT TRUE,
    show_signature BOOLEAN DEFAULT TRUE,
    show_qr_code BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- ============================================================
-- TABLE: activity_logs
-- ============================================================
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    action TEXT NOT NULL,
    description TEXT DEFAULT '',
    metadata JSONB DEFAULT '{}',
    ip_address TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES for performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON public.customers(user_id);
CREATE INDEX IF NOT EXISTS idx_customers_name ON public.customers(name);
CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers(email);
CREATE INDEX IF NOT EXISTS idx_products_user_id ON public.products(user_id);
CREATE INDEX IF NOT EXISTS idx_products_name ON public.products(name);
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku);
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON public.invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON public.invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_date ON public.invoices(invoice_date);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON public.invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_number ON public.invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON public.invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON public.payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON public.activity_logs(entity_type, entity_id);

-- ============================================================
-- TRIGGERS: auto-update updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_business_profile_updated_at
    BEFORE UPDATE ON public.business_profile
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_customers_updated_at
    BEFORE UPDATE ON public.customers
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_invoices_updated_at
    BEFORE UPDATE ON public.invoices
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_settings_updated_at
    BEFORE UPDATE ON public.settings
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- FUNCTION: Auto-initialize profile + settings on user signup
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.business_profile (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;

    INSERT INTO public.settings (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- VIEW: invoice_summary (useful for reports)
-- ============================================================
CREATE OR REPLACE VIEW public.invoice_summary AS
SELECT
    i.id,
    i.user_id,
    i.invoice_number,
    i.invoice_type,
    i.status,
    i.invoice_date,
    i.due_date,
    i.customer_name,
    i.grand_total,
    i.amount_paid,
    i.amount_due,
    i.currency_symbol,
    CASE
        WHEN i.due_date < CURRENT_DATE AND i.status NOT IN ('paid', 'cancelled') THEN TRUE
        ELSE FALSE
    END AS is_overdue,
    i.created_at
FROM public.invoices i;

-- ============================================================
-- FUNCTION: Get next invoice number
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_next_invoice_number(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
    v_prefix TEXT;
    v_counter INTEGER;
    v_result TEXT;
BEGIN
    SELECT invoice_prefix, invoice_counter
    INTO v_prefix, v_counter
    FROM public.business_profile
    WHERE user_id = p_user_id;

    IF NOT FOUND THEN
        RETURN 'INV-0001';
    END IF;

    v_result := v_prefix || '-' || LPAD(v_counter::TEXT, 4, '0');

    UPDATE public.business_profile
    SET invoice_counter = invoice_counter + 1
    WHERE user_id = p_user_id;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
