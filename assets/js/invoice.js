/**
 * Kosha - Invoice Page Logic
 */

import {
    requireAuth, getBusinessProfile, getCustomers, getProducts,
    getInvoiceById, createInvoice, updateInvoice, getNextInvoiceNumber,
    logActivity
} from './supabase.js';
import { initApp, formatCurrency, numberToWords, debounce, Toast, initAutoDraft, clearDraft, lsGet, lsSet } from './app.js';
import { initLayout } from './layout.js';

// ── State ────────────────────────────────────────────────────────
let currentInvoiceId = null;
let currentTemplate  = 'modern';
let currentColor     = '#3B82F6';
let currentDocType   = 'invoice';
let taxMode          = 'per-item';
let currencySymbol   = '₹';
let currencyCode     = 'INR';
let itemRowCount     = 0;
let autoSaveTimer    = null;

// ── Init ─────────────────────────────────────────────────────────
export async function initInvoicePage() {
    await requireAuth();
    initLayout('invoices');
    initApp();
    initFlatpickr();
    await loadInitialData();
    setupCustomerSearch();
    if (document.querySelectorAll('.item-row').length === 0) {
        addItemRow(); // default first row
    }
    setupAutoSave();
    initSignatureUpload();

    // Check edit mode
    const params = new URLSearchParams(window.location.search);
    currentInvoiceId = params.get('id');
    if (currentInvoiceId) {
        await loadInvoiceForEdit(currentInvoiceId);
    }

    // Ctrl+S shortcut
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            saveInvoice(false);
        }
    });

// Preview modal → render on open
    document.getElementById('previewModal')?.addEventListener('show.bs.modal', () => {
        renderInvoicePreview();
    });
}

export function cleanupInvoicePage() {
    if (autoSaveTimer) {
        clearInterval(autoSaveTimer);
        autoSaveTimer = null;
    }
    currentInvoiceId = null;
    itemRowCount = 0;
}

// ── Flatpickr ────────────────────────────────────────────────────
function initFlatpickr() {
    const today = new Date();
    flatpickr('#invoice-date', {
        dateFormat: 'Y-m-d', altInput: true, altFormat: 'd/m/Y',
        defaultDate: today,
        onChange: ([d]) => autoSetDueDate(d)
    });
    flatpickr('#due-date', {
        dateFormat: 'Y-m-d', altInput: true, altFormat: 'd/m/Y',
        defaultDate: new Date(today.getTime() + 30 * 86400000)
    });
}

function autoSetDueDate(invoiceDate) {
    if (!invoiceDate) return;
    const terms = parseInt(document.getElementById('payment-terms')?.value) || 30;
    const due = new Date(invoiceDate.getTime() + terms * 86400000);
    const dp = document.querySelector('#due-date')._flatpickr;
    if (dp) dp.setDate(due);
}

// ── Load Initial Data ────────────────────────────────────────────
async function loadInitialData() {
    const { data: profile } = await getBusinessProfile();
    if (profile) applyBusinessProfile(profile);

    // Invoice number
    const { data: num } = await getNextInvoiceNumber();
    if (num) document.getElementById('invoice-number').value = num;

    // Notes/Terms from profile settings
    if (profile?.default_invoice_notes) {
        const notesEl = document.getElementById('invoice-notes');
        if (notesEl && !notesEl.value) notesEl.value = profile.default_invoice_notes || 'Thank you for your business!';
    }
}

function applyBusinessProfile(profile) {
    const set = (id, val) => { const el = document.getElementById(id); if (el && val) el.value = val; };
    set('biz-name', profile.business_name);
    set('biz-email', profile.business_email);
    set('biz-phone', profile.business_phone);
    set('biz-gstin', profile.gstin);
    set('biz-pan', profile.pan);
    set('biz-website', profile.website);
    set('biz-address', [profile.business_address, profile.business_city, profile.business_state, profile.business_pincode].filter(Boolean).join(', '));
    if (profile.bank_name) {
        const bd = document.getElementById('bank-details');
        if (bd && !bd.value) bd.value = `Bank: ${profile.bank_name}\nAccount: ${profile.bank_account || ''}\nIFSC: ${profile.bank_ifsc || ''}`;
    }
    if (profile.currency_symbol) currencySymbol = profile.currency_symbol;
    if (profile.currency_code) currencyCode = profile.currency_code;
}

// ── Customer Search Autocomplete ─────────────────────────────────
function setupCustomerSearch() {
    const input = document.getElementById('customer-search');
    const dropdown = document.getElementById('customer-dropdown');
    if (!input) return;

    const doSearch = debounce(async (q) => {
        if (!q || q.length < 2) { dropdown.classList.remove('open'); return; }
        const { data } = await getCustomers(q, 1, 8);
        if (!data || !data.length) {
            dropdown.innerHTML = '<div class="autocomplete-item"><div class="autocomplete-item-meta">No customers found</div></div>';
            dropdown.classList.add('open');
            return;
        }
        dropdown.innerHTML = data.map(c => `
            <div class="autocomplete-item" onclick="selectCustomer(${JSON.stringify(JSON.stringify(c))})" role="option">
                <div class="autocomplete-item-name">${esc(c.name)}</div>
                <div class="autocomplete-item-meta">${esc(c.email || c.phone || '')}</div>
            </div>
        `).join('');
        dropdown.classList.add('open');
    }, 300);

    input.addEventListener('input', (e) => doSearch(e.target.value));
    document.addEventListener('click', (e) => { if (!input.contains(e.target)) dropdown.classList.remove('open'); });
}

