import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import "./Login.css";

const CHALK_DECO = [
  { text: "E = mc²",       top: "7%",  left: "3.5%", rotate: "-3deg",   opacity: 0.22, size: "1.5rem"  },
  { text: "y = mx + b",    top: "20%", left: "2.5%", rotate: "-2deg",   opacity: 0.18, size: "1.1rem"  },
  { text: "a² + b² = c²",  top: "38%", left: "3%",   rotate: "-1.5deg", opacity: 0.19, size: "1.05rem" },
  { text: "F = ma",        top: "55%", left: "4%",   rotate: "-2.5deg", opacity: 0.17, size: "1.2rem"  },
  { text: "π ≈ 3.14159…",  top: "70%", left: "3.5%", rotate: "-1deg",   opacity: 0.16, size: "1rem"    },
  { text: "∑ f(x) dx",     top: "84%", left: "4.5%", rotate: "-2deg",   opacity: 0.14, size: "0.95rem" },
  { text: "Σn=1^∞ 1/n²",  top: "6%",  right: "4%",  rotate: "2deg",    opacity: 0.19, size: "1.1rem"  },
  { text: "H₂O + CO₂",    top: "22%", right: "3.5%", rotate: "3deg",   opacity: 0.17, size: "1rem"    },
  { text: "∫₀^∞ e^(-x²)", top: "37%", right: "3%",  rotate: "1.5deg",  opacity: 0.15, size: "1rem"    },
  { text: "DNA → RNA",     top: "53%", right: "4.5%", rotate: "2deg",   opacity: 0.16, size: "0.95rem" },
  { text: "v = λf",        top: "68%", right: "3.5%", rotate: "1deg",   opacity: 0.18, size: "1.2rem"  },
  { text: "∞",             top: "82%", right: "5%",  rotate: "0deg",    opacity: 0.12, size: "2rem"    },
];

export default function Login() {
  const { login } = useAuth();

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email.trim(), password);
      // AuthContext sets isAuthenticated → App renders the dashboard automatically
    } catch (err) {
      setError(err.body?.message ?? err.message ?? "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="board-wrap">
      {/* Grain / chalk-dust overlay */}
      <div className="board-grain" aria-hidden="true" />
      {/* Horizontal ruled lines */}
      <div className="board-lines" aria-hidden="true" />
      {/* Double chalk-line frame border */}
      <div className="board-frame" aria-hidden="true" />
      {/* Wooden chalk tray */}
      <div className="chalk-tray"  aria-hidden="true" />

      {/* Decorative chalk writings */}
      {CHALK_DECO.map((d, i) => (
        <span
          key={i}
          aria-hidden="true"
          className="chalk-deco"
          style={{
            top:       d.top,
            left:      d.left,
            right:     d.right,
            transform: `rotate(${d.rotate})`,
            opacity:   d.opacity,
            fontSize:  d.size,
          }}
        >
          {d.text}
        </span>
      ))}

      {/* ── Page header ── */}
      <header className="board-header">
        <h1 className="board-title">
          <span className="board-icon-wrap" aria-hidden="true">
            <svg className="board-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              />
            </svg>
          </span>
          Sabboora
        </h1>
        <p className="board-subtitle">The Digital Learning Workspace</p>
      </header>

      {/* ── Login card ── */}
      <div className="login-card" role="main">
        <div className="card-header">
          <h2 className="card-title">Sign In</h2>
          <p className="card-sub">Welcome back to your workspace</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form" noValidate>
          {/* Error banner */}
          {error && (
            <div className="form-error" role="alert">{error}</div>
          )}

          {/* Email */}
          <div className="field-group">
            <label className="field-label" htmlFor="sb-email">Email</label>
            <input
              id="sb-email"
              name="email"
              type="email"
              required
              autoComplete="username"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="field-input"
            />
          </div>

          {/* Password */}
          <div className="field-group">
            <div className="field-label-row">
              <label className="field-label" htmlFor="sb-password">Password</label>
              <a className="forgot-link" href="#">Forgot Password?</a>
            </div>
            <input
              id="sb-password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="field-input"
            />
          </div>

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? "Signing in…" : "Log In"}
          </button>
        </form>

        {/* Social login divider */}
        <div className="social-divider">
          <div className="divider-line" />
          <span className="divider-text">Or continue with</span>
          <div className="divider-line" />
        </div>

        {/* Social buttons */}
        <div className="social-grid">
          <button type="button" className="social-btn">
            <img
              alt="Google"
              className="social-logo"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCLX8rIvs2xA6cPKwwuWplJ-jpI9DTch4HBcfkXT1MSSU17vjLxMXJESrJEtBrMiMn85I9K6ZmPguka2xKOo_7OUZnPiCFb77HT5i_72Ypb5WvC3uQIG8eyyOQFXTZwFCK6JPE62FSuuPYr9nG0D7NwGTtKx1G7o_wxT0Gwdso6rCoFxJUp9FkHvaIlMw5tchg0qg-aD2XCLEzmmu3kL-vErlN0Mmnnxr1yvcisP85CuGyOp-uqYpTEng0e5TDzEP3kf5QZSc2lzw"
            />
            <span>Google</span>
          </button>
          <button type="button" className="social-btn">
            <img
              alt="Microsoft"
              className="social-logo"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAZ2FzlZlBkDy-y7yXbyE0N4eqZRy3SZGztmUk5muQmKnKoOfwZU04JmYfSrKdCWM2T-czA3UmOgygVMlF75RFyfgYoKpY_mKqL5m25bdGZcXz2BajA8Z5nPZccx6gTvSUunNnXvkLUONgsOVGOOwBgrGJpUyKiQF3X1R_ucRGMPKp-a8EtknwqFWKBzX7KvedGEhLK_mhf7LZyxDTaR_yhEm8uWp1hAgLcJoc_kBZNztPRtH0MTkWrqcVbcIJy7GZ1L1_lxXglvQ"
            />
            <span>Microsoft</span>
          </button>
        </div>
      </div>

      {/* Legal footer */}
      <footer className="legal-footer">
        <div className="legal-divider" />
        <p className="legal-text">© 2025 Sabboora EdTech. All Rights Reserved.</p>
      </footer>
    </div>
  );
}
