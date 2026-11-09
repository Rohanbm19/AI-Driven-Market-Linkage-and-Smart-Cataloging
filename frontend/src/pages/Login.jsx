import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, Lock, Mail, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient.js';
import Logo from '../components/Logo.jsx';

const allowedArtisanRedirects = [
  /^\/seller(?:\/|$)/,
  /^\/add-product$/,
  /^\/edit-product\/[^/]+$/,
  /^\/image-enhancer$/,
  /^\/enquiries$/,
  /^\/artisan-profile$/
];

export default function Login({ role: requestedRole }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, role, isLoading: authLoading, authError, refreshAuth, signOut } = useAuth();
  const requestedRedirect = searchParams.get('redirect');
  const isAllowedArtisanRedirect = allowedArtisanRedirects.some((pattern) => (
    pattern.test(requestedRedirect || '')
  ));
  const redirectTo = requestedRole === 'artisan'
    ? isAllowedArtisanRedirect ? requestedRedirect : '/seller/dashboard'
    : '/';
  const [emailAction, setEmailAction] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const navigateForRole = (accountRole) => {
    navigate(accountRole === requestedRole ? redirectTo : (accountRole === 'artisan' ? '/seller/dashboard' : '/'), { replace: true });
  };

  useEffect(() => {
    if (!authLoading && isAuthenticated && role === requestedRole) {
      navigate(role === 'artisan' ? redirectTo : '/', { replace: true });
    }
  }, [authLoading, isAuthenticated, role, requestedRole, redirectTo, navigate]);

  const completeSignIn = async (session) => {
    const account = await refreshAuth(session);
    if (!account.isAuthenticated) {
      throw new Error('No active session was returned. Please try signing in again.');
    }
    if (account.role !== requestedRole) {
      await signOut();
      setMessage(`This account is registered as a ${account.role}; it does not have ${requestedRole} portal access.`);
      return;
    }
    navigateForRole(account.role);
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setMessage('');

    try {
      if (!isSupabaseConfigured()) {
        throw new Error('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
      }

      const callbackUrl = new URL(`/${requestedRole}/login`, window.location.origin);
      if (requestedRole === 'artisan' && isAllowedArtisanRedirect) {
        callbackUrl.searchParams.set('redirect', requestedRedirect);
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: callbackUrl.toString() }
      });
      if (error) throw error;
    } catch (error) {
      setMessage(error.message || 'Unable to continue with Google.');
      setLoading(false);
    }
  };

  const handleEmailAuth = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      if (!isSupabaseConfigured()) {
        throw new Error('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
      }

      if (emailAction === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/buyer/login` }
        });
        if (error) throw error;

        if (data.session) {
          await completeSignIn(data.session);
        } else {
          setMessage('Account created. Check your email to confirm your address, then sign in.');
          setEmailAction('login');
        }
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      await completeSignIn(data.session);
    } catch (error) {
      setMessage(error.message || 'Authentication failed. Please verify your details.');
    } finally {
      setLoading(false);
    }
  };

  const configured = isSupabaseConfigured();
  const isSignup = emailAction === 'signup';

  return (
    <div style={{ maxWidth: '440px', margin: '2.5rem auto' }}>
      <div className="card login-card">
        <div className="login-heading">
          <div className="login-logo"><Logo size={52} /></div>
          <h1>
            {isSignup
              ? 'Create Buyer Account'
              : requestedRole === 'artisan' ? 'Artisan Studio Sign In' : 'Buyer Portal Sign In'}
          </h1>
          <p>
            {isSignup
              ? 'Create an account to save your KalaSetu buyer details.'
              : `Sign in to your ${requestedRole === 'artisan' ? 'seller tools' : 'KalaSetu buyer account'}.`}
          </p>
        </div>

        {isAuthenticated && role !== requestedRole && (
          <div className="auth-message" role="status">
            You are signed in as a {role}. Sign out before using another portal account.
          </div>
        )}

        {authError && <div className="auth-message" role="alert">{authError}</div>}

        {!configured && (
          <div className="auth-message" role="alert">
            Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable authentication.
          </div>
        )}

        {requestedRole === 'buyer' && (
          <div className="auth-mode-switch" role="group" aria-label="Choose account action">
            <button type="button" className={!isSignup ? 'active' : ''} onClick={() => { setEmailAction('login'); setMessage(''); }}>
              Sign In
            </button>
            <button type="button" className={isSignup ? 'active' : ''} onClick={() => { setEmailAction('signup'); setMessage(''); }}>
              Create Account
            </button>
          </div>
        )}

        {requestedRole === 'artisan' && (
          <div className="auth-message" role="note">
            Sign in with an existing artisan account. Artisan access is granted by an administrator.
          </div>
        )}

        {message && <div className="auth-message" role="status">{message}</div>}

        <button
          type="button"
          className="btn btn-secondary login-submit login-google"
          onClick={handleGoogleSignIn}
          disabled={loading || !configured}
        >
          {loading ? 'Connecting to Google...' : 'Continue with Google'}
        </button>

        <form onSubmit={handleEmailAuth}>
            <div className="form-group">
              <label className="form-label" htmlFor="login-email">Email Address</label>
              <div className="login-input-wrap">
                <Mail size={16} aria-hidden="true" />
                <input id="login-email" type="email" required autoComplete="email" placeholder="you@kalasetu.org" className="form-input" value={email} onChange={(event) => setEmail(event.target.value)} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="login-password">Password</label>
              <div className="login-input-wrap">
                <Lock size={16} aria-hidden="true" />
                <input id="login-password" type="password" required minLength={6} autoComplete={isSignup ? 'new-password' : 'current-password'} placeholder="Password" className="form-input" value={password} onChange={(event) => setPassword(event.target.value)} />
              </div>
            </div>
            <button type="submit" className="btn btn-primary login-submit" disabled={loading || !configured || (isSignup && requestedRole !== 'buyer')}>
              <span>
                {loading ? (isSignup ? 'Creating account...' : 'Authenticating...') : isSignup ? 'Create Account' : 'Sign In'}
              </span><ArrowRight size={16} />
            </button>
        </form>

        <div className="login-security-note">
          <ShieldCheck size={14} color="#059669" />
          <span>Account roles are verified using your KalaSetu profile.</span>
        </div>
      </div>
    </div>
  );
}
