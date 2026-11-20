
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Always load backend/.env
dotenv.config({
  path: path.resolve(__dirname, '../../.env')
});

const supabaseUrl = process.env.SUPABASE_URL || '';

const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  '';

export const isSupabaseConfigured = () => {
  return Boolean(
    supabaseUrl &&
    supabaseKey &&
    supabaseUrl.startsWith('https://')
  );
};

if (!isSupabaseConfigured()) {
  console.error('Supabase configuration missing:', {
    urlPresent: Boolean(supabaseUrl),
    keyPresent: Boolean(supabaseKey)
  });
} else {
  console.log('Supabase environment variables loaded successfully.');
}

export const supabase = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseKey)
  : null;
