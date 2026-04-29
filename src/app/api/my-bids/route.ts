import { NextResponse } from 'next/server'
import { requireSession } from '@/lib/auth'
import { createServiceSupabase } from '@/lib/supabase'

// GET /api/my-bids — authenticated buyer's own bid history
export async function GET() {
  try {
    const session = await requireSession()
    const db = createServiceSupabase()

    const baseQuery = db
      .from('bids')
      .select(`
        id, amount, shop_name, created_at, anon_handle,
        item:items ( id, name, category, current_top_bid, status )
      `)
      .order('created_at', { ascending: false })

    const query = session.phone
      ? baseQuery.eq('phone', session.phone)
      : session.email
        ? baseQuery.eq('email', session.email)
        : null

    if (!query) {
      return NextResponse.json({ error: 'Login required' }, { status: 401 })
    }

    const { data, error } = await query

    if (error) throw error

    // Tag each bid: is this still the current highest?
    const enriched = data?.map(bid => {
      const item = Array.isArray(bid.item) ? bid.item[0] : bid.item

      return {
        ...bid,
        shop_name_snapshot: bid.shop_name,
        item,
        is_winning: item?.current_top_bid === bid.amount,
      }
    })

    return NextResponse.json({ bids: enriched })
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Login required' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Failed to load bids' }, { status: 500 })
  }
}
