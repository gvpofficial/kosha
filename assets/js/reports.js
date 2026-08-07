/**
 * Kosha - Reports Page Logic
 */

import { requireAuth, getInvoices, getInvoiceStats, getCustomers } from './supabase.js';
import { initApp, formatCurrency, formatDate, getStatusBadge, Toast } from './app.js';
import { initLayout } from './layout.js';

let charts = {};
let currentPeriod = 'this_year';
let fromDate = '';
let toDate = '';

export async function initReportsPage() {
    await requireAuth();
    initLayout('reports');
    initApp();
    await loadReportData();
}

if (document.readyState === 'complete' || document.readyState === 'interactive') {
    initReportsPage();
} else {
    document.addEventListener('DOMContentLoaded', initReportsPage);
}

// ── Period ─────────────────────────────────────────────────────
window.changePeriod = function(period) {
    currentPeriod = period;
    const customRange = document.getElementById('custom-range');
    if (period === 'custom') { customRange.style.display = 'flex'; return; }
    customRange.style.display = 'none';
    const { from, to } = getPeriodDates(period);
    fromDate = from; toDate = to;
    loadReportData();
};

window.applyCustomRange = function() {
    fromDate = document.getElementById('report-from')?.value;
    toDate = document.getElementById('report-to')?.value;
    if (!fromDate || !toDate) { Toast.warning('Select both from and to dates.'); return; }
    loadReportData();
};

function getPeriodDates(period) {
    const now = new Date();
    let from, to;
    switch (period) {
        case 'this_month':
            from = new Date(now.getFullYear(), now.getMonth(), 1);
            to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            break;
        case 'last_month':
            from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            to = new Date(now.getFullYear(), now.getMonth(), 0);
            break;
        case 'this_quarter':
            const q = Math.floor(now.getMonth() / 3);
            from = new Date(now.getFullYear(), q * 3, 1);
            to = new Date(now.getFullYear(), q * 3 + 3, 0);
            break;
        case 'last_year':
            from = new Date(now.getFullYear() - 1, 0, 1);
            to = new Date(now.getFullYear() - 1, 11, 31);
            break;
        case 'this_year':
        default:
            from = new Date(now.getFullYear(), 0, 1);
            to = new Date(now.getFullYear(), 11, 31);
    }
    return {
        from: from.toISOString().split('T')[0],
        to: to.toISOString().split('T')[0]
    };
}

// ── Load All Data ──────────────────────────────────────────────
async function loadReportData() {
    if (!fromDate && currentPeriod !== 'custom') {
        const { from, to } = getPeriodDates(currentPeriod);
        fromDate = from; toDate = to;
    }

    const [statsResult, invoicesResult] = await Promise.all([
        getInvoiceStats(fromDate, toDate),
        getInvoices({ from: fromDate, to: toDate }, 1, 500)
    ]);

    const stats = statsResult.data || {};
    const invoices = invoicesResult.data || [];

    renderKPIs(stats, invoices);
    renderRevenueCompare(invoices);
    renderPaymentStatus(stats);
    renderTopCustomers(invoices);
    renderTopProducts(invoices);
    renderOverdueTable(invoices);
    renderGSTSummary(invoices);
}

// ── KPIs ───────────────────────────────────────────────────────
function renderKPIs(stats, invoices) {
    const totalRev = invoices.reduce((s, i) => s + (Number(i.grand_total) || 0), 0);
    const collected = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + (Number(i.grand_total) || 0), 0);
    const outstanding = totalRev - collected;
    const totalCount = invoices.length;

    setText('kpi-revenue', formatCurrency(totalRev));
    setText('kpi-collected', formatCurrency(collected));
    setText('kpi-outstanding', formatCurrency(outstanding));
    setText('kpi-invoices', totalCount.toLocaleString('en-IN'));

    const pct = totalRev ? Math.round(collected / totalRev * 100) : 0;
    setText('kpi-collected-trend', `${pct}% collection rate`);
    setText('kpi-revenue-trend', `${totalCount} invoices`);
    setText('kpi-outstanding-trend', `${invoices.filter(i => i.status === 'overdue' || (!['paid','cancelled'].includes(i.status) && i.due_date && new Date(i.due_date) < new Date())).length} overdue`);
    setText('kpi-invoices-trend', `Paid: ${invoices.filter(i => i.status === 'paid').length}`);
}