window.selectCustomer = function(jsonStr) {
    const c = JSON.parse(jsonStr);
    document.getElementById('cust-name').value  = c.name  || '';
    document.getElementById('cust-email').value = c.email || '';
    document.getElementById('cust-phone').value = c.phone || '';
    document.getElementById('cust-gstin').value = c.gstin || '';
    document.getElementById('cust-address').value = [c.address, c.city, c.state, c.pincode].filter(Boolean).join(', ');
    document.getElementById('customer-search').value = c.name;
    document.getElementById('customer-dropdown').classList.remove('open');
    window._selectedCustomerId = c.id;
};

// ── Product Search per row ────────────────────────────────────────
async function setupProductSearch(input, row) {
    const dropdown = row.querySelector('.product-dropdown');
    if (!input || !dropdown) return;

    const doSearch = debounce(async (q) => {
        if (!q || q.length < 2) { dropdown.classList.remove('open'); return; }
        const { data } = await getProducts(q, 1, 8);
        if (!data || !data.length) {
            dropdown.innerHTML = '<div class="autocomplete-item"><div class="autocomplete-item-meta">No products found</div></div>';
            dropdown.classList.add('open');
            return;
        }
        dropdown.innerHTML = data.map(p => `
            <div class="autocomplete-item" onclick="selectProduct(this, '${row.dataset.rowId}')" data-product='${JSON.stringify(p).replace(/'/g,"&#39;")}' role="option">
                <div class="autocomplete-item-name">${esc(p.name)}</div>
                <div class="autocomplete-item-meta">₹${p.price} | GST ${p.tax_rate}% | HSN: ${p.hsn_code || '—'}</div>
            </div>
        `).join('');
        dropdown.classList.add('open');
    }, 300);

    input.addEventListener('input', (e) => doSearch(e.target.value));
    document.addEventListener('click', (e) => { if (!input.contains(e.target)) dropdown.classList.remove('open'); });
}

window.selectProduct = function(el, rowId) {
    const product = JSON.parse(el.dataset.product);
    const row = document.querySelector(`tr[data-row-id="${rowId}"]`);
    if (!row) return;
    row.querySelector('.item-name').value    = product.name || '';
    row.querySelector('.item-desc').value    = product.description || '';
    row.querySelector('.item-hsn').value     = product.hsn_code || '';
    row.querySelector('.item-unit').value    = product.unit || 'Nos';
    row.querySelector('.item-rate').value    = product.price || 0;
    row.querySelector('.item-gst').value     = product.tax_rate || 18;
    row.querySelector('.item-discount').value = product.discount || 0;
    row.querySelector('.item-qty').value     = 1;
    row.querySelector('.product-dropdown').classList.remove('open');
    calculateRow(row);
    calculateTotals();
};

// ── Item Row Management ──────────────────────────────────────────
window.addItemRow = function() {
    itemRowCount++;
    const rowId = `row-${itemRowCount}`;
    const tbody = document.getElementById('items-tbody');
    const tr = document.createElement('tr');
    tr.dataset.rowId = rowId;
    tr.innerHTML = `
        <td class="row-num">${itemRowCount}</td>
        <td style="position:relative;min-width:140px;">
            <input type="text" class="form-control item-name" placeholder="Product name" autocomplete="off" />
            <div class="autocomplete-dropdown product-dropdown" role="listbox"></div>
        </td>
        <td><input type="text" class="form-control item-desc" placeholder="Description" style="min-width:90px;" /></td>
        <td><input type="text" class="form-control item-hsn" placeholder="HSN" style="width:65px;" /></td>
        <td>
            <select class="form-select item-unit" style="width:65px;">
                <option>Nos</option><option>Hr</option><option>Kg</option><option>m</option>
                <option>L</option><option>Set</option><option>Box</option><option>Month</option><option>Year</option>
            </select>
        </td>
        <td><input type="number" class="form-control item-qty text-end" value="1" min="0.001" step="0.001" style="width:65px;" oninput="calculateRow(this.closest('tr'));calculateTotals()" /></td>
        <td><input type="number" class="form-control item-rate text-end" value="0" min="0" step="0.01" style="width:85px;" oninput="calculateRow(this.closest('tr'));calculateTotals()" /></td>
        <td><input type="number" class="form-control item-discount text-end" value="0" min="0" max="100" step="0.01" style="width:55px;" oninput="calculateRow(this.closest('tr'));calculateTotals()" /></td>
        <td>
            <select class="form-select item-gst" style="width:60px;" onchange="calculateRow(this.closest('tr'));calculateTotals()">
                <option value="0">0%</option><option value="5">5%</option><option value="12">12%</option>
                <option value="18" selected>18%</option><option value="28">28%</option>
            </select>
        </td>
        <td class="amount-cell" data-amount="0">₹0.00</td>
        <td><button type="button" class="del-row-btn" onclick="deleteItemRow(this)" aria-label="Delete row"><i class="fa-solid fa-trash-can"></i></button></td>
    `;
    tbody.appendChild(tr);
    setupProductSearch(tr.querySelector('.item-name'), tr);
    renumberRows();
    return tr;
};

