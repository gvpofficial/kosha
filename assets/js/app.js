/**
 * Kosha - Global App Utilities
 * Shared helpers used across all pages.
 */

import { getCurrentUser, signOut, getBusinessProfile } from './supabase.js';

// ────────────────────────────────────────────────────────────────
// APP INIT — call on every page after layout is injected
// ────────────────────────────────────────────────────────────────
// ── Load global translation helper ───────────────────────────────
window.translateFAToLucide = function() {
    const faToLucideMap = {
        'fa-gauge': 'layout-dashboard',
        'fa-file-invoice': 'receipt',
        'fa-users': 'users',
        'fa-box': 'box',
        'fa-chart-bar': 'bar-chart-2',
        'fa-gear': 'settings',
        'fa-plus': 'plus',
        'fa-rotate-right': 'rotate-cw',
        'fa-indian-rupee-sign': 'indian-rupee',
        'fa-clock': 'clock',
        'fa-bell': 'bell',
        'fa-moon': 'moon',
        'fa-sun': 'sun',
        'fa-right-from-bracket': 'log-out',
        'fa-user': 'user',
        'fa-trash': 'trash-2',
        'fa-trash-can': 'trash-2',
        'fa-pen': 'pencil',
        'fa-check': 'check',
        'fa-download': 'download',
        'fa-magnifying-glass': 'search',
        'fa-bars': 'menu',
        'fa-menu': 'menu',
        'fa-x': 'x',
        'fa-bolt': 'zap',
        'fa-pencil': 'pencil',
        'fa-file-plus': 'file-plus',
        'fa-user-plus': 'user-plus',
        'fa-box-open': 'box',
        'fa-chart-line': 'trending-up',
        'fa-arrow-left': 'arrow-left',
        'fa-chevron-left': 'chevron-left',
        'fa-chevron-right': 'chevron-right',
        'fa-circle-check': 'check-circle',
        'fa-circle-xmark': 'x-circle',
        'fa-triangle-exclamation': 'alert-triangle',
        'fa-circle-info': 'info',
        'fa-file-pdf': 'file-text',
        'fa-file-csv': 'file-spreadsheet',
        'fa-file-import': 'upload',
        'fa-file-export': 'download',
        'fa-ellipsis-vertical': 'more-vertical',
        'fa-eye': 'eye',
        'fa-eye-slash': 'eye-off',
        'fa-lock': 'lock',
        'fa-key': 'key',
        'fa-envelope': 'mail',
        'fa-phone': 'phone',
        'fa-map-marker-alt': 'map-pin',
        'fa-building': 'building',
        'fa-credit-card': 'credit-card',
        'fa-calendar': 'calendar',
        'fa-filter': 'filter',
        'fa-search': 'search'
    };

    document.querySelectorAll('i[class*="fa-"]').forEach(el => {
        let faClass = null;
        for (const cls of el.classList) {
            if (cls.startsWith('fa-') && cls !== 'fa-solid' && cls !== 'fa-regular' && cls !== 'fa-brands') {
                faClass = cls;
                break;
            }
        }
        if (faClass) {
            const lucideName = faToLucideMap[faClass] || faClass.replace('fa-', '');
            el.setAttribute('data-lucide', lucideName);
            el.classList.remove('fa-solid', 'fa-regular', 'fa-brands', faClass);
        }
    });

    if (window.lucide) {
        window.lucide.createIcons();
    }
};

// Set up MutationObserver to auto-translate dynamically inserted elements
if (typeof window.translateObserver === 'undefined') {
    let timeout = null;
    window.translateObserver = new MutationObserver((mutations) => {
        let hasAdditions = false;
        for (const m of mutations) {
            if (m.addedNodes.length > 0) {
                hasAdditions = true;
                break;
            }
        }
        if (hasAdditions) {
            if (timeout) clearTimeout(timeout);
            timeout = setTimeout(() => {
                window.translateFAToLucide();
            }, 50);
        }
    });
    window.translateObserver.observe(document.body, { childList: true, subtree: true });
}

