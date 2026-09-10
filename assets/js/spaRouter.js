/**
 * Kosha - True Single-Page Application (SPA) Router
 * Dynamically renders & swaps views inside the DOM without page reloads.
 */

import { initApp } from './app.js';
import { initLayout, updateSidebarActive } from './layout.js';

import { getDashboardHTML } from './views/dashboardView.js';
import { getInvoicesHTML } from './views/invoicesView.js';
import { getInvoiceHTML } from './views/invoiceView.js';
import { getCustomersHTML } from './views/customersView.js';
import { getProductsHTML } from './views/productsView.js';
import { getReportsHTML } from './views/reportsView.js';
import { getSettingsHTML } from './views/settingsView.js';
import { getLoginHTML } from './views/loginView.js';
import { getOfflineHTML } from './views/offlineView.js';

const viewMap = {
    'dashboard': getDashboardHTML,
    'invoices': getInvoicesHTML,
    'invoice': getInvoiceHTML,
    'customers': getCustomersHTML,
    'products': getProductsHTML,
    'reports': getReportsHTML,
    'settings': getSettingsHTML,
    'login': getLoginHTML,
    'offline': getOfflineHTML
};

const titleMap = {
    'dashboard': 'Dashboard — Kosha',
    'invoices': 'Invoices — Kosha',
    'invoice': 'Invoice — Kosha',
    'customers': 'Customers — Kosha',
    'products': 'Products — Kosha',
    'reports': 'Reports — Kosha',
    'settings': 'Settings — Kosha',
    'login': 'Account — Kosha',
    'offline': 'Offline — Kosha'
};

let isNavigating = false;
let currentCleanup = null;
let routerInitialized = false;

export function initSPARouter() {
    if (routerInitialized) return;
    routerInitialized = true;

    injectProgressBar();
    document.addEventListener('click', handleLinkClick);
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handleHashChange);
    window.navigateTo = navigateTo;
}

export function registerCleanup(fn) {
    if (typeof fn === 'function') {
        currentCleanup = fn;
    }
}

function injectProgressBar() {
    if (document.getElementById('spa-progress-bar')) return;
    const bar = document.createElement('div');
    bar.id = 'spa-progress-bar';
    bar.className = 'spa-progress-bar';
    document.body.appendChild(bar);
}

function startProgressBar() {
    const bar = document.getElementById('spa-progress-bar');
    if (!bar) return;
    bar.style.width = '15%';
    bar.style.opacity = '1';
    setTimeout(() => {
        if (bar.style.opacity === '1') bar.style.width = '75%';
    }, 100);
}

function finishProgressBar() {
    const bar = document.getElementById('spa-progress-bar');
    if (!bar) return;
    bar.style.width = '100%';
    setTimeout(() => {
        bar.style.opacity = '0';
        setTimeout(() => { bar.style.width = '0%'; }, 300);
    }, 200);
}

function handlePopState() {
    const targetRoute = getRouteFromLocation();
    navigateTo(targetRoute, { pushState: false });
}

function handleHashChange() {
    const targetRoute = getRouteFromLocation();
    navigateTo(targetRoute, { pushState: false });
}

function getRouteFromLocation() {
    const hash = window.location.hash || '';
    if (hash.startsWith('#/')) {
        return hash.substring(2);
    } else if (hash.startsWith('#')) {
        return hash.substring(1);
    }
    const path = window.location.pathname.split('/').pop() || '';
    if (path && path !== 'index.html') {
        return path;
    }
    return 'dashboard';
}

function handleLinkClick(e) {
    const anchor = e.target.closest('a');
    if (!anchor) return;

    const href = anchor.getAttribute('href');
    if (!href || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:') || anchor.target === '_blank' || anchor.hasAttribute('download')) {
        return;
    }

    if (anchor.classList.contains('no-spa')) {
        return;
    }

    // Ignore exact same empty hash or non-nav hashes
    if (href === '#' || href === '') return;

    let targetRoute = href;
    if (href.startsWith('#/')) {
        targetRoute = href.substring(2);
    } else if (href.startsWith('#')) {
        targetRoute = href.substring(1);
    } else if (href.includes('.html')) {
        targetRoute = href;
    } else {
        const targetUrl = new URL(href, window.location.href);
        if (targetUrl.origin !== window.location.origin) return;
        targetRoute = targetUrl.pathname.split('/').pop() + targetUrl.search;
    }

    e.preventDefault();
    if (isNavigating) return;

    navigateTo(targetRoute, { pushState: true });
}

