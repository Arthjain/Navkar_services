import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth'
import { createServiceSupabase } from '@/lib/supabase'
import { getCatalogItems } from '@/lib/catalog-items'

export const dynamic = 'force-dynamic'

const itemSchema = z.object({
  name:           z.string().min(1),
  description:    z.string().optional(),
  category:       z.string().optional(),
  starting_price: z.number().positive(),
  min_increment:  z.number().positive().default(100),
  image_urls:     z.array(z.string().url()).default([]),
})

// GET — list all items (admin sees everything including closed)
export async function GET() {
  try {
    await requireAdmin()
    const { items, source } = await getCatalogItems()
    return NextResponse.json({ items, catalog_source: source })
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 })
    }
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

// POST — create a single item
export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
    const body = await req.json()
    const parsed = itemSchema.parse(body)
    const db = createServiceSupabase()
    const { data, error } = await db.from('items').insert(parsed).select().single()
    if (error) throw error
    return NextResponse.json({ item: data }, { status: 201 })
  } catch (err: unknown) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.errors }, { status: 400 })
    if (err instanceof Error && (err.message === 'UNAUTHORIZED' || err.message === 'FORBIDDEN')) {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 })
    }
    console.error('[POST /api/admin/items]', err)
    return NextResponse.json({ error: 'Failed to create item' }, { status: 500 })
  }
}
