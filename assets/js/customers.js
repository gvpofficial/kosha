/**
 * Kosha - Customers Page Logic
 */

import {
    requireAuth, getCustomers, createCustomer, updateCustomer, deleteCustomer, getCustomerInvoices
} from './supabase.js';
import { initApp, formatCurrency, formatDate, getStatusBadge, getInitials, getAvatarColor, debounce, Pagination, exportCustomersCSV, confirmDialog, Toast, createSkeletonRows } from './app.js';
import { initLayout } from './layout.js';

let currentPage    = 1;
let perPage        = 25;
let totalCustomers = 0;
let allCustomers   = [];
let pagination     = null;
let editingId      = null;
let panelCustomer  = null;
let deleteTargetId = null;
let searchQuery    = '';
let filterStatus   = '';
let sortOrder      = 'created_at_desc';

export async function initCustomersPage() {
    await requireAuth();
    initLayout('customers');
    initApp();
    initFilters();
    await loadCustomers();
    await loadStats();
    handleURLActions();
}

if (document.readyState === 'complete' || document.readyState === 'interactive') {
    initCustomersPage();
} else {
    document.addEventListener('DOMContentLoaded', initCustomersPage);
}

// ── URL Actions ────────────────────────────────────────────────
function handleURLActions() {
    const params = new URLSearchParams(window.location.search);
    if (params.get('action') === 'new') openAddCustomer();
    if (params.get('id')) {
        const c = allCustomers.find(x => x.id === params.get('id'));
        if (c) openDetailPanel(c);
    }
}

// ── Filters ────────────────────────────────────────────────────
function initFilters() {
    const searchInput = document.getElementById('customer-search-input');
    const statusFilter = document.getElementById('customer-filter-status');
    const sortSelect = document.getElementById('customer-sort');
    const perPageSelect = document.getElementById('customer-per-page');

    searchInput?.addEventListener('input', debounce(e => {
        searchQuery = e.target.value.trim();
        currentPage = 1;
        loadCustomers();
    }, 300));

    statusFilter?.addEventListener('change', e => { filterStatus = e.target.value; currentPage = 1; loadCustomers(); });
    sortSelect?.addEventListener('change', e => { sortOrder = e.target.value; currentPage = 1; loadCustomers(); });
    perPageSelect?.addEventListener('change', e => { perPage = parseInt(e.target.value); currentPage = 1; loadCustomers(); });
}

window.resetFilters = function() {
    searchQuery = ''; filterStatus = ''; sortOrder = 'created_at_desc'; currentPage = 1;
    document.getElementById('customer-search-input').value = '';
    document.getElementById('customer-filter-status').value = '';
    document.getElementById('customer-sort').value = 'created_at_desc';
    loadCustomers();
};

// ── Load Customers ─────────────────────────────────────────────
async function loadCustomers() {
    const tbody = document.getElementById('customers-tbody');
    tbody.innerHTML = `<tr><td colspan="9">${createSkeletonRows(5, 9)}</td></tr>`;

    const activeOnly = filterStatus !== 'inactive';
    const { data, count, error } = await getCustomers(searchQuery, currentPage, perPage, activeOnly);

    if (error) { Toast.error('Failed to load customers.'); return; }

    allCustomers = data || [];
    totalCustomers = count || 0;

    renderTable(allCustomers);
    updateCountText();

    if (!pagination) {
        pagination = new Pagination('customers-pagination', totalCustomers, perPage, (p) => {
            currentPage = p; loadCustomers();
        });
    }
    pagination.update(totalCustomers, currentPage);
}