window.deleteItemRow = function(btn) {
    const row = btn.closest('tr');
    const tbody = document.getElementById('items-tbody');
    if (tbody.querySelectorAll('tr').length <= 1) { Toast.warning('At least one item required.'); return; }
    row.remove();
    renumberRows();
    calculateTotals();
};

function renumberRows() {
    document.querySelectorAll('#items-tbody tr').forEach((tr, i) => {
        const num = tr.querySelector('.row-num');
        if (num) num.textContent = i + 1;
    });
}

// ── Calculation Engine ───────────────────────────────────────────
window.calculateRow = function(row) {
    const qty      = parseFloat(row.querySelector('.item-qty')?.value) || 0;
    const rate     = parseFloat(row.querySelector('.item-rate')?.value) || 0;
    const disc     = parseFloat(row.querySelector('.item-discount')?.value) || 0;
    const gst      = taxMode === 'per-item' ? (parseFloat(row.querySelector('.item-gst')?.value) || 0) : 0;

    const base     = qty * rate;
    const discAmt  = base * (disc / 100);
    const taxable  = base - discAmt;
    const taxAmt   = taxable * (gst / 100);
    const amount   = taxable + taxAmt;

    const cell = row.querySelector('.amount-cell');
    if (cell) {
        cell.textContent = formatCurrency(amount, currencySymbol, currencyCode);
        cell.dataset.amount = amount;
        cell.dataset.taxable = taxable;
        cell.dataset.taxAmt = taxAmt;
    }
};

window.calculateTotals = function() {
    const rows = document.querySelectorAll('#items-tbody tr');
    let subtotal = 0, taxableTotal = 0, taxTotal = 0;

    rows.forEach(row => {
        subtotal    += parseFloat(row.querySelector('.amount-cell')?.dataset.amount) || 0;
        taxableTotal += parseFloat(row.querySelector('.amount-cell')?.dataset.taxable) || 0;
        taxTotal    += parseFloat(row.querySelector('.amount-cell')?.dataset.taxAmt) || 0;
    });

    // Recalculate raw subtotal (qty*rate without tax)
    let rawSubtotal = 0;
    rows.forEach(row => {
        const qty  = parseFloat(row.querySelector('.item-qty')?.value) || 0;
        const rate = parseFloat(row.querySelector('.item-rate')?.value) || 0;
        const disc = parseFloat(row.querySelector('.item-discount')?.value) || 0;
        rawSubtotal += (qty * rate) * (1 - disc / 100);
    });

    // Global discount
    const discType = document.getElementById('discount-type')?.value || 'percent';
    const discVal  = parseFloat(document.getElementById('global-discount')?.value) || 0;
    const discAmt  = discType === 'percent' ? rawSubtotal * (discVal / 100) : Math.min(discVal, rawSubtotal);

    // Overall GST mode
    if (taxMode === 'overall') {
        const overallGst = parseFloat(document.getElementById('overall-gst')?.value) || 0;
        taxTotal = (rawSubtotal - discAmt) * (overallGst / 100);
    }

    const shipping = parseFloat(document.getElementById('shipping-charge')?.value) || 0;
    const grand = rawSubtotal - discAmt + taxTotal + shipping;

    // Update UI
    setText('summary-subtotal', formatCurrency(rawSubtotal, currencySymbol, currencyCode));
    setText('summary-discount', `-${formatCurrency(discAmt, currencySymbol, currencyCode)}`);
    setText('summary-taxable', formatCurrency(rawSubtotal - discAmt, currencySymbol, currencyCode));
    setText('summary-tax', formatCurrency(taxTotal, currencySymbol, currencyCode));
    setText('summary-shipping', formatCurrency(shipping, currencySymbol, currencyCode));
    setText('summary-grand', formatCurrency(grand, currencySymbol, currencyCode));
    setText('amount-in-words', numberToWords(grand));
    setText('rp-subtotal', formatCurrency(rawSubtotal, currencySymbol, currencyCode));
    setText('rp-tax', formatCurrency(taxTotal, currencySymbol, currencyCode));
    setText('rp-grand', formatCurrency(grand, currencySymbol, currencyCode));

    // Mark unsaved
    setAutoSaveStatus(false);
    // Debounced live preview update
    debouncedPreview();
};

// ── Template & Color ─────────────────────────────────────────────
window.setTemplate = function(name) {
    currentTemplate = name;
    document.querySelectorAll('.template-card').forEach(c => c.classList.toggle('active', c.dataset.tpl === name));
    renderInvoicePreview();
};

window.setThemeColor = function(color, el) {
    currentColor = color;
    document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
    if (el) el.classList.add('active');
    renderInvoicePreview();
};

window.setDocType = function(type) {
    currentDocType = type;
    document.querySelectorAll('.doc-type-btn').forEach(b => b.classList.toggle('active', b.dataset.type === type));
};

window.setTaxMode = function(mode) {
    taxMode = mode;
    document.getElementById('tax-mode-per-item')?.classList.toggle('active', mode === 'per-item');
    document.getElementById('tax-mode-overall')?.classList.toggle('active', mode === 'overall');
    document.getElementById('overall-gst-row').style.display = mode === 'overall' ? 'block' : 'none';
    document.querySelectorAll('.item-gst').forEach(s => s.closest('td').style.opacity = mode === 'per-item' ? '1' : '.4');
    calculateTotals();
};

