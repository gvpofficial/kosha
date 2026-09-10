/**
 * Kosha - Supabase Client & API Layer
 * All backend calls are centralised here.
 */

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// ────────────────────────────────────────────────────────────────
// CONFIGURATION — Supabase project values
// ────────────────────────────────────────────────────────────────
const SUPABASE_URL     = 'https://xmjhnvthrakdiqtmtxgi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhtamhudnRocmFrZGlxdG10eGdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU4MTk3NTEsImV4cCI6MjEwMTM5NTc1MX0.0VR9XzL29zxVe7Ge2AdTXmrjzPllxcIW6Ynlvr5jZjA';

const isValidConfig = SUPABASE_URL.startsWith('http') && SUPABASE_ANON_KEY.length > 20;

const targetUrl = isValidConfig ? SUPABASE_URL : 'https://placeholder.supabase.co';
const targetKey = isValidConfig ? SUPABASE_ANON_KEY : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder';

export const supabase = createClient(targetUrl, targetKey, {
    auth: { persistSession: true, autoRefreshToken: true }
});

// ── Auth Helpers ────────────────────────────────────────────────

export async function getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}

export async function signInWithEmail(email, password) {
    return await supabase.auth.signInWithPassword({ email, password });
}

export async function signUpWithEmail(email, password, metadata = {}) {
    return await supabase.auth.signUp({ email, password, options: { data: metadata } });
}

export async function signOut() {
    return await supabase.auth.signOut();
}

/** Redirect to login if not authenticated */
export async function requireAuth() {
    const user = await getCurrentUser();
    if (!user) {
        if (typeof window.navigateTo === 'function') {
            window.navigateTo('login');
        } else {
            window.location.hash = '#/login';
        }
        return null;
    }
    return user;
}

/** Update user metadata (display name, avatar) */
export async function updateUserProfile(metadata) {
    return await supabase.auth.updateUser({ data: metadata });
}

// ── Business Profile ────────────────────────────────────────────

export async function getBusinessProfile() {
    const user = await getCurrentUser();
    if (!user) return { data: null, error: new Error('Not authenticated') };
    const { data, error } = await supabase
        .from('business_profile')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
    return { data, error };
}

export async function saveBusinessProfile(profileData) {
    const user = await getCurrentUser();
    if (!user) return { data: null, error: new Error('Not authenticated') };
    const { data, error } = await supabase
        .from('business_profile')
        .upsert({ ...profileData, user_id: user.id }, { onConflict: 'user_id' })
        .select()
        .single();
    return { data, error };
}

// ── Customers ────────────────────────────────────────────────────

export async function getCustomers(search = '', page = 1, perPage = 25, activeOnly = false) {
    const user = await getCurrentUser();
    if (!user) return { data: [], count: 0 };
    let query = supabase.from('customers').select('*', { count: 'exact' }).eq('user_id', user.id);
    if (activeOnly) query = query.eq('is_active', true);
    if (search) {
        query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%,gstin.ilike.%${search}%`);
    }
    query = query.order('created_at', { ascending: false }).range((page - 1) * perPage, page * perPage - 1);
    const { data, count, error } = await query;
    return { data: data || [], count: count || 0, error };
}

export async function createCustomer(customerData) {
    const user = await getCurrentUser();
    if (!user) return { data: null, error: new Error('Not authenticated') };
    return await supabase.from('customers').insert({ ...customerData, user_id: user.id, is_active: true }).select().single();
}

export async function updateCustomer(id, customerData) {
    const user = await getCurrentUser();
    if (!user) return { data: null, error: new Error('Not authenticated') };
    return await supabase.from('customers').update({ ...customerData, updated_at: new Date().toISOString() }).eq('id', id).eq('user_id', user.id).select().single();
}

export async function deleteCustomer(id) {
    const user = await getCurrentUser();
    if (!user) return { error: new Error('Not authenticated') };
    // Soft delete
    return await supabase.from('customers').update({ is_active: false }).eq('id', id).eq('user_id', user.id);
}

export async function getCustomerInvoices(customerId) {
    const user = await getCurrentUser();
    if (!user) return { data: [] };
    const { data, error } = await supabase
        .from('invoices')
        .select('id,invoice_number,invoice_date,due_date,grand_total,status,currency_symbol')
        .eq('user_id', user.id)
        .eq('customer_id', customerId)
        .order('invoice_date', { ascending: false })
        .limit(20);
    return { data: data || [], error };
}

// ── Products ─────────────────────────────────────────────────────

export async function getProducts(search = '', page = 1, perPage = 25, typeFilter = '') {
    const user = await getCurrentUser();
    if (!user) return { data: [], count: 0 };
    let query = supabase.from('products').select('*', { count: 'exact' }).eq('user_id', user.id);
    if (search) {
        query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%,hsn_code.ilike.%${search}%`);
    }
    if (typeFilter) query = query.eq('category', typeFilter);
    query = query.order('created_at', { ascending: false }).range((page - 1) * perPage, page * perPage - 1);
    const { data, count, error } = await query;
    const mappedData = (data || []).map(p => ({ ...p, type: p.category || 'product' }));
    return { data: mappedData, count: count || 0, error };
}

