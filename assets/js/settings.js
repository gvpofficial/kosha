/**
 * Kosha - Settings Page Logic
 */

import {
    requireAuth, getCurrentUser, getBusinessProfile, saveBusinessProfile as apiSaveBusinessProfile,
    updateUserProfile, getCustomers, getProducts, getInvoices, supabase
} from './supabase.js';
import { initApp, Toast, getInitials, getAvatarColor, lsSet, lsGet } from './app.js';
import { initLayout } from './layout.js';

let currentUser = null;
let logoFile    = null;

export async function initSettingsPage() {
    await requireAuth();
    initLayout('settings');
    initApp();
    currentUser = await getCurrentUser();
    await loadAllSettings();
    initLogoUpload();
    checkTheme();
}

if (document.readyState === 'complete' || document.readyState === 'interactive') {
    initSettingsPage();
} else {
    document.addEventListener('DOMContentLoaded', initSettingsPage);
}

// ── Tab Navigation ────────────────────────────────────────────
window.showTab = function(tab) {
    document.querySelectorAll('.settings-nav-item').forEach(b => {
        b.classList.toggle('active', b.id === `tab-${tab}-btn`);
    });
    document.querySelectorAll('.settings-panel').forEach(p => {
        p.classList.toggle('active', p.id === `panel-${tab}`);
    });
};

// ── Load All Settings ─────────────────────────────────────────
async function loadAllSettings() {
    await Promise.all([
        loadBusinessProfile(),
        loadAccountInfo(),
        loadInvoiceDefaults(),
        loadNotificationPrefs(),
    ]);
}

// ── Business Profile ──────────────────────────────────────────
async function loadBusinessProfile() {
    const { data: profile } = await getBusinessProfile();
    if (!profile) return;
    const fieldMap = {
        's-business-name': 'business_name', 's-business-email': 'business_email',
        's-business-phone': 'business_phone', 's-website': 'website',
        's-gstin': 'gstin', 's-pan': 'pan', 's-business-type': 'business_type',
        's-address': 'business_address', 's-city': 'business_city',
        's-state': 'business_state', 's-pincode': 'business_pincode',
        's-country': 'business_country',
        's-bank-name': 'bank_name', 's-account-name': 'bank_account_name',
        's-account-number': 'bank_account', 's-ifsc': 'bank_ifsc',
        's-branch': 'bank_branch', 's-upi': 'bank_upi',
        's-default-notes': 'default_invoice_notes', 's-default-terms': 'default_invoice_terms',
        's-inv-prefix': 'invoice_number_prefix', 's-default-template': 'default_template',
    };
    Object.entries(fieldMap).forEach(([id, key]) => {
        const el = document.getElementById(id);
        if (el && profile[key] !== undefined && profile[key] !== null) el.value = profile[key];
    });

    if (profile.currency_code) {
        const sel = document.getElementById('s-currency');
        if (sel) {
            const option = [...sel.options].find(o => o.value.startsWith(profile.currency_code));
            if (option) sel.value = option.value;
        }
    }
    if (profile.default_payment_terms !== undefined) {
        const el = document.getElementById('s-payment-terms');
        if (el) el.value = profile.default_payment_terms;
    }
    if (profile.default_gst_rate !== undefined) {
        const el = document.getElementById('s-default-gst');
        if (el) el.value = profile.default_gst_rate;
    }
    if (profile.logo_url) {
        const img = document.getElementById('logo-preview-img');
        const ph = document.getElementById('logo-placeholder-content');
        const removeBtn = document.getElementById('remove-logo-btn');
        if (img) { img.src = profile.logo_url; img.style.display = 'block'; }
        if (ph) ph.style.display = 'none';
        if (removeBtn) removeBtn.style.display = 'inline-block';
    }
}

window.saveBusinessProfile = async function() {
    const btn = document.getElementById('save-business-btn');
    btn.disabled = true;

    // Build payload
    const currencyVal = document.getElementById('s-currency')?.value || 'INR|₹';
    const [currCode, currSym] = currencyVal.split('|');

    const data = {
        business_name:   val('s-business-name'),
        business_email:  val('s-business-email'),
        business_phone:  val('s-business-phone'),
        website:         val('s-website'),
        gstin:           val('s-gstin'),
        pan:             val('s-pan'),
        business_type:   val('s-business-type'),
        business_address: val('s-address'),
        business_city:   val('s-city'),
        business_state:  val('s-state'),
        business_pincode: val('s-pincode'),
        business_country: val('s-country') || 'India',
        currency_code:   currCode, currency_symbol: currSym,
        default_payment_terms: parseInt(val('s-payment-terms')) || 30,
        default_gst_rate: parseInt(val('s-default-gst')) || 18,
        invoice_number_prefix: val('s-inv-prefix') || 'INV',
        default_template: val('s-default-template') || 'modern',
        default_invoice_notes: val('s-default-notes'),
        default_invoice_terms: val('s-default-terms'),
        bank_name: val('s-bank-name'),
        bank_account_name: val('s-account-name'),
        bank_account: val('s-account-number'),
        bank_ifsc: val('s-ifsc'),
        bank_branch: val('s-branch'),
        bank_upi: val('s-upi'),
    };

    // Upload logo first if any
    if (logoFile) {
        const ext = logoFile.name.split('.').pop();
        const path = `logos/${currentUser.id}.${ext}`;
        const { data: upload, error: uploadErr } = await supabase.storage.from('business').upload(path, logoFile, { upsert: true });
        if (!uploadErr) {
            const { data: urlData } = supabase.storage.from('business').getPublicUrl(path);
            data.logo_url = urlData.publicUrl;
        }
    }

    const { error } = await apiSaveBusinessProfile(data);
    btn.disabled = false;
    if (error) { Toast.error('Save failed: ' + (error.message || 'Unknown error')); return; }
    Toast.success('Business profile saved!');
};

