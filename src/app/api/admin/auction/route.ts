import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth'
import { createServiceSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

const schema = z.object({
  auction_end_at: z.string().datetime().nullable().optional(),
  is_live:        z.boolean().optional(),
  action:         z.enum(['close']).optional(), // closes all items
})

// GET — current auction config
export async function GET() {
  try {
    await requireAdmin()
    const db = createServiceSupabase()
    const { data, error } = await db.from('auction_config').select('*').eq('id', 1).single()
    if (error) throw error
    return NextResponse.json({ config: data })
  } catch (err: unknown) {
    if (err instanceof Error && (err.message === 'UNAUTHORIZED' || err.message === 'FORBIDDEN')) {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 })
    }
    return NextResponse.json({ error: 'Failed to load config' }, { status: 500 })
  }
}

// POST — update auction settings or close auction
export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
    const body = await req.json()
    const { auction_end_at, is_live, action } = schema.parse(body)
    const db = createServiceSupabase()

    if (action === 'close') {
      // Close all open items
      await db.from('items').update({ status: 'closed' }).eq('status', 'open')
      await db.from('auction_config').update({ is_live: false }).eq('id', 1)
      return NextResponse.json({ message: 'Auction closed. All items marked closed.' })
    }

    const updates: Record<string, unknown> = {}
    if (auction_end_at !== undefined) updates.auction_end_at = auction_end_at
    if (is_live !== undefined) updates.is_live = is_live

    const { data, error } = await db.from('auction_config').update(updates).eq('id', 1).select().single()
    if (error) throw error
    return NextResponse.json({ config: data })
  } catch (err: unknown) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.errors }, { status: 400 })
    if (err instanceof Error && (err.message === 'UNAUTHORIZED' || err.message === 'FORBIDDEN')) {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 })
    }
    return NextResponse.json({ error: 'Failed to update auction' }, { status: 500 })
  }
}