export async function createProduct(productData) {
    const user = await getCurrentUser();
    if (!user) return { data: null, error: new Error('Not authenticated') };
    const dbPayload = { ...productData, category: productData.type || 'product', user_id: user.id };
    delete dbPayload.type;
    const { data, error } = await supabase.from('products').insert(dbPayload).select().single();
    const mappedData = data ? { ...data, type: data.category || 'product' } : null;
    return { data: mappedData, error };
}

export async function updateProduct(id, productData) {
    const user = await getCurrentUser();
    if (!user) return { data: null, error: new Error('Not authenticated') };
    const dbPayload = { ...productData, updated_at: new Date().toISOString() };
    if (dbPayload.type !== undefined) {
        dbPayload.category = dbPayload.type;
        delete dbPayload.type;
    }
    const { data, error } = await supabase.from('products').update(dbPayload).eq('id', id).eq('user_id', user.id).select().single();
    const mappedData = data ? { ...data, type: data.category || 'product' } : null;
    return { data: mappedData, error };
}

export async function deleteProduct(id) {
    const user = await getCurrentUser();
    if (!user) return { error: new Error('Not authenticated') };
    return await supabase.from('products').delete().eq('id', id).eq('user_id', user.id);
}

export async function getLowStockProducts() {
    const user = await getCurrentUser();
    if (!user) return { data: [] };
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', user.id)
        .eq('category', 'product')
        .lte('stock_quantity', 10)
        .order('stock_quantity', { ascending: true })
        .limit(10);
    const mappedData = (data || []).map(p => ({ ...p, type: p.category || 'product' }));
    return { data: mappedData, error };
}

// ── Invoices ─────────────────────────────────────────────────────

export async function getInvoices(filters = {}, page = 1, perPage = 25) {
    const user = await getCurrentUser();
    if (!user) return { data: [], count: 0 };

    let query = supabase.from('invoices').select('*', { count: 'exact' }).eq('user_id', user.id);

    if (filters.status && filters.status !== 'overdue') query = query.eq('status', filters.status);
    if (filters.status === 'overdue') {
        query = query.not('status', 'in', '("paid","cancelled")').lt('due_date', new Date().toISOString().split('T')[0]);
    }
    if (filters.search) {
        query = query.or(`invoice_number.ilike.%${filters.search}%,customer_name.ilike.%${filters.search}%`);
    }
    if (filters.from) query = query.gte('invoice_date', filters.from);
    if (filters.to)   query = query.lte('invoice_date', filters.to);

    // Sort
    const sortMap = {
        invoice_date_desc: ['invoice_date', false],
        invoice_date_asc:  ['invoice_date', true],
        due_date_asc:      ['due_date', true],
        amount_desc:       ['grand_total', false],
        amount_asc:        ['grand_total', true],
    };
    const [sortCol, sortAsc] = sortMap[filters.sort || 'invoice_date_desc'] || ['invoice_date', false];
    query = query.order(sortCol, { ascending: sortAsc });
    query = query.range((page - 1) * perPage, page * perPage - 1);

    const { data, count, error } = await query;
    return { data: data || [], count: count || 0, error };
}

export async function getInvoiceById(id) {
    const user = await getCurrentUser();
    if (!user) return { data: null, error: new Error('Not authenticated') };
    // Get invoice + items
    const { data: inv, error: invErr } = await supabase
        .from('invoices').select('*').eq('id', id).eq('user_id', user.id).single();
    if (invErr) return { data: null, error: invErr };

    const { data: items } = await supabase
        .from('invoice_items').select('*').eq('invoice_id', id).order('sort_order');

    return { data: { ...inv, items: items || [] }, error: null };
}

export async function createInvoice(invoiceData, items = []) {
    const user = await getCurrentUser();
    if (!user) return { data: null, error: new Error('Not authenticated') };
    const { data: inv, error: invErr } = await supabase
        .from('invoices').insert({ ...invoiceData, user_id: user.id }).select().single();
    if (invErr) return { data: inv, error: invErr };

    if (items.length) {
        const itemsWithIds = items.map((item, i) => ({ ...item, invoice_id: inv.id, user_id: user.id, sort_order: i }));
        const { error: itemsErr } = await supabase.from('invoice_items').insert(itemsWithIds);
        if (itemsErr) return { data: inv, error: itemsErr };
    }
    return { data: inv, error: null };
}