// ── Invoice Defaults ──────────────────────────────────────────
async function loadInvoiceDefaults() {
    // Already handled in loadBusinessProfile
}

window.saveInvoiceDefaults = async function() {
    const btn = document.getElementById('save-inv-defaults-btn');
    btn.disabled = true;
    const currencyVal = document.getElementById('s-currency')?.value || 'INR|₹';
    const [currCode, currSym] = currencyVal.split('|');
    const data = {
        currency_code: currCode, currency_symbol: currSym,
        default_payment_terms: parseInt(val('s-payment-terms')) || 30,
        default_gst_rate: parseInt(val('s-default-gst')) || 18,
        invoice_number_prefix: val('s-inv-prefix') || 'INV',
        default_template: val('s-default-template') || 'modern',
        default_invoice_notes: val('s-default-notes'),
        default_invoice_terms: val('s-default-terms'),
    };
    const { error } = await apiSaveBusinessProfile(data);
    btn.disabled = false;
    if (error) { Toast.error('Save failed.'); return; }
    Toast.success('Invoice defaults saved!');
};

// ── Bank Details ──────────────────────────────────────────────
window.saveBankDetails = async function() {
    const btn = document.getElementById('save-bank-btn');
    btn.disabled = true;
    const data = {
        bank_name: val('s-bank-name'), bank_account_name: val('s-account-name'),
        bank_account: val('s-account-number'), bank_ifsc: val('s-ifsc'),
        bank_branch: val('s-branch'), bank_upi: val('s-upi'),
    };
    const { error } = await apiSaveBusinessProfile(data);
    btn.disabled = false;
    if (error) { Toast.error('Save failed.'); return; }
    Toast.success('Bank details saved!');
};

// ── Account ───────────────────────────────────────────────────
async function loadAccountInfo() {
    if (!currentUser) return;
    const name = currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'User';
    const email = currentUser.email || '';
    const initials = getInitials(name);
    const color = getAvatarColor(name);

    setText('account-display-name', name);
    setText('account-email-display', email);
    const avatar = document.getElementById('account-avatar');
    if (avatar) { avatar.textContent = initials; avatar.style.background = color; }
    if (document.getElementById('s-full-name')) document.getElementById('s-full-name').value = name;
    if (document.getElementById('s-email')) document.getElementById('s-email').value = email;
}

window.saveAccountInfo = async function() {
    const fullName = val('s-full-name');
    if (!fullName) { Toast.warning('Name is required.'); return; }
    const btn = document.getElementById('save-account-btn');
    btn.disabled = true;
    const { error } = await updateUserProfile({ full_name: fullName });
    btn.disabled = false;
    if (error) { Toast.error('Failed to update profile.'); return; }
    Toast.success('Profile updated!');
    setText('account-display-name', fullName);
};

// ── Security ──────────────────────────────────────────────────
window.changePassword = async function() {
    const newPw  = val('s-new-password');
    const confPw = val('s-confirm-password');
    if (!newPw) { Toast.warning('Enter a new password.'); return; }
    if (newPw.length < 8) { Toast.warning('Password must be at least 8 characters.'); return; }
    if (newPw !== confPw) { Toast.error('Passwords do not match.'); return; }

    const btn = document.getElementById('change-password-btn');
    btn.disabled = true;
    const { error } = await supabase.auth.updateUser({ password: newPw });
    btn.disabled = false;
    if (error) { Toast.error('Password update failed: ' + error.message); return; }
    Toast.success('Password updated successfully!');
    document.getElementById('s-new-password').value = '';
    document.getElementById('s-confirm-password').value = '';
};

window.confirmDeleteAccount = function() {
    if (!confirm('Are you absolutely sure? This will permanently delete your account and all data. This CANNOT be undone.\n\nType DELETE to confirm.')) return;
    const input = prompt('Type DELETE to confirm:');
    if (input === 'DELETE') {
        Toast.error('Account deletion requires admin support. Please contact us.', 5000);
    }
};

// ── Appearance ────────────────────────────────────────────────
function checkTheme() {
    const saved = lsGet('kosha_theme') || 'light';
    document.querySelectorAll('.theme-card').forEach(c => c.classList.toggle('active', c.id === `theme-${saved}`));
}