// ── Revenue vs Collected ───────────────────────────────────────
function renderRevenueCompare(invoices) {
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const revenueByMonth = Array(12).fill(0);
    const collectedByMonth = Array(12).fill(0);

    invoices.forEach(inv => {
        const m = new Date(inv.invoice_date).getMonth();
        if (isNaN(m)) return;
        revenueByMonth[m] += Number(inv.grand_total) || 0;
        if (inv.status === 'paid') collectedByMonth[m] += Number(inv.grand_total) || 0;
    });

    const ctx = document.getElementById('revenueCompareChart');
    if (!ctx) return;
    if (charts.revenueCompare) charts.revenueCompare.destroy();

    charts.revenueCompare = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: months,
            datasets: [
                { label: 'Revenue', data: revenueByMonth, backgroundColor: 'rgba(59,130,246,.7)', borderRadius: 4 },
                { label: 'Collected', data: collectedByMonth, backgroundColor: 'rgba(34,197,94,.7)', borderRadius: 4 }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { grid: { display: false } },
                y: { ticks: { callback: v => v >= 1000 ? `₹${(v/1000).toFixed(0)}K` : `₹${v}` } }
            }
        }
    });
}

// ── Payment Status Donut ───────────────────────────────────────
function renderPaymentStatus(stats) {
    const ctx = document.getElementById('paymentStatusChart');
    if (!ctx) return;
    if (charts.paymentStatus) charts.paymentStatus.destroy();

    const statusData = [
        { label: 'Paid',     value: stats.paid_count    || 0, color: '#22C55E' },
        { label: 'Pending',  value: stats.pending_count || 0, color: '#F59E0B' },
        { label: 'Overdue',  value: stats.overdue_count || 0, color: '#EF4444' },
        { label: 'Draft',    value: stats.draft_count   || 0, color: '#9CA3AF' },
    ].filter(s => s.value > 0);

    charts.paymentStatus = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: statusData.map(s => s.label),
            datasets: [{ data: statusData.map(s => s.value), backgroundColor: statusData.map(s => s.color), borderWidth: 0, hoverOffset: 6 }]
        },
        options: { responsive: true, maintainAspectRatio: false, cutout: '70%', plugins: { legend: { display: false } } }
    });

    const legendEl = document.getElementById('payment-status-legend');
    if (legendEl) {
        legendEl.innerHTML = statusData.map(s => `
            <div style="display:flex;align-items:center;gap:.375rem;font-size:.78rem;color:var(--text-muted);">
                <div style="width:10px;height:10px;border-radius:50%;background:${s.color};"></div>
                ${s.label}: <strong>${s.value}</strong>
            </div>`).join('');
    }
}

// ── Top Customers ─────────────────────────────────────────────
function renderTopCustomers(invoices) {
    const map = {};
    invoices.forEach(inv => {
        if (!inv.customer_name) return;
        map[inv.customer_name] = (map[inv.customer_name] || 0) + (Number(inv.grand_total) || 0);
    });
    const sorted = Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 8);

    const ctx = document.getElementById('topCustomersChart');
    if (!ctx) return;
    if (charts.topCustomers) charts.topCustomers.destroy();

    charts.topCustomers = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sorted.map(([k]) => k),
            datasets: [{ data: sorted.map(([,v]) => v), backgroundColor: 'rgba(59,130,246,.75)', borderRadius: 4 }]
        },
        options: {
            indexAxis: 'y', responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { x: { ticks: { callback: v => `₹${(v/1000).toFixed(0)}K` } } }
        }
    });
}

