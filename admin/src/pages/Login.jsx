import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import "./Login.css";

export default function Login() {
  const { login }              = useAuth();
  const navigate               = useNavigate();
  const [email,    setEmail]   = useState("");
  const [password, setPassword]= useState("");
  const [error,    setError]   = useState("");
  const [loading,  setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email.trim(), password);
      navigate("/");
    } catch (err) {
      setError(err.body?.message ?? err.message ?? "Login failed");
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
        <p className="brand-sub">Admin Control Panel</p>
      </div>

      {/* ── Login card ── */}
      <div className="glass-card">
        <div className="card-hd">
          <h2>Administrator Sign In</h2>
          <p>Restricted to admin accounts only</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          {error && <div className="form-err" role="alert">{error}</div>}

          <div className="field">
            <label htmlFor="adm-email">Admin Email</label>
            <input
              id="adm-email"
              name="email"
              type="email"
              required
              autoComplete="username"
              placeholder="demo-admin@school.local"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>

          <div className="field">
            <div className="field-label-row">
              <label htmlFor="adm-pass">Password</label>
              <a className="forgot" href="#">Forgot Password?</a>
            </div>
            <input
              id="adm-pass"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? "Verifying…" : "Sign In to Admin Panel"}
          </button>
        </form>

        {/* Admin role notice */}
        <div className="admin-notice">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          This portal is for administrators only. Teachers, students and parents
          should use the <a href="http://localhost:5173" target="_blank" rel="noreferrer">main platform</a>.
        </div>
      </div>

      {/* Legal footer */}
      <footer className="legal">
        <div className="legal-line" />
        <p>© 2025 Sabboora EdTech — Admin Portal</p>
      </footer>
    </main>
  );
}
