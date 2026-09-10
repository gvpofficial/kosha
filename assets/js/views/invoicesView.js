/**
 * Kosha - Invoices View Template
 */

export function getInvoicesHTML() {
    return `
    <div class="page-content">

        <nav class="kosha-breadcrumb" aria-label="Breadcrumb">
            <a href="#/dashboard" class="kosha-breadcrumb-item">Home</a>
            <span class="kosha-breadcrumb-sep">/</span>
            <span class="kosha-breadcrumb-item active">Invoices</span>
        </nav>

        <div class="page-header">
            <div>
                <h1 class="page-title">Invoices</h1>
                <p class="page-subtitle">All your invoices in one place</p>
            </div>
            <div class="d-flex gap-2">
                <a href="#/invoice" class="btn btn-primary" id="create-invoice-btn"><i class="fa-solid fa-plus"></i> New Invoice</a>
            </div>
        </div>

        <!-- Status Filter Tabs -->
        <div class="invoice-status-tabs mb-3" id="status-tabs" role="tablist">
            <button class="status-tab active" data-status="" onclick="setStatusFilter('')" role="tab" aria-selected="true" id="tab-all">All <span class="tab-count" id="cnt-all">0</span></button>
            <button class="status-tab" data-status="draft" onclick="setStatusFilter('draft')" role="tab" id="tab-draft">Drafts <span class="tab-count" id="cnt-draft">0</span></button>
            <button class="status-tab" data-status="sent" onclick="setStatusFilter('sent')" role="tab" id="tab-sent">Sent <span class="tab-count" id="cnt-sent">0</span></button>
            <button class="status-tab" data-status="pending" onclick="setStatusFilter('pending')" role="tab" id="tab-pending">Pending <span class="tab-count" id="cnt-pending">0</span></button>
            <button class="status-tab" data-status="paid" onclick="setStatusFilter('paid')" role="tab" id="tab-paid">Paid <span class="tab-count" id="cnt-paid">0</span></button>
            <button class="status-tab" data-status="overdue" onclick="setStatusFilter('overdue')" role="tab" id="tab-overdue">Overdue <span class="tab-count" id="cnt-overdue">0</span></button>
            <button class="status-tab" data-status="cancelled" onclick="setStatusFilter('cancelled')" role="tab" id="tab-cancelled">Cancelled <span class="tab-count" id="cnt-cancelled">0</span></button>
        </div>

        <!-- Filters -->
        <div class="kosha-card mb-3 filter-toolbar">
            <div class="kosha-card-body py-3">
                <div class="row g-2 align-items-center">
                    <div class="col-md-4">
                        <div class="input-group">
                            <span class="input-group-text"><i class="fa-solid fa-magnifying-glass"></i></span>
                            <input type="search" id="invoice-search" class="form-control" placeholder="Search invoice #, customer name…" aria-label="Search invoices" />
                        </div>
                    </div>
                    <div class="col-md-2"><input type="date" id="filter-from" class="form-control" aria-label="From date" /></div>
                    <div class="col-md-2"><input type="date" id="filter-to" class="form-control" aria-label="To date" /></div>
                    <div class="col-md-2">
                        <select class="form-select" id="invoice-sort" aria-label="Sort invoices">
                            <option value="invoice_date_desc">Newest First</option>
                            <option value="invoice_date_asc">Oldest First</option>
                            <option value="due_date_asc">Due Date ↑</option>
                            <option value="amount_desc">Amount ↓</option>
                            <option value="amount_asc">Amount ↑</option>
                        </select>
                    </div>
                    <div class="col-md-2 d-flex gap-1">
                        <button class="btn btn-outline-secondary btn-sm" onclick="applyFilters()" id="apply-filters-btn" title="Filter invoices" aria-label="Filter invoices"><i class="fa-solid fa-filter"></i></button>
                        <button class="btn btn-ghost btn-sm" onclick="resetInvoiceFilters()" title="Reset filters" aria-label="Reset filters"><i class="fa-solid fa-rotate-left"></i></button>
                        <button class="btn btn-ghost btn-sm" onclick="exportInvoicesCSV()" title="Export invoices" aria-label="Export invoices"><i class="fa-solid fa-file-export"></i></button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Invoices Table -->
        <div class="kosha-card">
            <div class="kosha-card-body p-0">
                <div class="kosha-table-wrapper">
                    <table class="kosha-table" id="invoices-table" aria-label="Invoices list">
                        <thead>
                            <tr>
                                <th><input type="checkbox" id="select-all-invoices" aria-label="Select all" /></th>
                                <th>Invoice #</th>
                                <th>Customer</th>
                                <th>Type</th>
                                <th>Date</th>
                                <th>Due Date</th>
                                <th class="text-end">Amount</th>
                                <th>Status</th>
                                <th style="width:120px;">Actions</th>
                            </tr>
                        </thead>
                        <tbody id="invoices-tbody"></tbody>
                    </table>
                </div>
                <div id="invoices-empty" style="display:none;">
                    <div class="empty-state">
                        <div class="empty-state-icon"><i class="fa-solid fa-file-invoice"></i></div>
                        <div class="empty-state-title">No invoices found</div>
                        <div class="empty-state-text">Create your first invoice to get started.</div>
                        <a href="#/invoice" class="btn btn-primary"><i class="fa-solid fa-plus"></i> Create Invoice</a>
                    </div>
                </div>
            </div>
            <div class="kosha-card-footer">
                <div class="d-flex justify-content-between align-items-center flex-wrap gap-2">
                    <div>
                        <small class="text-muted" id="invoices-count-text">0 invoices</small>
                        <span class="text-muted mx-2">|</span>
                        <small class="text-muted">Total: <strong id="invoices-total-amount">₹0.00</strong></small>
                    </div>
                    <div id="invoices-pagination"></div>
                </div>
            </div>
        </div>

        <!-- Bulk Actions Bar (hidden until items selected) -->
        <div id="bulk-actions-bar" style="display:none;position:fixed;bottom:1.5rem;left:50%;transform:translateX(-50%);background:var(--card);border:1px solid var(--border);border-radius:var(--radius-lg);padding:.875rem 1.25rem;box-shadow:var(--shadow-xl);align-items:center;gap:1rem;z-index:200;">
            <span id="bulk-count-text" class="fw-600">0 selected</span>
            <button class="btn btn-outline-secondary btn-sm" onclick="bulkMarkPaid()" id="bulk-mark-paid-btn"><i class="fa-solid fa-check"></i> Mark Paid</button>
            <button class="btn btn-outline-danger btn-sm" onclick="bulkDelete()" id="bulk-delete-btn"><i class="fa-solid fa-trash"></i> Delete</button>
            <button class="btn btn-ghost btn-sm" onclick="clearBulkSelect()"><i class="fa-solid fa-xmark"></i></button>
        </div>

    </div>
    `;
}
