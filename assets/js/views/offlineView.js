/**
 * Kosha - Offline View Template
 */

export function getOfflineHTML() {
    return `
    <div class="offline-container" style="text-align:center;padding:2rem;max-width:420px;margin:5rem auto;">
        <div class="offline-icon" style="width:80px;height:80px;border-radius:50%;background:rgba(251,191,36,0.1);border:1px solid rgba(251,191,36,0.25);display:flex;align-items:center;justify-content:center;margin:0 auto 1.5rem;font-size:2rem;color:#FBBF24;">&#x1F4F6;</div>
        <h1 style="font-size:1.8rem;font-weight:800;margin-bottom:0.75rem;letter-spacing:-0.02em;">You're Offline</h1>
        <p style="font-size:0.95rem;color:#94A3B8;line-height:1.6;margin-bottom:2rem;">Please check your internet connection. The app will automatically reconnect when your network is available.</p>
        <button class="btn btn-primary" onclick="window.location.reload()" style="padding:0.75rem 2rem;font-weight:700;">Try Again</button>
    </div>
    `;
}
