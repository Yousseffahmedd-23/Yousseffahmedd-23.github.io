import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import "./Login.css";

const CHALK = [
  { t: "7%",  l: "3.5%",  rot: "-3deg",   op: 0.2,  sz: "1.4rem", txt: "E = mc²"       },
  { t: "20%", l: "2.5%",  rot: "-2deg",   op: 0.17, sz: "1.1rem", txt: "y = mx + b"    },
  { t: "38%", l: "3%",    rot: "-1.5deg", op: 0.18, sz: "1rem",   txt: "a² + b² = c²"  },
  { t: "55%", l: "4%",    rot: "-2.5deg", op: 0.16, sz: "1.2rem", txt: "F = ma"         },
  { t: "70%", l: "3.5%",  rot: "-1deg",   op: 0.15, sz: "0.95rem",txt: "π ≈ 3.14159…"  },
  { t: "84%", l: "4.5%",  rot: "-2deg",   op: 0.13, sz: "0.9rem", txt: "∑ f(x) dx"     },
  { t: "6%",  r: "4%",    rot: "2deg",    op: 0.18, sz: "1.1rem", txt: "Σn=1^∞ 1/n²"  },
  { t: "22%", r: "3.5%",  rot: "3deg",    op: 0.16, sz: "1rem",   txt: "H₂O + CO₂"    },
  { t: "37%", r: "3%",    rot: "1.5deg",  op: 0.14, sz: "1rem",   txt: "∫₀^∞ e^(-x²)" },
  { t: "53%", r: "4.5%",  rot: "2deg",    op: 0.15, sz: "0.9rem", txt: "DNA → RNA"     },
  { t: "68%", r: "3.5%",  rot: "1deg",    op: 0.17, sz: "1.2rem", txt: "v = λf"        },
  { t: "82%", r: "5%",    rot: "0deg",    op: 0.11, sz: "2rem",   txt: "∞"             },
];

export default function Login() {
  const { login }              = useAuth();
  const navigate               = useNavigate();
  const [email, setEmail]      = useState("");
  const [password, setPassword]= useState("");
  const [error, setError]      = useState("");
  const [loading, setLoading]  = useState(false);

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
    <div className="board-wrap">
      <div className="board-grain"  aria-hidden="true" />
      <div className="board-lines"  aria-hidden="true" />
      <div className="board-frame"  aria-hidden="true" />
      <div className="chalk-tray"   aria-hidden="true" />

      {CHALK.map((d, i) => (
        <span key={i} aria-hidden="true" className="chalk-deco" style={{
          top:       d.t, left: d.l, right: d.r,
          transform: `rotate(${d.rot})`,
          opacity:   d.op, fontSize: d.sz,
        }}>{d.txt}</span>
      ))}

      <header className="board-header">
        <h1 className="board-title">
          <span className="board-icon-wrap" aria-hidden="true">
            <svg className="board-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"/>
            </svg>
          </span>
          Sabboora
        </h1>
        <p className="board-subtitle">Admin Control Panel</p>
      </header>

      <div className="login-card" role="main">
        <div className="card-header">
          <h2 className="card-title">Administrator Sign In</h2>
          <p className="card-sub">Restricted to admin accounts only</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form" noValidate>
          {error && <div className="form-error" role="alert">{error}</div>}

          <div className="field-group">
            <label className="field-label" htmlFor="sb-email">Admin Email</label>
            <input id="sb-email" type="email" required autoComplete="username"
              placeholder="admin@school.local"
              value={email} onChange={e => setEmail(e.target.value)}
              className="field-input" />
          </div>

          <div className="field-group">
            <label className="field-label" htmlFor="sb-pass">Password</label>
            <input id="sb-pass" type="password" required autoComplete="current-password"
              placeholder="••••••••"
              value={password} onChange={e => setPassword(e.target.value)}
              className="field-input" />
          </div>

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? "Verifying…" : "Sign In to Admin Panel"}
          </button>
        </form>
      </div>

      <footer className="legal-footer">
        <div className="legal-divider" />
        <p className="legal-text">© 2025 Sabboora EdTech — Admin Portal</p>
      </footer>
    </div>
  );
}
