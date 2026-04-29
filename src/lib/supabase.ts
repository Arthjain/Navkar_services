import { createBrowserClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseService = process.env.SUPABASE_SERVICE_ROLE_KEY!

// ── Browser client (Client Components) ───────────────────────
export function createBrowserSupabase() {
  return createBrowserClient(supabaseUrl, supabaseAnon)
}

// ── Service-role client — bypasses RLS (API routes only) ─────
export function createServiceSupabase() {
  return createClient(supabaseUrl, supabaseService, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
