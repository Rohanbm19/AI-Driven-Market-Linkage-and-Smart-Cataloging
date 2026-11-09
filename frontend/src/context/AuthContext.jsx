import { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext(null);

const readStoredUser = () => {
  if (typeof window === 'undefined') {
    return { role: 'buyer', isAuthenticated: false };
  }

  const storedUser = window.localStorage.getItem('kalasetu_user');
  if (!storedUser) {
    return { role: 'buyer', isAuthenticated: false };
  }

  try {
    const parsed = JSON.parse(storedUser);
    const role = parsed?.role === 'artisan' ? 'artisan' : 'buyer';
    return {
      ...parsed,
      role,
      isAuthenticated: Boolean(parsed?.email || parsed?.phone || parsed?.id)
    };
  } catch (error) {
    console.warn('Unable to parse stored auth user:', error);
    return { role: 'buyer', isAuthenticated: false };
  }
};

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => readStoredUser());

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleStorage = () => setSession(readStoredUser());
      window.addEventListener('storage', handleStorage);
      return () => window.removeEventListener('storage', handleStorage);
    }
    return undefined;
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const payload = session.isAuthenticated ? session : null;
      if (payload) {
        window.localStorage.setItem('kalasetu_user', JSON.stringify(payload));
      } else {
        window.localStorage.removeItem('kalasetu_user');
      }
    }
  }, [session]);

  const refreshAuth = async (supabaseSession = null) => {
    if (supabaseSession?.user) {
      const derivedRole = supabaseSession.user.app_metadata?.role === 'artisan' ? 'artisan' : 'buyer';
      const account = {
        id: supabaseSession.user.id,
        email: supabaseSession.user.email || null,
        phone: supabaseSession.user.phone || null,
        role: derivedRole,
        isAuthenticated: true
      };
      setSession(account);
      return account;
    }

    const account = readStoredUser();
    setSession(account);
    return account;
  };

  const signOut = async () => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('kalasetu_user');
    }
    setSession({ role: 'buyer', isAuthenticated: false });
    return true;
  };

  const value = {
    ...session,
    isAuthenticated: Boolean(session?.isAuthenticated),
    isArtisan: session?.role === 'artisan',
    role: session?.role || 'buyer',
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
