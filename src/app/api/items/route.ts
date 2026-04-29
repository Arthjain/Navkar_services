import { NextResponse } from 'next/server'
import { createServiceSupabase } from '@/lib/supabase'

export async function GET() {
  const db = createServiceSupabase()

  // Fetch all open items with denormalized top bid
  const { data: items, error } = await db
    .from('items')
    .select(`
      id, name, description, category, starting_price, min_increment,
      image_urls, current_top_bid, status, created_at,
      top_bidder:users!current_top_bidder_id ( anon_handle )
    `)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('[GET /api/items]', error)
    return NextResponse.json({ error: 'Failed to load items' }, { status: 500 })
  }

  return NextResponse.json({ items })
}
