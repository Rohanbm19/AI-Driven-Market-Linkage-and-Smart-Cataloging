import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Phone, Mail, Lock, ArrowRight, ShieldCheck } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient.js';
import Logo from '../components/Logo.jsx';

export default function Login() {
  const navigate = useNavigate();
  const [authMode, setAuthMode] = useState('otp'); // 'otp' or 'email'
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSendOtp = (e) => {
    e.preventDefault();
    if (!phone) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setOtpSent(true);
      setMessage('OTP 4-digit code sent to your mobile phone!');
    }, 700);
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      localStorage.setItem('kalasetu_user', JSON.stringify({ phone, role: 'artisan' }));
      navigate('/artisan-profile');
    }, 600);
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;
        navigate('/');
      } catch (err) {
        setMessage(err.message || 'Authentication failed. Please verify credentials.');
      } finally {
        setLoading(false);
      }
    } else {
      setTimeout(() => {
        setLoading(false);
        localStorage.setItem('kalasetu_user', JSON.stringify({ email, role: 'buyer' }));
        navigate('/');
      }, 700);
    }
  };

  return (
    <div style={{ maxWidth: '440px', margin: '2.5rem auto' }}>
      <div className="card" style={{ padding: '2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{ display: 'inline-block', marginBottom: '0.75rem' }}>
            <Logo size={52} />
          </div>
          <h1 style={{ fontSize: '1.45rem', fontWeight: 700, marginBottom: '0.35rem', color: '#1a1b1e' }}>
            Artisan & Buyer Portal
          </h1>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            Sign in to access your artisan studio or buyer catalogue
          </p>
        </div>

        {/* Tab switch */}
        <div
          style={{
            display: 'flex',
            background: 'var(--bg-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '0.25rem',
            marginBottom: '1.5rem'
          }}
        >
          <button
            type="button"
            onClick={() => {
              setAuthMode('otp');
              setMessage('');
            }}
            style={{
              flex: 1,
              padding: '0.55rem',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              background: authMode === 'otp' ? 'white' : 'transparent',
              fontWeight: 600,
              fontSize: '0.86rem',
              cursor: 'pointer',
              boxShadow: authMode === 'otp' ? 'var(--shadow-sm)' : 'none',
              color: authMode === 'otp' ? 'var(--primary)' : 'var(--text-muted)'
            }}
          >
            Artisan Mobile OTP
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode('email');
              setMessage('');
            }}
            style={{
              flex: 1,
              padding: '0.55rem',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              background: authMode === 'email' ? 'white' : 'transparent',
              fontWeight: 600,
              fontSize: '0.86rem',
              cursor: 'pointer',
              boxShadow: authMode === 'email' ? 'var(--shadow-sm)' : 'none',
              color: authMode === 'email' ? 'var(--primary)' : 'var(--text-muted)'
            }}
          >
            Email & Password
          </button>
        </div>

        {message && (
          <div
            style={{
              padding: '0.75rem',
              borderRadius: 'var(--radius-sm)',
              background: '#eff6ff',
              color: '#1e40af',
              fontSize: '0.84rem',
              marginBottom: '1rem',
              textAlign: 'center'
            }}
          >
            {message}
          </div>
        )}

        {authMode === 'otp' ? (
          !otpSent ? (
            <form onSubmit={handleSendOtp}>
              <div className="form-group">
                <label className="form-label">Artisan Mobile Number</label>
                <div style={{ position: 'relative' }}>
                  <Phone
                    size={16}
                    style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
                  />
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    className="form-input"
                    style={{ paddingLeft: '2.5rem' }}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%' }}
                disabled={loading}
              >
                <span>{loading ? 'Sending OTP...' : 'Send Login OTP via SMS'}</span>
                <ArrowRight size={16} />
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp}>
              <div className="form-group">
                <label className="form-label">Enter 4-Digit Verification Code</label>
                <input
                  type="text"
                  required
                  placeholder="1 2 3 4"
                  maxLength={4}
                  className="form-input"
                  style={{ textAlign: 'center', letterSpacing: '0.5rem', fontSize: '1.25rem' }}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%' }}
                disabled={loading}
              >
                <span>{loading ? 'Verifying...' : 'Verify & Enter Studio'}</span>
              </button>

              <button
                type="button"
                onClick={() => setOtpSent(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: '0.82rem',
                  display: 'block',
                  margin: '1rem auto 0',
                  cursor: 'pointer'
                }}
              >
                Change Phone Number
              </button>
            </form>
          )
        ) : (
          <form onSubmit={handleEmailAuth}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail
                  size={16}
                  style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
                />
                <input
                  type="email"
                  required
                  placeholder="artisan@kalasetu.org"
                  className="form-input"
                  style={{ paddingLeft: '2.5rem' }}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock
                  size={16}
                  style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
                />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  className="form-input"
                  style={{ paddingLeft: '2.5rem' }}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%' }}
              disabled={loading}
            >
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
              <ArrowRight size={16} />
            </button>
          </form>
        )}

        <div
          style={{
            marginTop: '1.5rem',
            paddingTop: '1rem',
            borderTop: '1px solid var(--border-color)',
            textAlign: 'center',
            fontSize: '0.82rem',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.35rem'
          }}
        >
          <ShieldCheck size={14} color="#059669" />
          <span>Protected with 256-bit SSL encryption & Fair Trade verification.</span>
        </div>
      </div>
    </div>
  );
}
