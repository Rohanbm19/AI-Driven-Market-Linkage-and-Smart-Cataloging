import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, Lock, Mail, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient.js';
import Logo from '../components/Logo.jsx';
import { useLanguage } from '../i18n/index.jsx';
import { loginTranslations } from '../i18n/loginTranslations.js';

const allowedArtisanRedirects = [
  /^\/seller(?:\/|$)/,
  /^\/add-product$/,
  /^\/edit-product\/[^/]+$/,
  /^\/image-enhancer$/,
  /^\/enquiries$/,
  /^\/artisan-profile$/
];
const allowedBuyerRedirects = [/^\/buyer\/profile$/];

export default function Login({ role: requestedRole }) {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const copy = loginTranslations[lang] || loginTranslations.en;
  const [searchParams] = useSearchParams();
  const {
    isAuthenticated,
    role,
    requestedRole: accountRequestedRole,
    fullName: accountFullName,
    studioName: accountStudioName,
    isLoading: authLoading,
    authError,
    refreshAuth
  } = useAuth();
  const requestedRedirect = searchParams.get('redirect');
  const isArtisanRegistrationCallback = requestedRole === 'artisan'
    && searchParams.get('register') === 'artisan';
  const shouldResumeArtisanRegistration = isArtisanRegistrationCallback
    && role !== 'artisan'
    && accountRequestedRole === 'artisan';
  const registrationStarted = useRef(false);
  const isAllowedArtisanRedirect = allowedArtisanRedirects.some((pattern) => (
    pattern.test(requestedRedirect || '')
  ));
  const isAllowedBuyerRedirect = allowedBuyerRedirects.some((pattern) => (
    pattern.test(requestedRedirect || '')
  ));
  const redirectTo = requestedRole === 'artisan'
    ? isAllowedArtisanRedirect ? requestedRedirect : '/seller/dashboard'
    : isAllowedBuyerRedirect ? requestedRedirect : '/';
  const [emailAction, setEmailAction] = useState('login');
  const [fullName, setFullName] = useState('');
  const [studioName, setStudioName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const navigateForRole = (accountRole) => navigate(
    accountRole === requestedRole
      ? redirectTo
      : (accountRole === 'artisan' ? '/seller/dashboard' : '/'),
    { replace: true }
  );

  useEffect(() => {
    if (authLoading || !isAuthenticated || shouldResumeArtisanRegistration) return;

    if (role === requestedRole) {
      navigate(redirectTo, { replace: true });
    } else if (role) {
      setMessage(`This account is registered as a ${role}; it does not have ${requestedRole} portal access.`);
    }
  }, [
    authLoading,
    isAuthenticated,
    role,
    requestedRole,
    redirectTo,
    navigate,
    isArtisanRegistrationCallback,
    shouldResumeArtisanRegistration
  ]);

  const completeArtisanRegistration = async (name, studio, session = null) => {
    const fullNameValue = name.trim();
    const studioNameValue = studio.trim();
    if (!fullNameValue || !studioNameValue) {
      throw new Error('Your name and studio or artisan name are required to complete registration.');
    }

    const { error } = await supabase.rpc('register_artisan_account', {
      p_full_name: fullNameValue,
      p_studio_name: studioNameValue
    });
    if (error) throw error;

    const account = await refreshAuth(session);
    if (!account.isAuthenticated || account.role !== 'artisan') {
      throw new Error('Artisan registration could not be verified. Please try again.');
    }
    navigateForRole(account.role);
  };

  useEffect(() => {
    if (
      !shouldResumeArtisanRegistration
      || authLoading
      || !isAuthenticated
      || registrationStarted.current
    ) return;

    registrationStarted.current = true;
    setLoading(true);
    setMessage('');
    completeArtisanRegistration(accountFullName || '', accountStudioName || '')
      .catch((error) => {
        setMessage(error.message || 'Unable to complete artisan registration. Please try again.');
      })
      .finally(() => setLoading(false));
  }, [
    shouldResumeArtisanRegistration,
    authLoading,
    isAuthenticated,
    accountRequestedRole,
    accountFullName,
    accountStudioName
  ]);

  const completeSignIn = async (session) => {
    const account = await refreshAuth(session);
    if (!account.isAuthenticated) {
      throw new Error('No active session was returned. Please try signing in again.');
    }
    if (account.role !== requestedRole) {
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
        throw new Error('Supabase authentication is unavailable. Set valid VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY values.');
      }

      const callbackUrl = new URL(`/${requestedRole}/login`, window.location.origin);
      if (requestedRole === 'artisan' && isAllowedArtisanRedirect) {
        callbackUrl.searchParams.set('redirect', requestedRedirect);
      } else if (requestedRole === 'buyer' && isAllowedBuyerRedirect) {
        callbackUrl.searchParams.set('redirect', requestedRedirect);
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: callbackUrl.toString() }
      });
      if (error) throw error;
    } catch (error) {
      const detail = error.message || 'Unable to continue with Google.';
      setMessage(/google|provider/i.test(detail)
        ? `${detail} Check that Google is enabled in your Supabase Auth providers.`
        : detail);
      setLoading(false);
    }
  };

  const handleEmailAuth = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      if (!isSupabaseConfigured()) {
        throw new Error('Supabase authentication is unavailable. Set valid VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY values.');
      }

      if (emailAction === 'signup') {
        if (requestedRole === 'artisan' && !studioName.trim()) {
          throw new Error('Enter your studio or artisan name to register.');
        }

        const emailCallbackUrl = new URL(`/${requestedRole}/login`, window.location.origin);
        if (requestedRole === 'artisan') {
          emailCallbackUrl.searchParams.set('register', 'artisan');
          if (isAllowedArtisanRedirect) {
            emailCallbackUrl.searchParams.set('redirect', requestedRedirect);
          }
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: emailCallbackUrl.toString(),
            data: {
              full_name: fullName.trim(),
              ...(requestedRole === 'artisan' && {
                studio_name: studioName.trim(),
                requested_role: 'artisan'
              })
            }
          }
        });
        if (error) throw error;

        if (data.session) {
          if (requestedRole === 'artisan') {
            await completeArtisanRegistration(fullName, studioName, data.session);
          } else {
            await completeSignIn(data.session);
          }
        } else {
          setMessage(requestedRole === 'artisan'
            ? 'Registration received. Confirm your email to activate your artisan role and studio profile; then you can open the seller dashboard.'
            : 'Account created. Check your email to confirm your address, then sign in.');
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
              ? requestedRole === 'artisan' ? copy.register : copy.createBuyer
              : requestedRole === 'artisan' ? copy.title : copy.buyer}
          </h1>
          <p>
            {isSignup
              ? requestedRole === 'artisan'
                ? 'Create an account with your studio details. Your seller dashboard is available after registration and any required email confirmation.'
                : 'Create an account to save your KalaSetu buyer details.'
              : requestedRole === 'artisan' ? copy.subtitle : copy.buyerSubtitle}
          </p>
        </div>

        {isAuthenticated && role && role !== requestedRole && (
          <div className="auth-message" role="status">
            You are signed in as a {role}. Sign out before using another portal account.
          </div>
        )}

        {authError && <div className="auth-message" role="alert">{authError}</div>}

        {!configured && (
          <div className="auth-message" role="alert">
            Supabase authentication is unavailable. Set valid VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY values; placeholder values are not accepted.
          </div>
        )}

        <div className="auth-mode-switch" role="group" aria-label="Choose account action">
          <button type="button" className={!isSignup ? 'active' : ''} onClick={() => { setEmailAction('login'); setMessage(''); }}>
            {copy.signIn}
          </button>
          <button type="button" className={isSignup ? 'active' : ''} onClick={() => { setEmailAction('signup'); setMessage(''); }}>
            {copy.create}
          </button>
        </div>

        {requestedRole === 'artisan' && !isSignup && (
          <div className="auth-message" role="note">
            Sign in with your artisan account, or create an account to register your studio and access seller tools.
          </div>
        )}

        {message && <div className="auth-message" role="status">{message}</div>}

        {!(isSignup && requestedRole === 'artisan') && <button
          type="button"
          className="btn btn-secondary login-submit login-google"
          onClick={handleGoogleSignIn}
          disabled={loading || !configured}
        >
          {loading ? copy.connecting : copy.google}
        </button>}

        <form onSubmit={handleEmailAuth}>
            {isSignup && (
              <>
                <div className="form-group">
                  <label className="form-label" htmlFor="signup-full-name">{copy.name}</label>
                  <input id="signup-full-name" type="text" required autoComplete="name" className="form-input" value={fullName} onChange={(event) => setFullName(event.target.value)} />
                </div>
                {requestedRole === 'artisan' && (
                  <div className="form-group">
                    <label className="form-label" htmlFor="signup-studio-name">{copy.studio}</label>
                    <input id="signup-studio-name" type="text" required autoComplete="organization" className="form-input" value={studioName} onChange={(event) => setStudioName(event.target.value)} />
                  </div>
                )}
              </>
            )}
            <div className="form-group">
              <label className="form-label" htmlFor="login-email">{copy.email}</label>
              <div className="login-input-wrap">
                <Mail size={16} aria-hidden="true" />
                <input id="login-email" type="email" required autoComplete="email" placeholder="you@kalasetu.org" className="form-input" value={email} onChange={(event) => setEmail(event.target.value)} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="login-password">{copy.password}</label>
              <div className="login-input-wrap">
                <Lock size={16} aria-hidden="true" />
                <input id="login-password" type="password" required minLength={6} autoComplete={isSignup ? 'new-password' : 'current-password'} placeholder="Password" className="form-input" value={password} onChange={(event) => setPassword(event.target.value)} />
              </div>
            </div>
            <button type="submit" className="btn btn-primary login-submit" disabled={loading || !configured}>
              <span>
                {loading ? (isSignup ? 'Creating account...' : copy.authenticating) : isSignup ? requestedRole === 'artisan' ? copy.registerButton : copy.create : copy.signIn}
              </span><ArrowRight size={16} />
            </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1rem' }}><Link to={requestedRole === 'artisan' ? '/buyer/login' : '/artisan/login'}>{requestedRole === 'artisan' ? copy.buyerLink : copy.artisanLink}</Link></p>
        <div className="login-security-note">
          <ShieldCheck size={14} color="#059669" />
          <span>{copy.security}</span>
        </div>
      </div>
    </div>
  );
}

