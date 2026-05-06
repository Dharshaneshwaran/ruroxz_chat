import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';

export default function Login() {
  const setUser = useAuthStore((s) => s.setUser);
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      return setError('Enter a valid email address');
    }
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/email-login', {
        email: trimmedEmail,
        displayName: displayName.trim() || undefined,
      });
      if (!data.token) throw new Error('Invalid server response');
      localStorage.setItem('authToken', data.token);
      setUser(data.user);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Login failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>
      <div style={s.card}>
        <h1 style={s.title}>rurozx chat</h1>
        <p style={s.subtitle}>Sign in with your email</p>

        {error && <div style={s.error}>{error}</div>}

        <form onSubmit={handleLogin} style={s.form}>
          <label style={s.label}>Email address</label>
          <input
            style={s.input}
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoFocus
            required
            disabled={loading}
          />

          <label style={s.label}>Display name (optional)</label>
          <input
            style={s.input}
            type="text"
            placeholder="Your name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            disabled={loading}
          />

          <button style={{ ...s.btn, opacity: loading ? 0.7 : 1 }} type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In →'}
          </button>
        </form>
      </div>
    </div>
  );
}

const s = {
  page: {
    minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'linear-gradient(135deg, #6D28D9 0%, #5B21B6 100%)',
  },
  card: {
    background: '#fff', padding: '40px 36px', borderRadius: 18, width: 380,
    boxShadow: '0 12px 40px rgba(0,0,0,0.18)',
  },
  title: { color: '#6D28D9', textAlign: 'center', marginBottom: 4, fontSize: 28, fontWeight: 800, textShadow: '0 0 15px rgba(109, 40, 217, 0.8)' },
  subtitle: { color: '#888', textAlign: 'center', marginBottom: 28, fontSize: 14 },
  error: {
    background: '#fff0f0', color: '#c0392b', padding: '10px 14px',
    borderRadius: 8, marginBottom: 16, fontSize: 13, border: '1px solid #f5c6cb',
  },
  form: { display: 'flex', flexDirection: 'column', gap: 14 },
  label: { fontSize: 13, color: '#555', fontWeight: 600 },
  input: {
    padding: '13px 14px', border: '1.5px solid #e0e0e0', borderRadius: 10,
    fontSize: 15, outline: 'none', width: '100%', boxSizing: 'border-box',
  },
  btn: {
    background: '#6D28D9', color: '#fff', border: 'none', padding: '14px',
    boxShadow: '0 0 18px rgba(109, 40, 217, 0.7)',
    borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer',
  },
  link: {
    background: 'none', border: 'none', color: '#6D28D9',
    cursor: 'pointer', fontSize: 13, textAlign: 'center',
  },
};
