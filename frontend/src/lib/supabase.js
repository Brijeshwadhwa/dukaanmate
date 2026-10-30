/**
 * DukaanMate — Supabase client setup
 * Uses ONLY the public anon key — never the service-role key.
 * The anon key is safe to include in the frontend bundle.
 * All sensitive operations (using service-role key) happen only in the backend.
 */
import { createClient } from '@supabase/supabase-js'

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnon = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key'

export const isSupabaseConfigured = Boolean(
  import.meta.env.VITE_SUPABASE_URL &&
  !import.meta.env.VITE_SUPABASE_URL.includes('your-project') &&
  import.meta.env.VITE_SUPABASE_ANON_KEY &&
  !import.meta.env.VITE_SUPABASE_ANON_KEY.includes('your-anon-key')
)

export const supabase = createClient(supabaseUrl, supabaseAnon, {
  auth: {
    // Persist session in localStorage so users stay logged in
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