window.setPaymentTerms = function(days) {
    if (days === '') return;
    const invDate = document.getElementById('invoice-date')?.value;
    if (!invDate) return;
    const due = new Date(new Date(invDate).getTime() + parseInt(days) * 86400000);
    const dp = document.querySelector('#due-date')._flatpickr;
    if (dp) dp.setDate(due);
};

window.toggleSection = function(id) {
    document.getElementById(id)?.classList.toggle('collapsed');
};

// ── Invoice Rendering (all 5 templates) ──────────────────────────
function collectFormData() {
    const rows = [];
    document.querySelectorAll('#items-tbody tr').forEach(row => {
        rows.push({
            name:        row.querySelector('.item-name')?.value || '',
            description: row.querySelector('.item-desc')?.value || '',
            hsn_code:    row.querySelector('.item-hsn')?.value || '',
            unit:        row.querySelector('.item-unit')?.value || 'Nos',
            quantity:    parseFloat(row.querySelector('.item-qty')?.value) || 0,
            rate:        parseFloat(row.querySelector('.item-rate')?.value) || 0,
            discount:    parseFloat(row.querySelector('.item-discount')?.value) || 0,
            tax_rate:    parseFloat(row.querySelector('.item-gst')?.value) || 0,
            amount:      parseFloat(row.querySelector('.amount-cell')?.dataset.amount) || 0,
        });
    });

    return {
        invoice_type:   currentDocType,
        template:       currentTemplate,
        theme_color:    currentColor,
        invoice_number: document.getElementById('invoice-number')?.value || '',
        po_number:      document.getElementById('po-number')?.value || '',
        invoice_date:   document.getElementById('invoice-date')?.value || new Date().toISOString().split('T')[0],
        due_date:       document.getElementById('due-date')?.value || '',
        currency_symbol: currencySymbol,
        currency_code:  currencyCode,
        business_name:  document.getElementById('biz-name')?.value || '',
        business_email: document.getElementById('biz-email')?.value || '',
        business_phone: document.getElementById('biz-phone')?.value || '',
        business_gstin: document.getElementById('biz-gstin')?.value || '',
        business_pan:   document.getElementById('biz-pan')?.value || '',
        business_address: document.getElementById('biz-address')?.value || '',
        customer_name:  document.getElementById('cust-name')?.value || '',
        customer_email: document.getElementById('cust-email')?.value || '',
        customer_phone: document.getElementById('cust-phone')?.value || '',
        customer_gstin: document.getElementById('cust-gstin')?.value || '',
        customer_address: document.getElementById('cust-address')?.value || '',
        customer_id:    window._selectedCustomerId || null,
        notes:          document.getElementById('invoice-notes')?.value || '',
        terms:          document.getElementById('invoice-terms')?.value || '',
        bank_details:   document.getElementById('bank-details')?.value || '',
        discount_type:  document.getElementById('discount-type')?.value || 'percent',
        discount_value: parseFloat(document.getElementById('global-discount')?.value) || 0,
        shipping_charge: parseFloat(document.getElementById('shipping-charge')?.value) || 0,
        subtotal:       parseFloat(document.getElementById('summary-subtotal')?.textContent?.replace(/[^0-9.]/g,'')) || 0,
        tax_amount:     parseFloat(document.getElementById('summary-tax')?.textContent?.replace(/[^0-9.]/g,'')) || 0,
        grand_total:    parseFloat(document.getElementById('rp-grand')?.textContent?.replace(/[^0-9.]/g,'')) || 0,
        items: rows
    };
}

