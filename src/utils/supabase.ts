// ═══════════════════════════════════════════════════════════════
// StatusVault — Supabase Client
// Publishable (anon) key only — safe in client code
// ═══════════════════════════════════════════════════════════════

import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import { platformStorage } from './storage';

const SUPABASE_URL = 'https://gekhrdqkaadqeeebzvlu.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_ek3nTZ0Aj-wh6dQqhav9_A_yhKXWqb0';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    // Use platform-aware storage so sessions persist on both mobile and web
    storage: platformStorage as any,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
});
