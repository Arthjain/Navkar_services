import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceSupabase } from '@/lib/supabase'
import { rateLimit } from '@/lib/rate-limit'
import { requireSession } from '@/lib/auth'

const schema = z.object({
  amount: z.number().positive(),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession()
    const { id: itemId } = await params
    const body = await req.json()
    const { amount } = schema.parse(body)

    const contactId = session.email || session.phone || 'unknown'

    // Rate limit per contact
    if (!rateLimit(`bid:${contactId}`, 30, 60 * 1000)) {
      return NextResponse.json({ error: 'Too many bids. Slow down.' }, { status: 429 })
    }

    const db = createServiceSupabase()
    const { data, error } = await db.rpc('place_bid', {
      p_item_id:   itemId,
      p_shop_name: session.shop_name,
      p_phone:     session.phone || null,
      p_email:     session.email || null,
      p_amount:    amount,
    })

    if (error) throw error

    const result = Array.isArray(data) ? data[0] : data
    if (!result?.ok) {
      return NextResponse.json({ error: result?.message ?? 'Bid failed' }, { status: 400 })
    }

    return NextResponse.json({ message: result.message })
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 })
    }
    console.error('[POST bid]', err)
    return NextResponse.json({ error: 'Failed to place bid' }, { status: 500 })
  }
}