function renderInvoiceTemplate(data) {
    const tpl = data.template || 'modern';
    const color = data.theme_color || '#3B82F6';
    const sym = data.currency_symbol || '₹';
    const fmtCurr = (v) => `${sym}${Number(v || 0).toLocaleString('en-IN', {minimumFractionDigits:2, maximumFractionDigits:2})}`;
    const fmtDate = (d) => { if (!d) return '—'; const dt = new Date(d); return isNaN(dt) ? d : dt.toLocaleDateString('en-IN'); };
    const docLabel = { invoice:'INVOICE', quotation:'QUOTATION', receipt:'RECEIPT', proforma:'PROFORMA INVOICE', credit_note:'CREDIT NOTE' }[data.invoice_type] || 'INVOICE';

    const itemsHtml = (data.items || []).filter(i => i.name).map((item, idx) => {
        const base = item.quantity * item.rate;
        const discAmt = base * (item.discount / 100);
        const taxable = base - discAmt;
        return `<tr>
            <td style="padding:.5rem .625rem;">${idx + 1}</td>
            <td style="padding:.5rem .625rem;"><strong>${esc(item.name)}</strong>${item.description ? `<br><small style="color:#6B7280;">${esc(item.description)}</small>` : ''}</td>
            <td style="padding:.5rem .625rem;">${esc(item.hsn_code || '')}</td>
            <td style="padding:.5rem .625rem;text-align:center;">${item.quantity} ${esc(item.unit)}</td>
            <td style="padding:.5rem .625rem;text-align:right;">${fmtCurr(item.rate)}</td>
            ${item.discount > 0 ? `<td style="padding:.5rem .625rem;text-align:right;">${item.discount}%</td>` : ''}
            <td style="padding:.5rem .625rem;text-align:right;">${item.tax_rate}%</td>
            <td style="padding:.5rem .625rem;text-align:right;font-weight:700;">${fmtCurr(item.amount)}</td>
        </tr>`;
    }).join('');

    const tableHead = `<tr>
        <th style="padding:.5rem .625rem;">#</th>
        <th style="padding:.5rem .625rem;">Item</th>
        <th style="padding:.5rem .625rem;">HSN</th>
        <th style="padding:.5rem .625rem;text-align:center;">Qty/Unit</th>
        <th style="padding:.5rem .625rem;text-align:right;">Rate</th>
        ${data.items?.some(i => i.discount > 0) ? '<th style="padding:.5rem .625rem;text-align:right;">Disc.</th>' : ''}
        <th style="padding:.5rem .625rem;text-align:right;">GST</th>
        <th style="padding:.5rem .625rem;text-align:right;">Amount</th>
    </tr>`;

    const summaryHtml = `
        <div style="margin-top:.375rem;display:flex;justify-content:space-between;font-size:.8rem;"><span>Subtotal</span><span>${fmtCurr(data.subtotal)}</span></div>
        ${data.discount_value > 0 ? `<div style="margin-top:.25rem;display:flex;justify-content:space-between;font-size:.8rem;"><span>Discount</span><span style="color:red;">-</span></div>` : ''}
        <div style="margin-top:.25rem;display:flex;justify-content:space-between;font-size:.8rem;"><span>GST</span><span>${fmtCurr(data.tax_amount)}</span></div>
        ${data.shipping_charge > 0 ? `<div style="margin-top:.25rem;display:flex;justify-content:space-between;font-size:.8rem;"><span>Shipping</span><span>${fmtCurr(data.shipping_charge)}</span></div>` : ''}
    `;

    const bizInfo = `<div style="font-size:.75rem;line-height:1.6;color:#374151;">
        ${data.business_name ? `<strong style="font-size:.875rem;">${esc(data.business_name)}</strong><br>` : ''}
        ${data.business_address ? `${esc(data.business_address)}<br>` : ''}
        ${data.business_phone ? `Tel: ${esc(data.business_phone)}<br>` : ''}
        ${data.business_email ? `Email: ${esc(data.business_email)}<br>` : ''}
        ${data.business_gstin ? `GSTIN: ${esc(data.business_gstin)}<br>` : ''}
        ${data.business_pan ? `PAN: ${esc(data.business_pan)}` : ''}
    </div>`;

    const custInfo = `<div style="font-size:.75rem;line-height:1.6;color:#374151;">
        ${data.customer_name ? `<strong style="font-size:.875rem;">${esc(data.customer_name)}</strong><br>` : ''}
        ${data.customer_address ? `${esc(data.customer_address)}<br>` : ''}
        ${data.customer_phone ? `Tel: ${esc(data.customer_phone)}<br>` : ''}
        ${data.customer_email ? `Email: ${esc(data.customer_email)}<br>` : ''}
        ${data.customer_gstin ? `GSTIN: ${esc(data.customer_gstin)}` : ''}
    </div>`;

    const metaInfo = `<div style="display:flex;gap:2rem;flex-wrap:wrap;font-size:.75rem;">
        <div><div style="text-transform:uppercase;font-size:.6rem;font-weight:700;color:#9CA3AF;margin-bottom:.2rem;">Invoice No.</div><strong>${esc(data.invoice_number)}</strong></div>
        <div><div style="text-transform:uppercase;font-size:.6rem;font-weight:700;color:#9CA3AF;margin-bottom:.2rem;">Date</div><strong>${fmtDate(data.invoice_date)}</strong></div>
        ${data.due_date ? `<div><div style="text-transform:uppercase;font-size:.6rem;font-weight:700;color:#9CA3AF;margin-bottom:.2rem;">Due Date</div><strong>${fmtDate(data.due_date)}</strong></div>` : ''}
        ${data.po_number ? `<div><div style="text-transform:uppercase;font-size:.6rem;font-weight:700;color:#9CA3AF;margin-bottom:.2rem;">PO/Ref</div><strong>${esc(data.po_number)}</strong></div>` : ''}
    </div>`;

    const footerHtml = `
        ${data.notes ? `<div style="font-size:.75rem;"><strong>Notes:</strong> ${esc(data.notes)}</div>` : ''}
        ${data.terms ? `<div style="font-size:.75rem;margin-top:.5rem;"><strong>Terms:</strong> ${esc(data.terms)}</div>` : ''}
        ${data.bank_details ? `<div style="font-size:.75rem;margin-top:.5rem;white-space:pre-line;"><strong>Bank Details:</strong><br>${esc(data.bank_details)}</div>` : ''}
    `;

    const templates = {
        modern: `<div class="tpl-modern">
            <div class="inv-header" style="background:linear-gradient(135deg,${color},${color}dd);">
                <div class="inv-logo-area">${esc(data.business_name || 'Your Company')}</div>
                <div class="inv-number-area"><h2>${docLabel}</h2><p>#${esc(data.invoice_number)}</p><p style="color:rgba(255,255,255,.7);">${fmtDate(data.invoice_date)}</p></div>
            </div>
            <div class="inv-body">
                <div class="inv-parties"><div><div class="inv-party-label">From</div>${bizInfo}</div><div><div class="inv-party-label">Bill To</div>${custInfo}</div></div>
                <div class="inv-meta-row" style="margin-bottom:1.5rem;">${metaInfo}</div>
                <table class="inv-items-table"><thead style="background:#F8FAFC;">${tableHead}</thead><tbody>${itemsHtml}</tbody></table>
                <div class="inv-summary"><div class="inv-summary-box">${summaryHtml}<div class="inv-summary-total" style="background:${color};">Grand Total <span>${fmtCurr(data.grand_total)}</span></div></div></div>
                <div style="margin-top:1.5rem;font-size:.72rem;color:#9CA3AF;font-style:italic;">${numberToWords(data.grand_total)}</div>
                <div class="inv-footer" style="margin-top:2rem;border-top:1px solid #E5E7EB;padding-top:1rem;">${footerHtml}</div>
            </div>
        </div>`,

        professional: `<div class="tpl-professional">
            <div style="border-bottom:4px solid ${color};padding:1.5rem 2rem;display:flex;justify-content:space-between;align-items:center;">
                <div><div style="font-size:2rem;font-weight:800;color:${color};">${docLabel}</div><div style="font-size:.8rem;color:#6B7280;">Invoice #${esc(data.invoice_number)}</div></div>
                <div style="text-align:right;">${bizInfo}</div>
            </div>
            <div style="padding:1.5rem 2rem;display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;">
                <div><div style="font-size:.65rem;font-weight:700;text-transform:uppercase;color:#9CA3AF;margin-bottom:.375rem;">Bill To</div>${custInfo}</div>
                <div style="text-align:right;">${metaInfo}</div>
                <div style="grid-column:1/-1;">
                    <table class="inv-items-table" style="width:100%;border-collapse:collapse;font-size:.8rem;">
                        <thead><tr style="background:${color};color:#fff;">${tableHead}</tr></thead>
                        <tbody>${itemsHtml}</tbody>
                    </table>
                    <div style="display:flex;justify-content:flex-end;margin-top:1rem;">
                        <div style="width:240px;">${summaryHtml}<div style="margin-top:.5rem;background:${color};color:#fff;padding:.625rem .875rem;border-radius:6px;display:flex;justify-content:space-between;font-weight:800;">Grand Total <span>${fmtCurr(data.grand_total)}</span></div></div>
                    </div>
                </div>
                <div style="grid-column:1/-1;border-top:1px solid #E5E7EB;padding-top:1rem;font-size:.72rem;">${footerHtml}</div>
            </div>
        </div>`,

        minimal: `<div class="tpl-minimal">
            <div style="padding:2.5rem 2rem 1rem;display:flex;justify-content:space-between;align-items:flex-start;">
                <div style="font-size:2.5rem;font-weight:800;letter-spacing:-.04em;color:#111;">${docLabel}</div>
                <div style="text-align:right;">${bizInfo}</div>
            </div>
            <div style="padding:0 2rem 2rem;">
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:2rem;margin-bottom:1.5rem;">
                    <div><div style="font-size:.65rem;font-weight:700;text-transform:uppercase;color:#9CA3AF;margin-bottom:.375rem;">Bill To</div>${custInfo}</div>
                    <div style="text-align:right;">${metaInfo}</div>
                </div>
                <table style="width:100%;border-collapse:collapse;font-size:.8rem;margin-top:1rem;">
                    <thead><tr style="border-bottom:2px solid #111;">${tableHead}</tr></thead>
                    <tbody>${itemsHtml}</tbody>
                </table>
                <div style="display:flex;justify-content:flex-end;margin-top:1.5rem;">
                    <div style="width:220px;border-top:2px solid #111;padding-top:.75rem;">${summaryHtml}<div style="display:flex;justify-content:space-between;font-weight:800;font-size:1rem;margin-top:.5rem;padding-top:.5rem;border-top:1px solid #111;">Grand Total <span>${fmtCurr(data.grand_total)}</span></div></div>
                </div>
                <div style="margin-top:2rem;font-size:.72rem;color:#9CA3AF;">${footerHtml}</div>
            </div>
        </div>`,

        classic: `<div class="tpl-classic">
            <div style="text-align:center;padding:2rem;border-bottom:3px double #111;">
                <div style="font-size:1.875rem;font-weight:800;">${esc(data.business_name || 'Company Name')}</div>
                <div style="font-size:.8rem;color:#374151;margin-top:.375rem;">${esc(data.business_address || '')}</div>
                <div style="font-size:2rem;font-weight:800;margin-top:1rem;letter-spacing:.1em;color:${color};">${docLabel}</div>
            </div>
            <div style="padding:1.5rem 2rem;">
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:2rem;margin-bottom:1.5rem;">
                    <div><div style="font-weight:700;font-size:.75rem;text-transform:uppercase;border-bottom:1px solid #111;padding-bottom:.25rem;margin-bottom:.5rem;">Bill To</div>${custInfo}</div>
                    <div style="text-align:right;">${metaInfo}</div>
                </div>
                <table style="width:100%;border-collapse:collapse;font-size:.8rem;">
                    <thead><tr style="background:#F9FAFB;">${tableHead}</tr></thead>
                    <tbody>${itemsHtml}</tbody>
                </table>
                <div style="display:flex;justify-content:flex-end;margin-top:1.5rem;">
                    <div style="width:240px;border:1px solid #D1D5DB;padding:.875rem;">${summaryHtml}<div style="display:flex;justify-content:space-between;font-weight:800;border-top:2px solid #111;padding-top:.5rem;margin-top:.5rem;">GRAND TOTAL <span style="color:${color};">${fmtCurr(data.grand_total)}</span></div></div>
                </div>
                <div style="margin-top:1.5rem;font-size:.72rem;color:#6B7280;">${footerHtml}</div>
            </div>
        </div>`,

        bold: `<div class="tpl-bold">
            <div style="background:#111827;color:#fff;padding:2rem;display:grid;grid-template-columns:1fr 1fr;gap:2rem;">
                <div><div style="font-size:1rem;font-weight:700;color:${color};text-transform:uppercase;letter-spacing:.1em;">${esc(data.business_name || '')}</div><div style="font-size:1.5rem;font-weight:800;margin-top:.5rem;">${docLabel}</div><div style="font-size:.8rem;color:rgba(255,255,255,.6);margin-top:.25rem;">#${esc(data.invoice_number)}</div></div>
                <div style="text-align:right;font-size:.75rem;color:rgba(255,255,255,.8);">${bizInfo.replace(/color:#374151/g,'color:rgba(255,255,255,.7)')}</div>
            </div>
            <div style="padding:2rem;">
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:2rem;margin-bottom:2rem;">
                    <div><div style="font-size:.65rem;font-weight:700;text-transform:uppercase;color:#9CA3AF;margin-bottom:.375rem;">Bill To</div>${custInfo}</div>
                    <div>${metaInfo}</div>
                </div>
                <table style="width:100%;border-collapse:collapse;font-size:.8rem;">
                    <thead><tr style="background:#1F2937;color:#fff;">${tableHead}</tr></thead>
                    <tbody>${itemsHtml}</tbody>
                </table>
                <div style="display:flex;justify-content:flex-end;margin-top:1.5rem;">
                    <div style="width:260px;">${summaryHtml}<div style="background:${color};color:#fff;padding:.875rem 1rem;border-radius:6px;display:flex;justify-content:space-between;font-weight:800;font-size:1rem;margin-top:.5rem;">Grand Total <span>${fmtCurr(data.grand_total)}</span></div></div>
                </div>
                <div style="margin-top:2rem;padding-top:1rem;border-top:1px solid #E5E7EB;font-size:.72rem;color:#6B7280;">${footerHtml}</div>
            </div>
        </div>`
    };

    return templates[tpl] || templates.modern;
}

