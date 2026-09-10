/**
 * Kosha - Dashboard View Template
 */

export function getDashboardHTML() {
    return `
    <div class="page-content">

        <!-- Breadcrumb -->
        <nav class="kosha-breadcrumb" aria-label="Breadcrumb">
            <span class="kosha-breadcrumb-item"><i class="fa-solid fa-house"></i></span>
            <span class="kosha-breadcrumb-sep">/</span>
            <span class="kosha-breadcrumb-item active">Dashboard</span>
        </nav>

        <!-- Page Header -->
        <div class="page-header">
            <div>
                <h1 class="page-title" id="greeting-text">Good morning! 👋</h1>
                <p class="page-subtitle">Here's your business overview for today.</p>
            </div>
            <div class="d-flex gap-2 flex-wrap">
                <button class="btn btn-outline-secondary" id="refresh-dashboard-btn" aria-label="Refresh data">
                    <i class="fa-solid fa-rotate-right"></i>
                </button>
            </div>
        </div>

        <!-- ── Stat Cards ── -->
        <div class="row g-3 mb-4" id="stat-cards-row">
            <!-- Revenue -->
            <div class="col-xl-3 col-md-6">
                <div class="stat-card primary">
                    <div class="stat-trend up" id="revenue-trend">+0%</div>
                    <div class="stat-icon bg-primary"><i class="fa-solid fa-indian-rupee-sign" aria-hidden="true"></i></div>
                    <div class="stat-value" id="stat-revenue">
                        <div class="skeleton skeleton-text" style="width:120px;height:2rem;"></div>
                    </div>
                    <div class="stat-label">Total Revenue</div>
                </div>
            </div>
            <!-- Invoices -->
            <div class="col-xl-3 col-md-6">
                <div class="stat-card success">
                    <div class="stat-trend up" id="invoice-trend">+0</div>
                    <div class="stat-icon bg-success"><i class="fa-solid fa-file-invoice" aria-hidden="true"></i></div>
                    <div class="stat-value" id="stat-invoices">
                        <div class="skeleton skeleton-text" style="width:80px;height:2rem;"></div>
                    </div>
                    <div class="stat-label">Total Invoices</div>
                </div>
            </div>
            <!-- Customers -->
            <div class="col-xl-3 col-md-6">
                <div class="stat-card warning">
                    <div class="stat-trend up" id="customer-trend">+0</div>
                    <div class="stat-icon bg-warning"><i class="fa-solid fa-users" aria-hidden="true"></i></div>
                    <div class="stat-value" id="stat-customers">
                        <div class="skeleton skeleton-text" style="width:80px;height:2rem;"></div>
                    </div>
                    <div class="stat-label">Active Customers</div>
                </div>
            </div>
            <!-- Pending -->
            <div class="col-xl-3 col-md-6">
                <div class="stat-card danger">
                    <div class="stat-trend down" id="pending-trend" style="display:none"></div>
                    <div class="stat-icon bg-danger"><i class="fa-solid fa-clock" aria-hidden="true"></i></div>
                    <div class="stat-value" id="stat-pending">
                        <div class="skeleton skeleton-text" style="width:120px;height:2rem;"></div>
                    </div>
                    <div class="stat-label">Pending Payments</div>
                    <small class="text-danger" id="overdue-label" style="font-size:.75rem;"></small>
                </div>
            </div>
        </div>

        <!-- ── Charts Row ── -->
        <div class="row g-3 mb-4">
            <!-- Revenue Chart -->
            <div class="col-lg-8">
                <div class="kosha-card h-100">
                    <div class="kosha-card-header">
                        <div>
                            <div class="kosha-card-title">Revenue Overview</div>
                            <div class="kosha-card-subtitle">Monthly revenue for the past 6 months</div>
                        </div>
                        <select class="form-select" id="revenue-year-select" style="width:auto;font-size:.8125rem;" aria-label="Select year">
                            <option value="2025">2025</option>
                            <option value="2024">2024</option>
                        </select>
                    </div>
                    <div class="kosha-card-body">
                        <div class="chart-container" style="height:260px;">
                            <canvas id="revenueChart" aria-label="Revenue overview chart"></canvas>
                        </div>
                    </div>
                </div>
            </div>
            <!-- Status Donut -->
            <div class="col-lg-4">
                <div class="kosha-card h-100">
                    <div class="kosha-card-header">
                        <div>
                            <div class="kosha-card-title">Invoice Status</div>
                            <div class="kosha-card-subtitle">Distribution by status</div>
                        </div>
                    </div>
                    <div class="kosha-card-body d-flex flex-column align-items-center justify-content-center">
                        <div class="chart-container" style="height:200px;width:200px;">
                            <canvas id="statusChart" aria-label="Invoice status donut chart"></canvas>
                        </div>
                        <div id="status-legend" class="status-legend-grid mt-3"></div>
                    </div>
                </div>
            </div>
        </div>

        <!-- ── Quick Actions ── -->
        <div class="quick-actions-row mb-4">

            <a href="#/customers?action=new" class="quick-action-btn" id="qa-new-customer">
                <div class="qa-icon" style="background:linear-gradient(135deg,#22C55E,#10B981);">
                    <i class="fa-solid fa-user-plus" aria-hidden="true"></i>
                </div>
                <span>Add Customer</span>
            </a>
            <a href="#/products?action=new" class="quick-action-btn" id="qa-new-product">
                <div class="qa-icon" style="background:linear-gradient(135deg,#F59E0B,#D97706);">
                    <i class="fa-solid fa-box-open" aria-hidden="true"></i>
                </div>
                <span>Add Product</span>
            </a>
            <a href="#/reports" class="quick-action-btn" id="qa-reports">
                <div class="qa-icon" style="background:linear-gradient(135deg,#8B5CF6,#6D28D9);">
                    <i class="fa-solid fa-chart-line" aria-hidden="true"></i>
                </div>
                <span>View Reports</span>
            </a>
        </div>

        <!-- ── Recent Invoices ── -->
        <div class="kosha-card mb-4">
            <div class="kosha-card-header">
                <div>
                    <div class="kosha-card-title">Recent Invoices</div>
                    <div class="kosha-card-subtitle">Latest 5 invoices</div>
                </div>
                <a href="#/invoices" class="btn btn-outline-secondary btn-sm">View All</a>
            </div>
            <div class="kosha-card-body p-0">
                <div class="kosha-table-wrapper">
                    <table class="kosha-table" aria-label="Recent invoices">
                        <thead>
                            <tr>
                                <th>Invoice #</th>
                                <th>Customer</th>
                                <th>Date</th>
                                <th>Due Date</th>
                                <th class="text-end">Amount</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="recent-invoices-body">
                            <!-- Skeleton rows -->
                            <tr><td colspan="7"><div class="skeleton skeleton-text"></div></td></tr>
                            <tr><td colspan="7"><div class="skeleton skeleton-text"></div></td></tr>
                            <tr><td colspan="7"><div class="skeleton skeleton-text"></div></td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- ── Two-column bottom row ── -->
        <div class="row g-3 mb-4">
            <!-- Recent Customers -->
            <div class="col-lg-6">
                <div class="kosha-card h-100">
                    <div class="kosha-card-header">
                        <div class="kosha-card-title">Recent Customers</div>
                        <a href="#/customers" class="btn btn-outline-secondary btn-sm">View All</a>
                    </div>
                    <div class="kosha-card-body p-0">
                        <ul id="recent-customers-list" class="customer-mini-list">
                            <!-- Skeleton -->
                            <li class="customer-mini-item">
                                <div class="skeleton" style="width:40px;height:40px;border-radius:50%;flex-shrink:0;"></div>
                                <div style="flex:1;"><div class="skeleton skeleton-text" style="width:60%"></div><div class="skeleton skeleton-text" style="width:40%"></div></div>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
            <!-- Low Stock Products -->
            <div class="col-lg-6">
                <div class="kosha-card h-100">
                    <div class="kosha-card-header">
                        <div class="kosha-card-title">Low Stock Alert</div>
                        <a href="#/products" class="btn btn-outline-secondary btn-sm">View All</a>
                    </div>
                    <div class="kosha-card-body p-0">
                        <ul id="low-stock-list" class="product-mini-list">
                            <li class="product-mini-item">
                                <div style="flex:1;"><div class="skeleton skeleton-text" style="width:60%"></div><div class="skeleton skeleton-text" style="width:40%"></div></div>
                                <div class="skeleton" style="width:60px;height:24px;border-radius:12px;"></div>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>

        <!-- ── Activity Feed ── -->
        <div class="kosha-card">
            <div class="kosha-card-header">
                <div class="kosha-card-title">Recent Activity</div>
            </div>
            <div class="kosha-card-body p-0">
                <ul id="activity-feed" class="activity-list">
                    <li class="activity-item">
                        <div class="skeleton" style="width:36px;height:36px;border-radius:50%;flex-shrink:0;"></div>
                        <div style="flex:1;"><div class="skeleton skeleton-text" style="width:80%"></div><div class="skeleton skeleton-text" style="width:40%"></div></div>
                    </li>
                </ul>
            </div>
        </div>

    </div><!-- /page-content -->
    `;
}
