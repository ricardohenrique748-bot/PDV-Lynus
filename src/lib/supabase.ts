import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder-erp.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key-erp-lynus-system-token';

export const isSupabaseConfigured = 
  supabaseUrl !== 'https://placeholder-erp.supabase.co' &&
  supabaseAnonKey !== 'placeholder-anon-key-erp-lynus-system-token';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
  },
  global: {
    headers: {
      'x-application-name': 'lynus-system-erp',
    },
  },
});

