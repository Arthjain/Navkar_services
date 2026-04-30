import 'server-only'

import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import * as XLSX from 'xlsx'
import type { Item } from '@/types'
import { createServiceSupabase } from '@/lib/supabase'

export type CatalogSource = 'db' | 'csv'

export type CatalogItem = Item & { top_bidder?: { anon_handle: string } | null }

type SeedRow = {
  name: string
  description: string | null
  category: string
  starting_price: number
  min_increment: number
  image_urls: string[]
}

type CatalogResult = {
  items: CatalogItem[]
  source: CatalogSource
}

const CSV_FILE_PATH = path.join(process.cwd(), 'items_to_import.csv')

let cachedSeedRows: SeedRow[] | null = null

function normalize(value: string | number | null | undefined) {
  return String(value ?? '').trim().toLowerCase()
}

function buildKey(row: Pick<SeedRow, 'name' | 'category' | 'starting_price' | 'min_increment'>) {
  return [normalize(row.name), normalize(row.category), String(row.starting_price), String(row.min_increment)].join('|')
}

function createSeedId(key: string) {
  const digest = createHash('sha256').update(key).digest()
  const bytes = Array.from(digest.slice(0, 16))

  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80

  const hex = bytes.map(byte => byte.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`
}

function chunk<T>(items: T[], size: number) {
  const batches: T[][] = []
  for (let index = 0; index < items.length; index += size) {
    batches.push(items.slice(index, index + size))
  }
  return batches
}

function toCatalogItem(row: SeedRow): CatalogItem {
  const seedId = createSeedId(buildKey(row))

  return {
    id: seedId,
    name: row.name,
    description: row.description,
    category: row.category,
    starting_price: row.starting_price,
    min_increment: row.min_increment,
    image_urls: row.image_urls,
    current_top_bid: null,
    current_top_anon: null,
    status: 'open',
    created_at: new Date(0).toISOString(),
  }
}

async function loadSeedRows(): Promise<SeedRow[]> {
  if (cachedSeedRows) return cachedSeedRows

  const csvText = await readFile(CSV_FILE_PATH, 'utf8')
  const workbook = XLSX.read(csvText, { type: 'string' })
  const worksheet = workbook.Sheets[workbook.SheetNames[0]]
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: '' })

  cachedSeedRows = rawRows.map((row, index) => {
    const get = (key: string) => {
      const normalizedKey = key.toLowerCase().replace(/[\s_]/g, '')
      const foundKey = Object.keys(row).find(candidate => candidate.toLowerCase().replace(/[\s_]/g, '') === normalizedKey)
      return foundKey ? String(row[foundKey] ?? '').trim() : ''
    }

    const name = get('name')
    const category = get('category')
    const startingPrice = Number(get('startingprice') || get('price'))
    const minIncrement = Number(get('minincrement') || get('increment')) || 100
    const imageUrls = get('imageurl') || get('imageurls') || get('images')

    if (!name) {
      throw new Error(`Missing item name in CSV row ${index + 2}`)
    }

    if (!category) {
      throw new Error(`Missing category/brand in CSV row ${index + 2}`)
    }

    if (Number.isNaN(startingPrice)) {
      throw new Error(`Invalid starting price in CSV row ${index + 2}`)
    }

    return {
      name,
      description: get('description') || null,
      category,
      starting_price: startingPrice,
      min_increment: minIncrement,
      image_urls: imageUrls ? imageUrls.split(',').map((value: string) => value.trim()).filter(Boolean) : [],
    }
  })

  return cachedSeedRows
}

async function seedMissingCatalogItems(seedRows: SeedRow[]) {
  const db = createServiceSupabase()
  const { data: existingRows, error } = await db
    .from('items')
    .select('name, category, starting_price, min_increment')

  if (error) {
    throw error
  }

  const existingKeys = new Set((existingRows ?? []).map(row => buildKey(row)))
  const missingRows = seedRows
    .filter(row => !existingKeys.has(buildKey(row)))
    .map(row => ({
      id: createSeedId(buildKey(row)),
      name: row.name,
      description: row.description,
      category: row.category,
      starting_price: row.starting_price,
      min_increment: row.min_increment,
      image_urls: row.image_urls,
    }))

  if (missingRows.length === 0) {
    return
  }

  for (const batch of chunk(missingRows, 100)) {
    const { error: insertError } = await db.from('items').upsert(batch, { onConflict: 'id' })
    if (insertError) {
      throw insertError
    }
  }
}

export async function getCatalogItems(): Promise<CatalogResult> {
  try {
    const seedRows = await loadSeedRows()

    try {
      await seedMissingCatalogItems(seedRows)

      const db = createServiceSupabase()
      const { data: items, error } = await db
        .from('items')
        .select(`
          id, name, description, category, starting_price, min_increment,
          image_urls, current_top_bid, current_top_anon, status, created_at
        `)
        .order('created_at', { ascending: true })

      if (error) {
        throw error
      }

      return { items: (items ?? []) as CatalogItem[], source: 'db' }
    } catch (error) {
      console.warn('[catalog-items] Falling back to CSV seed data:', error)
      return {
        items: seedRows.map(row => toCatalogItem(row)),
        source: 'csv',
      }
    }
  } catch (error) {
    console.error('[catalog-items] Failed to load seed CSV:', error)
    return { items: [], source: 'csv' }
  }
}

export async function getCatalogItem(id: string): Promise<CatalogResult & { item: CatalogItem | null }> {
  const { items, source } = await getCatalogItems()
  return {
    items,
    source,
    item: items.find(item => item.id === id) ?? null,
  }
}