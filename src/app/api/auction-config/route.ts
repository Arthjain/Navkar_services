import { NextResponse } from 'next/server'
import { createServiceSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// Public endpoint — anyone can read auction timing for countdown display
export async function GET() {
  const db = createServiceSupabase()
  const { data, error } = await db.from('auction_config').select('auction_end_at, is_live').eq('id', 1).single()
  if (error) return NextResponse.json({ config: null })
  return NextResponse.json({ config: data })
}
