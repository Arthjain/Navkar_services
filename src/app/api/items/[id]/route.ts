import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabase } from '@/lib/supabase'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const db = createServiceSupabase()

  // Item details
  const { data: item, error: itemErr } = await db
    .from('items')
    .select(`
      id, name, description, category, starting_price, min_increment,
      image_urls, current_top_bid, status, created_at,
      top_bidder:users!current_top_bidder_id ( anon_handle )
    `)
    .eq('id', id)
    .single()

  if (itemErr || !item) {
    return NextResponse.json({ error: 'Item not found' }, { status: 404 })
  }

  // Anonymised bid history via public_bids view
  const { data: bids, error: bidsErr } = await db
    .from('public_bids')
    .select('id, amount, created_at, anon_handle')
    .eq('item_id', id)
    .order('amount', { ascending: false })

  if (bidsErr) {
    return NextResponse.json({ error: 'Failed to load bids' }, { status: 500 })
  }

  // Auction config (for countdown)
  const { data: config } = await db
    .from('auction_config')
    .select('auction_end_at, is_live')
    .eq('id', 1)
    .single()

  return NextResponse.json({ item, bids: bids ?? [], config })
}
