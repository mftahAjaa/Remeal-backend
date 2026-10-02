// src/config/supabase.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
  throw new Error(
    'SUPABASE_URL, SUPABASE_ANON_KEY, dan SUPABASE_SERVICE_ROLE_KEY wajib diatur.',
  );
}

const authOptions = {
  autoRefreshToken: false,
  detectSessionInUrl: false,
  persistSession: false,
};

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: authOptions,
});

export function supabaseForUser(token) {
  if (typeof token !== 'string' || token.length === 0) {
    throw new TypeError('Token pengguna wajib berupa string yang tidak kosong.');
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: authOptions,
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });
}