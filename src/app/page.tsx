'use client'

import { useState, useEffect, useMemo } from 'react'
import { createBrowserSupabase } from '@/lib/supabase'
import ItemCard from '@/components/ItemCard'
import CountdownTimer from '@/components/CountdownTimer'
import type { Item, AuctionConfig } from '@/types'
import { useLanguage } from '@/lib/i18n'
import { CATALOG_BRANDS } from '@/lib/catalog-brands'

type ItemWithBidder = Item & { top_bidder?: { anon_handle: string } | null }

export default function CatalogPage() {
  const [items, setItems]         = useState<ItemWithBidder[]>([])
  const [config, setConfig]       = useState<AuctionConfig | null>(null)
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [category, setCategory]   = useState('All')
  const [statusFilter, setStatus] = useState<'all' | 'open' | 'closed'>('open')
  
  const { t } = useLanguage()

  useEffect(() => {
    fetch('/api/items')
      .then(r => r.json())
      .then(d => setItems(d.items ?? []))
      .finally(() => setLoading(false))

    fetch('/api/auction-config')
      .then(r => r.json())
      .then(d => setConfig(d.config))
      .catch(() => null)

    // Realtime: re-fetch items when current_top_bid changes
    const supabase = createBrowserSupabase()
    const channel = supabase
      .channel('items-realtime')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'items' }, payload => {
        setItems(prev => prev.map(item =>
          item.id === payload.new.id
            ? { ...item, current_top_bid: payload.new.current_top_bid }
            : item
        ))
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const filtered = useMemo(() => {
    return items.filter(item => {
      const matchSearch = !search || item.name.toLowerCase().includes(search.toLowerCase())
      const matchCat    = category === 'All' || item.category?.trim() === category
      const matchStatus = statusFilter === 'all' || item.status === statusFilter
      return matchSearch && matchCat && matchStatus
    })
  }, [items, search, category, statusFilter])

  const categories = useMemo(() => {
    const itemCategories = Array.from(
      new Set(
        items
          .map(item => item.category?.trim())
          .filter((value): value is string => Boolean(value))
      )
    ).sort((left, right) => left.localeCompare(right))

    return ['All', ...Array.from(new Set([...CATALOG_BRANDS, ...itemCategories]))]
  }, [items])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-brand-navy">{t('home.title')}</h1>
          <p className="text-gray-500 mt-1">{t('home.subtitle', { count: items.length })}</p>
        </div>
        {config && <CountdownTimer endAt={config.auction_end_at} isLive={config.is_live} />}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="search"
          placeholder={t('home.search')}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input max-w-xs"
        />
        <div className="flex gap-2 flex-wrap">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                category === cat
                  ? 'bg-brand-navy text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-brand-navy'
              }`}
            >
              {cat === 'All' ? t('home.all_items') : cat}
            </button>
          ))}
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatus(e.target.value as 'all' | 'open' | 'closed')}
          className="input max-w-[140px]"
        >
          <option value="open">{t('home.open_only')}</option>
          <option value="closed">{t('home.closed_only')}</option>
          <option value="all">{t('home.all_items')}</option>
        </select>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card h-72 animate-pulse bg-gray-100" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <div className="text-5xl mb-3">📭</div>
          <p className="text-lg">{t('home.no_items')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map(item => <ItemCard key={item.id} item={item} />)}
        </div>
      )}
    </div>
  )
}