function renderTable(customers) {
    const tbody = document.getElementById('customers-tbody');
    const empty = document.getElementById('customers-empty');

    if (!customers.length) {
        tbody.innerHTML = '';
        empty.style.display = 'block';
        return;
    }
    empty.style.display = 'none';

    tbody.innerHTML = customers.map(c => {
        const initials = getInitials(c.name);
        const color = getAvatarColor(c.name);
        return `<tr class="customer-row" data-id="${c.id}" onclick="rowClickCustomer('${c.id}')">
            <td><div class="table-avatar" style="background:${color};">${initials}</div></td>
            <td data-label="Name"><strong>${esc(c.name)}</strong></td>
            <td data-label="Email"><a href="mailto:${esc(c.email)}" onclick="event.stopPropagation();">${esc(c.email || '—')}</a></td>
            <td data-label="Phone">${esc(c.phone || '—')}</td>
            <td data-label="City">${esc(c.city || '—')}</td>
            <td data-label="GSTIN"><code style="font-size:.75rem;">${esc(c.gstin || '—')}</code></td>
            <td data-label="Invoices"><span class="kosha-badge badge-draft">View</span></td>
            <td data-label="Status"><span class="kosha-badge ${c.is_active ? 'badge-paid' : 'badge-cancelled'}">${c.is_active ? 'Active' : 'Inactive'}</span></td>
            <td onclick="event.stopPropagation();">
                <div class="d-flex gap-1">
                    <button class="row-action-btn success" onclick="openDetailPanel(allCustomersById['${c.id}'])" title="View history"><i class="fa-solid fa-eye"></i></button>
                    <button class="row-action-btn" onclick="openEditCustomer('${c.id}')" title="Edit"><i class="fa-solid fa-pen"></i></button>
                    <a href="invoice.html?customer=${c.id}" class="row-action-btn" title="New Invoice" onclick="event.stopPropagation();"><i class="fa-solid fa-file-plus"></i></a>
                    <button class="row-action-btn danger" onclick="promptDeleteCustomer('${c.id}')" title="Delete"><i class="fa-solid fa-trash-can"></i></button>
                </div>
            </td>
        </tr>`;
    }).join('');

    // Map for quick lookup
    window.allCustomersById = {};
    customers.forEach(c => { window.allCustomersById[c.id] = c; });
}

function updateCountText() {
    const from = totalCustomers === 0 ? 0 : (currentPage - 1) * perPage + 1;
    const to = Math.min(currentPage * perPage, totalCustomers);
    document.getElementById('customers-count-text').textContent = `Showing ${from}–${to} of ${totalCustomers} customers`;
}

window.rowClickCustomer = function(id) {
    const c = window.allCustomersById?.[id];
    if (c) openDetailPanel(c);
};

// ── Stats ──────────────────────────────────────────────────────
async function loadStats() {
    const { data: all } = await getCustomers('', 1, 1, false);
    const { data: active } = await getCustomers('', 1, 1, true);
    if (all) setText('stat-total-customers', all.count?.toLocaleString('en-IN') || '0');
    if (active) setText('stat-active-customers', active.count?.toLocaleString('en-IN') || '0');

    // New this month
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const { count: newCount } = await getCustomers('', 1, 1);
    setText('stat-new-customers', '—'); // simplified
}

// ── Add/Edit Modal ─────────────────────────────────────────────
window.openAddCustomer = function() {
    editingId = null;
    document.getElementById('customerModalLabel').textContent = 'Add Customer';
    document.getElementById('customer-form').reset();
    document.getElementById('customer-id').value = '';
    document.getElementById('cf-country').value = 'India';
    bootstrap.Modal.getOrCreateInstance(document.getElementById('customerModal')).show();
};

window.openEditCustomer = function(id) {
    editingId = id;
    const c = window.allCustomersById?.[id] || allCustomers.find(x => x.id === id);
    if (!c) return;
    document.getElementById('customerModalLabel').textContent = 'Edit Customer';
    document.getElementById('customer-id').value = c.id;
    ['name','email','phone','gstin','pan','address','city','state','pincode','country','notes'].forEach(f => {
        const el = document.getElementById(`cf-${f}`);
        if (el) el.value = c[f] || '';
    });
    bootstrap.Modal.getOrCreateInstance(document.getElementById('customerModal')).show();
};

window.saveCustomer = async function() {
    const form = document.getElementById('customer-form');
    const name = document.getElementById('cf-name').value.trim();
    if (!name) { Toast.warning('Customer name is required.'); return; }

    const btn = document.getElementById('save-customer-btn');
    btn.disabled = true;

    const data = {
        name, email: val('cf-email'), phone: val('cf-phone'),
        gstin: val('cf-gstin'), pan: val('cf-pan'),
        address: val('cf-address'), city: val('cf-city'),
        state: val('cf-state'), pincode: val('cf-pincode'),
        country: val('cf-country') || 'India', notes: val('cf-notes')
    };

    let result;
    if (editingId) {
        result = await updateCustomer(editingId, data);
    } else {
        result = await createCustomer(data);
    }

    btn.disabled = false;
    if (result.error) { Toast.error('Save failed.'); return; }

    bootstrap.Modal.getOrCreateInstance(document.getElementById('customerModal')).hide();
    Toast.success(editingId ? 'Customer updated!' : 'Customer added!');
    await loadCustomers();
};

