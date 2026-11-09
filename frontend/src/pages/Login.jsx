import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, Lock, Mail, Phone, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient.js';
import Logo from '../components/Logo.jsx';

export default function Login() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated, role, refreshAuth } = useAuth();
  const requestedRole = searchParams.get('role') === 'artisan' ? 'artisan' : 'buyer';
  const requestedRedirect = searchParams.get('redirect');
  const redirectTo = requestedRedirect?.startsWith('/') && !requestedRedirect.startsWith('//')
    ? requestedRedirect
    : null;
  const [authMode, setAuthMode] = useState('otp');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const navigateForRole = (accountRole) => {
    navigate(redirectTo || (accountRole === 'artisan' ? '/seller/dashboard' : '/'), { replace: true });
  };

  const handleSendOtp = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');

    if (!isSupabaseConfigured()) {
      setTimeout(() => {
        setOtpSent(true);
        setMessage('Demo mode: enter any verification code to continue.');
        setLoading(false);
      }, 400);
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithOtp({ phone });
      if (error) throw error;
      setOtpSent(true);
      setMessage('Verification code sent to your mobile phone.');
    } catch (error) {
      setMessage(error.message || 'Unable to send a verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');

    if (!isSupabaseConfigured()) {
      localStorage.setItem('kalasetu_user', JSON.stringify({ phone, role: requestedRole }));
      const account = await refreshAuth();
      setLoading(false);
      navigateForRole(account.role);
      return;
    }

    try {
      const { data, error } = await supabase.auth.verifyOtp({ phone, token: otp, type: 'sms' });
      if (error) throw error;
      const account = await refreshAuth(data.session);
      if (account.error) throw account.error;
      if (account.role !== requestedRole) {
        setMessage(`This account is registered as a ${account.role || 'buyer'}; it does not have ${requestedRole} portal access.`);
        return;
      }
      navigateForRole(account.role);
    } catch (error) {
      setMessage(error.message || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');

    if (!isSupabaseConfigured()) {
      localStorage.setItem('kalasetu_user', JSON.stringify({ email, role: requestedRole }));
      const account = await refreshAuth();
      setLoading(false);
      navigateForRole(account.role);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      const account = await refreshAuth(data.session);
      if (account.error) throw account.error;
      if (account.role !== requestedRole) {
        setMessage(`This account is registered as a ${account.role || 'buyer'}; it does not have ${requestedRole} portal access.`);
        return;
      }
      navigateForRole(account.role);
    } catch (error) {
      setMessage(error.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = (nextRole) => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.set('role', nextRole);
      return next;
    });
    setMessage('');
  };

  return (
    <div style={{ maxWidth: '440px', margin: '2.5rem auto' }}>
      <div className="card login-card">
        <div className="login-heading">
          <div className="login-logo"><Logo size={52} /></div>
          <h1>{requestedRole === 'artisan' ? 'Artisan Studio Sign In' : 'Buyer Portal Sign In'}</h1>
          <p>Sign in to your {requestedRole === 'artisan' ? 'seller tools' : 'KalaSetu buyer account'}.</p>
        </div>

        <div className="portal-role-switch" role="group" aria-label="Choose portal">
          <button type="button" className={requestedRole === 'buyer' ? 'active' : ''} onClick={() => handleRoleChange('buyer')}>
            Buyer
          </button>
          <button type="button" className={requestedRole === 'artisan' ? 'active' : ''} onClick={() => handleRoleChange('artisan')}>
            Artisan
          </button>
        </div>

        {isAuthenticated && role !== requestedRole && (
          <div className="auth-message" role="status">
            You are signed in as a {role || 'buyer'}. Sign out before using another portal account.
          </div>
        )}

        <div className="auth-mode-switch" role="group" aria-label="Choose sign-in method">
          <button type="button" className={authMode === 'otp' ? 'active' : ''} onClick={() => { setAuthMode('otp'); setMessage(''); }}>
            Mobile OTP
          </button>
          <button type="button" className={authMode === 'email' ? 'active' : ''} onClick={() => { setAuthMode('email'); setMessage(''); }}>
            Email &amp; Password
          </button>
        </div>

        {message && <div className="auth-message" role="status">{message}</div>}

        {authMode === 'otp' ? (
          !otpSent ? (
            <form onSubmit={handleSendOtp}>
              <div className="form-group">
                <label className="form-label" htmlFor="login-phone">Mobile Number</label>
                <div className="login-input-wrap">
                  <Phone size={16} aria-hidden="true" />
                  <input id="login-phone" type="tel" required placeholder="+91 98765 43210" className="form-input" value={phone} onChange={(event) => setPhone(event.target.value)} />
                </div>
              </div>
              <button type="submit" className="btn btn-primary login-submit" disabled={loading}>
                <span>{loading ? 'Sending code...' : 'Send Login Code'}</span><ArrowRight size={16} />
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp}>
              <div className="form-group">
                <label className="form-label" htmlFor="login-otp">Verification Code</label>
                <input id="login-otp" type="text" required placeholder="Verification code" maxLength={6} className="form-input login-otp-input" value={otp} onChange={(event) => setOtp(event.target.value)} />
              </div>
              <button type="submit" className="btn btn-primary login-submit" disabled={loading}>
                <span>{loading ? 'Verifying...' : 'Verify & Continue'}</span>
              </button>
              <button type="button" onClick={() => { setOtpSent(false); setMessage(''); }} className="auth-secondary-action">
                Change mobile number
              </button>
            </form>
          )
        ) : (
          <form onSubmit={handleEmailAuth}>
            <div className="form-group">
              <label className="form-label" htmlFor="login-email">Email Address</label>
              <div className="login-input-wrap">
                <Mail size={16} aria-hidden="true" />
                <input id="login-email" type="email" required placeholder="you@kalasetu.org" className="form-input" value={email} onChange={(event) => setEmail(event.target.value)} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="login-password">Password</label>
              <div className="login-input-wrap">
                <Lock size={16} aria-hidden="true" />
                <input id="login-password" type="password" required placeholder="Password" className="form-input" value={password} onChange={(event) => setPassword(event.target.value)} />
              </div>
            </div>
            <button type="submit" className="btn btn-primary login-submit" disabled={loading}>
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span><ArrowRight size={16} />
            </button>
          </form>
        )}

        <div className="login-security-note">
          <ShieldCheck size={14} color="#059669" />
          <span>Account roles are verified using your KalaSetu profile.</span>
        </div>
      </div>
    </div>
  );
}