export function initApp() {
    initDarkMode();
    initSidebarToggle();
    initLogout();
    loadUserInfo();
    setPageTitle();
    initGlobalSearch();
    initGlobalParticleCanvas();
    window.translateFAToLucide();
}

// ── Dark Mode ────────────────────────────────────────────────────
function initDarkMode() {
    const saved = lsGet('kosha_theme') || 'dark';
    let theme = saved;
    if (saved === 'system') {
        theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    document.documentElement.setAttribute('data-theme', theme);

    const btn  = document.getElementById('dark-mode-toggle');
    const icon = document.getElementById('dark-mode-icon');

    const updateIcon = () => {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        if (icon) {
            icon.removeAttribute('class'); // Safe for both HTML and SVG elements
            icon.setAttribute('data-lucide', isDark ? 'sun' : 'moon');
            if (window.lucide) {
                window.lucide.createIcons();
            } else {
                icon.setAttribute('class', isDark ? 'fa-solid fa-sun' : 'fa-solid fa-moon');
            }
        }
        if (btn) {
            const tooltipText = isDark ? 'Switch to light mode' : 'Switch to dark mode';
            btn.setAttribute('aria-label', tooltipText);
            btn.setAttribute('title', tooltipText);
        }
    };
    updateIcon();

    if (btn && !btn._dmListener) {
        btn._dmListener = true;
        btn.addEventListener('click', () => {
            const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
            const next = isDark ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', next);
            lsSet('kosha_theme', next);
            updateIcon();
        });
    }
}

// ── Sidebar Toggle ───────────────────────────────────────────────
function initSidebarToggle() {
    const mobileNav     = document.getElementById('topbar-nav');
    const mobileBtn     = document.getElementById('mobile-menu-toggle');
    const closeBtn      = document.getElementById('mobile-nav-close');
    const overlay       = document.getElementById('sidebar-overlay');

    if (!mobileNav) return;

    // Mobile toggle open
    if (mobileBtn && !mobileBtn._mbListener) {
        mobileBtn._mbListener = true;
        mobileBtn.addEventListener('click', () => {
            const open = mobileNav.classList.toggle('mobile-open');
            overlay?.classList.toggle('show', open);
            mobileBtn.setAttribute('aria-expanded', open);
        });
    }

    // Mobile toggle close
    if (closeBtn && !closeBtn._closeListener) {
        closeBtn._closeListener = true;
        closeBtn.addEventListener('click', () => {
            mobileNav.classList.remove('mobile-open');
            overlay?.classList.remove('show');
            mobileBtn?.setAttribute('aria-expanded', 'false');
        });
    }

    // Close on overlay click
    if (overlay && !overlay._ovListener) {
        overlay._ovListener = true;
        overlay.addEventListener('click', () => {
            mobileNav.classList.remove('mobile-open');
            overlay.classList.remove('show');
            mobileBtn?.setAttribute('aria-expanded', 'false');
        });
    }
}

// ── Logout ───────────────────────────────────────────────────────
function initLogout() {
    document.querySelectorAll('[data-action="logout"]').forEach(el => {
        if (el._lgListener) return;
        el._lgListener = true;
        el.addEventListener('click', async (e) => {
            e.preventDefault();
            await signOut();
            if (typeof window.navigateTo === 'function') {
                window.navigateTo('login');
            } else {
                window.location.hash = '#/login';
            }
        });
    });
}

// ── Load User Info ────────────────────────────────────────────────
async function loadUserInfo() {
    const user = await getCurrentUser();
    if (!user) return;

    const name  = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
    const email = user.email || '';
    const initials = getInitials(name);
    const color = getAvatarColor(name);

    setText('user-display-name', name);
    setText('user-email', email);
    const avatar = document.getElementById('user-avatar');
    if (avatar) { avatar.textContent = initials; avatar.style.background = color; }
}

// ── Page Title ────────────────────────────────────────────────────
function setPageTitle() {
    const titleEl = document.getElementById('page-title-display');
    if (!titleEl) return;
    // Already set by individual pages; this is a fallback
    const path = window.location.pathname;
    const pageName = path.split('/').pop().replace('.html','').replace(/-/g,' ');
    if (pageName && !titleEl.textContent.trim()) {
        titleEl.textContent = pageName.charAt(0).toUpperCase() + pageName.slice(1);
    }
}

// ── Global Search ─────────────────────────────────────────────────
function initGlobalSearch() {
    const searchInput = document.getElementById('global-search');
    if (!searchInput || searchInput._gsListener) return;
    searchInput._gsListener = true;
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const q = searchInput.value.trim();
            if (q) {
                const target = `#/invoices?search=${encodeURIComponent(q)}`;
                if (typeof window.navigateTo === 'function') {
                    window.navigateTo(target);
                } else {
                    window.location.hash = target;
                }
            }
        }
    });
}