// ── Delete ─────────────────────────────────────────────────────
window.promptDeleteCustomer = function(id) {
    deleteTargetId = id;
    bootstrap.Modal.getOrCreateInstance(document.getElementById('deleteCustomerModal')).show();
};

document.getElementById('confirm-delete-customer-btn')?.addEventListener('click', async () => {
    if (!deleteTargetId) return;
    const { error } = await deleteCustomer(deleteTargetId);
    bootstrap.Modal.getOrCreateInstance(document.getElementById('deleteCustomerModal')).hide();
    if (error) { Toast.error('Delete failed.'); return; }
    Toast.success('Customer removed.');
    deleteTargetId = null;
    closeDetailPanel();
    await loadCustomers();
});

// ── Detail Panel ───────────────────────────────────────────────
window.openDetailPanel = async function(customer) {
    if (!customer) return;
    panelCustomer = customer;
    const color = getAvatarColor(customer.name);
    const initials = getInitials(customer.name);

    const avatarEl = document.getElementById('panel-avatar');
    if (avatarEl) { avatarEl.textContent = initials; avatarEl.style.background = color; }
    setText('panel-customer-name', customer.name);
    setText('panel-email', customer.email || '');
    setText('panel-phone', customer.phone || '');
    setText('panel-edit-btn', 'Edit');

    const createInvLink = document.getElementById('panel-create-invoice-btn');
    if (createInvLink) createInvLink.href = `invoice.html?customer=${customer.id}`;

    // Invoice history
    const panel = document.getElementById('customerDetailPanel');
    panel.classList.add('open');
    document.getElementById('panel-backdrop').classList.add('show');
    document.getElementById('panel-invoices-list').innerHTML = '<div class="text-muted" style="font-size:.8rem;">Loading…</div>';

    const { data: invs } = await getCustomerInvoices(customer.id);
    const totalVal = (invs || []).reduce((s, i) => s + (Number(i.grand_total) || 0), 0);
    const paid = (invs || []).filter(i => i.status === 'paid').reduce((s, i) => s + (Number(i.grand_total) || 0), 0);

    document.getElementById('panel-stats').innerHTML = `
        <div class="panel-stat-card"><div class="panel-stat-value">${(invs || []).length}</div><div class="panel-stat-label">Invoices</div></div>
        <div class="panel-stat-card"><div class="panel-stat-value">${formatCurrency(totalVal)}</div><div class="panel-stat-label">Total Value</div></div>
        <div class="panel-stat-card"><div class="panel-stat-value">${formatCurrency(paid)}</div><div class="panel-stat-label">Paid</div></div>
        <div class="panel-stat-card"><div class="panel-stat-value">${formatCurrency(totalVal - paid)}</div><div class="panel-stat-label">Pending</div></div>
    `;

    if (!invs || !invs.length) {
        document.getElementById('panel-invoices-list').innerHTML = '<div class="text-muted" style="font-size:.8rem;padding:.5rem 0;">No invoices yet.</div>';
        return;
    }
    document.getElementById('panel-invoices-list').innerHTML = invs.slice(0, 8).map(inv => `
        <div class="panel-invoice-row">
            <div>
                <a href="invoice.html?id=${inv.id}" class="panel-invoice-num">${esc(inv.invoice_number)}</a>
                <div style="font-size:.75rem;color:var(--text-muted);">${formatDate(inv.invoice_date)}</div>
            </div>
            <div style="text-align:right;">
                <div style="font-weight:700;">${formatCurrency(inv.grand_total, inv.currency_symbol)}</div>
                ${getStatusBadge(inv.status)}
            </div>
        </div>
    `).join('');
};

window.closeDetailPanel = function() {
    document.getElementById('customerDetailPanel').classList.remove('open');
    document.getElementById('panel-backdrop').classList.remove('show');
    panelCustomer = null;
};

window.editCurrentPanelCustomer = function() {
    if (panelCustomer) { closeDetailPanel(); openEditCustomer(panelCustomer.id); }
};

// ── Export ─────────────────────────────────────────────────────
window.exportCustomers = function() {
    if (!allCustomers.length) { Toast.warning('No customers to export.'); return; }
    exportCustomersCSV(allCustomers);
    Toast.success('CSV downloaded.');
};

window.importCSVModal = function() {
    Toast.info('CSV import: upload a CSV with columns: Name, Email, Phone, City, State, GSTIN');
};

// ── Helpers ────────────────────────────────────────────────────
function val(id) { return document.getElementById(id)?.value?.trim() || ''; }
function setText(id, v) { const el = document.getElementById(id); if (el) el.textContent = v; }
function esc(s) { return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
