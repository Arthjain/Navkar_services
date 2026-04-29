import { createBrowserClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'

function getSupabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!url) throw new Error('NEXT_PUBLIC_SUPABASE_URL is required')
  return url
}

function getSupabaseAnonKey(): string {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!key) throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is required')
  return key
}

function getSupabaseServiceKey(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY is required')
  return key
}

// ── Browser client (Client Components) ───────────────────────
export function createBrowserSupabase() {
  return createBrowserClient(getSupabaseUrl(), getSupabaseAnonKey())
}

// ── Service-role client — bypasses RLS (API routes only) ─────
export function createServiceSupabase() {
  return createClient(getSupabaseUrl(), getSupabaseServiceKey(), {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
