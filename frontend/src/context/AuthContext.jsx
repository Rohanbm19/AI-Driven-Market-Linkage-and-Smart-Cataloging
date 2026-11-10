import { createContext, useContext, useEffect, useState } from 'react';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient.js';

const AuthContext = createContext(null);
const anonymousAccount = { role: 'buyer', isAuthenticated: false };

async function getAccount(session) {
  const user = session?.user;
  if (!user) return anonymousAccount;

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role, requested_role, full_name, studio_name')
    .eq('id', user.id)
    .maybeSingle();

  if (error) throw error;

  return {
    id: user.id,
    email: user.email || null,
    fullName: profile?.full_name || user.user_metadata?.full_name || null,
    studioName: profile?.studio_name || user.user_metadata?.studio_name || null,
    requestedRole: profile?.requested_role || 'buyer',
    phone: user.phone || user.user_metadata?.phone || null,
    createdAt: user.created_at || null,
    role: profile?.role === 'artisan' ? 'artisan' : 'buyer',
    isAuthenticated: true
  };
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(anonymousAccount);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('kalasetu_user');
    }

    if (!isSupabaseConfigured()) {
      setIsLoading(false);
      return undefined;
    }

    let active = true;

    const syncSession = async (nextSession) => {
      const account = await getAccount(nextSession);
      if (!active) return account;
      setSession(account);
      setAuthError('');
      setIsLoading(false);
      return account;
    };

    const handleAuthError = (error, nextSession = null) => {
      console.error('Unable to load the authenticated account:', error);
      if (!active) return;
      setSession(nextSession?.user
        ? {
            id: nextSession.user.id,
            email: nextSession.user.email || null,
            fullName: nextSession.user.user_metadata?.full_name || null,
            phone: nextSession.user.phone || null,
            createdAt: nextSession.user.created_at || null,
            role: 'buyer',
            isAuthenticated: true
          }
        : anonymousAccount);
      setAuthError('Unable to load your account profile. Please try again.');
      setIsLoading(false);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setTimeout(() => {
        syncSession(nextSession).catch((error) => handleAuthError(error, nextSession));
      }, 0);
    });

    supabase.auth.getSession()
      .then(({ data, error }) => {
        if (error) throw error;
        return syncSession(data.session);
      })
      .catch((error) => handleAuthError(error));

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const refreshAuth = async (supabaseSession = null) => {
    let nextSession = supabaseSession;
    if (!nextSession) {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      nextSession = data.session;
    }

    const account = await getAccount(nextSession);
    setSession(account);
    setAuthError('');
    setIsLoading(false);
    return account;
  };

  const signOut = async () => {
    if (isSupabaseConfigured()) {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    }
    setSession(anonymousAccount);
    setAuthError('');
  };

  const value = {
    ...session,
    isAuthenticated: Boolean(session?.isAuthenticated),
    isArtisan: session?.role === 'artisan',
    role: session?.role || 'buyer',
    isLoading,
    authError,
    refreshAuth,
    signOut
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