export async function navigateTo(routeStr, options = {}) {
    const { pushState = true, replaceState = false } = options;

    // Parse route name and query string
    let cleanRoute = routeStr.replace('index.html', '').replace('.html', '').trim();
    if (cleanRoute.startsWith('#/')) cleanRoute = cleanRoute.substring(2);
    if (cleanRoute.startsWith('#')) cleanRoute = cleanRoute.substring(1);
    if (cleanRoute.startsWith('/')) cleanRoute = cleanRoute.substring(1);

    let pageId = cleanRoute.split('?')[0].split('#')[0] || 'dashboard';
    if (!viewMap[pageId]) {
        pageId = 'dashboard';
    }

    const queryString = routeStr.includes('?') ? '?' + routeStr.split('?')[1] : '';

    if (isNavigating) return;
    isNavigating = true;
    startProgressBar();

    // Run cleanup for previous page if registered
    if (currentCleanup) {
        try { currentCleanup(); } catch (err) { console.warn('Page cleanup error:', err); }
        currentCleanup = null;
    }

    try {
        const viewHTML = viewMap[pageId] ? viewMap[pageId]() : viewMap['dashboard']();
        const isAuthPage = (pageId === 'login' || pageId === 'offline');

        if (isAuthPage) {
            renderAuthView(viewHTML, pageId);
        } else {
            renderAppView(viewHTML, pageId);
        }

        // Set document title
        if (titleMap[pageId]) {
            document.title = titleMap[pageId];
        }

        // Update URL hash state
        const targetHash = '#/' + pageId + (queryString || '');
        if (window.location.hash !== targetHash) {
            if (replaceState) {
                history.replaceState(null, '', targetHash);
            } else if (pushState) {
                history.pushState(null, '', targetHash);
            }
        }

        // Init page module JS logic
        await initPageModule(pageId, queryString);

        window.scrollTo({ top: 0, behavior: 'instant' });
        finishProgressBar();
        isNavigating = false;

    } catch (err) {
        console.warn('SPA Navigation error:', err);
        isNavigating = false;
        finishProgressBar();
    }
}

function renderAuthView(htmlContent, pageId) {
    const topbar = document.getElementById('topbar');
    const overlay = document.getElementById('sidebar-overlay');
    const mainContent = document.getElementById('main-content');

    if (topbar) topbar.style.display = 'none';
    if (overlay) overlay.style.display = 'none';
    if (mainContent) mainContent.style.display = 'none';

    document.body.classList.add('login-page');

    let authContainer = document.getElementById('spa-auth-container');
    if (!authContainer) {
        authContainer = document.createElement('div');
        authContainer.id = 'spa-auth-container';
        document.body.appendChild(authContainer);
    }
    authContainer.style.display = 'flex';
    authContainer.innerHTML = htmlContent;
}

function renderAppView(htmlContent, pageId) {
    document.body.classList.remove('login-page');

    const authContainer = document.getElementById('spa-auth-container');
    if (authContainer) authContainer.style.display = 'none';

    if (!document.getElementById('topbar')) {
        initLayout(pageId);
    }

    const topbar = document.getElementById('topbar');
    const overlay = document.getElementById('sidebar-overlay');
    const mainContent = document.getElementById('main-content');
    const mobileNav = document.getElementById('topbar-nav');

    if (topbar) topbar.style.display = '';
    if (overlay) overlay.style.display = '';
    if (mainContent) {
        mainContent.style.display = '';
        mainContent.innerHTML = htmlContent;
    }

    // Close mobile nav if open
    mobileNav?.classList.remove('mobile-open');
    overlay?.classList.remove('show');

    updateSidebarActive(pageId);
    initApp();
}

async function initPageModule(pageId, queryString) {
    document.dispatchEvent(new CustomEvent('kosha:page-loaded', { detail: { page: pageId, query: queryString } }));

    try {
        if (pageId === 'login') {
            const mod = await import('./login.js');
            if (mod.initLoginPage) await mod.initLoginPage();
            if (mod.cleanupLoginPage) currentCleanup = mod.cleanupLoginPage;
        } else if (pageId === 'dashboard') {
            const mod = await import('./dashboard.js');
            if (mod.initDashboardPage) await mod.initDashboardPage();
            if (mod.cleanupDashboardPage) currentCleanup = mod.cleanupDashboardPage;
        } else if (pageId === 'invoices') {
            const mod = await import('./invoices.js');
            if (mod.initInvoicesPage) await mod.initInvoicesPage();
            if (mod.cleanupInvoicesPage) currentCleanup = mod.cleanupInvoicesPage;
        } else if (pageId === 'invoice') {
            const mod = await import('./invoice.js');
            if (mod.initInvoicePage) await mod.initInvoicePage();
            if (mod.cleanupInvoicePage) currentCleanup = mod.cleanupInvoicePage;
        } else if (pageId === 'customers') {
            const mod = await import('./customers.js');
            if (mod.initCustomersPage) await mod.initCustomersPage();
            if (mod.cleanupCustomersPage) currentCleanup = mod.cleanupCustomersPage;
        } else if (pageId === 'products') {
            const mod = await import('./products.js');
            if (mod.initProductsPage) await mod.initProductsPage();
            if (mod.cleanupProductsPage) currentCleanup = mod.cleanupProductsPage;
        } else if (pageId === 'reports') {
            const mod = await import('./reports.js');
            if (mod.initReportsPage) await mod.initReportsPage();
            if (mod.cleanupReportsPage) currentCleanup = mod.cleanupReportsPage;
        } else if (pageId === 'settings') {
            const mod = await import('./settings.js');
            if (mod.initSettingsPage) await mod.initSettingsPage();
            if (mod.cleanupSettingsPage) currentCleanup = mod.cleanupSettingsPage;
        }
    } catch (err) {
        console.warn('Page module SPA init error:', err);
    }
}
