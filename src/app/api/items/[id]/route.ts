import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabase } from '@/lib/supabase'
import { getCatalogItem } from '@/lib/catalog-items'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const { item, source } = await getCatalogItem(id)

  if (!item) {
    return NextResponse.json({ error: 'Item not found' }, { status: 404 })
  }

  if (source === 'csv') {
    return NextResponse.json({ item, bids: [], config: null, catalog_source: source })
  }

  const db = createServiceSupabase()

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

  return NextResponse.json({ item, bids: bids ?? [], config, catalog_source: source })
}
