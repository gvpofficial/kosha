/**
 * Kosha - Login Page Logic
 */

import { signInWithEmail, signUpWithEmail, getCurrentUser, supabase } from './supabase.js';

document.addEventListener('DOMContentLoaded', async () => {
    // Already logged in → redirect
    const user = await getCurrentUser();
    if (user) {
        window.location.href = 'dashboard.html';
        return;
    }

    initLoginPage();
});

function initLoginPage() {
    const loginForm       = document.getElementById('login-form');
    const forgotForm      = document.getElementById('forgot-form');
    const loginWrapper    = document.getElementById('login-form-wrapper');
    const forgotPanel     = document.getElementById('forgot-panel');
    const showForgotBtn   = document.getElementById('show-forgot-btn');
    const backToLoginBtn  = document.getElementById('back-to-login-btn');
    const togglePasswordBtn = document.getElementById('toggle-password');
    const passwordInput   = document.getElementById('login-password');
    const toggleIcon      = document.getElementById('toggle-password-icon');
    const loginErrorEl    = document.getElementById('login-error');
    const loginErrorText  = document.getElementById('login-error-text');
    const forgotSuccess   = document.getElementById('forgot-success-msg');

    // ── Password visibility toggle ─────────────────────────
    togglePasswordBtn?.addEventListener('click', () => {
        const isPass = passwordInput.type === 'password';
        passwordInput.type = isPass ? 'text' : 'password';
        toggleIcon.className = isPass ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye';
    });

    // ── Show forgot panel ──────────────────────────────────
    showForgotBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        loginWrapper.classList.add('hidden');
        forgotPanel.classList.add('show');
    });

    backToLoginBtn?.addEventListener('click', () => {
        forgotPanel.classList.remove('show');
        loginWrapper.classList.remove('hidden');
        forgotSuccess.classList.remove('show');
    });

    // ── Login form submit ──────────────────────────────────
    loginForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email    = document.getElementById('login-email').value.trim();
        const password = passwordInput.value;
        const remember = document.getElementById('remember-me').checked;

        // Validate
        if (!email || !password) {
            showLoginError('Please enter your email and password.');
            return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            showLoginError('Please enter a valid email address.');
            return;
        }

        setLoading('login-submit-btn', true);
        hideLoginError();

        const { data, error } = await signInWithEmail(email, password);

        if (error) {
            setLoading('login-submit-btn', false);
            showLoginError(error.message || 'Login failed. Please check your credentials.');
            return;
        }

        // Store remember preference
        if (remember) {
            localStorage.setItem('kosha_remember_email', email);
        } else {
            localStorage.removeItem('kosha_remember_email');
        }

        // Redirect to dashboard
        window.location.href = 'dashboard.html';
    });

    // ── Forgot password submit ─────────────────────────────
    forgotForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('forgot-email').value.trim();

        if (!email) {
            alert('Please enter your email address.');
            return;
        }

        setLoading('forgot-submit-btn', true);

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/settings.html`
        });

        setLoading('forgot-submit-btn', false);

        if (error) {
            alert(error.message || 'Failed to send reset email.');
        } else {
            forgotSuccess.classList.add('show');
            document.getElementById('forgot-email').value = '';
        }
    });

    // ── Pre-fill remembered email ──────────────────────────
    const rememberedEmail = localStorage.getItem('kosha_remember_email');
    if (rememberedEmail) {
        const emailField = document.getElementById('login-email');
        if (emailField) { emailField.value = rememberedEmail; }
        const rememberChk = document.getElementById('remember-me');
        if (rememberChk) rememberChk.checked = true;
    }

    // ── Helper functions ───────────────────────────────────
    function showLoginError(msg) {
        loginErrorText.textContent = msg;
        loginErrorEl.classList.add('show');
    }
    function hideLoginError() { loginErrorEl.classList.remove('show'); }

    function setLoading(btnId, loading) {
        const btn = document.getElementById(btnId);
        if (!btn) return;
        if (loading) {
            btn.classList.add('loading');
            btn.disabled = true;
        } else {
            btn.classList.remove('loading');
            btn.disabled = false;
        }
    }
}