// ── Preview ───────────────────────────────────────────────────────
function renderInvoicePreview() {
    const data = collectFormData();
    const html = renderInvoiceTemplate(data);
    const renderArea = document.getElementById('invoice-render-area');
    if (renderArea) renderArea.innerHTML = html;
    // Mini preview (scaled)
    const mini = document.getElementById('mini-preview');
    if (mini) mini.innerHTML = html;
}

const debouncedPreview = debounce(renderInvoicePreview, 600);

// ── Save Invoice ──────────────────────────────────────────────────
window.saveInvoice = async function(isDraft = false) {
    const data = collectFormData();
    if (!data.customer_name) { Toast.warning('Customer name is required.'); return; }
    if (!data.invoice_number) { Toast.warning('Invoice number is required.'); return; }
    if (!data.items.filter(i => i.name).length) { Toast.warning('Add at least one item.'); return; }

    const btn = document.getElementById(isDraft ? 'save-draft-btn' : 'save-invoice-btn');
    if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span>'; }

    const { items, bank_details, ...invData } = data;
    const payload = { ...invData, is_draft: isDraft, status: isDraft ? 'draft' : 'sent', notes: (data.notes || '') + (bank_details ? '\n\n' + bank_details : '') };

    const cleanItems = items.filter(i => i.name).map(item => ({
        name: item.name, description: item.description, hsn_code: item.hsn_code,
        unit: item.unit, quantity: item.quantity, rate: item.rate,
        discount: item.discount, tax_rate: item.tax_rate, tax_amount: item.amount - (item.quantity * item.rate * (1 - item.discount/100)),
        amount: item.amount, user_id: '' // filled by supabase module
    }));

    let result;
    if (currentInvoiceId) {
        result = await updateInvoice(currentInvoiceId, payload, cleanItems);
    } else {
        result = await createInvoice(payload, cleanItems);
    }

    if (btn) { btn.disabled = false; btn.innerHTML = isDraft ? '<i class="fa-solid fa-floppy-disk"></i> Save Draft' : '<i class="fa-solid fa-check"></i> Save Invoice'; }

    if (result.error) { Toast.error('Save failed: ' + (result.error.message || 'Unknown error')); return; }

    if (!currentInvoiceId && result.data?.id) currentInvoiceId = result.data.id;
    clearDraft('invoice');
    setAutoSaveStatus(true);
    Toast.success(isDraft ? 'Draft saved!' : 'Invoice saved successfully!');
    await logActivity('invoice', result.data?.id, isDraft ? 'draft_saved' : 'invoice_saved', `Invoice ${data.invoice_number} saved`);

    const badge = document.getElementById('save-status-badge');
    if (badge) { badge.className = `kosha-badge ${isDraft ? 'badge-draft' : 'badge-sent'}`; badge.innerHTML = isDraft ? '<i class="fa-solid fa-pencil"></i> Draft' : '<i class="fa-solid fa-paper-plane"></i> Saved'; }
};

