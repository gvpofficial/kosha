/**
 * Kosha - Invoice View Template
 */

export function getInvoiceHTML() {
    return `
    <div class="page-content" style="padding-bottom:5rem;">

        <!-- Breadcrumb -->
        <nav class="kosha-breadcrumb" aria-label="Breadcrumb">
            <a href="#/dashboard" class="kosha-breadcrumb-item">Home</a>
            <span class="kosha-breadcrumb-sep">/</span>
            <a href="#/invoices" class="kosha-breadcrumb-item">Invoices</a>
            <span class="kosha-breadcrumb-sep">/</span>
            <span class="kosha-breadcrumb-item active" id="breadcrumb-label">New Invoice</span>
        </nav>

        <!-- Page Header -->
        <div class="page-header">
            <div>
                <h1 class="page-title" id="page-title-display">New Invoice</h1>
                <p class="page-subtitle">Fill in the details to create a professional invoice.</p>
            </div>
            <div class="d-flex gap-2">
                <span class="kosha-badge badge-draft" id="save-status-badge"><i class="fa-solid fa-pencil"></i> Draft</span>
            </div>
        </div>

        <!-- ══ Two-column editor layout ══ -->
        <div class="invoice-editor-layout">

            <!-- ──── LEFT: Form ──────────────────────────────── -->
            <div class="invoice-form-col" id="invoice-form-col">

                <!-- SECTION 1: Document Settings -->
                <div class="invoice-section" id="sec-settings">
                    <div class="invoice-section-header" onclick="toggleSection('sec-settings')">
                        <div class="invoice-section-title"><i class="fa-solid fa-sliders"></i> Document Settings</div>
                        <i class="fa-solid fa-chevron-down section-toggle-icon"></i>
                    </div>
                    <div class="invoice-section-body">
                        <div class="row g-3 mb-3">
                            <div class="col-12">
                                <label class="form-label">Document Type</label>
                                <div class="doc-type-group" id="doc-type-group" role="group" aria-label="Document type">
                                    <button class="doc-type-btn active" data-type="invoice">Invoice</button>
                                    <button class="doc-type-btn" data-type="quotation">Quotation</button>
                                    <button class="doc-type-btn" data-type="receipt">Receipt</button>
                                    <button class="doc-type-btn" data-type="proforma">Proforma</button>
                                    <button class="doc-type-btn" data-type="credit_note">Credit Note</button>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label" for="invoice-currency">Currency</label>
                                <select class="form-select" id="invoice-currency" name="currency">
                                    <option value="INR|₹">₹ INR — Indian Rupee</option>
                                    <option value="USD|$">$ USD — US Dollar</option>
                                    <option value="EUR|€">€ EUR — Euro</option>
                                    <option value="GBP|£">£ GBP — British Pound</option>
                                    <option value="AED|AED">AED — UAE Dirham</option>
                                    <option value="SGD|S$">S$ SGD — Singapore Dollar</option>
                                    <option value="AUD|A$">A$ AUD — Australian Dollar</option>
                                    <option value="JPY|¥">¥ JPY — Japanese Yen</option>
                                </select>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label">Template</label>
                                <div class="template-grid" id="template-grid" role="group" aria-label="Invoice template">
                                    <div class="template-card active" data-tpl="modern" onclick="setTemplate('modern')">
                                        <div class="template-preview"><div class="template-preview-header" style="background:linear-gradient(135deg,#3B82F6,#06B6D4);"></div><div class="template-preview-lines"><div class="template-preview-line"></div><div class="template-preview-line short"></div><div class="template-preview-line"></div><div class="template-preview-line short"></div></div></div>
                                        <div class="template-name">Modern</div>
                                    </div>
                                    <div class="template-card" data-tpl="professional" onclick="setTemplate('professional')">
                                        <div class="template-preview"><div class="template-preview-header" style="background:#fff;border-bottom:4px solid #3B82F6;"></div><div class="template-preview-lines"><div class="template-preview-line"></div><div class="template-preview-line"></div><div class="template-preview-line short"></div></div></div>
                                        <div class="template-name">Pro</div>
                                    </div>
                                    <div class="template-card" data-tpl="minimal" onclick="setTemplate('minimal')">
                                        <div class="template-preview"><div class="template-preview-header" style="background:#fff;padding:4px;"><div style="font-size:6px;font-weight:800;color:#111;">INVOICE</div></div><div class="template-preview-lines"><div class="template-preview-line"></div><div class="template-preview-line short"></div><div class="template-preview-line"></div></div></div>
                                        <div class="template-name">Minimal</div>
                                    </div>
                                    <div class="template-card" data-tpl="classic" onclick="setTemplate('classic')">
                                        <div class="template-preview"><div class="template-preview-header" style="background:#fff;border-bottom:3px double #111;display:flex;align-items:center;justify-content:center;"><div style="font-size:6px;font-weight:800;">INVOICE</div></div><div class="template-preview-lines"><div class="template-preview-line"></div><div class="template-preview-line"></div></div></div>
                                        <div class="template-name">Classic</div>
                                    </div>
                                    <div class="template-card" data-tpl="bold" onclick="setTemplate('bold')">
                                        <div class="template-preview"><div class="template-preview-header" style="background:#111827;"></div><div class="template-preview-lines"><div class="template-preview-line"></div><div class="template-preview-line short"></div><div class="template-preview-line"></div></div></div>
                                        <div class="template-name">Bold</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- SECTION 2: Business Details -->
                <div class="invoice-section collapsed" id="sec-business">
                    <div class="invoice-section-header" onclick="toggleSection('sec-business')">
                        <div class="invoice-section-title"><i class="fa-solid fa-building"></i> Business Details</div>
                        <div class="d-flex align-items-center gap-2">
                            <button type="button" class="btn btn-outline-secondary btn-sm" onclick="event.stopPropagation();loadBusinessProfile()" title="Load from saved profile">
                                <i class="fa-solid fa-rotate-right"></i> Load Profile
                            </button>
                            <i class="fa-solid fa-chevron-down section-toggle-icon"></i>
                        </div>
                    </div>
                    <div class="invoice-section-body">
                        <div class="row g-2">
                            <div class="col-md-6"><label class="form-label">Business Name<span class="required">*</span></label><input type="text" id="biz-name" name="business_name" class="form-control" placeholder="Your Business Name" /></div>
                            <div class="col-md-6"><label class="form-label">Email</label><input type="email" id="biz-email" name="business_email" class="form-control" placeholder="business@email.com" /></div>
                            <div class="col-md-6"><label class="form-label">Phone</label><input type="tel" id="biz-phone" name="business_phone" class="form-control" placeholder="+91 98765 43210" /></div>
                            <div class="col-md-6"><label class="form-label">GSTIN</label><input type="text" id="biz-gstin" name="business_gstin" class="form-control" placeholder="29ABCDE1234F1Z5" maxlength="15" /></div>
                            <div class="col-md-6"><label class="form-label">PAN</label><input type="text" id="biz-pan" name="business_pan" class="form-control" placeholder="ABCDE1234F" maxlength="10" /></div>
                            <div class="col-md-6"><label class="form-label">Website</label><input type="url" id="biz-website" name="business_website" class="form-control" placeholder="https://yourwebsite.com" /></div>
                            <div class="col-12"><label class="form-label">Address</label><textarea id="biz-address" name="business_address" class="form-control" rows="2" placeholder="Street, City, State, PIN"></textarea></div>
                        </div>
                    </div>
                </div>

                <!-- SECTION 3: Customer Details -->
                <div class="invoice-section" id="sec-customer">
                    <div class="invoice-section-header" onclick="toggleSection('sec-customer')">
                        <div class="invoice-section-title"><i class="fa-solid fa-user-tie"></i> Customer Details</div>
                        <i class="fa-solid fa-chevron-down section-toggle-icon"></i>
                    </div>
                    <div class="invoice-section-body">
                        <div class="row g-2">
                            <div class="col-12">
                                <label class="form-label">Search Customer</label>
                                <div class="autocomplete-wrapper">
                                    <input type="text" id="customer-search" class="form-control" placeholder="Search by name, email, phone…" autocomplete="off" />
                                    <div class="autocomplete-dropdown" id="customer-dropdown" role="listbox" aria-label="Customer suggestions"></div>
                                </div>
                            </div>
                            <div class="col-md-6"><label class="form-label">Name<span class="required">*</span></label><input type="text" id="cust-name" name="customer_name" class="form-control" placeholder="Customer Name" /></div>
                            <div class="col-md-6"><label class="form-label">Email</label><input type="email" id="cust-email" name="customer_email" class="form-control" placeholder="customer@email.com" /></div>
                            <div class="col-md-6"><label class="form-label">Phone</label><input type="tel" id="cust-phone" name="customer_phone" class="form-control" placeholder="+91 98765 43210" /></div>
                            <div class="col-md-6"><label class="form-label">GSTIN</label><input type="text" id="cust-gstin" name="customer_gstin" class="form-control" placeholder="Customer GSTIN" maxlength="15" /></div>
                            <div class="col-12"><label class="form-label">Address</label><textarea id="cust-address" name="customer_address" class="form-control" rows="2" placeholder="Customer address"></textarea></div>
                            <div class="col-12">
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" id="save-to-customers" />
                                    <label class="form-check-label" for="save-to-customers" style="font-size:.8125rem;">
                                        Save this customer to my Customers list
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- SECTION 4: Invoice Meta -->
                <div class="invoice-section" id="sec-meta">
                    <div class="invoice-section-header" onclick="toggleSection('sec-meta')">
                        <div class="invoice-section-title"><i class="fa-solid fa-circle-info"></i> Invoice Details</div>
                        <i class="fa-solid fa-chevron-down section-toggle-icon"></i>
                    </div>
                    <div class="invoice-section-body">
                        <div class="row g-2">
                            <div class="col-md-6">
                                <label class="form-label">Invoice Number<span class="required">*</span></label>
                                <div class="input-group">
                                    <input type="text" id="invoice-number" name="invoice_number" class="form-control" placeholder="INV-0001" />
                                    <button type="button" class="btn btn-outline-secondary" onclick="regenerateInvoiceNumber()" title="Generate new number">
                                        <i class="fa-solid fa-wand-magic-sparkles"></i>
                                    </button>
                                </div>
                            </div>
                            <div class="col-md-6"><label class="form-label">PO / Reference Number</label><input type="text" id="po-number" name="po_number" class="form-control" placeholder="PO-12345" /></div>
                            <div class="col-md-6"><label class="form-label">Invoice Date<span class="required">*</span></label><input type="text" id="invoice-date" name="invoice_date" class="form-control flatpickr" placeholder="DD/MM/YYYY" /></div>
                            <div class="col-md-6"><label class="form-label">Due Date</label><input type="text" id="due-date" name="due_date" class="form-control flatpickr" placeholder="DD/MM/YYYY" /></div>
                            <div class="col-md-6">
                                <label class="form-label">Payment Terms</label>
                                <select class="form-select" id="payment-terms" onchange="setPaymentTerms(this.value)">
                                    <option value="">Custom</option>
                                    <option value="0">Due on Receipt</option>
                                    <option value="15">Net 15 days</option>
                                    <option value="30" selected>Net 30 days</option>
                                    <option value="45">Net 45 days</option>
                                    <option value="60">Net 60 days</option>
                                </select>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label">Tax Mode</label>
                                <div class="doc-type-group">
                                    <button class="doc-type-btn active" data-tax="per-item" id="tax-mode-per-item" onclick="setTaxMode('per-item')">Per Item</button>
                                    <button class="doc-type-btn" data-tax="overall" id="tax-mode-overall" onclick="setTaxMode('overall')">Overall</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- SECTION 5: Items Table -->
                <div class="invoice-section" id="sec-items">
                    <div class="invoice-section-header" onclick="toggleSection('sec-items')">
                        <div class="invoice-section-title"><i class="fa-solid fa-list"></i> Line Items</div>
                        <i class="fa-solid fa-chevron-down section-toggle-icon"></i>
                    </div>
                    <div class="invoice-section-body" style="padding:1rem;">
                        <div class="items-table-wrapper">
                            <table class="items-table" id="items-table" aria-label="Invoice line items">
                                <thead>
                                    <tr>
                                        <th style="width:30px;">#</th>
                                        <th style="min-width:140px;">Product / Service</th>
                                        <th style="min-width:100px;">Description</th>
                                        <th style="width:70px;">HSN</th>
                                        <th style="width:70px;">Unit</th>
                                        <th style="width:70px;">Qty</th>
                                        <th style="width:90px;">Rate</th>
                                        <th style="width:60px;">Disc%</th>
                                        <th style="width:60px;">GST%</th>
                                        <th style="width:90px;" class="text-end">Amount</th>
                                        <th style="width:36px;"></th>
                                    </tr>
                                </thead>
                                <tbody id="items-tbody">
                                    <!-- Rows injected by JS -->
                                </tbody>
                            </table>
                        </div>
                        <button type="button" class="btn btn-outline-primary btn-sm add-item-btn" id="add-item-btn" onclick="addItemRow()">
                            <i class="fa-solid fa-plus"></i> Add Item
                        </button>
                    </div>
                </div>

                <!-- SECTION 6: Summary -->
                <div class="invoice-section" id="sec-summary">
                    <div class="invoice-section-header" onclick="toggleSection('sec-summary')">
                        <div class="invoice-section-title"><i class="fa-solid fa-calculator"></i> Summary</div>
                        <i class="fa-solid fa-chevron-down section-toggle-icon"></i>
                    </div>
                    <div class="invoice-section-body">
                        <div class="row g-2">
                            <div class="col-md-6 ms-auto">
                                <div class="summary-table" id="summary-table">
                                    <div class="summary-row">
                                        <span>Subtotal</span>
                                        <span id="sum-subtotal">₹0.00</span>
                                    </div>
                                    <div class="summary-row">
                                        <span>Discount</span>
                                        <div class="d-flex align-items-center gap-1" style="width:140px;">
                                            <input type="number" id="sum-discount-val" class="form-control form-control-sm text-end" value="0" min="0" oninput="calculateTotals()" />
                                            <select class="form-select form-select-sm" id="sum-discount-type" style="width:55px;" onchange="calculateTotals()">
                                                <option value="percent">%</option>
                                                <option value="flat">₹</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div class="summary-row">
                                        <span>Total GST</span>
                                        <span id="sum-gst">₹0.00</span>
                                    </div>
                                    <div class="summary-row" id="cgst-row" style="display:none;">
                                        <span style="font-size:.78rem;color:var(--text-muted);padding-left:.5rem;">— CGST</span>
                                        <span id="sum-cgst" style="font-size:.78rem;">₹0.00</span>
                                    </div>
                                    <div class="summary-row" id="sgst-row" style="display:none;">
                                        <span style="font-size:.78rem;color:var(--text-muted);padding-left:.5rem;">— SGST</span>
                                        <span id="sum-sgst" style="font-size:.78rem;">₹0.00</span>
                                    </div>
                                    <div class="summary-row">
                                        <span>Shipping / Other Charge</span>
                                        <input type="number" id="sum-shipping" class="form-control form-control-sm text-end" style="width:100px;" value="0" min="0" step="0.01" oninput="calculateTotals()" />
                                    </div>
                                    <div class="summary-row">
                                        <div class="form-check">
                                            <input class="form-check-input" type="checkbox" id="sum-round-off" checked onchange="calculateTotals()" />
                                            <label class="form-check-label" for="sum-round-off" style="font-size:.8125rem;">Round off total</label>
                                        </div>
                                        <span id="sum-round-diff" style="font-size:.75rem;color:var(--text-muted);">₹0.00</span>
                                    </div>
                                    <div class="summary-row total">
                                        <span>Grand Total</span>
                                        <span id="sum-grand-total">₹0.00</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- SECTION 7: Bank & Notes -->
                <div class="invoice-section collapsed" id="sec-notes">
                    <div class="invoice-section-header" onclick="toggleSection('sec-notes')">
                        <div class="invoice-section-title"><i class="fa-solid fa-building-columns"></i> Bank &amp; Notes</div>
                        <i class="fa-solid fa-chevron-down section-toggle-icon"></i>
                    </div>
                    <div class="invoice-section-body">
                        <div class="row g-2 mb-2">
                            <div class="col-md-6"><label class="form-label">Bank Name</label><input type="text" id="bank-name" name="bank_name" class="form-control" placeholder="Bank Name" /></div>
                            <div class="col-md-6"><label class="form-label">Account Number</label><input type="text" id="bank-acc-no" name="bank_acc_no" class="form-control" placeholder="Account Number" /></div>
                            <div class="col-md-6"><label class="form-label">IFSC Code</label><input type="text" id="bank-ifsc" name="bank_ifsc" class="form-control" placeholder="IFSC Code" maxlength="11" /></div>
                            <div class="col-md-6"><label class="form-label">UPI ID</label><input type="text" id="bank-upi" name="upi_id" class="form-control" placeholder="name@upi" /></div>
                        </div>
                        <div class="mb-2"><label class="form-label">Notes</label><textarea id="invoice-notes" name="notes" class="form-control" rows="2" placeholder="Notes visible on invoice…"></textarea></div>
                        <div><label class="form-label">Terms &amp; Conditions</label><textarea id="invoice-terms" name="terms" class="form-control" rows="2" placeholder="Terms visible on invoice…"></textarea></div>
                    </div>
                </div>

            </div><!-- /invoice-form-col -->

            <!-- ──── RIGHT: Live Preview Panel ───────────────────── -->
            <div class="invoice-preview-col" id="invoice-preview-col">
                <div class="preview-sticky-wrap">
                    <div class="preview-toolbar">
                        <div class="d-flex align-items-center gap-2">
                            <span class="fw-600" style="font-size:.875rem;"><i class="fa-solid fa-eye"></i> Live Preview</span>
                            <span class="kosha-badge badge-draft" id="preview-template-badge" style="font-size:.7rem;">Modern</span>
                        </div>
                        <div class="d-flex align-items-center gap-1">
                            <button class="btn btn-ghost btn-sm" onclick="zoomPreview(-0.1)" title="Zoom Out"><i class="fa-solid fa-magnifying-glass-minus"></i></button>
                            <span id="zoom-level-text" style="font-size:.75rem;min-width:35px;text-align:center;">100%</span>
                            <button class="btn btn-ghost btn-sm" onclick="zoomPreview(0.1)" title="Zoom In"><i class="fa-solid fa-magnifying-glass-plus"></i></button>
                            <button class="btn btn-ghost btn-sm" onclick="toggleFullscreenPreview()" title="Fullscreen Preview"><i class="fa-solid fa-expand"></i></button>
                        </div>
                    </div>
                    <div class="preview-scroll-container">
                        <div class="invoice-paper tpl-modern" id="invoice-paper">
                            <!-- Paper HTML rendered live by JS -->
                        </div>
                    </div>
                </div>
            </div>

        </div><!-- /invoice-editor-layout -->

        <!-- ══ Bottom Sticky Action Bar ══ -->
        <div class="invoice-action-bar" id="invoice-action-bar">
            <div class="action-bar-inner">
                <div class="d-flex align-items-center gap-2">
                    <button type="button" class="btn btn-outline-secondary btn-sm" onclick="window.history.back()"><i class="fa-solid fa-arrow-left"></i> Back</button>
                    <span style="font-size:.8125rem;color:var(--text-muted);" id="auto-save-text"></span>
                </div>
                <div class="action-bar-btns">
                    <button type="button" class="btn btn-outline-secondary" onclick="saveAsDraft()" id="save-draft-btn">
                        <i class="fa-solid fa-pencil"></i> Save Draft
                    </button>
                    <button type="button" class="btn btn-outline-primary" onclick="printInvoice()" id="print-btn">
                        <i class="fa-solid fa-print"></i> Print / PDF
                    </button>
                    <button type="button" class="btn btn-outline-success" onclick="openShareModal()" id="share-btn">
                        <i class="fa-solid fa-share-nodes"></i> Share
                    </button>
                    <button type="button" class="btn btn-primary" onclick="saveAndFinalize()" id="finalize-btn">
                        <i class="fa-solid fa-check-double"></i> Save &amp; Issue
                    </button>
                </div>
            </div>
        </div>

    </div>
    `;
}
