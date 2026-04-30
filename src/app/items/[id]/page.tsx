'use client'

import { useState, useEffect, use } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { createBrowserSupabase } from '@/lib/supabase'
import CountdownTimer from '@/components/CountdownTimer'
import type { Item, PublicBid, AuctionConfig, SessionUser } from '@/types'
import { useLanguage } from '@/lib/i18n'

interface PageData {
  item: Item & { top_bidder?: { anon_handle: string } | null }
  bids: PublicBid[]
  config: AuctionConfig | null
}

export default function ItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [data, setData]       = useState<PageData | null>(null)
  const [user, setUser]       = useState<SessionUser | null>(null)
  const [bidAmount, setBid]   = useState('')
  const [submitting, setSub]  = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [imgIdx, setImgIdx]   = useState(0)
  const [error, setError]     = useState<string | null>(null)
  const { t } = useLanguage()

  async function loadItem() {
    const res = await fetch(`/api/items/${id}`)
    const json = await res.json()

    if (!res.ok) {
      throw new Error(json.error ?? 'Failed to load item')
    }

    setData(json)
    setError(null)
  }

  // Load item data + current user
  useEffect(() => {
    loadItem().catch(err => {
      setError(err instanceof Error ? err.message : 'Failed to load item')
    })
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => setUser(d.user))
  }, [id])

  // Realtime: re-fetch bids when item updates
  useEffect(() => {
    const supabase = createBrowserSupabase()
    const channel = supabase
      .channel(`item-${id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'items', filter: `id=eq.${id}` }, () => {
        loadItem().catch(err => {
          console.error('Failed to refresh item', err)
        })
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [id])

  async function handleBid(e: React.FormEvent) {
    e.preventDefault()
    if (!user) { window.location.href = '/login'; return }
    setSub(true)
    setMessage(null)
    try {
      const res = await fetch(`/api/items/${id}/bid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: parseFloat(bidAmount) }),
      })
      const json = await res.json()
      if (!res.ok) {
        setMessage({ type: 'error', text: json.error })
      } else {
        setMessage({ type: 'success', text: '🎉 Bid placed successfully!' })
        setBid('')
        // Refresh data
        loadItem().catch(err => {
          console.error('Failed to refresh item after bid', err)
        })
      }
    } finally {
      setSub(false)
    }
  }

  if (error && !data) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="card p-6 border border-red-200 bg-red-50">
          <h1 className="text-xl font-bold text-red-800">Unable to load item</h1>
          <p className="mt-2 text-red-700">{error}</p>
          <button
            type="button"
            className="btn-primary mt-4"
            onClick={() => {
              setError(null)
              loadItem().catch(err => {
                setError(err instanceof Error ? err.message : 'Failed to load item')
              })
            }}
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!data) return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/2" />
        <div className="h-80 bg-gray-200 rounded-xl" />
      </div>
    </div>
  )

  const { item, bids, config } = data
  const topBid  = item.current_top_bid
  const minNext = (topBid ?? item.starting_price) + item.min_increment
  const isClosed = item.status === 'closed'
  const brand    = item.category?.trim() || null

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back */}
      <Link href="/" className="text-sm text-gray-500 hover:text-brand-navy mb-4 inline-flex items-center gap-1">
        {t('item.back')}
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-4">
        {/* Left — images */}
        <div>
          <div className="relative h-80 bg-gray-100 rounded-xl overflow-hidden mb-3">
            {item.image_urls?.[imgIdx] ? (
              <Image src={item.image_urls[imgIdx]} alt={item.name} fill className="object-contain" />
            ) : (
              <div className="flex items-center justify-center h-full text-7xl text-gray-300">📦</div>
            )}
            {isClosed && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <span className="text-white font-bold text-2xl">{t('item.auction_closed')}</span>
              </div>
            )}
          </div>
          {item.image_urls?.length > 1 && (
            <div className="flex gap-2">
              {item.image_urls.map((url, i) => (
                <button
                  key={i}
                  onClick={() => setImgIdx(i)}
                  className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 ${i === imgIdx ? 'border-brand-gold' : 'border-transparent'}`}
                >
                  <Image src={url} alt="" fill className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right — details + bid */}
        <div className="space-y-5">
          <div className="rounded-2xl border border-brand-navy/10 bg-brand-navy/5 px-4 py-3">
            <div className="text-[11px] uppercase tracking-[0.24em] text-gray-400 font-semibold mb-1">
              {t('item.brand')}
            </div>
            <div className="text-lg font-semibold text-brand-navy whitespace-normal break-words">
              {brand ?? t('item.brand_missing')}
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-gray-400 font-semibold mb-1">{t('item.product')}</div>
            <h1 className="text-2xl font-bold text-gray-900">{item.name}</h1>
          </div>
          {item.description && <p className="text-gray-600">{item.description}</p>}

          {config && <CountdownTimer endAt={config.auction_end_at} isLive={config.is_live} />}

          {/* Current bid display */}
          <div className="card p-5 space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-sm text-gray-500">{t('item.starting_price')}</div>
                <div className="font-medium">₹{item.starting_price.toLocaleString('en-IN')}</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">{topBid ? t('item.highest_bid') : t('item.no_bids')}</div>
                {topBid && (
                  <>
                    <div className="text-3xl font-bold text-brand-gold">₹{topBid.toLocaleString('en-IN')}</div>
                    <div className="text-xs text-gray-400">{item.current_top_anon}</div>
                  </>
                )}
              </div>
            </div>
            <div className="text-sm text-gray-500">
              {t('item.min_increment', { amount: item.min_increment.toLocaleString('en-IN') })} &bull; {t('item.next_min')} <strong>₹{minNext.toLocaleString('en-IN')}</strong>
            </div>
          </div>

          {/* Bid form */}
          {!isClosed ? (
            user ? (
              <form onSubmit={handleBid} className="space-y-3">
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">₹</span>
                    <input
                      type="number"
                      min={minNext}
                      step={item.min_increment}
                      value={bidAmount}
                      onChange={e => setBid(e.target.value)}
                      placeholder={minNext.toString()}
                      className="input pl-8"
                      required
                    />
                  </div>
                  <button type="submit" disabled={submitting} className="btn-primary whitespace-nowrap">
                    {submitting ? t('item.placing') : t('item.place_bid')}
                  </button>
                </div>
                <div className="text-xs text-gray-400">
                  {t('item.bidding_as')} <strong>{user.anon_handle}</strong> · {user.shop_name}
                </div>
                {message && (
                  <div className={`rounded-lg px-4 py-3 text-sm font-medium ${
                    message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                  }`}>
                    {message.text}
                  </div>
                )}
              </form>
            ) : (
              <Link href={`/login?next=/items/${id}`} className="btn-primary inline-block text-center w-full">
                {t('item.login_to_bid')}
              </Link>
            )
          ) : (
            <div className="bg-gray-100 rounded-lg px-4 py-3 text-gray-600 text-sm font-medium text-center">
              {t('item.closed_msg')}
            </div>
          )}
        </div>
      </div>

      {/* Bid history */}
      <div className="mt-10">
        <h2 className="text-xl font-bold text-gray-900 mb-4">{t('item.bid_history', { count: bids.length })}</h2>
        {bids.length === 0 ? (
          <p className="text-gray-400 italic">{t('item.no_bids_yet')}</p>
        ) : (
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 uppercase text-xs tracking-wide">
                <tr>
                  <th className="text-left px-4 py-3">{t('item.bidder')}</th>
                  <th className="text-right px-4 py-3">{t('item.amount')}</th>
                  <th className="text-right px-4 py-3">{t('item.time')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {bids.map((bid, i) => (
                  <tr key={bid.id} className={i === 0 ? 'bg-yellow-50' : ''}>
                    <td className="px-4 py-3 font-medium">
                      {bid.anon_handle}
                      {i === 0 && <span className="ml-2 badge bg-brand-gold text-brand-navy">{t('item.leading')}</span>}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-brand-gold">
                      ₹{bid.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-400">
                      {new Date(bid.created_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