// ── Load for Edit ─────────────────────────────────────────────────
async function loadInvoiceForEdit(id) {
    const { data, error } = await getInvoiceById(id);
    if (error || !data) { Toast.error('Failed to load invoice.'); return; }

    document.getElementById('page-title-display').textContent = `Edit Invoice`;
    document.getElementById('invoice-number').value = data.invoice_number || '';
    document.getElementById('cust-name').value = data.customer_name || '';
    document.getElementById('cust-email').value = data.customer_email || '';
    document.getElementById('cust-phone').value = data.customer_phone || '';
    document.getElementById('cust-gstin').value = data.customer_gstin || '';
    document.getElementById('cust-address').value = data.customer_address || '';
    document.getElementById('invoice-notes').value = data.notes || '';
    document.getElementById('invoice-terms').value = data.terms || '';

    if (data.invoice_date) { const dp = document.querySelector('#invoice-date')._flatpickr; if (dp) dp.setDate(data.invoice_date); }
    if (data.due_date) { const dp = document.querySelector('#due-date')._flatpickr; if (dp) dp.setDate(data.due_date); }

    setTemplate(data.template || 'modern');
    setThemeColor(data.theme_color || '#3B82F6', null);

    // Render items
    const tbody = document.getElementById('items-tbody');
    tbody.innerHTML = '';
    itemRowCount = 0;
    (data.items || []).forEach(item => {
        const row = addItemRow();
        row.querySelector('.item-name').value     = item.name || '';
        row.querySelector('.item-desc').value     = item.description || '';
        row.querySelector('.item-hsn').value      = item.hsn_code || '';
        row.querySelector('.item-unit').value     = item.unit || 'Nos';
        row.querySelector('.item-qty').value      = item.quantity || 1;
        row.querySelector('.item-rate').value     = item.rate || 0;
        row.querySelector('.item-discount').value = item.discount || 0;
        row.querySelector('.item-gst').value      = item.tax_rate || 18;
        calculateRow(row);
    });
    calculateTotals();
}

