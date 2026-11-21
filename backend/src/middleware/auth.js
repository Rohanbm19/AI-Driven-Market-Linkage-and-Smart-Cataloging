import { createClient } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../config/supabase.js';

export async function requireAuth(req, res, next) {
  if (!isSupabaseConfigured()) {
    return res.status(503).json({ error: 'Supabase is not configured.' });
  }

  const token = req.headers.authorization?.match(/^Bearer\s+(.+)$/i)?.[1];

  if (!token) {
    return res.status(401).json({ error: 'Sign in required.' });
  }

  if (!process.env.SUPABASE_ANON_KEY) {
    return res.status(503).json({ error: 'Supabase anon key is missing.' });
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired session.' });
    }

    req.user = user;
    req.db = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY,
      {
        global: {
          headers: { Authorization: `Bearer ${token}` }
        },
        auth: {
          persistSession: false,
          autoRefreshToken: false
        }
      }
    );

    return next();
  } catch (error) {
    console.error('Authentication error:', error.message);
    return res.status(401).json({ error: 'Unable to validate session.' });
  }
}

export async function requireArtisan(req, res, next) {
  try {
    const { data: profile, error } = await req.db
      .from('profiles')
      .select('role')
      .eq('id', req.user.id)
      .maybeSingle();

    if (error) {
      console.error('Unable to verify KalaSetu profile:', error.message);
      return res.status(500).json({ error: 'Unable to verify KalaSetu role.' });
    }

    if (!profile) {
      return res.status(404).json({ error: 'No KalaSetu profile is linked to this account.' });
    }

    if (profile.role !== 'artisan') {
      return res.status(403).json({ error: 'Artisan access required.' });
    }

    return next();
  } catch (error) {
    console.error('Unable to verify KalaSetu role:', error.message);
    return res.status(500).json({ error: error.message });
  }
}

export function protectArtisanWrites(req, res, next) {
  req.db = supabase;

  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  return requireAuth(req, res, () =>
    requireArtisan(req, res, next)
  );
}
