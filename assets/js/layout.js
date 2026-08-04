/**
 * Kosha - Shared Layout Injector
 * Injects sidebar and topbar into every app page.
 * Call: initLayout('dashboard') — pass current page id.
 */

export function initLayout(activePage = '') {
    injectSidebar(activePage);
    injectTopbar();
    injectOverlay();
}

const navItems = [
    { id: 'dashboard',  href: 'dashboard.html',  icon: 'fa-gauge',        label: 'Dashboard' },
    { id: 'invoices',   href: 'invoices.html',   icon: 'fa-file-invoice', label: 'Invoices',  badge: '' },
    { id: 'customers',  href: 'customers.html',  icon: 'fa-users',        label: 'Customers' },
    { id: 'products',   href: 'products.html',   icon: 'fa-box',          label: 'Products' },
    { id: 'reports',    href: 'reports.html',    icon: 'fa-chart-bar',    label: 'Reports' },
    { id: 'settings',   href: 'settings.html',   icon: 'fa-gear',         label: 'Settings' },
];

function injectSidebar(activePage) {
    const navHTML = navItems.map(item => `
        <a href="${item.href}" class="sidebar-nav-link ${activePage === item.id ? 'active' : ''}" id="nav-${item.id}">
            <i class="fa-solid ${item.icon} sidebar-icon" aria-hidden="true"></i>
            <span class="sidebar-label">${item.label}</span>
            ${item.badge !== undefined ? `<span class="sidebar-badge" id="badge-${item.id}" style="display:none">0</span>` : ''}
        </a>
    `).join('');

    const sidebar = document.createElement('aside');
    sidebar.id = 'sidebar';
    sidebar.className = 'sidebar';
    sidebar.setAttribute('role', 'navigation');
    sidebar.setAttribute('aria-label', 'Main navigation');
    sidebar.innerHTML = `
        <div class="sidebar-logo">
            <div class="logo-placeholder" id="sidebar-logo-placeholder" aria-label="Logo placeholder">K</div>
            <span class="sidebar-logo-text">Kosha</span>
        </div>
        <nav class="sidebar-nav">
            <div class="sidebar-section-title">Main Menu</div>
            ${navHTML}
            <div class="sidebar-section-title" style="margin-top:1rem;">More</div>
        </nav>
        <div class="sidebar-footer">
            <a href="#" class="sidebar-nav-link" data-action="logout" id="logout-btn" aria-label="Logout">
                <i class="fa-solid fa-right-from-bracket sidebar-icon" aria-hidden="true"></i>
                <span class="sidebar-label">Logout</span>
            </a>
        </div>
        <button class="sidebar-toggle-btn" id="sidebar-toggle" aria-label="Toggle sidebar" aria-expanded="true">
            <i class="fa-solid fa-chevron-left"></i>
        </button>
    `;
    document.body.insertBefore(sidebar, document.body.firstChild);
}

function injectTopbar() {
    const topbar = document.createElement('header');
    topbar.className = 'topbar';
    topbar.setAttribute('role', 'banner');
    topbar.innerHTML = `
        <div class="topbar-start">
            <button class="mobile-menu-btn" id="mobile-menu-toggle" aria-label="Open navigation" aria-expanded="false">
                <i class="fa-solid fa-bars" aria-hidden="true"></i>
            </button>
            <h1 class="topbar-title" id="page-title-display">Dashboard</h1>
        </div>
        <div class="topbar-end">
            <!-- Search -->
            <div class="search-wrapper" role="search">
                <i class="fa-solid fa-magnifying-glass search-icon" aria-hidden="true"></i>
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
                <i class="fa-solid fa-moon" id="dark-mode-icon" aria-hidden="true"></i>
            </button>

            <!-- Notifications -->
            <button class="topbar-btn" id="notifications-btn" aria-label="Notifications" title="Notifications">
                <i class="fa-solid fa-bell" aria-hidden="true"></i>
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
                    <a href="settings.html" class="dropdown-item-custom" role="menuitem">
                        <i class="fa-solid fa-user"></i> My Profile
                    </a>
                    <a href="settings.html" class="dropdown-item-custom" role="menuitem">
                        <i class="fa-solid fa-gear"></i> Settings
                    </a>
                    <hr style="margin:.25rem 0;border-color:var(--border-light);" />
                    <a href="#" class="dropdown-item-custom danger" data-action="logout" role="menuitem">
                        <i class="fa-solid fa-right-from-bracket"></i> Logout
                    </a>
                </div>
            </div>
        </div>
    `;
    document.body.insertBefore(topbar, document.body.children[1]);

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
