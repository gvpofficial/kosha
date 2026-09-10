import { getCurrentUser, signInWithEmail, signUpWithEmail, supabase } from './supabase.js';

let animFrameId = null;
let resizeHandler = null;

export async function initLoginPage() {
    // Redirect if already authenticated
    const user = await getCurrentUser();
    if (user) {
        if (typeof window.navigateTo === 'function') {
            window.navigateTo('dashboard', { replaceState: true });
        } else {
            window.location.hash = '#/dashboard';
        }
        return;
    }

    initAuthPage();
    init3DTilt();
    initParticleCanvas();
}

export function cleanupLoginPage() {
    if (animFrameId) {
        cancelAnimationFrame(animFrameId);
        animFrameId = null;
    }
    if (resizeHandler) {
        window.removeEventListener('resize', resizeHandler);
        resizeHandler = null;
    }
}



function initAuthPage() {
    const tabSigninBtn   = document.getElementById('tab-signin-btn');
    const tabSignupBtn   = document.getElementById('tab-signup-btn');
    const signinForm     = document.getElementById('signin-form');
    const signupForm     = document.getElementById('signup-form');
    const forgotPanel    = document.getElementById('forgot-panel');
    const forgotForm     = document.getElementById('forgot-form');
    const showForgotBtn  = document.getElementById('show-forgot-btn');
    const backToLoginBtn = document.getElementById('back-to-login-btn');
    const alertEl        = document.getElementById('auth-alert');
    const alertText      = document.getElementById('auth-alert-text');
    const resendBtn      = document.getElementById('resend-verification-btn');
    const successEl      = document.getElementById('auth-success');
    const successTitle   = document.getElementById('auth-success-title');
    const successText    = document.getElementById('auth-success-text');

    // Verification overlay elements
    const verifyOverlay  = document.getElementById('verification-overlay');
    const voTitle        = document.getElementById('vo-title');
    const voMessage      = document.getElementById('vo-message');
    const voEmail        = document.getElementById('vo-email');
    const voResendBtn    = document.getElementById('vo-resend-btn');
    const voBackBtn      = document.getElementById('vo-back-btn');

    let lastAttemptedEmail = '';

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
        lastAttemptedEmail = email;

        if (!email || !password) {
            showAlert('Please enter your email and password.');
            return;
        }

        setLoading('signin-submit-btn', true);

        const { data, error } = await signInWithEmail(email, password);

        setLoading('signin-submit-btn', false);

        if (error) {
            const msg = error.message || '';
            if (msg.toLowerCase().includes('email not confirmed') || msg.toLowerCase().includes('unconfirmed')) {
                showVerificationOverlay(email, 'unverified');
            } else {
                showAlert(msg || 'Login failed. Please check your credentials.', false);
            }
            return;
        }

        if (remember) {
            localStorage.setItem('kosha_remember_email', email);
        } else {
            localStorage.removeItem('kosha_remember_email');
        }

        if (typeof window.navigateTo === 'function') {
            window.navigateTo('dashboard', { replaceState: true });
        } else {
            window.location.hash = '#/dashboard';
        }
    });

    // ── 2. CREATE ACCOUNT SUBMIT ───────────────────────────
    signupForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideAlert(); hideSuccess();

        const fullName = document.getElementById('signup-name').value.trim();
        const email    = document.getElementById('signup-email').value.trim();
        const password = document.getElementById('signup-password').value;
        const confirm  = document.getElementById('signup-confirm').value;
        lastAttemptedEmail = email;

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

        if (data?.session) {
            showSuccess('Account created!', 'Redirecting to dashboard…');
            setTimeout(() => {
                if (typeof window.navigateTo === 'function') {
                    window.navigateTo('dashboard', { replaceState: true });
                } else {
                    window.location.hash = '#/dashboard';
                }
            }, 1200);
        } else {
            signupForm.reset();
            const signinEmail = document.getElementById('signin-email');
            if (signinEmail) signinEmail.value = email;
            showVerificationOverlay(email, 'post-signup');
        }
    });

    // ── 3. RESEND VERIFICATION EMAIL ────────────────────────
    resendBtn?.addEventListener('click', async () => {
        if (!lastAttemptedEmail) {
            lastAttemptedEmail = document.getElementById('signin-email')?.value.trim();
        }

        if (!lastAttemptedEmail) {
            showAlert('Please enter your email address first.');
            return;
        }

        resendBtn.disabled = true;
        resendBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sending…';

        const { error } = await supabase.auth.resend({
            type: 'signup',
            email: lastAttemptedEmail
        });

        resendBtn.disabled = false;
        resendBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Resend Verification Email';

        if (error) {
            showAlert(error.message || 'Failed to resend verification email.');
        } else {
            showSuccess('Verification Email Resent!', `A new link was sent to ${lastAttemptedEmail}. Check your inbox.`);
            hideAlert();
        }
    });

    // ── 4. FORGOT PASSWORD SUBMIT ──────────────────────────
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
            showSuccess('Reset Link Sent!', `Password recovery email sent to ${email}. Check your inbox.`);
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
    function showAlert(msg, showResendOption = false) {
        alertText.textContent = msg;
        alertEl.classList.add('show');
        if (resendBtn) resendBtn.style.display = showResendOption ? 'inline-flex' : 'none';
    }
    function hideAlert() {
        alertEl.classList.remove('show');
        if (resendBtn) resendBtn.style.display = 'none';
    }

    function showSuccess(title, text) {
        successTitle.textContent = title;
        successText.textContent = text;
        successEl.classList.add('show');
    }
    function hideSuccess() { successEl.classList.remove('show'); }

    // ── Verification Overlay ──────────────────────────────
    function showVerificationOverlay(email, mode) {
        hideAlert(); hideSuccess();
        // Hide forms and tabs
        signinForm.classList.remove('active');
        signupForm.classList.remove('active');
        forgotPanel.classList.remove('active');
        tabSigninBtn.classList.remove('active');
        tabSignupBtn.classList.remove('active');
        document.querySelector('.auth-tabs').style.display = 'none';
        document.querySelector('.forms-container').style.display = 'none';
        const termsNotice = document.querySelector('.auth-terms-notice');
        if (termsNotice) termsNotice.style.display = 'none';

        // Set content based on mode
        if (mode === 'post-signup') {
            voTitle.textContent = 'Check Your Email';
            voMessage.textContent = "We've sent a verification link to";
        } else {
            voTitle.textContent = 'Email Verification Required';
            voMessage.textContent = 'Please verify your email before signing in.';
        }
        voEmail.textContent = email;
        voResendBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Resend Verification Email';
        voResendBtn.classList.remove('sent');
        voResendBtn.disabled = false;
        verifyOverlay.classList.add('active');
    }

    function hideVerificationOverlay() {
        verifyOverlay.classList.remove('active');
        document.querySelector('.auth-tabs').style.display = '';
        document.querySelector('.forms-container').style.display = '';
        const termsNotice = document.querySelector('.auth-terms-notice');
        if (termsNotice) termsNotice.style.display = '';
        switchTab('signin');
    }

    // ── Verification Overlay Buttons ──────────────────────
    voBackBtn?.addEventListener('click', () => {
        hideVerificationOverlay();
    });

    voResendBtn?.addEventListener('click', async () => {
        const email = voEmail.textContent;
        if (!email || email === 'user@email.com') return;

        voResendBtn.disabled = true;
        voResendBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sending…';

        const { error } = await supabase.auth.resend({
            type: 'signup',
            email
        });

        if (error) {
            voResendBtn.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i> Failed — Try Again';
            voResendBtn.disabled = false;
        } else {
            voResendBtn.innerHTML = '<i class="fa-solid fa-circle-check"></i> Email Sent!';
            voResendBtn.classList.add('sent');
            setTimeout(() => {
                voResendBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Resend Verification Email';
                voResendBtn.classList.remove('sent');
                voResendBtn.disabled = false;
            }, 4000);
        }
    });

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