// ════════════════════════════════════════════════════════════════
//  TOAST NOTIFICATIONS
// ════════════════════════════════════════════════════════════════

const toastStyles = {
    success: { icon: 'fa-circle-check',      bg: '#22C55E', text: '#fff' },
    error:   { icon: 'fa-circle-xmark',      bg: '#EF4444', text: '#fff' },
    warning: { icon: 'fa-triangle-exclamation', bg: '#F59E0B', text: '#fff' },
    info:    { icon: 'fa-circle-info',       bg: '#3B82F6', text: '#fff' },
};

function ensureToastContainer() {
    let c = document.getElementById('toast-container');
    if (!c) {
        c = document.createElement('div');
        c.id = 'toast-container';
        c.setAttribute('aria-live', 'assertive');
        c.setAttribute('aria-atomic', 'true');
        document.body.appendChild(c);
    }
    return c;
}

function showToast(message, type = 'info', duration = 3500) {
    const container = ensureToastContainer();
    const style = toastStyles[type] || toastStyles.info;
    const toast = document.createElement('div');
    toast.className = `kosha-toast kosha-toast-${type}`;
    toast.setAttribute('role', 'alert');
    toast.innerHTML = `
        <i class="fa-solid ${style.icon}" aria-hidden="true"></i>
        <span class="toast-message">${message}</span>
        <button class="toast-close" aria-label="Dismiss">&times;</button>
    `;
    toast.querySelector('.toast-close')?.addEventListener('click', () => removeToast(toast));
    container.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add('show'));

    const timer = setTimeout(() => removeToast(toast), duration);
    toast._timer = timer;
    return toast;
}

function removeToast(toast) {
    clearTimeout(toast._timer);
    toast.classList.remove('show');
    toast.classList.add('hiding');
    setTimeout(() => toast.remove(), 350);
}

export const Toast = {
    success: (msg, dur) => showToast(msg, 'success', dur),
    error:   (msg, dur) => showToast(msg, 'error', dur),
    warning: (msg, dur) => showToast(msg, 'warning', dur),
    info:    (msg, dur) => showToast(msg, 'info', dur),
};

// ════════════════════════════════════════════════════════════════
//  PAGINATION
// ════════════════════════════════════════════════════════════════

export class Pagination {
    constructor(containerId, total, perPage, onPageChange) {
        this.containerId = containerId;
        this.total = total;
        this.perPage = perPage;
        this.currentPage = 1;
        this.onPageChange = onPageChange;
        this.render();
    }

    update(total, currentPage) {
        this.total = total;
        this.currentPage = currentPage;
        this.render();
    }

