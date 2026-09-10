/**
 * Kosha - Login View Template
 */

export function getLoginHTML() {
    return `
    <div class="login-wrapper" style="display:flex;width:100%;min-height:100vh;">
        <!-- Global Background Elements -->
        <canvas id="login-particle-canvas" class="login-particle-canvas"></canvas>
        <div class="login-orb login-orb-1" aria-hidden="true"></div>
        <div class="login-orb login-orb-2" aria-hidden="true"></div>
        <div class="login-orb login-orb-3" aria-hidden="true"></div>
        <div class="login-grid-overlay" aria-hidden="true"></div>

        <!-- 3D Floating Geometric Shapes -->
        <div class="floating-shapes" aria-hidden="true">
            <div class="shape shape-cube">
                <div class="cube">
                    <div class="cube-face cube-front"></div>
                    <div class="cube-face cube-back"></div>
                    <div class="cube-face cube-left"></div>
                    <div class="cube-face cube-right"></div>
                    <div class="cube-face cube-top"></div>
                    <div class="cube-face cube-bottom"></div>
                </div>
            </div>
            <div class="shape shape-ring"></div>
            <div class="shape shape-pyramid">
                <div class="pyramid">
                    <div class="pyramid-face pyramid-front"></div>
                    <div class="pyramid-face pyramid-right"></div>
                    <div class="pyramid-face pyramid-back"></div>
                    <div class="pyramid-face pyramid-left"></div>
                    <div class="pyramid-base"></div>
                </div>
            </div>
            <div class="shape shape-sphere"></div>
            <div class="shape shape-octahedron">
                <div class="octahedron">
                    <div class="oct-face oct-1"></div>
                    <div class="oct-face oct-2"></div>
                    <div class="oct-face oct-3"></div>
                    <div class="oct-face oct-4"></div>
                </div>
            </div>
            <div class="shape shape-diamond">
                <div class="diamond-inner"></div>
            </div>
        </div>

        <!-- ══ LEFT PANEL — Redesigned 3D Hero ══════════════════════════ -->
        <div class="login-left">
            <!-- Top Bar: Logo + Version -->
            <div class="login-left-topbar">
                <img src="assets/img/Kosha long.svg" alt="Kosha Logo" class="login-logo-img" />
            </div>

            <!-- Hero Content -->
            <div class="login-left-hero">
                <div class="hero-label">
                    <span class="pulse-dot"></span>
                    Next-Gen Billing Suite
                </div>
                <h1 class="hero-title">
                    Manage invoices<br>
                    <span class="hero-gradient-text">effortlessly.</span>
                </h1>
                <p class="hero-description">
                    Real-time analytics, GST compliance, customer tracking,
                    and seamless cloud backups — all in one place.
                </p>
            </div>

            <!-- 3D Feature Cards with perspective tilt -->
            <div class="login-feature-cards" id="feature-cards-container">
                <div class="feature-card card-3d" data-tilt style="animation-delay: 0.1s;">
                    <div class="card-3d-glow"></div>
                    <div class="feature-card-icon"><i class="fa-solid fa-shield-halved"></i></div>
                    <div class="feature-card-body">
                        <h4>Enterprise Security</h4>
                        <p>Row-level security with end-to-end encryption</p>
                    </div>
                    <div class="card-3d-shine"></div>
                </div>
                <div class="feature-card card-3d" data-tilt style="animation-delay: 0.25s;">
                    <div class="card-3d-glow"></div>
                    <div class="feature-card-icon icon-bolt"><i class="fa-solid fa-bolt"></i></div>
                    <div class="feature-card-body">
                        <h4>Instant PDFs</h4>
                        <p>Generate professional invoices in milliseconds</p>
                    </div>
                    <div class="card-3d-shine"></div>
                </div>
                <div class="feature-card card-3d" data-tilt style="animation-delay: 0.4s;">
                    <div class="card-3d-glow"></div>
                    <div class="feature-card-icon icon-chart"><i class="fa-solid fa-chart-line"></i></div>
                    <div class="feature-card-body">
                        <h4>Live Analytics</h4>
                        <p>Real-time financial insights and reporting</p>
                    </div>
                    <div class="card-3d-shine"></div>
                </div>
            </div>

            <!-- Bottom Stats + Copyright -->
            <div class="login-left-bottom">
                <div class="login-stats-bar">
                    <div class="login-stat-item">
                        <span class="stat-value">10K+</span>
                        <span class="stat-label">Invoices</span>
                    </div>
                    <div class="stat-divider"></div>
                    <div class="login-stat-item">
                        <span class="stat-value">99.9%</span>
                        <span class="stat-label">Uptime</span>
                    </div>
                    <div class="stat-divider"></div>
                    <div class="login-stat-item">
                        <span class="stat-value">2x</span>
                        <span class="stat-label">Faster</span>
                    </div>
                </div>
                <p class="login-footer-text">
                    &copy; 2026 Kosha. A <b>SaaS</b> product by
                    <a href="https://gvpofficial.in" target="_blank" rel="noopener noreferrer" class="footer-logo-link">
                        <img src="assets/img/gvp_dezitech_dark.svg" alt="GVP Dezitech Logo" class="footer-logo-img" />
                    </a>
                </p>
            </div>
        </div>

        <!-- ══ RIGHT PANEL — 3D Login Card ════════════════════════════ -->
        <div class="login-right">
            <div class="login-card card-3d-main" id="login-card">
                <!-- 3D Ambient light reflection -->
                <div class="card-3d-ambient"></div>
                <div class="card-edge-glow"></div>

                <!-- Account Form Header -->
                <div class="login-card-header">
                    <h2 class="card-header-title">Welcome to <span class="ananda-namaste-font">Kosha.</span></h2>
                    <p class="card-header-subtitle">Sign in or create an account to get started</p>
                </div>

                <!-- Mode Tabs (Sign In / Sign Up) -->
                <div class="auth-tabs" role="tablist">
                    <button class="auth-tab-btn active" id="tab-signin-btn" type="button" role="tab" aria-selected="true">
                        <i class="fa-solid fa-right-from-bracket"></i> Sign In
                    </button>
                    <button class="auth-tab-btn" id="tab-signup-btn" type="button" role="tab" aria-selected="false">
                        <i class="fa-solid fa-user-plus"></i> Create Account
                    </button>
                </div>

                <!-- Alert Messages -->
                <div id="auth-alert" class="auth-alert" role="alert" aria-live="assertive">
                    <i class="fa-solid fa-circle-exclamation" id="auth-alert-icon"></i>
                    <div style="flex:1;">
                        <span id="auth-alert-text">Error message</span>
                        <button type="button" id="resend-verification-btn" class="resend-link-btn" style="display:none;">
                            <i class="fa-solid fa-paper-plane"></i> Resend Verification Email
                        </button>
                    </div>
                </div>

                <!-- Verification / Success Banner -->
                <div id="auth-success" class="auth-success" role="alert" aria-live="polite">
                    <i class="fa-solid fa-circle-check" style="font-size:1.2rem;"></i>
                    <div style="flex:1;">
                        <strong id="auth-success-title" style="display:block;margin-bottom:0.15rem;">Success</strong>
                        <span id="auth-success-text">Success message</span>
                    </div>
                </div>

                <!-- Forms Wrapper -->
                <div class="forms-container">

                    <!-- ── 1. SIGN IN FORM ── -->
                    <form id="signin-form" class="auth-form active" novalidate>
                        <div class="form-group">
                            <label class="form-label" for="signin-email">Email Address</label>
                            <div class="input-wrapper">
                                <i class="fa-solid fa-envelope input-icon"></i>
                                <input
                                    type="email"
                                    id="signin-email"
                                    class="form-control"
                                    placeholder="you@domain.com"
                                    autocomplete="email"
                                    required
                                />
                            </div>
                        </div>

                        <div class="form-group">
                            <label class="form-label" for="signin-password">Password</label>
                            <div class="input-wrapper">
                                <i class="fa-solid fa-lock input-icon"></i>
                                <input
                                    type="password"
                                    id="signin-password"
                                    class="form-control"
                                    placeholder="••••••••"
                                    autocomplete="current-password"
                                    required
                                />
                                <button type="button" class="password-toggle" data-target="signin-password" aria-label="Toggle visibility">
                                    <i class="fa-solid fa-eye"></i>
                                </button>
                            </div>
                            <div class="login-extras">
                                <label class="login-remember">
                                    <input type="checkbox" id="remember-me" checked /> Keep me signed in
                                </label>
                                <a href="#" class="forgot-link" id="show-forgot-btn">Forgot password?</a>
                            </div>
                        </div>

                        <button type="submit" class="btn-gvp-primary" id="signin-submit-btn">
                            <span class="btn-spinner" aria-hidden="true"></span>
                            <span class="btn-text">Sign In to Dashboard <i class="fa-solid fa-arrow-right"></i></span>
                        </button>
                    </form>

                    <!-- ── 2. CREATE ACCOUNT FORM ── -->
                    <form id="signup-form" class="auth-form" novalidate>
                        <div class="form-group">
                            <label class="form-label" for="signup-name">Full Name</label>
                            <div class="input-wrapper">
                                <i class="fa-solid fa-user input-icon"></i>
                                <input
                                    type="text"
                                    id="signup-name"
                                    class="form-control"
                                    placeholder="Gupthan Vishnu Prasad"
                                    autocomplete="name"
                                    required
                                />
                            </div>
                        </div>

                        <div class="form-group">
                            <label class="form-label" for="signup-email">Email Address</label>
                            <div class="input-wrapper">
                                <i class="fa-solid fa-envelope input-icon"></i>
                                <input
                                    type="email"
                                    id="signup-email"
                                    class="form-control"
                                    placeholder="name@company.com"
                                    autocomplete="email"
                                    required
                                />
                            </div>
                        </div>

                        <div class="form-group">
                            <label class="form-label" for="signup-password">Password</label>
                            <div class="input-wrapper">
                                <i class="fa-solid fa-lock input-icon"></i>
                                <input
                                    type="password"
                                    id="signup-password"
                                    class="form-control"
                                    placeholder="At least 6 characters"
                                    autocomplete="new-password"
                                    required
                                />
                                <button type="button" class="password-toggle" data-target="signup-password" aria-label="Toggle visibility">
                                    <i class="fa-solid fa-eye"></i>
                                </button>
                            </div>
                        </div>

                        <div class="form-group">
                            <label class="form-label" for="signup-confirm">Confirm Password</label>
                            <div class="input-wrapper">
                                <i class="fa-solid fa-shield-halved input-icon"></i>
                                <input
                                    type="password"
                                    id="signup-confirm"
                                    class="form-control"
                                    placeholder="Re-enter password"
                                    autocomplete="new-password"
                                    required
                                />
                            </div>
                        </div>

                        <button type="submit" class="btn-gvp-primary" id="signup-submit-btn">
                            <span class="btn-spinner" aria-hidden="true"></span>
                            <span class="btn-text">Create Account <i class="fa-solid fa-user-check"></i></span>
                        </button>
                    </form>

                    <!-- ── 3. FORGOT PASSWORD FORM ── -->
                    <div id="forgot-panel" class="auth-form">
                        <button type="button" id="back-to-login-btn" class="btn-back">
                            <i class="fa-solid fa-arrow-left"></i> Back to Sign In
                        </button>
                        <h3 class="form-heading">Reset Password</h3>
                        <p class="form-subheading">Enter your email and we'll send a password recovery link.</p>

                        <form id="forgot-form" novalidate>
                            <div class="form-group mb-3">
                                <label class="form-label" for="forgot-email">Email Address</label>
                                <div class="input-wrapper">
                                    <i class="fa-solid fa-envelope input-icon"></i>
                                    <input
                                        type="email"
                                        id="forgot-email"
                                        class="form-control"
                                        placeholder="you@domain.com"
                                        autocomplete="email"
                                        required
                                    />
                                </div>
                            </div>
                            <button type="submit" class="btn-gvp-primary" id="forgot-submit-btn">
                                <span class="btn-spinner" aria-hidden="true"></span>
                                <span class="btn-text">Send Recovery Link <i class="fa-solid fa-paper-plane"></i></span>
                            </button>
                        </form>
                    </div>

                </div><!-- /forms-container -->

                <!-- Terms & Privacy Policy Notice -->
                <p class="auth-terms-notice">
                    By continuing, you agree to the <a href="#" class="terms-link">Terms</a> and <a href="#" class="terms-link">Privacy Policy</a>.
                </p>

                <!-- ── Verification Overlay ── -->
                <div id="verification-overlay" class="verification-overlay">
                    <div class="vo-icon-wrap">
                        <i class="fa-solid fa-envelope-circle-check"></i>
                    </div>
                    <h2 class="vo-title" id="vo-title">Check Your Email</h2>
                    <p class="vo-message" id="vo-message">We've sent a verification link to</p>
                    <div class="vo-email-highlight" id="vo-email">user@email.com</div>
                    <p class="vo-tip"><i class="fa-solid fa-lightbulb"></i> Didn't receive it? Check your spam or junk folder.</p>
                    <button type="button" class="vo-btn-resend" id="vo-resend-btn">
                        <i class="fa-solid fa-paper-plane"></i> Resend Verification Email
                    </button>
                    <button type="button" class="vo-back-link" id="vo-back-btn">
                        <i class="fa-solid fa-arrow-left"></i> Back to Sign In
                    </button>
                </div>

            </div>
        </div>
    </div>
    `;
}
