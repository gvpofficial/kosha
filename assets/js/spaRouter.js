/**
 * Kosha - SPA Router (Single Page Application)
 * Enables fast zero-reload client-side page transitions across the workspace.
 */

import { initApp } from './app.js';
import { getCurrentUser } from './supabase.js';

let isNavigating = false;

export function initSPARouter() {
    injectProgressBar();
    document.addEventListener('click', handleLinkClick);
    window.addEventListener('popstate', handlePopState);
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
    bar.style.width = '10%';
    bar.style.opacity = '1';
    setTimeout(() => {
        if (bar.style.opacity === '1') bar.style.width = '70%';
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
    loadPage(window.location.href, false);
}

function handleLinkClick(e) {
    const anchor = e.target.closest('a');
    if (!anchor) return;

    const href = anchor.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:') || anchor.target === '_blank' || anchor.hasAttribute('download')) {
        return;
    }

    if (anchor.dataset.action === 'logout' || anchor.classList.contains('no-spa')) {
        return;
    }

    const targetUrl = new URL(href, window.location.href);
    if (targetUrl.origin !== window.location.origin) return;

    const path = targetUrl.pathname;
    const filename = path.split('/').pop() || 'index.html';
    if (!filename.endsWith('.html') && filename !== '') return;

    // Do not intercept login or index redirects to avoid auth loop
    if (filename.includes('login') || filename.includes('offline')) {
        return;
    }

    e.preventDefault();
    if (isNavigating) return;

    // Don't reload if already on the exact same full URL
    if (targetUrl.href === window.location.href) return;

    loadPage(targetUrl.href, true);
}

export async function loadPage(urlStr, pushState = true) {
    if (isNavigating) return;
    isNavigating = true;
    startProgressBar();

    try {
        const response = await fetch(urlStr);
        if (!response.ok) {
            window.location.href = urlStr;
            return;
        }

        const htmlText = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlText, 'text/html');

        const newMain = doc.querySelector('#main-content') || doc.querySelector('.main-content');
        const currentMain = document.querySelector('#main-content') || document.querySelector('.main-content');

        if (!newMain || !currentMain) {
            window.location.href = urlStr;
            return;
        }

        // Close mobile sidebar if open
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        sidebar?.classList.remove('mobile-open');
        overlay?.classList.remove('show');

        // Update document title
        if (doc.title) {
            document.title = doc.title;
        }

        // Smooth transition
        currentMain.style.opacity = '0.3';
        currentMain.style.transform = 'translateY(4px)';
        currentMain.style.transition = 'opacity 0.15s ease, transform 0.15s ease';

        setTimeout(async () => {
            currentMain.innerHTML = newMain.innerHTML;

            if (pushState) {
                history.pushState({}, '', urlStr);
            }

            updateSidebarActiveState(urlStr);
            initApp();

            currentMain.style.opacity = '1';
            currentMain.style.transform = 'translateY(0)';

            // Dynamically load page module JS
            await initPageModule(urlStr, doc);

            window.scrollTo({ top: 0, behavior: 'instant' });
            finishProgressBar();
            isNavigating = false;
        }, 150);

    } catch (err) {
        console.warn('SPA Navigation warning, reloading:', err);
        window.location.href = urlStr;
        isNavigating = false;
        finishProgressBar();
    }
}

function updateSidebarActiveState(urlStr) {
    const url = new URL(urlStr, window.location.href);
    const filename = url.pathname.split('/').pop() || 'dashboard.html';
    const pageId = filename.replace('.html', '');

    document.querySelectorAll('.sidebar-nav-link').forEach(link => {
        const href = link.getAttribute('href');
        if (href && href.includes(filename)) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });

    const titleEl = document.getElementById('page-title-display');
    if (titleEl) {
        const titleMap = {
            'dashboard': 'Dashboard',
            'invoices': 'Invoices',
            'invoice': 'Invoice Editor',
            'customers': 'Customers',
            'products': 'Products',
            'reports': 'Reports',
            'settings': 'Settings'
        };
        if (titleMap[pageId]) {
            titleEl.textContent = titleMap[pageId];
        }
    }
}

async function initPageModule(urlStr, doc) {
    const url = new URL(urlStr, window.location.href);
    const filename = url.pathname.split('/').pop() || 'dashboard.html';

    document.dispatchEvent(new CustomEvent('kosha:page-loaded', { detail: { page: filename, url: urlStr } }));

    try {
        if (filename.includes('dashboard')) {
            const mod = await import('./dashboard.js');
            if (mod.initDashboardPage) await mod.initDashboardPage();
        } else if (filename.includes('invoices') && !filename.includes('invoice.')) {
            const mod = await import('./invoices.js');
            if (mod.initInvoicesPage) await mod.initInvoicesPage();
        } else if (filename.includes('invoice.')) {
            const mod = await import('./invoice.js');
            if (mod.initInvoicePage) await mod.initInvoicePage();
        } else if (filename.includes('customers')) {
            const mod = await import('./customers.js');
            if (mod.initCustomersPage) await mod.initCustomersPage();
        } else if (filename.includes('products')) {
            const mod = await import('./products.js');
            if (mod.initProductsPage) mod.initProductsPage();
        } else if (filename.includes('reports')) {
            const mod = await import('./reports.js');
            if (mod.initReportsPage) await mod.initReportsPage();
        } else if (filename.includes('settings')) {
            const mod = await import('./settings.js');
            if (mod.initSettingsPage) await mod.initSettingsPage();
        }
    } catch (err) {
        console.warn('Page module SPA init warning:', err);
    }
}
