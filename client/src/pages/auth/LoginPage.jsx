import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();

  const from = location.state?.from?.pathname || '/';

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        background: 'var(--mv-bg)',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        fontFamily: 'var(--mv-font)',
      }}
    >
      <div
        style={{
          background: 'var(--mv-surface)',
          borderTop: '3px solid var(--mv-purple)',
          boxShadow: '0 12px 32px color-mix(in srgb, var(--mv-ink) 22%, transparent)',
          width: '100%',
          maxWidth: 400,
          padding: '40px 36px',
          boxSizing: 'border-box',
        }}
      >
        {/* Logo / brand */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, marginBottom: 32 }}>
          <span style={{ fontWeight: 800, fontSize: 26, letterSpacing: '-.03em', color: 'var(--mv-ink)' }}>MOOV</span>
          <span style={{ width: 8, height: 8, background: 'var(--mv-green)', marginBottom: 3 }} />
        </div>

        <h1 style={{ color: 'var(--mv-ink)', fontWeight: 800, fontSize: 22, letterSpacing: '-.01em', margin: '0 0 6px' }}>
          Sign in
        </h1>
        <p style={{ color: 'var(--mv-ink-62)', fontSize: 13, margin: '0 0 28px' }}>
          Enter your email and password to continue.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="mv-field" style={{ marginBottom: 0 }}>
            <label className="mv-label">Email</label>
            <input
              className="mv-input"
              type="email"
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
            />
          </div>

          <div className="mv-field" style={{ marginBottom: 0 }}>
            <label className="mv-label">Password</label>
            <input
              className="mv-input"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div
              style={{
                background: 'var(--mv-magenta-deep)',
                color: 'var(--mv-bg)',
                padding: '10px 14px',
                fontSize: 13,
              }}
            >
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} className="mv-btn mv-btn--primary" style={{ justifyContent: 'center', marginTop: 4 }}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
