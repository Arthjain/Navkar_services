import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { createServiceSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// GET /api/admin/bids?item_id=xxx  — full bid log with bidder identity
export async function GET(req: NextRequest) {
  try {
    await requireAdmin()
    const itemId = req.nextUrl.searchParams.get('item_id')
    const db = createServiceSupabase()

    let query = db
      .from('bids')
      .select(`
        id, item_id, amount, shop_name, phone, email, anon_handle, created_at,
        item:items ( name )
      `)
      .order('created_at', { ascending: false })

    if (itemId) query = query.eq('item_id', itemId)

    const { data, error } = await query
    if (error) throw error
    return NextResponse.json({ bids: data })
  } catch (err: unknown) {
    if (err instanceof Error && (err.message === 'UNAUTHORIZED' || err.message === 'FORBIDDEN')) {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 })
    }
    return NextResponse.json({ error: 'Failed to load bids' }, { status: 500 })
  }
}
