/**
 * Kosha - Products Page Logic
 */

import { requireAuth, getProducts, createProduct, updateProduct, deleteProduct, getLowStockProducts } from './supabase.js';
import { initApp, formatCurrency, debounce, Pagination, Toast } from './app.js';
import { initLayout } from './layout.js';

let currentPage   = 1;
let perPage       = 25;
let allProducts   = [];
let allProductsById = {};
let editingId     = null;
let deleteTargetId = null;
let searchQuery   = '';
let filterType    = '';
let sortOrder     = 'created_at_desc';
let viewMode      = 'table';
let pagination    = null;

document.addEventListener('DOMContentLoaded', async () => {
    await requireAuth();
    initLayout('products');
    initApp();
    initFilters();
    initTypeButtons();
    await loadProducts();
    await loadProductStats();
    handleURLActions();
    document.getElementById('confirm-delete-product-btn')?.addEventListener('click', confirmDeleteProduct);
});

function handleURLActions() {
    const params = new URLSearchParams(window.location.search);
    if (params.get('action') === 'new') openAddProduct();
}

// ── Filters ────────────────────────────────────────────────────
function initFilters() {
    const search = document.getElementById('product-search');
    const typeFilter = document.getElementById('product-filter-type');
    const sort = document.getElementById('product-sort');
    const viewSelect = document.getElementById('product-view-mode');

    search?.addEventListener('input', debounce(e => { searchQuery = e.target.value.trim(); currentPage = 1; loadProducts(); }, 300));
    typeFilter?.addEventListener('change', e => { filterType = e.target.value; currentPage = 1; loadProducts(); });
    sort?.addEventListener('change', e => { sortOrder = e.target.value; currentPage = 1; loadProducts(); });
    viewSelect?.addEventListener('change', e => { viewMode = e.target.value; renderCurrentView(); });
}

function initTypeButtons() {
    document.querySelectorAll('[data-ptype]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('[data-ptype]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById('pf-type').value = btn.dataset.ptype;
            // Show/hide stock fields for services
            const isService = btn.dataset.ptype === 'service';
            document.getElementById('pf-stock').closest('.col-md-4').style.opacity = isService ? '.4' : '1';
            document.getElementById('pf-low-stock-level').closest('.col-md-4').style.opacity = isService ? '.4' : '1';
            document.getElementById('pf-hsn').placeholder = isService ? 'SAC Code' : 'HSN Code';
        });
    });
}

// ── Load ───────────────────────────────────────────────────────
async function loadProducts() {
    const tbody = document.getElementById('products-tbody');
    if (tbody) tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:2rem;color:var(--text-muted);">Loading…</td></tr>';

    const { data, count, error } = await getProducts(searchQuery, currentPage, perPage, filterType);
    if (error) { Toast.error('Failed to load products.'); return; }

    allProducts = data || [];
    allProductsById = {};
    allProducts.forEach(p => { allProductsById[p.id] = p; });
    window.allProductsById = allProductsById;

    renderCurrentView();

    if (!pagination) {
        pagination = new Pagination('products-pagination', count || 0, perPage, (p) => { currentPage = p; loadProducts(); });
    }
    pagination.update(count || 0, currentPage);
    document.getElementById('products-count-text').textContent = `${count || 0} products`;
}

function renderCurrentView() {
    if (viewMode === 'card') {
        document.getElementById('products-table-view').style.display = 'none';
        document.getElementById('products-card-view').style.display = 'block';
        renderCardView(allProducts);
    } else {
        document.getElementById('products-table-view').style.display = 'block';
        document.getElementById('products-card-view').style.display = 'none';
        renderTableView(allProducts);
    }
}

