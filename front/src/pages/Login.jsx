import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import "./Login.css";

export default function Login() {
  const { login } = useAuth();

  const [credential, setCredential] = useState("");
  const [password,   setPassword]   = useState("");
  const [remember,   setRemember]   = useState(false);
  const [error,      setError]      = useState("");
  const [loading,    setLoading]    = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(credential.trim(), password);
      // AuthContext sets isAuthenticated → App re-renders with dashboard
    } catch (err) {
      setError(err.body?.message ?? err.message ?? "Invalid credentials");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="academic-bg">
      {/* ── Brand header ── */}
      <div className="page-title">
        <h1 className="brand-title">
          <span className="brand-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
              />
            </svg>
          </span>
          Sabboora
        </h1>
        <p className="brand-sub">The Digital Learning Workspace</p>
      </div>

      {/* ── Login card ── */}
      <div className="glass-card">
        <div className="card-hd">
          <h2>Sign In</h2>
          <p>Welcome back to your workspace</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          {error && <div className="form-err" role="alert">{error}</div>}

          {/* Email / Username */}
          <div className="field">
            <label htmlFor="lf-cred">Email or Username</label>
            <input
              id="lf-cred"
              name="email"
              type="text"
              required
              autoComplete="username"
              placeholder="Enter your credentials"
              value={credential}
              onChange={e => setCredential(e.target.value)}
            />
          </div>

          {/* Password */}
          <div className="field">
            <div className="field-label-row">
              <label htmlFor="lf-pass">Password</label>
              <a className="forgot" href="#">Forgot Password?</a>
            </div>
            <input
              id="lf-pass"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>

          {/* Remember me */}
          <div className="remember">
            <input
              id="lf-rem"
              type="checkbox"
              checked={remember}
              onChange={e => setRemember(e.target.checked)}
            />
            <label htmlFor="lf-rem">Keep me logged in</label>
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? "Signing in…" : "Log In"}
          </button>
        </form>

        {/* Social divider */}
        <div className="soc-divider">
          <span>Or continue with</span>
        </div>

        {/* Social buttons */}
        <div className="soc-grid">
          <button type="button" className="soc-btn">
            <img
              alt="Google"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCLX8rIvs2xA6cPKwwuWplJ-jpI9DTch4HBcfkXT1MSSU17vjLxMXJESrJEtBrMiMn85I9K6ZmPguka2xKOo_7OUZnPiCFb77HT5i_72Ypb5WvC3uQIG8eyyOQFXTZwFCK6JPE62FSuuPYr9nG0D7NwGTtKx1G7o_wxT0Gwdso6rCoFxJUp9FkHvaIlMw5tchg0qg-aD2XCLEzmmu3kL-vErlN0Mmnnxr1yvcisP85CuGyOp-uqYpTEng0e5TDzEP3kf5QZSc2lzw"
            />
            Google
          </button>
          <button type="button" className="soc-btn">
            <img
              alt="Microsoft"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAZ2FzlZlBkDy-y7yXbyE0N4eqZRy3SZGztmUk5muQmKnKoOfwZU04JmYfSrKdCWM2T-czA3UmOgygVMlF75RFyfgYoKpY_mKqL5m25bdGZcXz2BajA8Z5nPZccx6gTvSUunNnXvkLUONgsOVGOOwBgrGJpUyKiQF3X1R_ucRGMPKp-a8EtknwqFWKBzX7KvedGEhLK_mhf7LZyxDTaR_yhEm8uWp1hAgLcJoc_kBZNztPRtH0MTkWrqcVbcIJy7GZ1L1_lxXglvQ"
            />
            Microsoft
          </button>
        </div>

        {/* Card footer */}
        <div className="card-footer">
          <p>
            New to Sabboora?
            <a href="#">Create an account</a>
          </p>
        </div>
      </div>

      {/* Legal footer */}
      <footer className="legal">
        <div className="legal-line" />
        <p>© 2025 Sabboora EdTech. All Rights Reserved.</p>
      </footer>
    </main>
  );
}
