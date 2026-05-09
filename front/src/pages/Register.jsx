import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Login.css'; // shares chalkboard + card styles

const CHALK_DECO = [
  { text: 'E = mc²',      top: '7%',  left: '3.5%', rotate: '-3deg',   opacity: 0.22, size: '1.5rem'  },
  { text: 'y = mx + b',   top: '20%', left: '2.5%', rotate: '-2deg',   opacity: 0.18, size: '1.1rem'  },
  { text: 'a² + b² = c²', top: '38%', left: '3%',   rotate: '-1.5deg', opacity: 0.19, size: '1.05rem' },
  { text: 'F = ma',       top: '55%', left: '4%',   rotate: '-2.5deg', opacity: 0.17, size: '1.2rem'  },
  { text: 'π ≈ 3.14159…', top: '70%', left: '3.5%', rotate: '-1deg',   opacity: 0.16, size: '1rem'    },
  { text: 'Σn=1^∞ 1/n²', top: '6%',  right: '4%',  rotate: '2deg',    opacity: 0.19, size: '1.1rem'  },
  { text: 'H₂O + CO₂',   top: '22%', right: '3.5%',rotate: '3deg',    opacity: 0.17, size: '1rem'    },
  { text: 'DNA → RNA',    top: '53%', right: '4.5%',rotate: '2deg',    opacity: 0.16, size: '0.95rem' },
  { text: 'v = λf',       top: '68%', right: '3.5%',rotate: '1deg',    opacity: 0.18, size: '1.2rem'  },
];

export default function Register() {
  const { register }          = useAuth();
  const navigate              = useNavigate();
  const [name, setName]           = useState('');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [confirm, setConfirm]     = useState('');
  const [error, setError]         = useState('');
  const [loading, setLoading]     = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirm) {
      return setError('Passwords do not match');
    }
    if (password.length < 6) {
      return setError('Password must be at least 6 characters');
    }

    setLoading(true);
    try {
      await register(name, email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="board-wrap">
      <div className="board-grain" aria-hidden="true" />
      <div className="board-lines" aria-hidden="true" />
      <div className="board-frame" aria-hidden="true" />
      <div className="chalk-tray"  aria-hidden="true" />

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

      {/* Page header */}
      <div className="board-header">
        <h1 className="board-title">
          <span className="board-icon-wrap">
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
      </div>

      {/* Card */}
      <div className="login-card">
        <div className="card-header">
          <h2 className="card-title">Create Account</h2>
          <p className="card-sub">Join your digital classroom today</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            <div className="form-error" role="alert">{error}</div>
          )}

          {/* Name */}
          <div className="field-group">
            <label className="field-label" htmlFor="name">Full Name</label>
            <input
              id="name"
              name="name"
              type="text"
              required
              placeholder="Your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="field-input"
            />
          </div>

          {/* Email */}
          <div className="field-group">
            <label className="field-label" htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="field-input"
            />
          </div>

          {/* Password */}
          <div className="field-group">
            <label className="field-label" htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              placeholder="Min 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="field-input"
            />
          </div>

          {/* Confirm password */}
          <div className="field-group">
            <label className="field-label" htmlFor="confirm">Confirm Password</label>
            <input
              id="confirm"
              name="confirm"
              type="password"
              required
              placeholder="Repeat your password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="field-input"
            />
          </div>

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <div className="card-footer">
          <p>
            Already have an account?{' '}
            <Link className="signup-link" to="/login">Sign in</Link>
          </p>
        </div>
      </div>

      <footer className="legal-footer">
        <div className="legal-divider" />
        <p className="legal-text">© 2025 Sabboora EdTech. All Rights Reserved.</p>
      </footer>
    </div>
  );
}
