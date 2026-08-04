/**
 * Kosha - Dashboard Page Logic
 */

import { requireAuth, getInvoiceStats, getInvoices, getCustomers, getLowStockProducts, getMonthlyTrend, getRevenueByMonth } from './supabase.js';
import { initApp, formatCurrency, formatDate, getStatusBadge, getInitials, getAvatarColor, getRelativeTime } from './app.js';
import { initLayout } from './layout.js';

let revenueChart = null;
let statusChart  = null;

document.addEventListener('DOMContentLoaded', async () => {
    await requireAuth();
    initLayout('dashboard');
    initApp();
    setGreeting();
    await loadDashboard();

    // Year change
    document.getElementById('revenue-year-select')?.addEventListener('change', async (e) => {
        await loadRevenueChart(parseInt(e.target.value));
    });

    // Refresh
    document.getElementById('refresh-dashboard-btn')?.addEventListener('click', () => loadDashboard());
});

async function loadDashboard() {
    await Promise.all([
        loadStats(),
        loadRevenueChart(new Date().getFullYear()),
        loadStatusChart(),
        loadRecentInvoices(),
        loadRecentCustomers(),
        loadLowStock(),
    ]);
}

// ── Greeting ───────────────────────────────────────────────────
function setGreeting() {
    const h = new Date().getHours();
    const time = h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
    const emojis = { morning: '☀️', afternoon: '👋', evening: '🌙' };
    const el = document.getElementById('greeting-text');
    if (el) el.textContent = `Good ${time}! ${emojis[time]}`;
}

// ── Stats ───────────────────────────────────────────────────────
async function loadStats() {
    const { data: stats } = await getInvoiceStats();
    const { data: custData } = await getCustomers('', 1, 1);

    if (stats) {
        animateCounter('stat-revenue', stats.total_revenue, true);
        animateCounter('stat-invoices', stats.total_count);
        animateCounter('stat-pending', stats.pending_amount, true);

        const overdueEl = document.getElementById('overdue-label');
        if (overdueEl && stats.overdue_count > 0) {
            overdueEl.textContent = `${stats.overdue_count} overdue`;
        }
    }
    if (custData !== undefined) {
        animateCounter('stat-customers', custData?.count || 0);
    }
}

function animateCounter(elId, target, isCurrency = false) {
    const el = document.getElementById(elId);
    if (!el) return;
    const duration = 1200;
    const start = Date.now();
    el.innerHTML = '';
    const tick = () => {
        const elapsed = Date.now() - start;
        const progress = Math.min(elapsed / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(target * ease);
        el.textContent = isCurrency ? formatCurrency(current) : current.toLocaleString('en-IN');
        if (progress < 1) requestAnimationFrame(tick);
        else el.textContent = isCurrency ? formatCurrency(target) : target.toLocaleString('en-IN');
    };
    requestAnimationFrame(tick);
}

// ── Revenue Chart ───────────────────────────────────────────────
async function loadRevenueChart(year = new Date().getFullYear()) {
    const { data } = await getRevenueByMonth(year);
    if (!data) return;

    const labels = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const ctx = document.getElementById('revenueChart');
    if (!ctx) return;

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const gridColor = isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.06)';
    const textColor = isDark ? '#8B949E' : '#6B7280';

    if (revenueChart) revenueChart.destroy();

    const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 260);
    gradient.addColorStop(0, 'rgba(59,130,246,.25)');
    gradient.addColorStop(1, 'rgba(59,130,246,0)');

    revenueChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'Revenue',
                data,
                borderColor: '#3B82F6',
                backgroundColor: gradient,
                borderWidth: 2.5,
                tension: .4,
                fill: true,
                pointBackgroundColor: '#3B82F6',
                pointRadius: 4,
                pointHoverRadius: 6,
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false }, tooltip: {
                backgroundColor: isDark ? '#1C2130' : '#fff',
                titleColor: isDark ? '#F0F6FC' : '#111827',
                bodyColor: isDark ? '#C9D1D9' : '#374151',
                borderColor: isDark ? '#30363D' : '#E5E7EB',
                borderWidth: 1,
                callbacks: { label: ctx => ` ₹${ctx.parsed.y.toLocaleString('en-IN')}` }
            }},
            scales: {
                x: { grid: { color: gridColor }, ticks: { color: textColor, font: { size: 11 } } },
                y: { grid: { color: gridColor }, ticks: {
                    color: textColor, font: { size: 11 },
                    callback: v => v >= 1000 ? `₹${(v/1000).toFixed(0)}K` : `₹${v}`
                }}
            }
        }
    });
}