    render() {
        const container = document.getElementById(this.containerId);
        if (!container) return;
        const totalPages = Math.ceil(this.total / this.perPage);
        if (totalPages <= 1) { container.innerHTML = ''; return; }

        const pages = this._getPageNumbers(totalPages);
        container.innerHTML = `
            <nav aria-label="Pagination" class="pagination-nav">
                <button class="page-btn" ${this.currentPage === 1 ? 'disabled' : ''} data-page="${this.currentPage - 1}" aria-label="Previous">
                    <i class="fa-solid fa-chevron-left"></i>
                </button>
                ${pages.map(p => p === '…'
                    ? `<span class="page-ellipsis">…</span>`
                    : `<button class="page-btn ${p === this.currentPage ? 'active' : ''}" data-page="${p}" aria-label="Page ${p}" ${p === this.currentPage ? 'aria-current="page"' : ''}>${p}</button>`
                ).join('')}
                <button class="page-btn" ${this.currentPage === totalPages ? 'disabled' : ''} data-page="${this.currentPage + 1}" aria-label="Next">
                    <i class="fa-solid fa-chevron-right"></i>
                </button>
            </nav>
        `;

        container.querySelectorAll('.page-btn:not([disabled])').forEach(btn => {
            btn.addEventListener('click', () => {
                const p = parseInt(btn.dataset.page);
                if (!isNaN(p)) { this.currentPage = p; this.onPageChange(p); }
            });
        });
    }

    _getPageNumbers(total) {
        const current = this.currentPage;
        if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
        if (current <= 4) return [1, 2, 3, 4, 5, '…', total];
        if (current >= total - 3) return [1, '…', total-4, total-3, total-2, total-1, total];
        return [1, '…', current-1, current, current+1, '…', total];
    }
}

// ════════════════════════════════════════════════════════════════
//  FORMATTERS
// ════════════════════════════════════════════════════════════════

