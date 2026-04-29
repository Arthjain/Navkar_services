import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { createServiceSupabase } from '@/lib/supabase'

// GET /api/admin/winners — per-item winner (highest bid per item)
export async function GET() {
  try {
    await requireAdmin()
    const db = createServiceSupabase()

    // Get all items with a top bid
    const { data: items, error } = await db
      .from('items')
      .select(`id, name, category, status, current_top_bid, current_top_anon`)
      .not('current_top_bid', 'is', null)
      .order('name')

    if (error) throw error

    // For each item, fetch the contact details of the winning bid from the bids table
    // (since we denormalize phone/email/shop_name on the bid itself)
    const winners = await Promise.all((items || []).map(async item => {
      const { data: topBid } = await db
        .from('bids')
        .select('shop_name, phone, email, anon_handle')
        .eq('item_id', item.id)
        .order('amount', { ascending: false })
        .limit(1)
        .single()
      
      return {
        ...item,
        winner: topBid ? {
          shop_name: topBid.shop_name,
          phone: topBid.phone,
          email: topBid.email,
          anon_handle: topBid.anon_handle
        } : null
      }
    }))

    return NextResponse.json({ winners })
  } catch (err: unknown) {
    if (err instanceof Error && (err.message === 'UNAUTHORIZED' || err.message === 'FORBIDDEN')) {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 })
    }
    return NextResponse.json({ error: 'Failed to load winners' }, { status: 500 })
  }
}
