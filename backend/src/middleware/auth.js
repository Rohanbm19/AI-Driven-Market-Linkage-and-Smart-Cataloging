import { createClient } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../config/supabase.js';

// Validate access tokens with Supabase and use the caller's JWT for RLS.
export async function requireAuth(req, res, next) {
  if (!isSupabaseConfigured()) return res.status(503).json({ error: 'Supabase is not configured.' });
  const token = req.headers.authorization?.match(/^Bearer (.+)$/i)?.[1];
  if (!token) return res.status(401).json({ error: 'Sign in required.' });
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return res.status(401).json({ error: 'Invalid or expired session.' });
    req.user = user;
    req.db = createClient(process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY, {
        global: { headers: { Authorization: `Bearer ${token}` } },
        auth: { persistSession: false, autoRefreshToken: false }
      });
    next();
  } catch (error) { res.status(401).json({ error: 'Unable to validate session.' }); }
}
export async function requireArtisan(req, res, next) {
  const { data: role, error } = await req.db.rpc('get_my_kalasetu_role');
  if (error) return res.status(500).json({ error: `Unable to verify KalaSetu role: ${error.message}` });
  if (!role) return res.status(404).json({ error: 'No KalaSetu user record is linked to this account.' });
  if (role !== 'artisan') return res.status(403).json({ error: 'Artisan access required.' });
  next();
}
export function protectArtisanWrites(req, res, next) {
  req.db = supabase;
  if (['GET','HEAD','OPTIONS'].includes(req.method)) return next();
  return requireAuth(req, res, () => requireArtisan(req, res, next));
}