function renderTableView(products) {
    const tbody = document.getElementById('products-tbody');
    const empty = document.getElementById('products-empty');
    if (!products.length) {
        tbody.innerHTML = '';
        empty.style.display = 'block';
        return;
    }
    empty.style.display = 'none';

    tbody.innerHTML = products.map(p => {
        const stock = p.stock_quantity;
        const stockBadge = p.type === 'service' ? `<span class="kosha-badge badge-sent">Service</span>` :
            stock <= 0 ? `<span class="kosha-badge badge-cancelled">Out</span>` :
            stock <= (p.low_stock_level || 5) ? `<span class="kosha-badge badge-pending">${stock}</span>` :
            `<span class="kosha-badge badge-paid">${stock}</span>`;

        return `<tr>
            <td data-label="Name">
                <div style="font-weight:600;">${esc(p.name)}</div>
                ${p.sku ? `<code style="font-size:.72rem;color:var(--text-muted);">${esc(p.sku)}</code>` : ''}
                ${p.description ? `<div style="font-size:.75rem;color:var(--text-muted);">${esc(p.description.substring(0,60))}${p.description.length > 60 ? '…' : ''}</div>` : ''}
            </td>
            <td data-label="Type"><span class="kosha-badge ${p.type === 'service' ? 'badge-sent' : 'badge-draft'}">${p.type || 'Product'}</span></td>
            <td data-label="HSN"><code style="font-size:.75rem;">${esc(p.hsn_code || '—')}</code></td>
            <td data-label="Unit">${esc(p.unit || 'Nos')}</td>
            <td data-label="Price" class="text-end fw-600">${formatCurrency(p.price, '₹', 'INR')}</td>
            <td data-label="GST" class="text-center">${p.tax_rate || 0}%</td>
            <td data-label="Stock" class="text-center">${stockBadge}</td>
            <td data-label="Status"><span class="kosha-badge ${p.is_active ? 'badge-paid' : 'badge-cancelled'}">${p.is_active ? 'Active' : 'Inactive'}</span></td>
            <td>
                <div class="d-flex gap-1">
                    <button class="row-action-btn" onclick="openEditProduct('${p.id}')" title="Edit"><i class="fa-solid fa-pen"></i></button>
                    <a href="invoice.html" class="row-action-btn" title="Add to invoice"><i class="fa-solid fa-file-plus"></i></a>
                    <button class="row-action-btn danger" onclick="promptDeleteProduct('${p.id}')" title="Delete"><i class="fa-solid fa-trash-can"></i></button>
                </div>
            </td>
        </tr>`;
    }).join('');
}

function renderCardView(products) {
    const row = document.getElementById('products-cards-row');
    row.innerHTML = products.map(p => {
        const stock = p.stock_quantity;
        const stockColor = p.type === 'service' ? '#3B82F6' : stock <= 0 ? '#EF4444' : stock <= (p.low_stock_level || 5) ? '#F59E0B' : '#22C55E';
        return `<div class="col-xl-3 col-lg-4 col-md-6">
            <div class="kosha-card h-100" style="cursor:pointer;" onclick="openEditProduct('${p.id}')">
                <div class="kosha-card-body">
                    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:.75rem;">
                        <div class="qa-icon" style="background:linear-gradient(135deg,#3B82F6,#06B6D4);width:44px;height:44px;">
                            <i class="fa-solid ${p.type === 'service' ? 'fa-gear' : 'fa-box'}" style="font-size:1.1rem;"></i>
                        </div>
                        <span class="kosha-badge ${p.is_active ? 'badge-paid' : 'badge-cancelled'}">${p.is_active ? 'Active' : 'Inactive'}</span>
                    </div>
                    <div style="font-weight:700;font-size:.9375rem;margin-bottom:.25rem;">${esc(p.name)}</div>
                    ${p.sku ? `<div style="font-size:.72rem;color:var(--text-muted);">SKU: ${esc(p.sku)}</div>` : ''}
                    <div style="font-size:1.25rem;font-weight:800;color:var(--primary);margin:.5rem 0;">${formatCurrency(p.price)}</div>
                    <div style="display:flex;justify-content:space-between;align-items:center;">
                        <div style="font-size:.75rem;color:var(--text-muted);">GST: ${p.tax_rate || 0}% | HSN: ${p.hsn_code || '—'}</div>
                        <span style="background:${stockColor}20;color:${stockColor};font-size:.72rem;font-weight:700;padding:.2rem .5rem;border-radius:10px;">
                            ${p.type === 'service' ? 'Service' : `Stock: ${stock}`}
                        </span>
                    </div>
                </div>
            </div>
        </div>`;
    }).join('');
}

// ── Stats ──────────────────────────────────────────────────────
async function loadProductStats() {
    const { data: all } = await getProducts('', 1, 1000);
    if (!all) return;
    const total = all.length;
    const active = all.filter(p => p.is_active).length;
    const lowStock = all.filter(p => p.type !== 'service' && p.stock_quantity > 0 && p.stock_quantity <= (p.low_stock_level || 5)).length;
    const outOfStock = all.filter(p => p.type !== 'service' && p.stock_quantity <= 0).length;
    setText('stat-total-products', total);
    setText('stat-active-products', active);
    setText('stat-low-stock', lowStock);
    setText('stat-out-of-stock', outOfStock);
}

// ── Add/Edit ───────────────────────────────────────────────────
window.openAddProduct = function() {
    editingId = null;
    document.getElementById('productModalLabel').textContent = 'Add Product';
    document.getElementById('product-form').reset();
    document.getElementById('product-id').value = '';
    document.getElementById('pf-stock').value = '0';
    document.getElementById('pf-low-stock-level').value = '5';
    document.getElementById('pf-discount').value = '0';
    document.getElementById('pf-tax-rate').value = '18';
    bootstrap.Modal.getOrCreateInstance(document.getElementById('productModal')).show();
};

