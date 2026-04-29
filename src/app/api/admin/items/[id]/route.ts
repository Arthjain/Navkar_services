import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth'
import { createServiceSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

const patchSchema = z.object({
  name:           z.string().min(1).optional(),
  description:    z.string().optional(),
  category:       z.string().optional(),
  starting_price: z.number().positive().optional(),
  min_increment:  z.number().positive().optional(),
  image_urls:     z.array(z.string()).optional(),
  status:         z.enum(['open', 'closed']).optional(),
})

// PATCH — edit item (locked if bids exist, except admin notes)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
    const { id } = await params
    const body = await req.json()
    const updates = patchSchema.parse(body)
    const db = createServiceSupabase()

    // Check if any bids exist — lock price fields if so
    const { count } = await db.from('bids').select('id', { count: 'exact', head: true }).eq('item_id', id)
    if ((count ?? 0) > 0) {
      delete updates.starting_price
      delete updates.min_increment
    }

    const { data, error } = await db.from('items').update(updates).eq('id', id).select().single()
    if (error) throw error
    return NextResponse.json({ item: data })
  } catch (err: unknown) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.errors }, { status: 400 })
    if (err instanceof Error && (err.message === 'UNAUTHORIZED' || err.message === 'FORBIDDEN')) {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 })
    }
    return NextResponse.json({ error: 'Failed to update item' }, { status: 500 })
  }
}

// DELETE — remove item (only if no bids)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
    const { id } = await params
    const db = createServiceSupabase()

    const { count } = await db.from('bids').select('id', { count: 'exact', head: true }).eq('item_id', id)
    if ((count ?? 0) > 0) {
      return NextResponse.json({ error: 'Cannot delete item with existing bids.' }, { status: 400 })
    }

    const { error } = await db.from('items').delete().eq('id', id)
    if (error) throw error
    return NextResponse.json({ message: 'Deleted' })
  } catch (err: unknown) {
    if (err instanceof Error && (err.message === 'UNAUTHORIZED' || err.message === 'FORBIDDEN')) {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 })
    }
    return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 })
  }
}