// ── Top Products ──────────────────────────────────────────────
function renderTopProducts(invoices) {
    const map = {};
    invoices.forEach(inv => {
        (inv.items || []).forEach(item => {
            if (!item.name) return;
            map[item.name] = (map[item.name] || 0) + (Number(item.amount) || 0);
        });
    });

    // If items aren't loaded, show placeholder
    const hasItems = Object.keys(map).length > 0;
    const sorted = hasItems ? Object.entries(map).sort((a,b) => b[1]-a[1]).slice(0,8) : [['Product data will appear here',0]];

    const ctx = document.getElementById('topProductsChart');
    if (!ctx) return;
    if (charts.topProducts) charts.topProducts.destroy();

    charts.topProducts = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sorted.map(([k]) => k),
            datasets: [{ data: sorted.map(([,v]) => v), backgroundColor: 'rgba(139,92,246,.75)', borderRadius: 4 }]
        },
        options: {
            indexAxis: 'y', responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { x: { ticks: { callback: v => `₹${(v/1000).toFixed(0)}K` } } }
        }
    });
}

// ── Overdue Table ─────────────────────────────────────────────
function renderOverdueTable(invoices) {
    const tbody = document.getElementById('overdue-tbody');
    if (!tbody) return;
    const overdue = invoices.filter(inv =>
        !['paid','cancelled'].includes(inv.status) &&
        inv.due_date && new Date(inv.due_date) < new Date()
    ).slice(0, 10);

    if (!overdue.length) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:1.5rem;color:var(--text-muted);">🎉 No overdue invoices!</td></tr>';
        return;
    }
    tbody.innerHTML = overdue.map(inv => `<tr>
        <td><a href="invoice.html?id=${inv.id}" style="color:var(--primary);font-weight:600;">${esc(inv.invoice_number)}</a></td>
        <td>${esc(inv.customer_name || '—')}</td>
        <td style="color:var(--danger);">${formatDate(inv.due_date)}</td>
        <td class="fw-600">${formatCurrency(inv.grand_total, inv.currency_symbol)}</td>
        <td>${getStatusBadge(inv.status)}</td>
    </tr>`).join('');
}

// ── GST Summary ───────────────────────────────────────────────
function renderGSTSummary(invoices) {
    const gstMap = {};
    invoices.forEach(inv => {
        const rate = '—';
        // Simplified: group by overall tax
        const taxAmt = Number(inv.tax_amount) || 0;
        const gstKey = inv.status === 'paid' ? 'Paid' : 'Pending';
        if (!gstMap[gstKey]) gstMap[gstKey] = { taxable: 0, cgst: 0, sgst: 0, igst: 0, total: 0 };
        const taxable = (Number(inv.grand_total) || 0) - taxAmt - (Number(inv.shipping_charge) || 0);
        gstMap[gstKey].taxable += taxable;
        gstMap[gstKey].cgst += taxAmt / 2;
        gstMap[gstKey].sgst += taxAmt / 2;
        gstMap[gstKey].total += taxAmt;
    });

    const entries = Object.entries(gstMap);
    const totalTaxable = entries.reduce((s,[,v]) => s + v.taxable, 0);
    const totalGST = entries.reduce((s,[,v]) => s + v.total, 0);

    const el = document.getElementById('gst-summary-table');
    if (!el) return;
    el.innerHTML = `<table class="gst-summary-table">
        <thead><tr><th>Category</th><th>Taxable Amt</th><th>CGST</th><th>SGST</th><th>Total GST</th></tr></thead>
        <tbody>
            ${entries.map(([k, v]) => `<tr>
                <td>${k}</td>
                <td>${formatCurrency(v.taxable)}</td>
                <td>${formatCurrency(v.cgst)}</td>
                <td>${formatCurrency(v.sgst)}</td>
                <td class="fw-600">${formatCurrency(v.total)}</td>
            </tr>`).join('')}
        </tbody>
        <tfoot>
            <tr>
                <td>Total</td>
                <td>${formatCurrency(totalTaxable)}</td>
                <td colspan="2"></td>
                <td>${formatCurrency(totalGST)}</td>
            </tr>
        </tfoot>
    </table>`;
}

// ── Export ─────────────────────────────────────────────────────
window.exportReportPDF = function() {
    Toast.info('Preparing PDF…', 2000);
    window.print();
};

window.exportGSTReport = function() {
    Toast.info('Generating GST report CSV…');
};

// ── Helpers ───────────────────────────────────────────────────
function setText(id, v) { const el = document.getElementById(id); if (el) el.textContent = v; }
function esc(s) { return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
