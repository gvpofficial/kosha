/**
 * Kosha — Offline Sync Module
 * IndexedDB queue + auto-sync on reconnect + network status banner
 */

import { supabase } from './supabase.js';

const DB_NAME = 'kosha-offline-db';
const STORE_NAME = 'pending-operations';
const DB_VERSION = 1;

// ── IndexedDB Helpers ──────────────────────────────────────────
function openDB() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = () => {
            const db = req.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
            }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

// ── Public API ─────────────────────────────────────────────────

/** Queue a write operation for later sync */
export async function queueOperation(table, operation, data) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.add({
            table,
            operation,
            data,
            timestamp: Date.now()
        });
        tx.oncomplete = () => {
            updateBannerCount();
            resolve();
        };
        tx.onerror = () => reject(tx.error);
    });
}

/** Get count of pending operations */
export async function getPendingCount() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const countReq = store.count();
        countReq.onsuccess = () => resolve(countReq.result);
        countReq.onerror = () => reject(countReq.error);
    });
}

/** Process all pending operations against Supabase */
export async function processPendingSync() {
    const db = await openDB();
    const ops = await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });

    if (!ops || !ops.length) return;

    const errors = [];

    for (const op of ops) {
        try {
            let result;
            if (op.operation === 'insert') {
                result = await supabase.from(op.table).insert(op.data);
            } else if (op.operation === 'update') {
                const { id, ...rest } = op.data;
                result = await supabase.from(op.table).update(rest).eq('id', id);
            } else if (op.operation === 'delete') {
                result = await supabase.from(op.table).delete().eq('id', op.data.id);
            }

            if (result?.error) throw result.error;

            // Remove successful operation from queue
            const delDb = await openDB();
            await new Promise((resolve, reject) => {
                const tx = delDb.transaction(STORE_NAME, 'readwrite');
                tx.objectStore(STORE_NAME).delete(op.id);
                tx.oncomplete = () => resolve();
                tx.onerror = () => reject(tx.error);
            });
        } catch (err) {
            errors.push({ operation: op, error: err });
        }
    }

    if (errors.length) {
        window.dispatchEvent(new CustomEvent('kosha:sync-error', { detail: { errors } }));
    } else {
        window.dispatchEvent(new CustomEvent('kosha:sync-complete'));
    }

    updateBannerCount();
}

/** Check if currently online */
export function isOnline() {
    return navigator.onLine;
}

// ── Network Status Banner ─────────────────────────────────────
let bannerEl = null;

function createBanner() {
    if (bannerEl) return bannerEl;
    bannerEl = document.createElement('div');
    bannerEl.className = 'kosha-net-banner';
    bannerEl.innerHTML = `
        <i class="fa-solid fa-wifi" style="margin-right:0.5rem;"></i>
        <span class="kosha-net-banner-text">You're offline — changes will sync when reconnected</span>
    `;
    document.body.appendChild(bannerEl);
    return bannerEl;
}

function showOfflineBanner() {
    const banner = createBanner();
    banner.classList.remove('online');
    const icon = banner.querySelector('i');
    if (icon) icon.className = 'fa-solid fa-wifi-slash';
    banner.querySelector('.kosha-net-banner-text').textContent =
        "You're offline — changes will sync when reconnected";
    banner.classList.add('visible');
}

function showOnlineBanner() {
    const banner = createBanner();
    banner.classList.add('online');
    const icon = banner.querySelector('i');
    if (icon) icon.className = 'fa-solid fa-wifi';
    banner.querySelector('.kosha-net-banner-text').textContent =
        'Back online — syncing...';
    banner.classList.add('visible');

    // Auto-hide after sync
    setTimeout(() => {
        banner.querySelector('.kosha-net-banner-text').textContent = 'Back online — all synced!';
        setTimeout(() => {
            banner.classList.remove('visible');
            banner.classList.remove('online');
        }, 2000);
    }, 1500);
}

async function updateBannerCount() {
    try {
        const count = await getPendingCount();
        if (count > 0 && !navigator.onLine && bannerEl) {
            bannerEl.querySelector('.kosha-net-banner-text').textContent =
                `You're offline — ${count} change${count > 1 ? 's' : ''} pending sync`;
        }
    } catch (_) { /* ignore */ }
}

// ── Auto-sync on reconnect ────────────────────────────────────
window.addEventListener('online', async () => {
    showOnlineBanner();
    try {
        await processPendingSync();
    } catch (err) {
        console.warn('Sync failed:', err);
    }
});

window.addEventListener('offline', () => {
    showOfflineBanner();
});

// Check initial state
if (!navigator.onLine) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', showOfflineBanner);
    } else {
        showOfflineBanner();
    }
}