// ── Status Donut Chart ──────────────────────────────────────────
async function loadStatusChart() {
    const { data: stats } = await getInvoiceStats();
    if (!stats) return;

    const ctx = document.getElementById('statusChart');
    if (!ctx) return;

    const statusData = [
        { label: 'Paid',    value: stats.paid_count,    color: '#22C55E' },
        { label: 'Pending', value: stats.pending_count,  color: '#F59E0B' },
        { label: 'Overdue', value: stats.overdue_count,  color: '#EF4444' },
        { label: 'Draft',   value: stats.draft_count,    color: '#9CA3AF' },
    ].filter(s => s.value > 0);

    if (statusChart) statusChart.destroy();

    statusChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: statusData.map(s => s.label),
            datasets: [{
                data: statusData.map(s => s.value),
                backgroundColor: statusData.map(s => s.color),
                borderWidth: 0, hoverOffset: 6
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false, cutout: '70%',
            plugins: { legend: { display: false } }
        }
    });

    // Render legend
    const legendEl = document.getElementById('status-legend');
    if (legendEl) {
        legendEl.innerHTML = statusData.map(s => `
            <div class="legend-item">
                <div class="legend-dot" style="background:${s.color}"></div>
                <span>${s.label}: <strong>${s.value}</strong></span>
            </div>
        `).join('');
    }
}

// ── Recent Invoices ─────────────────────────────────────────────
async function loadRecentInvoices() {
    const tbody = document.getElementById('recent-invoices-body');
    if (!tbody) return;

    const { data } = await getInvoices({}, 1, 5);

    if (!data || data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state py-4"><div class="empty-state-icon"><i class="fa-solid fa-file-invoice"></i></div><div class="empty-state-title">No invoices yet</div><div class="empty-state-text">Create your first invoice to get started.</div><a href="invoice.html" class="btn btn-primary btn-sm">Create Invoice</a></div></td></tr>`;
        return;
    }

    tbody.innerHTML = data.map(inv => `
        <tr>
            <td data-label="Invoice #"><a href="invoice.html?id=${inv.id}" class="fw-600 text-primary-color">${inv.invoice_number}</a></td>
            <td data-label="Customer">${escapeHtml(inv.customer_name)}</td>
            <td data-label="Date">${formatDate(inv.invoice_date)}</td>
            <td data-label="Due Date" class="${isOverdue(inv.due_date, inv.status) ? 'text-danger' : ''}">${inv.due_date ? formatDate(inv.due_date) : '—'}</td>
            <td data-label="Amount" class="fw-600">${formatCurrency(inv.grand_total, inv.currency_symbol)}</td>
            <td data-label="Status">${getStatusBadge(inv.status)}</td>
            <td data-label="Actions">
                <div class="d-flex gap-1">
                    <a href="invoice.html?id=${inv.id}" class="invoice-action-btn" title="View/Edit"><i class="fa-solid fa-eye"></i></a>
                    <button class="invoice-action-btn" onclick="window.open('invoice.html?id=${inv.id}&print=1')" title="Download PDF"><i class="fa-solid fa-download"></i></button>
                </div>
            </td>
        </tr>
    `).join('');
}

// ── Recent Customers ────────────────────────────────────────────
async function loadRecentCustomers() {
    const list = document.getElementById('recent-customers-list');
    if (!list) return;

    const { data } = await getCustomers('', 1, 5);

    if (!data || data.length === 0) {
        list.innerHTML = `<li class="empty-state py-4"><div class="empty-state-icon"><i class="fa-solid fa-users"></i></div><div class="empty-state-title">No customers yet</div></li>`;
        return;
    }

    list.innerHTML = data.map(c => `
        <li class="customer-mini-item" onclick="window.location.href='customers.html?id=${c.id}'" role="button" tabindex="0">
            <div class="cust-avatar" style="background:${getAvatarColor(c.name)}">${getInitials(c.name)}</div>
            <div>
                <div class="cust-name">${escapeHtml(c.name)}</div>
                <div class="cust-email">${escapeHtml(c.email || c.phone || '')}</div>
            </div>
            <div class="cust-amount">
                <span class="kosha-badge badge-paid">${c.city || 'Customer'}</span>
            </div>
        </li>
    `).join('');
}

// ── Low Stock ───────────────────────────────────────────────────
async function loadLowStock() {
    const list = document.getElementById('low-stock-list');
    if (!list) return;

    const { data } = await getLowStockProducts();

    if (!data || data.length === 0) {
        list.innerHTML = `<li class="empty-state py-4"><div class="empty-state-icon"><i class="fa-solid fa-box-open"></i></div><div class="empty-state-title">All products are well stocked</div></li>`;
        return;
    }

    list.innerHTML = data.map(p => {
        const qty = p.stock_quantity;
        const cls = qty === 0 ? 'stock-critical' : 'stock-low';
        const label = qty === 0 ? 'Out of Stock' : `${qty} left`;
        return `<li class="product-mini-item">
            <div style="flex:1;">
                <div class="fw-600" style="font-size:.875rem;">${escapeHtml(p.name)}</div>
                <div style="font-size:.75rem;color:var(--text-muted);">SKU: ${p.sku || '—'}</div>
            </div>
            <span class="product-stock-badge ${cls}">${label}</span>
        </li>`;
    }).join('');
}

// ── Helpers ─────────────────────────────────────────────────────
function escapeHtml(str) {
    return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function isOverdue(dueDate, status) {
    if (!dueDate || ['paid','cancelled'].includes(status)) return false;
    return new Date(dueDate) < new Date();
}
