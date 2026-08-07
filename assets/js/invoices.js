/**
 * Kosha - Invoices List Page Logic
 */

import { requireAuth, getInvoices, deleteInvoice, updateInvoiceStatus, getInvoiceStats } from './supabase.js';
import { initApp, formatCurrency, formatDate, getStatusBadge, debounce, Pagination, Toast } from './app.js';
import { initLayout } from './layout.js';

let currentPage     = 1;
let perPage         = 25;
let allInvoices     = [];
let totalInvoices   = 0;
let pagination      = null;
let searchQuery     = '';
let statusFilter    = '';
let sortOrder       = 'invoice_date_desc';
let filterFrom      = '';
let filterTo        = '';
let selectedIds     = new Set();

export async function initInvoicesPage() {
    await requireAuth();
    initLayout('invoices');
    initApp();
    initFilters();
    await loadInvoices();
    await loadStatusCounts();
}

if (document.readyState === 'complete' || document.readyState === 'interactive') {
    initInvoicesPage();
} else {
    document.addEventListener('DOMContentLoaded', initInvoicesPage);
}

// ── Filters ────────────────────────────────────────────────────
function initFilters() {
    const search = document.getElementById('invoice-search');
    const sort = document.getElementById('invoice-sort');
    search?.addEventListener('input', debounce(e => { searchQuery = e.target.value.trim(); currentPage = 1; loadInvoices(); }, 300));
    sort?.addEventListener('change', e => { sortOrder = e.target.value; currentPage = 1; loadInvoices(); });

    // Select all checkbox
    document.getElementById('select-all-invoices')?.addEventListener('change', (e) => {
        const checked = e.target.checked;
        document.querySelectorAll('.invoice-row-check').forEach(ch => {
            ch.checked = checked;
            checked ? selectedIds.add(ch.dataset.id) : selectedIds.delete(ch.dataset.id);
        });
        updateBulkBar();
    });
}

window.applyFilters = function() {
    filterFrom = document.getElementById('filter-from')?.value || '';
    filterTo   = document.getElementById('filter-to')?.value || '';
    currentPage = 1;
    loadInvoices();
};

window.resetInvoiceFilters = function() {
    searchQuery = ''; statusFilter = ''; sortOrder = 'invoice_date_desc'; filterFrom = ''; filterTo = '';
    document.getElementById('invoice-search').value = '';
    document.getElementById('invoice-sort').value = 'invoice_date_desc';
    document.getElementById('filter-from').value = '';
    document.getElementById('filter-to').value = '';
    setStatusFilter('');
    loadInvoices();
};

window.setStatusFilter = function(status) {
    statusFilter = status;
    currentPage = 1;
    document.querySelectorAll('.status-tab').forEach(t => t.classList.toggle('active', t.dataset.status === status));
    loadInvoices();
};

// ── Load ───────────────────────────────────────────────────────
async function loadInvoices() {
    const tbody = document.getElementById('invoices-tbody');
    tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:2rem;color:var(--text-muted);">Loading…</td></tr>';

    const filters = { status: statusFilter, search: searchQuery, from: filterFrom, to: filterTo, sort: sortOrder };
    const { data, count, error } = await getInvoices(filters, currentPage, perPage);

    if (error) { Toast.error('Failed to load invoices.'); return; }

    allInvoices = data || [];
    totalInvoices = count || 0;

    renderTable(allInvoices);
    updateFooter(allInvoices, totalInvoices);

    if (!pagination) {
        pagination = new Pagination('invoices-pagination', totalInvoices, perPage, (p) => { currentPage = p; loadInvoices(); });
    }
    pagination.update(totalInvoices, currentPage);
}

function renderTable(invoices) {
    const tbody = document.getElementById('invoices-tbody');
    const empty = document.getElementById('invoices-empty');
    if (!invoices.length) { tbody.innerHTML = ''; empty.style.display = 'block'; return; }
    empty.style.display = 'none';

    tbody.innerHTML = invoices.map(inv => {
        const overdue = inv.due_date && !['paid','cancelled'].includes(inv.status) && new Date(inv.due_date) < new Date();
        const dueCls = overdue ? 'style="color:var(--danger);font-weight:600;"' : '';
        const checked = selectedIds.has(inv.id);
        return `<tr class="${overdue ? 'row-overdue' : ''}">
            <td><input type="checkbox" class="invoice-row-check" data-id="${inv.id}" ${checked ? 'checked' : ''} onchange="toggleRowSelect('${inv.id}',this.checked)" aria-label="Select invoice ${esc(inv.invoice_number)}" /></td>
            <td><a href="invoice.html?id=${inv.id}" class="fw-600" style="color:var(--primary);">${esc(inv.invoice_number)}</a></td>
            <td data-label="Customer">${esc(inv.customer_name || '—')}</td>
            <td data-label="Type"><span class="kosha-badge badge-draft" style="font-size:.7rem;">${(inv.invoice_type || 'invoice').toUpperCase()}</span></td>
            <td data-label="Date">${formatDate(inv.invoice_date)}</td>
            <td data-label="Due" ${dueCls}>${inv.due_date ? formatDate(inv.due_date) : '—'}${overdue ? ' <i class="fa-solid fa-triangle-exclamation" style="color:var(--danger);font-size:.75rem;"></i>' : ''}</td>
            <td data-label="Amount" class="text-end fw-600">${formatCurrency(inv.grand_total, inv.currency_symbol)}</td>
            <td data-label="Status">${getStatusBadge(inv.status)}</td>
            <td>
                <div class="d-flex gap-1 align-items-center">
                    <a href="invoice.html?id=${inv.id}" class="row-action-btn" title="Edit" style="color:var(--text-muted);background:none;border:none;cursor:pointer;padding:.3rem .4rem;border-radius:var(--radius-sm);font-size:.875rem;"><i class="fa-solid fa-pen"></i></a>
                    ${inv.status !== 'paid' ? `<button class="row-action-btn" onclick="markInvoicePaid('${inv.id}')" title="Mark as Paid" style="background:none;border:none;cursor:pointer;color:var(--text-muted);padding:.3rem .4rem;border-radius:var(--radius-sm);font-size:.875rem;"><i class="fa-solid fa-check"></i></button>` : ''}
                    <button class="row-action-btn" onclick="downloadInvoicePDF('${inv.id}')" title="Download" style="background:none;border:none;cursor:pointer;color:var(--text-muted);padding:.3rem .4rem;border-radius:var(--radius-sm);font-size:.875rem;"><i class="fa-solid fa-download"></i></button>
                    <button class="row-action-btn danger" onclick="confirmDeleteInvoice('${inv.id}')" title="Delete" style="background:none;border:none;cursor:pointer;color:var(--text-muted);padding:.3rem .4rem;border-radius:var(--radius-sm);font-size:.875rem;"><i class="fa-solid fa-trash"></i></button>
                </div>
            </td>
        </tr>`;
    }).join('');
}