window.openEditProduct = function(id) {
    editingId = id;
    const p = allProductsById[id];
    if (!p) return;
    document.getElementById('productModalLabel').textContent = 'Edit Product';
    document.getElementById('product-id').value = p.id;
    document.getElementById('pf-name').value = p.name || '';
    document.getElementById('pf-sku').value = p.sku || '';
    document.getElementById('pf-description').value = p.description || '';
    document.getElementById('pf-price').value = p.price || '';
    document.getElementById('pf-tax-rate').value = p.tax_rate || 18;
    document.getElementById('pf-hsn').value = p.hsn_code || '';
    document.getElementById('pf-unit').value = p.unit || 'Nos';
    document.getElementById('pf-stock').value = p.stock_quantity || 0;
    document.getElementById('pf-low-stock-level').value = p.low_stock_level || 5;
    document.getElementById('pf-discount').value = p.discount || 0;
    document.getElementById('pf-type').value = p.type || 'product';
    document.querySelectorAll('[data-ptype]').forEach(b => b.classList.toggle('active', b.dataset.ptype === (p.type || 'product')));
    bootstrap.Modal.getOrCreateInstance(document.getElementById('productModal')).show();
};

window.saveProduct = async function() {
    const name = document.getElementById('pf-name').value.trim();
    const price = parseFloat(document.getElementById('pf-price').value);
    if (!name) { Toast.warning('Product name is required.'); return; }
    if (isNaN(price) || price < 0) { Toast.warning('Enter a valid price.'); return; }

    const btn = document.getElementById('save-product-btn');
    btn.disabled = true;

    const data = {
        name, sku: val('pf-sku'), description: val('pf-description'),
        price, tax_rate: parseFloat(val('pf-tax-rate')) || 0,
        hsn_code: val('pf-hsn'), unit: val('pf-unit') || 'Nos',
        stock_quantity: parseInt(val('pf-stock')) || 0,
        low_stock_level: parseInt(val('pf-low-stock-level')) || 5,
        discount: parseFloat(val('pf-discount')) || 0,
        type: document.getElementById('pf-type')?.value || 'product',
        is_active: true
    };

    let result;
    if (editingId) {
        result = await updateProduct(editingId, data);
    } else {
        result = await createProduct(data);
    }
    btn.disabled = false;

    if (result.error) { Toast.error('Save failed.'); return; }
    bootstrap.Modal.getOrCreateInstance(document.getElementById('productModal')).hide();
    Toast.success(editingId ? 'Product updated!' : 'Product added!');
    await loadProducts();
    await loadProductStats();
};

// ── Delete ─────────────────────────────────────────────────────
window.promptDeleteProduct = function(id) {
    deleteTargetId = id;
    bootstrap.Modal.getOrCreateInstance(document.getElementById('deleteProductModal')).show();
};

async function confirmDeleteProduct() {
    if (!deleteTargetId) return;
    const { error } = await deleteProduct(deleteTargetId);
    bootstrap.Modal.getOrCreateInstance(document.getElementById('deleteProductModal')).hide();
    if (error) { Toast.error('Delete failed.'); return; }
    Toast.success('Product deleted.');
    deleteTargetId = null;
    await loadProducts();
    await loadProductStats();
}

// ── Export ─────────────────────────────────────────────────────
window.exportProducts = function() {
    if (!allProducts.length) { Toast.warning('No products to export.'); return; }
    const headers = 'Name,SKU,Type,Price,GST%,HSN,Unit,Stock\n';
    const rows = allProducts.map(p =>
        [p.name, p.sku, p.type, p.price, p.tax_rate, p.hsn_code, p.unit, p.stock_quantity].map(v => `"${v || ''}"`).join(',')
    ).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'kosha_products.csv';
    a.click();
    Toast.success('Products exported.');
};

// ── Helpers ────────────────────────────────────────────────────
function val(id) { return document.getElementById(id)?.value?.trim() || ''; }
function setText(id, v) { const el = document.getElementById(id); if (el) el.textContent = v; }
function esc(s) { return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

// Add shared CSS for row-action-btn
const style = document.createElement('style');
style.textContent = `.row-action-btn{background:none;border:none;cursor:pointer;color:var(--text-muted);padding:.3rem .4rem;border-radius:var(--radius-sm);transition:var(--transition);font-size:.875rem;text-decoration:none;display:inline-flex;align-items:center;}.row-action-btn:hover{color:var(--primary);background:var(--primary-light);}.row-action-btn.danger:hover{color:var(--danger);background:var(--danger-light);}`;
document.head.appendChild(style);
