
import { createContext, useContext, useEffect, useState } from 'react';
import {
  isSupabaseConfigured,
  supabase
} from '../lib/supabaseClient.js';

const AuthContext = createContext(null);

const anonymousAccount = {
  id: null,
  email: null,
  fullName: null,
  studioName: null,
  requestedRole: null,
  phone: null,
  createdAt: null,
  role: null,
  isAuthenticated: false
};

// Keep the Supabase session authenticated even if profile loading fails.
// Never assign an artisan role using client-side metadata.
function getPendingAccount(session) {
  const user = session?.user;

  if (!user) return anonymousAccount;

  return {
    id: user.id,
    email: user.email || null,
    fullName: user.user_metadata?.full_name || null,
    studioName: user.user_metadata?.studio_name || null,
    requestedRole:
      user.user_metadata?.requested_role || 'buyer',
    phone: user.phone || user.user_metadata?.phone || null,
    createdAt: user.created_at || null,
    role: null,
    isAuthenticated: true
  };
}

// Retrieve the verified role from the database.
async function getAccount(session) {
  const user = session?.user;

  if (!user) return anonymousAccount;

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role, full_name, studio_name, requested_role')
    .eq('id', user.id)
    .maybeSingle();

  if (error) {
    throw new Error(
      `Unable to load your KalaSetu profile: ${error.message}`
    );
  }

  if (!profile) {
    throw new Error(
      'Your account was created, but its KalaSetu profile is missing. Please check that the Supabase profile migration and signup trigger have been applied.'
    );
  }

  return {
    id: user.id,
    email: user.email || null,

    fullName:
      profile.full_name ||
      user.user_metadata?.full_name ||
      null,

    studioName:
      profile.studio_name ||
      user.user_metadata?.studio_name ||
      null,

    requestedRole: profile.requested_role || 'buyer',

    phone:
      user.phone ||
      user.user_metadata?.phone ||
      null,

    createdAt: user.created_at || null,

    role: profile.role,

    isAuthenticated: true
  };
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(anonymousAccount);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setIsLoading(false);
      return undefined;
    }

    let active = true;
    let requestVersion = 0;

    const syncSession = async (nextSession) => {
      const version = ++requestVersion;

      try {
        const account = await getAccount(nextSession);

        if (!active || version !== requestVersion) {
          return account;
        }

        setSession(account);
        setAuthError('');
        setIsLoading(false);

        return account;
      } catch (error) {
        if (!active || version !== requestVersion) {
          throw error;
        }

        setSession(getPendingAccount(nextSession));

        setAuthError(
          error.message ||
          'Unable to verify your KalaSetu account.'
        );

        setIsLoading(false);

        throw error;
      }
    };

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        // Do not perform Supabase database requests inside
        // the auth-state callback itself.
        setTimeout(() => {
          syncSession(nextSession).catch((error) => {
            console.error(
              'KalaSetu authentication error:',
              error
            );
          });
        }, 0);
      }
    );

    supabase.auth.getSession()
      .then(({ data, error }) => {
        if (!active) return;

        if (error) {
          throw error;
        }

        return syncSession(data.session);
      })
      .catch((error) => {
        if (!active) return;

        console.error(
          'Unable to restore KalaSetu session:',
          error
        );

        setSession(anonymousAccount);
        setAuthError(
          error.message || 'Unable to restore your session.'
        );
        setIsLoading(false);
      });

    return () => {
      active = false;
      requestVersion++;
      subscription.unsubscribe();
    };
  }, []);

  // Refresh the current authenticated account.
  const refreshAuth = async (supabaseSession = null) => {
    let nextSession = supabaseSession;

    if (!nextSession) {
      const { data, error } = await supabase.auth.getSession();

      if (error) throw error;

      nextSession = data.session;
    }

    if (!nextSession?.user) {
      setSession(anonymousAccount);
      setAuthError('');
      setIsLoading(false);

      return anonymousAccount;
    }

    try {
      const account = await getAccount(nextSession);

      setSession(account);
      setAuthError('');
      setIsLoading(false);

      return account;
    } catch (error) {
      setSession(getPendingAccount(nextSession));

      setAuthError(
        error.message ||
        'Unable to load your KalaSetu account.'
      );

      setIsLoading(false);

      throw error;
    }
  };

  // Sign out from Supabase.
  const signOut = async () => {
    if (isSupabaseConfigured()) {
      const { error } = await supabase.auth.signOut();

      if (error) throw error;
    }

    setSession(anonymousAccount);
    setAuthError('');
    setIsLoading(false);
  };

  const value = {
    ...session,

    isAuthenticated: Boolean(session?.isAuthenticated),

    isArtisan: session?.role === 'artisan',

    role: session?.role ?? null,

    isLoading,

    authError,

    refreshAuth,

    signOut
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      'useAuth must be used within an AuthProvider'
    );
  }

  return context;
}