function updateFooter(invoices, total) {
    const from = total === 0 ? 0 : (currentPage - 1) * perPage + 1;
    const to = Math.min(currentPage * perPage, total);
    const totalAmt = invoices.reduce((s, i) => s + (Number(i.grand_total) || 0), 0);
    document.getElementById('invoices-count-text').textContent = `Showing ${from}–${to} of ${total} invoices`;
    document.getElementById('invoices-total-amount').textContent = formatCurrency(totalAmt);
}

// ── Status Counts ──────────────────────────────────────────────
async function loadStatusCounts() {
    const { data: stats } = await getInvoiceStats();
    if (!stats) return;
    const map = { draft: stats.draft_count, sent: stats.sent_count, pending: stats.pending_count, paid: stats.paid_count, overdue: stats.overdue_count, cancelled: stats.cancelled_count || 0 };
    Object.entries(map).forEach(([k, v]) => { const el = document.getElementById(`cnt-${k}`); if (el) el.textContent = v || 0; });
}

// ── Actions ────────────────────────────────────────────────────
window.markInvoicePaid = async function(id) {
    const { error } = await updateInvoiceStatus(id, 'paid');
    if (error) { Toast.error('Failed to update status.'); return; }
    Toast.success('Marked as paid!');
    loadInvoices(); loadStatusCounts();
};

window.confirmDeleteInvoice = async function(id) {
    if (!confirm('Delete this invoice? This cannot be undone.')) return;
    const { error } = await deleteInvoice(id);
    if (error) { Toast.error('Delete failed.'); return; }
    Toast.success('Invoice deleted.');
    loadInvoices(); loadStatusCounts();
};

window.downloadInvoicePDF = function(id) {
    window.open(`invoice.html?id=${id}&print=1`, '_blank');
};

// ── Bulk Select ────────────────────────────────────────────────
window.toggleRowSelect = function(id, checked) {
    checked ? selectedIds.add(id) : selectedIds.delete(id);
    updateBulkBar();
};

function updateBulkBar() {
    const bar = document.getElementById('bulk-actions-bar');
    const cnt = document.getElementById('bulk-count-text');
    const n = selectedIds.size;
    if (!bar) return;
    bar.style.display = n > 0 ? 'flex' : 'none';
    if (cnt) cnt.textContent = `${n} selected`;
}

function clearBulkSelect() {
    selectedIds.clear();
    document.querySelectorAll('.invoice-row-check').forEach(ch => { ch.checked = false; });
    document.getElementById('select-all-invoices').checked = false;
    updateBulkBar();
}
window.clearBulkSelect = clearBulkSelect;

window.bulkMarkPaid = async function() {
    if (!selectedIds.size) return;
    const ids = [...selectedIds];
    let ok = 0, fail = 0;
    await Promise.all(ids.map(async (id) => {
        const { error } = await updateInvoiceStatus(id, 'paid');
        error ? fail++ : ok++;
    }));
    if (ok) Toast.success(`${ok} invoice(s) marked as paid.`);
    if (fail) Toast.error(`${fail} failed.`);
    clearBulkSelect();
    loadInvoices(); loadStatusCounts();
};

window.bulkDelete = async function() {
    if (!selectedIds.size) return;
    if (!confirm(`Delete ${selectedIds.size} selected invoice(s)?`)) return;
    const ids = [...selectedIds];
    let ok = 0;
    await Promise.all(ids.map(async (id) => {
        const { error } = await deleteInvoice(id);
        if (!error) ok++;
    }));
    Toast.success(`${ok} invoice(s) deleted.`);
    clearBulkSelect();
    loadInvoices(); loadStatusCounts();
};

// ── Export ─────────────────────────────────────────────────────
window.exportInvoicesCSV = function() {
    if (!allInvoices.length) { Toast.warning('No invoices to export.'); return; }
    const headers = 'Invoice #,Customer,Date,Due Date,Amount,Status\n';
    const rows = allInvoices.map(inv =>
        [inv.invoice_number, inv.customer_name, inv.invoice_date, inv.due_date, inv.grand_total, inv.status].map(v => `"${v || ''}"`).join(',')
    ).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'kosha_invoices.csv';
    a.click();
    Toast.success('Invoices exported.');
};

function esc(s) { return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