// ════════════════════════════════════════════════════════════════
//  3D PERSPECTIVE TILT & INTERACTIVE EFFECTS
// ════════════════════════════════════════════════════════════════
function init3DTilt() {
    // ── Main Login Card Tilt ──────────────────────────────
    const loginCard = document.getElementById('login-card');
    if (loginCard) {
        loginCard.addEventListener('mousemove', (e) => {
            const rect = loginCard.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // Update CSS variables for ambient light reflection
            loginCard.style.setProperty('--card-mouse-x', `${x}px`);
            loginCard.style.setProperty('--card-mouse-y', `${y}px`);
            
            // Calculate tilt angle (max 8 degrees)
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const tiltX = -((y - centerY) / centerY) * 8;
            const tiltY = ((x - centerX) / centerX) * 8;
            
            loginCard.style.transform = `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateZ(10px)`;
        });
        
        loginCard.addEventListener('mouseleave', () => {
            loginCard.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0)';
            loginCard.style.setProperty('--card-mouse-x', '50%');
            loginCard.style.setProperty('--card-mouse-y', '50%');
        });
    }

    // ── Feature Cards Tilt ────────────────────────────────
    const featureCards = document.querySelectorAll('.feature-card.card-3d');
    featureCards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            card.style.setProperty('--mouse-x', `${x}px`);
            card.style.setProperty('--mouse-y', `${y}px`);
            
            // Calculate tilt angle (max 10 degrees)
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const tiltX = -((y - centerY) / centerY) * 10;
            const tiltY = ((x - centerX) / centerX) * 10;
            
            card.style.transform = `translateY(-6px) perspective(600px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateZ(20px)`;
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = '';
            card.style.setProperty('--mouse-x', '50%');
            card.style.setProperty('--mouse-y', '50%');
        });
    });
}

// ════════════════════════════════════════════════════════════════
//  BACKGROUND PARTICLE CANVAS ANIMATION
// ════════════════════════════════════════════════════════════════
function initParticleCanvas() {
    const canvas = document.getElementById('login-particle-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    resizeHandler = function resize() {
        if (!canvas.parentElement) return;
        canvas.width = canvas.parentElement.offsetWidth;
        canvas.height = canvas.parentElement.offsetHeight;
    };
    resizeHandler();

    window.addEventListener('resize', resizeHandler);

    const particles = [];
    const count = 40;

    for (let i = 0; i < count; i++) {
        particles.push({
            x: Math.random() * (canvas.width || 500),
            y: Math.random() * (canvas.height || 500),
            vx: (Math.random() - 0.5) * 0.4,
            vy: (Math.random() - 0.5) * 0.4,
            radius: Math.random() * 2 + 1,
            alpha: Math.random() * 0.5 + 0.2,
            color: Math.random() > 0.4 ? 'rgba(16, 101, 255,' : 'rgba(23, 230, 174,'
        });
    }

    function animate() {
        const w = canvas.width || 500;
        const h = canvas.height || 500;
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

                if (dist < 110) {
                    ctx.beginPath();
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.strokeStyle = `rgba(16, 101, 255, ${0.15 * (1 - dist / 110)})`;
                    ctx.lineWidth = 0.6;
                    ctx.stroke();
                }
            }
        }

        animFrameId = requestAnimationFrame(animate);
    }

    animate();
}
