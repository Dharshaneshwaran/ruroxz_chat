import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';

export default function Login() {
  const setUser = useAuthStore((s) => s.setUser);
  const navigate = useNavigate();

  const [tab, setTab] = useState('signin'); // 'signin' | 'signup'
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('email'); // 'email' | 'otp'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const resetForm = () => {
    setEmail('');
    setPhone('');
    setDisplayName('');
    setOtp('');
    setStep('email');
    setError('');
    setInfo('');
  };

  const switchTab = (t) => {
    setTab(t);
    resetForm();
  };

  // Sign In: direct email access, no OTP
  const handleSignIn = async (e) => {
    e.preventDefault();
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !trimmedEmail.includes('@')) return setError('Enter a valid email address');
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/email-login', { email: trimmedEmail });
      if (!data.token) throw new Error('Invalid server response');
      localStorage.setItem('authToken', data.token);
      setUser(data.user);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  // Sign Up: email OTP flow with name + optional phone
  const handleSendOTP = async (e) => {
    e.preventDefault();
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !trimmedEmail.includes('@')) return setError('Enter a valid email address');
    if (!displayName.trim()) return setError('Enter your display name');
    if (phone.trim() && phone.trim().length < 8)
      return setError('Enter a valid phone number with country code (e.g. +91XXXXXXXXXX)');
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/send-otp', { email: trimmedEmail });
      setInfo(`OTP sent to ${trimmedEmail} — check your inbox.`);
      setStep('otp');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send OTP. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (otp.trim().length !== 6) return setError('Enter the 6-digit OTP');
    setError('');
    setLoading(true);
    try {
      const payload = {
        email: email.trim().toLowerCase(),
        otp: otp.trim(),
        displayName: displayName.trim(),
      };
      if (phone.trim()) payload.phoneNumber = phone.trim();
      const { data } = await api.post('/auth/verify-otp', payload);
      if (!data.token) throw new Error('Invalid server response');
      localStorage.setItem('authToken', data.token);
      setUser(data.user);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>
      <div style={s.card}>
        {/* Logo */}
        <div style={s.logoWrap}>
          <div style={s.logoCircle}>💬</div>
        </div>
        <h1 style={s.title}>RuroxZ Chat</h1>
        <p style={s.tagline}>Connect with anyone, anywhere</p>

        {/* Tabs */}
        <div style={s.tabs}>
          <button
            style={{ ...s.tab, ...(tab === 'signin' ? s.tabActive : {}) }}
            onClick={() => switchTab('signin')}
            type="button"
          >
            Sign In
          </button>
          <button
            style={{ ...s.tab, ...(tab === 'signup' ? s.tabActive : {}) }}
            onClick={() => switchTab('signup')}
            type="button"
          >
            Sign Up
          </button>
        </div>

        {/* Alerts */}
        {error && <div style={s.error}>{error}</div>}
        {info && !error && <div style={s.infoBox}>{info}</div>}

        {/* Step: form fields */}
        {step === 'email' && (
          <>
            {/* ── SIGN IN: just email, direct access ── */}
            {tab === 'signin' && (
              <form onSubmit={handleSignIn} style={s.form}>
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
                <button
                  style={{ ...s.btn, opacity: loading ? 0.7 : 1 }}
                  type="submit"
                  disabled={loading}
                >
                  {loading ? 'Signing in…' : 'Sign In →'}
                </button>
                <p style={s.switchHint}>
                  Don't have an account?{' '}
                  <span style={s.switchLink} onClick={() => switchTab('signup')}>Sign Up</span>
                </p>
              </form>
            )}

            {/* ── SIGN UP: name + email + phone → OTP ── */}
            {tab === 'signup' && (
              <form onSubmit={handleSendOTP} style={s.form}>
                <label style={s.label}>Display name</label>
                <input
                  style={s.input}
                  type="text"
                  placeholder="Your name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  disabled={loading}
                  autoFocus
                  required
                />
                <label style={s.label}>Email address</label>
                <input
                  style={s.input}
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
                <label style={s.label}>
                  Phone number{' '}
                  <span style={s.optional}>(optional)</span>
                </label>
                <input
                  style={s.input}
                  type="tel"
                  placeholder="+91XXXXXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={loading}
                />
                <button
                  style={{ ...s.btn, opacity: loading ? 0.7 : 1 }}
                  type="submit"
                  disabled={loading}
                >
                  {loading ? 'Sending OTP…' : 'Create Account →'}
                </button>
                <p style={s.switchHint}>
                  Already have an account?{' '}
                  <span style={s.switchLink} onClick={() => switchTab('signin')}>Sign In</span>
                </p>
              </form>
            )}
          </>
        )}

        {/* Step: OTP (Sign Up only) */}
        {step === 'otp' && (
          <form onSubmit={handleVerifyOTP} style={s.form}>
            <div style={s.otpInfo}>
              <span style={s.otpIcon}>📧</span>
              <span>OTP sent to <strong>{email}</strong></span>
            </div>
            <label style={s.label}>Enter 6-digit OTP</label>
            <input
              style={{ ...s.input, letterSpacing: 10, fontSize: 24, textAlign: 'center' }}
              type="text"
              maxLength={6}
              placeholder="123456"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              autoFocus
              required
              disabled={loading}
            />
            <button
              style={{ ...s.btn, opacity: loading ? 0.7 : 1 }}
              type="submit"
              disabled={loading}
            >
              {loading ? 'Verifying…' : 'Confirm & Create Account →'}
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
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
  },
  card: {
    background: '#fff',
    padding: '36px 36px 32px',
    borderRadius: 20,
    width: 420,
    boxShadow: '0 16px 48px rgba(0,0,0,0.2)',
  },
  logoWrap: { display: 'flex', justifyContent: 'center', marginBottom: 8 },
  logoCircle: {
    width: 56, height: 56, borderRadius: '50%',
    background: 'linear-gradient(135deg, #25D366, #128C7E)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 26,
  },
  title: { color: '#25D366', textAlign: 'center', marginBottom: 2, fontSize: 26, fontWeight: 800 },
  tagline: { color: '#aaa', textAlign: 'center', marginBottom: 24, fontSize: 13 },
  tabs: {
    display: 'flex', background: '#f4f4f4', borderRadius: 10,
    padding: 4, marginBottom: 20, gap: 4,
  },
  tab: {
    flex: 1, padding: '10px 0', border: 'none', borderRadius: 8,
    background: 'transparent', cursor: 'pointer', fontSize: 14,
    fontWeight: 600, color: '#888', transition: 'all 0.2s',
  },
  tabActive: { background: '#fff', color: '#25D366', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' },
  error: {
    background: '#fff0f0', color: '#c0392b', padding: '10px 14px',
    borderRadius: 8, marginBottom: 14, fontSize: 13, border: '1px solid #f5c6cb',
  },
  infoBox: {
    background: '#e8f8ef', color: '#1a7a4a', padding: '10px 14px',
    borderRadius: 8, marginBottom: 14, fontSize: 13, border: '1px solid #b3e8cc',
  },
  form: { display: 'flex', flexDirection: 'column', gap: 12 },
  label: { fontSize: 13, color: '#555', fontWeight: 600 },
  optional: { color: '#aaa', fontWeight: 400, fontSize: 12 },
  input: {
    padding: '13px 14px', border: '1.5px solid #e0e0e0', borderRadius: 10,
    fontSize: 15, outline: 'none', width: '100%', boxSizing: 'border-box',
  },
  btn: {
    background: 'linear-gradient(135deg, #25D366, #128C7E)',
    color: '#fff', border: 'none', padding: '14px',
    borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(37,211,102,0.35)', marginTop: 4,
  },
  link: {
    background: 'none', border: 'none', color: '#25D366',
    cursor: 'pointer', fontSize: 13, textAlign: 'center',
  },
  switchHint: { fontSize: 13, color: '#888', textAlign: 'center', margin: 0 },
  switchLink: { color: '#25D366', cursor: 'pointer', fontWeight: 600 },
  otpInfo: {
    background: '#e8f8ef', color: '#1a7a4a', padding: '10px 14px',
    borderRadius: 8, fontSize: 13, border: '1px solid #b3e8cc',
    display: 'flex', alignItems: 'center', gap: 8,
  },
  otpIcon: { fontSize: 18 },
};