export function formatCurrency(amount, symbol = '₹', code = 'INR') {
    const num = Number(amount) || 0;
    return `${symbol}${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function getStatusBadge(status) {
    const map = {
        draft:     ['badge-draft',     'Draft'],
        sent:      ['badge-sent',      'Sent'],
        pending:   ['badge-pending',   'Pending'],
        paid:      ['badge-paid',      'Paid'],
        overdue:   ['badge-overdue',   'Overdue'],
        cancelled: ['badge-cancelled', 'Cancelled'],
    };
    const [cls, label] = map[status] || ['badge-draft', status || 'Unknown'];
    return `<span class="kosha-badge ${cls}">${label}</span>`;
}

export function getRelativeTime(dateStr) {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const secs  = Math.floor(diff / 1000);
    const mins  = Math.floor(secs / 60);
    const hours = Math.floor(mins / 60);
    const days  = Math.floor(hours / 24);
    if (secs < 60)  return 'just now';
    if (mins < 60)  return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7)   return `${days}d ago`;
    return formatDate(dateStr);
}

export function getInitials(name = '') {
    return name.split(' ').slice(0, 2).map(w => w[0] || '').join('').toUpperCase() || '?';
}

export function getAvatarColor(name = '') {
    const colors = ['#3B82F6','#06B6D4','#22C55E','#F59E0B','#EF4444','#8B5CF6','#EC4899','#14B8A6'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
}

// ════════════════════════════════════════════════════════════════
//  AMOUNT IN WORDS (for Indian Rupees)
// ════════════════════════════════════════════════════════════════

export function numberToWords(amount) {
    const units = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine',
        'Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
    const tens = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];

    function toWords(n) {
        if (n === 0) return '';
        if (n < 20) return units[n] + ' ';
        if (n < 100) return tens[Math.floor(n/10)] + ' ' + toWords(n % 10);
        if (n < 1000) return units[Math.floor(n/100)] + ' Hundred ' + toWords(n % 100);
        if (n < 100000) return toWords(Math.floor(n/1000)) + 'Thousand ' + toWords(n % 1000);
        if (n < 10000000) return toWords(Math.floor(n/100000)) + 'Lakh ' + toWords(n % 100000);
        return toWords(Math.floor(n/10000000)) + 'Crore ' + toWords(n % 10000000);
    }

    const n = Math.round(amount);
    const paise = Math.round((amount - n) * 100);
    let words = toWords(n).trim();
    if (!words) words = 'Zero';
    let result = words + ' Rupees';
    if (paise > 0) result += ' and ' + toWords(paise).trim() + ' Paise';
    return result + ' Only';
}

// ════════════════════════════════════════════════════════════════
//  UTILITIES
// ════════════════════════════════════════════════════════════════

/** Debounce function */
export function debounce(fn, delay = 300) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), delay);
    };
}

/** LocalStorage helpers */
export function lsGet(key) {
    try { return localStorage.getItem(key); } catch { return null; }
}
export function lsSet(key, val) {
    try { localStorage.setItem(key, typeof val === 'object' ? JSON.stringify(val) : val); } catch {}
}

/** Draft management */
export function initAutoDraft(key) {
    const saved = lsGet(`kosha_draft_${key}`);
    return saved ? JSON.parse(saved) : null;
}
export function clearDraft(key) {
    localStorage.removeItem(`kosha_draft_${key}`);
}

/** Text helper */
function setText(id, v) { const el = document.getElementById(id); if (el) el.textContent = v; }

/** Create skeleton loading rows */
export function createSkeletonRows(rows = 5, cols = 5) {
    return Array.from({ length: rows }, () =>
        `<tr>${Array.from({length: cols}, () => `<td><div class="skeleton skeleton-text"></div></td>`).join('')}</tr>`
    ).join('');
}

/** Export customers to CSV */
export function exportCustomersCSV(customers) {
    const headers = 'Name,Email,Phone,City,State,GSTIN,Country\n';
    const rows = customers.map(c =>
        [c.name,c.email,c.phone,c.city,c.state,c.gstin,c.country].map(v=>`"${v||''}"`).join(',')
    ).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'kosha_customers.csv';
    a.click();
}

/** Confirm dialog helper */
export function confirmDialog(message) {
    return new Promise(resolve => resolve(window.confirm(message)));
}

let appParticleFrameId = null;
function initGlobalParticleCanvas() {
    if (window._particleCanvasInitialized) return;
    
    const canvas = document.getElementById('app-particle-canvas');
    if (!canvas) return;
    
    window._particleCanvasInitialized = true;
    const ctx = canvas.getContext('2d');

    let resizeHandler = function resize() {
        if (!canvas.parentElement) return;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    };
    resizeHandler();
    window.addEventListener('resize', resizeHandler);

    const particles = [];
    const count = 75; // Increased density from 45 to 75

    for (let i = 0; i < count; i++) {
        const rand = Math.random();
        let colorStr = 'rgba(255, 255, 255,'; // Pure white/sparkling stars
        if (rand < 0.35) {
            colorStr = 'rgba(16, 101, 255,'; // Brand primary blue stars
        } else if (rand < 0.7) {
            colorStr = 'rgba(23, 230, 174,'; // Accent green stars
        }

        particles.push({
            x: Math.random() * (window.innerWidth || 1000),
            y: Math.random() * (window.innerHeight || 800),
            vx: (Math.random() - 0.5) * 0.45,
            vy: (Math.random() - 0.5) * 0.45,
            radius: Math.random() * 2.5 + 1.5, // Increased size from 2+1 to 2.5+1.5
            alpha: Math.random() * 0.5 + 0.35, // Increased opacity from 0.4+0.15 to 0.5+0.35
            color: colorStr
        });
    }

    function animate() {
        if (!document.getElementById('app-particle-canvas')) return; // stop animating if element is gone
        const w = window.innerWidth;
        const h = window.innerHeight;
        ctx.clearRect(0, 0, w, h);

        for (let i = 0; i < count; i++) {
            const p = particles[i];
            p.x += p.vx;
            p.y += p.vy;

            if (p.x < 0 || p.x > w) p.vx *= -1;
            if (p.y < 0 || p.y > h) p.vy *= -1;

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = `${p.color}${p.alpha})`;
            ctx.fill();

            // Connect nearby particles
            for (let j = i + 1; j < count; j++) {
                const p2 = particles[j];
                const dx = p.x - p2.x;
                const dy = p.y - p2.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < 130) {
                    ctx.beginPath();
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.strokeStyle = `rgba(16, 101, 255, ${0.22 * (1 - dist / 130)})`; // Increased stroke opacity from 0.12 to 0.22
                    ctx.lineWidth = 0.65; // Increased line width from 0.5 to 0.65
                    ctx.stroke();
                }
            }
        }

        appParticleFrameId = requestAnimationFrame(animate);
    }

    animate();
}
