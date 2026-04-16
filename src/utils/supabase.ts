// ═══════════════════════════════════════════════════════════════
// StatusVault — Supabase Client
// Publishable (anon) key only — safe in client code
// ═══════════════════════════════════════════════════════════════

import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import { platformStorage } from './storage';

const SUPABASE_URL = 'https://gekhrdqkaadqeeebzvlu.supabase.co';
// Derived storage key — Supabase JS uses this format for session persistence
export const SUPABASE_SESSION_KEY = `sb-${SUPABASE_URL.split('//')[1].split('.')[0]}-auth-token`;
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdla2hyZHFrYWFkcWVlZWJ6dmx1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1MzcxMTIsImV4cCI6MjA5MDExMzExMn0.fgzagDt9ZNQnwP3bQR6pDZ6MZ2UWFomBuKd3xsPHkUk';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    // Use platform-aware storage so sessions persist on both mobile and web
    storage: platformStorage as any,
    autoRefreshToken: true,
    persistSession: true,
    // detectSessionInUrl handles both implicit (#access_token=) and PKCE (?code=)
    // automatically — do not force flowType, let the Supabase project config decide
    detectSessionInUrl: Platform.OS === 'web',
  },
});
