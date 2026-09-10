/**
 * Kosha - Shared Layout Injector
 * Injects top responsive navbar into every app page.
 * Call: initLayout('dashboard') — pass current page id.
 */

export function initLayout(activePage = '') {
    if (!document.getElementById('topbar')) {
        injectTopbar(activePage);
        injectOverlay();
    } else {
        updateSidebarActive(activePage);
    }
}

export function updateSidebarActive(activePage = '') {
    document.querySelectorAll('.topbar-nav-link').forEach(link => {
        const id = link.id ? link.id.replace('nav-', '') : '';
        const href = link.getAttribute('href') || '';
        if (id === activePage || (activePage && href.includes(activePage))) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

const navItems = [
    { id: 'dashboard',  href: '#/dashboard',  icon: 'layout-dashboard', label: 'Dashboard' },
    { id: 'invoices',   href: '#/invoices',   icon: 'receipt',          label: 'Invoices',  badge: '' },
    { id: 'customers',  href: '#/customers',  icon: 'users',            label: 'Customers' },
    { id: 'products',   href: '#/products',   icon: 'box',              label: 'Products' },
    { id: 'reports',    href: '#/reports',    icon: 'bar-chart-2',      label: 'Reports' },
    { id: 'settings',   href: '#/settings',   icon: 'settings',         label: 'Settings' },
];

function injectTopbar(activePage) {
    const navHTML = navItems.map(item => `
        <a href="${item.href}" class="topbar-nav-link ${activePage === item.id ? 'active' : ''}" id="nav-${item.id}">
            <i class="nav-icon" data-lucide="${item.icon}" aria-hidden="true"></i>
            <span class="nav-label">${item.label}</span>
            ${item.badge !== undefined ? `<span class="nav-badge" id="badge-${item.id}" style="display:none">0</span>` : ''}
        </a>
    `).join('');

    const topbar = document.createElement('header');
    topbar.className = 'topbar';
    topbar.id = 'topbar';
    topbar.setAttribute('role', 'banner');
    topbar.innerHTML = `
        <div class="topbar-left">
            <a href="#/dashboard" class="topbar-logo-link" aria-label="Kosha Home">
                <img src="assets/img/Kosha long.svg" alt="Kosha Logo" class="topbar-logo-img" />
            </a>
        </div>
        
        <nav class="topbar-nav" id="topbar-nav">
            <div class="mobile-nav-header">
                <img src="assets/img/Kosha long.svg" alt="Kosha Logo" class="mobile-nav-logo" />
                <button class="mobile-nav-close" id="mobile-nav-close" aria-label="Close navigation"><i data-lucide="x"></i></button>
            </div>
            ${navHTML}
            <div class="mobile-nav-actions">
                <a href="#/invoice" class="btn btn-primary w-100" id="mobile-new-invoice">
                    <i data-lucide="plus"></i> New Invoice
                </a>
            </div>
        </nav>

        <div class="topbar-right">
            <!-- New Invoice CTA Desktop -->
            <a href="#/invoice" class="btn btn-primary btn-sm desktop-new-invoice" title="Create New Invoice">
                <i data-lucide="plus"></i> <span class="desktop-new-invoice-text">New Invoice</span>
            </a>

            <!-- Search -->
            <div class="search-wrapper" role="search">
                <i class="search-icon" data-lucide="search" aria-hidden="true"></i>
                <input
                    type="search"
                    id="global-search"
                    class="search-bar"
                    placeholder="Search invoices, customers…"
                    aria-label="Global search"
                    autocomplete="off"
                />
            </div>

            <!-- Dark mode -->
            <button class="topbar-btn" id="dark-mode-toggle" aria-label="Toggle dark mode" title="Toggle dark mode">
                <i id="dark-mode-icon" aria-hidden="true"></i>
            </button>

            <!-- Notifications -->
            <button class="topbar-btn" id="notifications-btn" aria-label="Notifications" title="Notifications">
                <i data-lucide="bell" aria-hidden="true"></i>
                <span class="notif-count" id="notif-count" style="display:none">0</span>
            </button>

            <!-- Profile -->
            <div class="profile-dropdown">
                <div
                     class="profile-avatar"
                     id="user-avatar"
                     style="background:#3B82F6;"
                     aria-haspopup="true"
                     aria-expanded="false"
                     role="button"
                     tabindex="0"
                     aria-label="User profile menu"
                >U</div>
                <div class="dropdown-menu-custom" id="profile-dropdown-menu" role="menu">
                    <div class="dropdown-user-info">
                        <div class="dropdown-user-name" id="user-display-name">User</div>
                        <div class="dropdown-user-email" id="user-email">user@example.com</div>
                    </div>
                    <a href="#/settings" class="dropdown-item-custom" role="menuitem">
                        <i data-lucide="user"></i> My Profile
                    </a>
                    <a href="#/settings" class="dropdown-item-custom" role="menuitem">
                        <i data-lucide="settings"></i> Settings
                    </a>
                    <hr style="margin:.25rem 0;border-color:var(--border-light);" />
                    <a href="#" class="dropdown-item-custom danger" data-action="logout" role="menuitem">
                        <i data-lucide="log-out"></i> Logout
                    </a>
                </div>
            </div>

            <!-- Mobile Menu Toggle Button (Visible on mobile, far right) -->
            <button class="mobile-menu-btn" id="mobile-menu-toggle" aria-label="Open navigation" aria-expanded="false">
                <i data-lucide="menu"></i>
            </button>
        </div>
    `;
    document.body.insertBefore(topbar, document.body.firstChild);

    // Profile dropdown toggle
    const avatar = topbar.querySelector('#user-avatar');
    const menu = topbar.querySelector('#profile-dropdown-menu');
    avatar?.addEventListener('click', (e) => {
        e.stopPropagation();
        const open = menu.classList.toggle('show');
        avatar.setAttribute('aria-expanded', open);
    });
    avatar?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); avatar.click(); }
    });
    document.addEventListener('click', () => menu?.classList.remove('show'));
}

function injectOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'sidebar-overlay';
    overlay.className = 'sidebar-overlay';
    overlay.setAttribute('aria-hidden', 'true');
    document.body.appendChild(overlay);
}
