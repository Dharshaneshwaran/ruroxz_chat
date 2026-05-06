import React, { useState } from 'react';
import axios from 'axios';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';

const FIREBASE_API_KEY = import.meta.env.VITE_FIREBASE_API_KEY;

// Exchange Firebase custom token for an ID token via REST (no SDK needed)
const exchangeCustomToken = async (customToken) => {
  const res = await axios.post(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${FIREBASE_API_KEY}`,
    { token: customToken, returnSecureToken: true }
  );
  return res.data.idToken;
};

export default function Login() {
  const setUser = useAuthStore((s) => s.setUser);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const handleSendOTP = async (e) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes('@')) return setError('Enter a valid email address');
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/send-otp', { email: trimmed });
      setInfo(`OTP sent to ${trimmed} — check your inbox.`);
      setStep('otp');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send OTP. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (otp.trim().length !== 6) return setError('Enter the 6-digit OTP from your email');
    setError('');
    setLoading(true);
    try {
      // 1. Verify OTP → get Firebase custom token + user
      const { data } = await api.post('/auth/verify-otp', {
        email: email.trim(),
        otp: otp.trim(),
      });
      const { customToken, user } = data;

      // 2. Exchange custom token for Firebase ID token via REST (no SDK)
      const idToken = await exchangeCustomToken(customToken);

      // 3. Store token so API interceptor picks it up
      localStorage.setItem('authToken', idToken);

      // 4. Set user in store → triggers redirect
      setUser(user);
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Verification failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>
      <div style={s.card}>
        <h1 style={s.title}>WhatApp Clone</h1>
        <p style={s.subtitle}>Sign in with your email address</p>

        {error && <div style={s.error}>{error}</div>}
        {info && !error && <div style={s.infoBox}>{info}</div>}

        {step === 'email' ? (
          <form onSubmit={handleSendOTP} style={s.form}>
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
            <button style={{ ...s.btn, opacity: loading ? 0.7 : 1 }} type="submit" disabled={loading}>
              {loading ? 'Sending OTP…' : 'Send OTP →'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} style={s.form}>
            <label style={s.label}>6-digit OTP from your email</label>
            <input
              style={{ ...s.input, letterSpacing: 10, fontSize: 24, textAlign: 'center' }}
              type="number"
              placeholder="123456"
              value={otp}
              onChange={(e) => setOtp(e.target.value.slice(0, 6))}
              autoFocus
              required
              disabled={loading}
            />
            <button style={{ ...s.btn, opacity: loading ? 0.7 : 1 }} type="submit" disabled={loading}>
              {loading ? 'Verifying…' : 'Verify OTP →'}
            </button>
            <button
              type="button"
              style={s.link}
              onClick={() => { setStep('email'); setOtp(''); setError(''); setInfo(''); }}
              disabled={loading}
            >
              ← Use a different email
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

const s = {
  page: {
    minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
  },
  card: {
    background: '#fff', padding: '40px 36px', borderRadius: 18, width: 380,
    boxShadow: '0 12px 40px rgba(0,0,0,0.18)',
  },
  title: { color: '#25D366', textAlign: 'center', marginBottom: 4, fontSize: 28, fontWeight: 800 },
  subtitle: { color: '#888', textAlign: 'center', marginBottom: 28, fontSize: 14 },
  error: {
    background: '#fff0f0', color: '#c0392b', padding: '10px 14px',
    borderRadius: 8, marginBottom: 16, fontSize: 13, border: '1px solid #f5c6cb',
  },
  infoBox: {
    background: '#e8f8ef', color: '#1a7a4a', padding: '10px 14px',
    borderRadius: 8, marginBottom: 16, fontSize: 13, border: '1px solid #b3e8cc',
  },
  form: { display: 'flex', flexDirection: 'column', gap: 14 },
  label: { fontSize: 13, color: '#555', fontWeight: 600 },
  input: {
    padding: '13px 14px', border: '1.5px solid #e0e0e0', borderRadius: 10,
    fontSize: 15, outline: 'none', width: '100%', boxSizing: 'border-box',
  },
  btn: {
    background: '#25D366', color: '#fff', border: 'none', padding: '14px',
    borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer',
  },
  link: {
    background: 'none', border: 'none', color: '#25D366',
    cursor: 'pointer', fontSize: 13, textAlign: 'center',
  },
};
