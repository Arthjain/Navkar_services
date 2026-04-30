import { NextResponse } from 'next/server'
import { getCatalogItems } from '@/lib/catalog-items'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const { items } = await getCatalogItems()
    return NextResponse.json({ items })
  } catch (error) {
    console.error('[GET /api/items]', error)
    return NextResponse.json({ error: 'Failed to load items' }, { status: 500 })
  }
}