// ── PDF / Print ───────────────────────────────────────────────────
window.downloadPDF = function() {
    renderInvoicePreview();
    const data = collectFormData();
    const el = document.getElementById('invoice-render-area');
    if (!el || !window.html2pdf) { Toast.error('PDF library not loaded.'); return; }
    const opt = {
        margin: 0, filename: `${data.invoice_number || 'invoice'}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    Toast.info('Generating PDF…', 2000);
    html2pdf().from(el).set(opt).save();
};

window.printInvoice = function() {
    renderInvoicePreview();
    window.print();
};

// ── Auto-save ─────────────────────────────────────────────────────
function setupAutoSave() {
    autoSaveTimer = setInterval(() => {
        const data = collectFormData();
        lsSet('kosha_invoice_draft', data);
        setAutoSaveStatus(true, new Date());
    }, 60000);
}

function setAutoSaveStatus(saved, ts = null) {
    const ind = document.getElementById('autosave-indicator');
    const txt = document.getElementById('autosave-text');
    const lst = document.getElementById('last-saved-text');
    if (!ind || !txt) return;
    if (saved) {
        ind.style.color = 'var(--accent)';
        txt.textContent = 'All changes saved';
        if (ts && lst) lst.textContent = 'Last saved: ' + ts.toLocaleTimeString();
    } else {
        ind.style.color = 'var(--warning)';
        txt.textContent = 'Unsaved changes';
    }
}

// ── Signature Upload ──────────────────────────────────────────────
function initSignatureUpload() {
    const fileInput = document.getElementById('sig-file');
    const preview = document.getElementById('sig-preview');
    fileInput?.addEventListener('change', () => {
        const file = fileInput.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => { preview.src = e.target.result; preview.style.display = 'block'; };
        reader.readAsDataURL(file);
    });
}

// ── Misc globals ─────────────────────────────────────────────────
window.loadBusinessProfile = async function() {
    const { data } = await getBusinessProfile();
    if (data) { applyBusinessProfile(data); Toast.success('Business profile loaded.'); }
};

window.regenerateInvoiceNumber = async function() {
    const { data } = await getNextInvoiceNumber();
    if (data) { document.getElementById('invoice-number').value = data; Toast.info('New invoice number generated.'); }
};

window.clearInvoiceForm = function() {
    if (!confirm('Clear all form data?')) return;
    document.querySelectorAll('#invoice-form-col input, #invoice-form-col textarea, #invoice-form-col select').forEach(el => { if (el.type !== 'submit') el.value = ''; });
    document.getElementById('items-tbody').innerHTML = '';
    itemRowCount = 0;
    addItemRow();
    calculateTotals();
    clearDraft('invoice');
    Toast.info('Form cleared.');
};

// ── Helpers ───────────────────────────────────────────────────────
function setText(id, val) { const el = document.getElementById(id); if (el) el.textContent = val; }
function esc(s) { return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
