import { createClient } from '@supabase/supabase-js';

const FALLBACK_URL = 'https://placeholder.supabase.co';
const FALLBACK_KEY = 'placeholder-key';
const configuredUrl = import.meta.env.VITE_SUPABASE_URL?.trim() || '';
const configuredAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() || '';

function isValidSupabaseUrl(value) {
  try {
    const url = new URL(value);
    return (
      ['https:', 'http:'].includes(url.protocol) &&
      !/placeholder|your[-_ ]?project|example/i.test(url.hostname)
    );
  } catch {
    return false;
  }
}

function isValidAnonKey(value) {
  return Boolean(value) && !/placeholder|your[-_ ]?(supabase[-_ ]?)?(anon[-_ ]?)?key|replace[-_ ]?me|example/i.test(value);
}

const supabaseUrl = isValidSupabaseUrl(configuredUrl) ? configuredUrl : FALLBACK_URL;
const supabaseAnonKey = isValidAnonKey(configuredAnonKey) ? configuredAnonKey : FALLBACK_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const isSupabaseConfigured = () => {
  return isValidSupabaseUrl(configuredUrl) && isValidAnonKey(configuredAnonKey);
};
