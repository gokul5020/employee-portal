import React, { useState } from 'react';
import { authApi } from '../services/api';
import { Loader2 } from 'lucide-react';
import { ThemeToggle } from '../components/ThemeToggle';

interface LoginProps {
  onLoginSuccess: (token: string, user: any) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await authApi.login({ email, password });
      onLoginSuccess(data.token, data.user);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Incorrect email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (e: string, p: string) => {
    setEmail(e);
    setPassword(p);
    setError('');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-app)',
        padding: '24px 16px',
        position: 'relative',
      }}
    >
      {/* Top right theme toggle */}
      <div style={{ position: 'absolute', top: 20, right: 20 }}>
        <ThemeToggle />
      </div>

      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Brand header */}
        <div style={{ marginBottom: 28, textAlign: 'center' }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              backgroundColor: 'var(--color-brand-600)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: 15,
              color: '#fff',
              margin: '0 auto 16px',
              letterSpacing: '-0.02em',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            EP
          </div>
          <h1
            style={{
              fontSize: '1.35rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              margin: 0,
              letterSpacing: '-0.02em',
            }}
          >
            Employee Portal
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: 6 }}>
            Sign in to access your self-service workspace
          </p>
        </div>

        {/* Login form */}
        <div
          className="surface"
          style={{ padding: 28 }}
        >
          {error && (
            <div
              className="alert alert-error"
              role="alert"
              style={{ marginBottom: 20 }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label htmlFor="email" className="field-label">
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="field-input"
                disabled={loading}
              />
            </div>

            <div style={{ marginBottom: 22 }}>
              <label htmlFor="password" className="field-label">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="field-input"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-block btn-lg"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Signing in…
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>
        </div>

        {/* Demo credentials */}
        <div style={{ marginTop: 20 }}>
          <p
            style={{
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              textAlign: 'center',
              marginBottom: 10,
            }}
          >
            Demo accounts — click to test roles
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              { label: 'Employee — Elena Rostova', email: 'employee1@company.com', pass: 'employee123', role: 'Staff' },
              { label: 'Manager — Marcus Aurelius', email: 'manager@company.com', pass: 'manager123', role: 'Manager' },
              { label: 'HR Admin — Sarah Jenkins', email: 'admin@company.com', pass: 'admin123', role: 'Admin' },
            ].map((cred) => (
              <button
                key={cred.email}
                type="button"
                onClick={() => fillCredentials(cred.email, cred.pass)}
                className="surface"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '9px 12px',
                  borderRadius: 6,
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%',
                  transition: 'all 0.15s ease',
                }}
              >
                <div>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text-primary)', fontWeight: 500, display: 'block' }}>
                    {cred.label}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    {cred.email}
                  </span>
                </div>
                <span className="badge badge-neutral" style={{ fontSize: '0.6875rem' }}>
                  {cred.role}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
