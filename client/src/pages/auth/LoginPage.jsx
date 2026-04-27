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
      style={{ background: '#0A0B1E', minHeight: '100vh' }}
      className="flex items-center justify-center p-4"
    >
      <div
        style={{
          background: '#14162A',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '14px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
          width: '100%',
          maxWidth: '400px',
          padding: '40px 36px',
        }}
      >
        {/* Logo / brand */}
        <div className="flex items-center gap-3 mb-8">
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #7B2FBE 0%, #E91E8C 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: 16,
              color: '#fff',
            }}
          >
            M
          </div>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 20 }}>Moov OS</span>
        </div>

        <h1 style={{ color: '#fff', fontWeight: 700, fontSize: 22, marginBottom: 6 }}>
          Sign in
        </h1>
        <p style={{ color: '#AAAAAA', fontSize: 14, marginBottom: 28 }}>
          Enter your email and password to continue.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label style={{ color: '#AAAAAA', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Email
            </label>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              style={{
                background: '#1A1D35',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 8,
                color: '#fff',
                padding: '10px 14px',
                fontSize: 14,
                outline: 'none',
                width: '100%',
              }}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label style={{ color: '#AAAAAA', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Password
            </label>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              style={{
                background: '#1A1D35',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 8,
                color: '#fff',
                padding: '10px 14px',
                fontSize: 14,
                outline: 'none',
                width: '100%',
              }}
            />
          </div>

          {error && (
            <div
              style={{
                background: 'rgba(220, 38, 38, 0.15)',
                border: '1px solid rgba(220, 38, 38, 0.4)',
                borderRadius: 8,
                color: '#f87171',
                padding: '10px 14px',
                fontSize: 14,
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              background: loading
                ? 'rgba(123, 47, 190, 0.5)'
                : 'linear-gradient(135deg, #7B2FBE 0%, #E91E8C 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '12px 0',
              fontWeight: 700,
              fontSize: 15,
              cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: 4,
              transition: 'opacity 0.15s',
            }}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
