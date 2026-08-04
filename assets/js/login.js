/**
 * Kosha - Authentication Logic (Sign In & Sign Up)
 */

import { signInWithEmail, signUpWithEmail, getCurrentUser, supabase } from './supabase.js';

document.addEventListener('DOMContentLoaded', async () => {
    // Redirect if already authenticated
    const user = await getCurrentUser();
    if (user) {
        window.location.replace('dashboard.html');
        return;
    }

    initAuthPage();
});

function initAuthPage() {
    const tabSigninBtn  = document.getElementById('tab-signin-btn');
    const tabSignupBtn  = document.getElementById('tab-signup-btn');
    const signinForm    = document.getElementById('signin-form');
    const signupForm    = document.getElementById('signup-form');
    const forgotPanel   = document.getElementById('forgot-panel');
    const forgotForm    = document.getElementById('forgot-form');
    const showForgotBtn = document.getElementById('show-forgot-btn');
    const backToLoginBtn= document.getElementById('back-to-login-btn');
    const alertEl       = document.getElementById('auth-alert');
    const alertText     = document.getElementById('auth-alert-text');
    const successEl     = document.getElementById('auth-success');
    const successText   = document.getElementById('auth-success-text');

    // ── Tab Switcher ───────────────────────────────────────
    function switchTab(mode) {
        hideAlert();
        hideSuccess();

        if (mode === 'signin') {
            tabSigninBtn.classList.add('active');
            tabSigninBtn.setAttribute('aria-selected', 'true');
            tabSignupBtn.classList.remove('active');
            tabSignupBtn.setAttribute('aria-selected', 'false');
            signinForm.classList.add('active');
            signupForm.classList.remove('active');
            forgotPanel.classList.remove('active');
        } else if (mode === 'signup') {
            tabSignupBtn.classList.add('active');
            tabSignupBtn.setAttribute('aria-selected', 'true');
            tabSigninBtn.classList.remove('active');
            tabSigninBtn.setAttribute('aria-selected', 'false');
            signupForm.classList.add('active');
            signinForm.classList.remove('active');
            forgotPanel.classList.remove('active');
        } else if (mode === 'forgot') {
            tabSigninBtn.classList.remove('active');
            tabSignupBtn.classList.remove('active');
            signinForm.classList.remove('active');
            signupForm.classList.remove('active');
            forgotPanel.classList.add('active');
        }
    }

    tabSigninBtn?.addEventListener('click', () => switchTab('signin'));
    tabSignupBtn?.addEventListener('click', () => switchTab('signup'));
    showForgotBtn?.addEventListener('click', (e) => { e.preventDefault(); switchTab('forgot'); });
    backToLoginBtn?.addEventListener('click', () => switchTab('signin'));

    // ── Password Visibility Toggles ────────────────────────
    document.querySelectorAll('.password-toggle').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.dataset.target;
            const input = document.getElementById(targetId);
            const icon = btn.querySelector('i');
            if (input) {
                const isPass = input.type === 'password';
                input.type = isPass ? 'text' : 'password';
                icon.className = isPass ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye';
            }
        });
    });

    // ── 1. SIGN IN SUBMIT ──────────────────────────────────
    signinForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideAlert(); hideSuccess();

        const email    = document.getElementById('signin-email').value.trim();
        const password = document.getElementById('signin-password').value;
        const remember = document.getElementById('remember-me').checked;

        if (!email || !password) {
            showAlert('Please enter your email and password.');
            return;
        }

        setLoading('signin-submit-btn', true);

        const { data, error } = await signInWithEmail(email, password);

        if (error) {
            setLoading('signin-submit-btn', false);
            showAlert(error.message || 'Login failed. Please check your credentials.');
            return;
        }

        if (remember) {
            localStorage.setItem('kosha_remember_email', email);
        } else {
            localStorage.removeItem('kosha_remember_email');
        }

        window.location.replace('dashboard.html');
    });

    // ── 2. CREATE ACCOUNT SUBMIT ───────────────────────────
    signupForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideAlert(); hideSuccess();

        const fullName = document.getElementById('signup-name').value.trim();
        const email    = document.getElementById('signup-email').value.trim();
        const password = document.getElementById('signup-password').value;
        const confirm  = document.getElementById('signup-confirm').value;

        if (!fullName || !email || !password) {
            showAlert('Please fill in all required fields.');
            return;
        }

        if (password.length < 6) {
            showAlert('Password must be at least 6 characters long.');
            return;
        }

        if (password !== confirm) {
            showAlert('Passwords do not match.');
            return;
        }

        setLoading('signup-submit-btn', true);

        const { data, error } = await signUpWithEmail(email, password, { full_name: fullName });

        setLoading('signup-submit-btn', false);

        if (error) {
            showAlert(error.message || 'Failed to create account.');
            return;
        }

        // If auto sign-in happens or verification email is sent
        if (data?.session) {
            showSuccess('Account created! Redirecting to dashboard…');
            setTimeout(() => { window.location.replace('dashboard.html'); }, 1200);
        } else {
            showSuccess('Account created successfully! You can now Sign In.');
            signupForm.reset();
            setTimeout(() => switchTab('signin'), 1800);
        }
    });

    // ── 3. FORGOT PASSWORD SUBMIT ──────────────────────────
    forgotForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideAlert(); hideSuccess();

        const email = document.getElementById('forgot-email').value.trim();

        if (!email) {
            showAlert('Please enter your email address.');
            return;
        }

        setLoading('forgot-submit-btn', true);

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/settings.html`
        });

        setLoading('forgot-submit-btn', false);

        if (error) {
            showAlert(error.message || 'Failed to send reset email.');
        } else {
            showSuccess('Password reset link sent to your email!');
            document.getElementById('forgot-email').value = '';
        }
    });

    // ── Pre-fill Remembered Email ──────────────────────────
    const remembered = localStorage.getItem('kosha_remember_email');
    if (remembered) {
        const emailInput = document.getElementById('signin-email');
        if (emailInput) emailInput.value = remembered;
    }

    // ── Helpers ────────────────────────────────────────────
    function showAlert(msg) {
        alertText.textContent = msg;
        alertEl.classList.add('show');
    }
    function hideAlert() { alertEl.classList.remove('show'); }

    function showSuccess(msg) {
        successText.textContent = msg;
        successEl.classList.add('show');
    }
    function hideSuccess() { successEl.classList.remove('show'); }

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
