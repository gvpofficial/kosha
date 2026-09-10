// ────────────────────────────────────────────────────────────────
// Kosha Service Worker — Offline-First with Network Sync
// ────────────────────────────────────────────────────────────────
const CACHE_NAME = 'kosha-cache-v1';

const PRECACHE_URLS = [
    '/',
    '/index.html',
    '/assets/css/style.css',
    '/assets/css/dashboard.css',
    '/assets/css/login.css',
    '/assets/css/invoice.css',
    '/assets/css/customers.css',
    '/assets/css/reports.css',
    '/assets/css/settings.css',
    '/assets/js/supabase.js',
    '/assets/js/login.js',
    '/assets/js/dashboard.js',
    '/assets/js/customers.js',
    '/assets/js/products.js',
    '/assets/js/invoices.js',
    '/assets/js/invoice.js',
    '/assets/js/reports.js',
    '/assets/js/settings.js',
    '/assets/js/app.js',
    '/assets/js/layout.js',
    '/assets/js/spaRouter.js',
    '/assets/js/offlineSync.js',
    '/assets/js/views/dashboardView.js',
    '/assets/js/views/invoicesView.js',
    '/assets/js/views/invoiceView.js',
    '/assets/js/views/customersView.js',
    '/assets/js/views/productsView.js',
    '/assets/js/views/reportsView.js',
    '/assets/js/views/settingsView.js',
    '/assets/js/views/loginView.js',
    '/assets/js/views/offlineView.js',
    '/assets/img/Kosha long.svg',
    '/assets/img/Kosha.svg',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css'
];

// Install — pre-cache app shell
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(PRECACHE_URLS))
            .then(() => self.skipWaiting())
    );
});

// Activate — clean old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(
                keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
            )
        ).then(() => self.clients.claim())
    );
});

// Fetch — strategy per request type
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') return;

    // Supabase API — network only (don't cache API data)
    if (url.hostname.includes('supabase.co')) return;

    // Navigation requests — network first, fallback to cache, then offline page
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .then(response => {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
                    return response;
                })
                .catch(() =>
                    caches.match(request).then(cached => cached || caches.match('/offline.html'))
                )
        );
        return;
    }

    // CDN resources (fonts, font-awesome, jsdelivr) — cache first
    if (url.hostname.includes('googleapis.com') ||
        url.hostname.includes('gstatic.com') ||
        url.hostname.includes('cloudflare') ||
        url.hostname.includes('jsdelivr.net')) {
        event.respondWith(
            caches.match(request).then(cached => {
                if (cached) return cached;
                return fetch(request).then(response => {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
                    return response;
                });
            })
        );
        return;
    }

    // Static assets — cache first, update in background
    event.respondWith(
        caches.match(request).then(cached => {
            const fetchPromise = fetch(request).then(response => {
                const clone = response.clone();
                caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
                return response;
            }).catch(() => cached);
            return cached || fetchPromise;
        })
    );
});
