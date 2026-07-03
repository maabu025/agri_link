// Auth.js — Login and Register page

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const REGIONS = ['Tamale', 'Bolgatanga', 'Wa', 'Damango', 'Bawku'];

export default function Auth() {
  const { login } = useAuth();
  const [mode, setMode]       = useState('login'); // 'login' | 'register'
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: '', phone: '', region: 'Tamale', password: '', confirmPassword: '',
  });

  function handle(e) {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (mode === 'register') {
      if (form.password !== form.confirmPassword) {
        setError('Passwords do not match.'); return;
      }
      if (form.password.length < 6) {
        setError('Password must be at least 6 characters.'); return;
      }
    }

    setLoading(true);
    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const body     = mode === 'login'
        ? { phone: form.phone, password: form.password }
        : { name: form.name, phone: form.phone, region: form.region, password: form.password };

      const res  = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();

      if (json.success) {
        login(json.token, json.user);
      } else {
        setError(json.error || 'Something went wrong. Please try again.');
      }
    } catch {
      setError('Cannot connect to server. Is the backend running?');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      {/* Left panel — branding */}
      <div className="auth-left">
        <div className="auth-brand">
          <div className="auth-brand-icon"></div>
          <h1 className="auth-brand-name">AgriLink</h1>
          <p className="auth-brand-tagline">Smallholder farmer platform for Northern Ghana</p>
        </div>
        <div className="auth-features">
          <div className="auth-feature"><span></span> Real-time crop market prices</div>
          <div className="auth-feature"><span></span> AI-powered irrigation advice</div>
          <div className="auth-feature"><span></span> Buy &amp; sell with MoMo payments</div>
          <div className="auth-feature"><span></span> Live weather for your region</div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="auth-right">
        <div className="auth-card">
          {/* Toggle */}
          <div className="auth-toggle">
            <button
              className={`auth-toggle-btn ${mode === 'login' ? 'active' : ''}`}
              onClick={() => { setMode('login'); setError(''); }}
            >Sign in</button>
            <button
              className={`auth-toggle-btn ${mode === 'register' ? 'active' : ''}`}
              onClick={() => { setMode('register'); setError(''); }}
            >Create account</button>
          </div>

          <h2 className="auth-title">
            {mode === 'login' ? 'Welcome back' : 'Join AgriLink'}
          </h2>
          <p className="auth-sub">
            {mode === 'login'
              ? 'Sign in with your phone number and password.'
              : 'Create your free farmer account in seconds.'}
          </p>

          {error && <div className="auth-error"> {error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            {mode === 'register' && (
              <div className="form-group">
                <label>Full name *</label>
                <input
                  type="text" name="name" value={form.name} onChange={handle}
                  placeholder="e.g. Amina Alhassan" required
                />
              </div>
            )}

            <div className="form-group">
              <label>Phone number *</label>
              <input
                type="tel" name="phone" value={form.phone} onChange={handle}
                placeholder="e.g. 0241234567" required
              />
            </div>

            {mode === 'register' && (
              <div className="form-group">
                <label>Region</label>
                <select name="region" value={form.region} onChange={handle}>
                  {REGIONS.map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
            )}

            <div className="form-group">
              <label>Password *</label>
              <input
                type="password" name="password" value={form.password} onChange={handle}
                placeholder={mode === 'register' ? 'At least 6 characters' : 'Your password'}
                required
              />
            </div>

            {mode === 'register' && (
              <div className="form-group">
                <label>Confirm password *</label>
                <input
                  type="password" name="confirmPassword" value={form.confirmPassword}
                  onChange={handle} placeholder="Repeat your password" required
                />
              </div>
            )}

            <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
              {loading
                ? (mode === 'login' ? 'Signing in...' : 'Creating account...')
                : (mode === 'login' ? 'Sign in →' : 'Create account →')}
            </button>
          </form>

          {mode === 'login' && (
            <p className="auth-hint">
              Don't have an account?{' '}
              <button className="link-btn" onClick={() => setMode('register')}>Register here</button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