window.setAppTheme = function(theme) {
    lsSet('kosha_theme', theme);
    let appliedTheme = theme;
    if (theme === 'system') {
        appliedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    document.documentElement.setAttribute('data-theme', appliedTheme);
    document.querySelectorAll('.theme-card').forEach(c => c.classList.toggle('active', c.id === `theme-${theme}`));
    Toast.info(`Theme set to ${theme}.`);
};

window.toggleCompactSidebar = function(enabled) {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.classList.toggle('compact', enabled);
    lsSet('kosha_compact_sidebar', enabled);
};

window.toggleAnimations = function(enabled) {
    document.documentElement.style.setProperty('--transition', enabled ? 'all .2s ease' : 'none');
    lsSet('kosha_animations', enabled);
};

// ── Notifications ─────────────────────────────────────────────
function loadNotificationPrefs() {
    const prefs = JSON.parse(localStorage.getItem('kosha_notif_prefs') || '{}');
    ['notif-invoice-created','notif-payment-received','notif-invoice-overdue','notif-low-stock','notif-new-customer'].forEach(id => {
        const el = document.getElementById(id);
        if (el && prefs[id] !== undefined) el.checked = prefs[id];
    });
}

window.saveNotifications = function() {
    const prefs = {};
    ['notif-invoice-created','notif-payment-received','notif-invoice-overdue','notif-low-stock','notif-new-customer'].forEach(id => {
        const el = document.getElementById(id);
        if (el) prefs[id] = el.checked;
    });
    localStorage.setItem('kosha_notif_prefs', JSON.stringify(prefs));
    Toast.success('Notification preferences saved!');
};

// ── Data Export ───────────────────────────────────────────────
window.dataExport = async function(type) {
    let data = [], filename = '', headers = '';
    switch (type) {
        case 'customers':
            ({ data } = await getCustomers('', 1, 10000));
            headers = 'Name,Email,Phone,City,State,GSTIN,Country\n';
            filename = 'kosha_customers.csv';
            data = (data || []).map(c => [c.name,c.email,c.phone,c.city,c.state,c.gstin,c.country].map(v=>`"${v||''}"`).join(','));
            break;
        case 'invoices':
            ({ data } = await getInvoices({}, 1, 10000));
            headers = 'Invoice #,Customer,Date,Due,Amount,Status\n';
            filename = 'kosha_invoices.csv';
            data = (data || []).map(i => [i.invoice_number,i.customer_name,i.invoice_date,i.due_date,i.grand_total,i.status].map(v=>`"${v||''}"`).join(','));
            break;
        case 'products':
            ({ data } = await getProducts('', 1, 10000));
            headers = 'Name,SKU,Type,Price,GST%,HSN,Unit,Stock\n';
            filename = 'kosha_products.csv';
            data = (data || []).map(p => [p.name,p.sku,p.type,p.price,p.tax_rate,p.hsn_code,p.unit,p.stock_quantity].map(v=>`"${v||''}"`).join(','));
            break;
    }
    if (!data.length) { Toast.warning('No data to export.'); return; }
    const blob = new Blob([headers + data.join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    Toast.success(`${type} exported successfully!`);
};

window.confirmClearData = function(type) {
    const msg = type === 'all'
        ? 'FACTORY RESET: This will DELETE ALL your invoices, customers, and products. This CANNOT be undone. Type RESET to confirm.'
        : `This will delete all ${type}. Type DELETE to confirm.`;
    const input = prompt(msg);
    const expected = type === 'all' ? 'RESET' : 'DELETE';
    if (input === expected) {
        Toast.error(`This action requires admin intervention. Please contact support.`, 5000);
    }
};

// ── Logo ──────────────────────────────────────────────────────
function initLogoUpload() {
    const fileInput = document.getElementById('logo-file-input');
    const preview = document.getElementById('logo-preview-img');
    const placeholder = document.getElementById('logo-placeholder-content');
    const removeBtn = document.getElementById('remove-logo-btn');

    fileInput?.addEventListener('change', () => {
        const file = fileInput.files[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) { Toast.error('Logo must be under 2MB.'); return; }
        logoFile = file;
        const reader = new FileReader();
        reader.onload = (e) => {
            if (preview) { preview.src = e.target.result; preview.style.display = 'block'; }
            if (placeholder) placeholder.style.display = 'none';
            if (removeBtn) removeBtn.style.display = 'inline-block';
        };
        reader.readAsDataURL(file);
    });
}

window.removeLogo = function() {
    const preview = document.getElementById('logo-preview-img');
    const placeholder = document.getElementById('logo-placeholder-content');
    const removeBtn = document.getElementById('remove-logo-btn');
    if (preview) { preview.src = ''; preview.style.display = 'none'; }
    if (placeholder) placeholder.style.display = 'flex';
    if (removeBtn) removeBtn.style.display = 'none';
    logoFile = null;
    document.getElementById('logo-file-input').value = '';
};

// ── Helpers ───────────────────────────────────────────────────
function val(id) { return document.getElementById(id)?.value?.trim() || ''; }
function setText(id, v) { const el = document.getElementById(id); if (el) el.textContent = v; }