export async function updateInvoice(id, invoiceData, items = []) {
    const user = await getCurrentUser();
    if (!user) return { data: null, error: new Error('Not authenticated') };
    const { data: inv, error: invErr } = await supabase
        .from('invoices').update({ ...invoiceData, updated_at: new Date().toISOString() })
        .eq('id', id).eq('user_id', user.id).select().single();
    if (invErr) return { data: inv, error: invErr };

    if (items.length) {
        await supabase.from('invoice_items').delete().eq('invoice_id', id);
        const itemsWithIds = items.map((item, i) => ({ ...item, invoice_id: id, user_id: user.id, sort_order: i }));
        await supabase.from('invoice_items').insert(itemsWithIds);
    }
    return { data: inv, error: null };
}

export async function deleteInvoice(id) {
    const user = await getCurrentUser();
    if (!user) return { error: new Error('Not authenticated') };
    await supabase.from('invoice_items').delete().eq('invoice_id', id);
    return await supabase.from('invoices').delete().eq('id', id).eq('user_id', user.id);
}

export async function updateInvoiceStatus(id, status) {
    const user = await getCurrentUser();
    if (!user) return { error: new Error('Not authenticated') };
    return await supabase.from('invoices')
        .update({ status, updated_at: new Date().toISOString(), ...(status === 'paid' ? { paid_at: new Date().toISOString() } : {}) })
        .eq('id', id).eq('user_id', user.id);
}

// ── Invoice Stats ─────────────────────────────────────────────

export async function getInvoiceStats(fromDate = null, toDate = null) {
    const user = await getCurrentUser();
    if (!user) return { data: null };

    let query = supabase.from('invoices').select('status,grand_total,due_date,tax_amount,shipping_charge').eq('user_id', user.id);
    if (fromDate) query = query.gte('invoice_date', fromDate);
    if (toDate) query = query.lte('invoice_date', toDate);

    const { data, error } = await query;
    if (error || !data) return { data: null, error };

    const now = new Date().toISOString().split('T')[0];
    const stats = {
        total_count:    data.length,
        total_revenue:  data.reduce((s, i) => s + (Number(i.grand_total) || 0), 0),
        paid_count:     data.filter(i => i.status === 'paid').length,
        pending_count:  data.filter(i => i.status === 'pending').length,
        draft_count:    data.filter(i => i.status === 'draft').length,
        sent_count:     data.filter(i => i.status === 'sent').length,
        cancelled_count: data.filter(i => i.status === 'cancelled').length,
        paid_amount:    data.filter(i => i.status === 'paid').reduce((s, i) => s + (Number(i.grand_total) || 0), 0),
        pending_amount: data.filter(i => !['paid','cancelled'].includes(i.status)).reduce((s, i) => s + (Number(i.grand_total) || 0), 0),
        overdue_count:  data.filter(i => !['paid','cancelled'].includes(i.status) && i.due_date && i.due_date < now).length,
        overdue_amount: data.filter(i => !['paid','cancelled'].includes(i.status) && i.due_date && i.due_date < now).reduce((s, i) => s + (Number(i.grand_total) || 0), 0),
    };
    return { data: stats, error: null };
}

// ── Invoice Number ────────────────────────────────────────────

export async function getNextInvoiceNumber() {
    const user = await getCurrentUser();
    if (!user) return { data: 'INV-0001' };
    const { data: profile } = await getBusinessProfile();
    const prefix = profile?.invoice_number_prefix || 'INV';
    const start = profile?.invoice_number_start || 1;

    const { count } = await supabase.from('invoices').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
    const num = (count || 0) + start;
    return { data: `${prefix}-${String(num).padStart(4, '0')}` };
}

// ── Revenue by Month ─────────────────────────────────────────

export async function getRevenueByMonth(year = new Date().getFullYear()) {
    const user = await getCurrentUser();
    if (!user) return { data: Array(12).fill(0) };

    const from = `${year}-01-01`;
    const to   = `${year}-12-31`;

    const { data, error } = await supabase
        .from('invoices')
        .select('invoice_date,grand_total,status')
        .eq('user_id', user.id)
        .gte('invoice_date', from)
        .lte('invoice_date', to);

    const monthly = Array(12).fill(0);
    (data || []).forEach(inv => {
        const m = new Date(inv.invoice_date).getMonth();
        if (!isNaN(m)) monthly[m] += Number(inv.grand_total) || 0;
    });
    return { data: monthly, error };
}

// ── Monthly Trend ─────────────────────────────────────────────

export async function getMonthlyTrend() {
    return await getRevenueByMonth(new Date().getFullYear());
}

// ── Activity Log ─────────────────────────────────────────────

export async function logActivity(entityType, entityId, action, description) {
    const user = await getCurrentUser();
    if (!user) return;
    try {
        await supabase.from('activity_logs').insert({
            user_id: user.id,
            entity_type: entityType,
            entity_id: entityId,
            action,
            description,
        });
    } catch (e) {
        // non-critical — silently fail
    }
}

export async function getActivityLogs(limit = 10) {
    const user = await getCurrentUser();
    if (!user) return { data: [], error: new Error('Not authenticated') };
    const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);
    return { data: data || [], error };
}
