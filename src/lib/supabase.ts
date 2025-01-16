import { createClient } from '@supabase/supabase-js';
import { config } from './config';
import type { Database } from './database.types';

export const supabase = createClient<Database>(
  config.supabase.url,
  config.supabase.anonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false
    },
  }
);