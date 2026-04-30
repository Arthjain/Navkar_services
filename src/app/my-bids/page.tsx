'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import type { SessionUser } from '@/types'
import { useLanguage } from '@/lib/i18n'

interface MyBid {
  id: string
  amount: number
  shop_name_snapshot: string
  created_at: string
  is_winning: boolean
  item: {
    id: string
    name: string
    category: string | null
    current_top_bid: number | null
    status: 'open' | 'closed'
  } | null
}

export default function MyBidsPage() {
  const [bids, setBids]   = useState<MyBid[]>([])
  const [user, setUser]   = useState<SessionUser | null>(null)
  const [loading, setLoading] = useState(true)
  const { t } = useLanguage()

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => setUser(d.user))
    fetch('/api/my-bids')
      .then(r => r.json())
      .then(d => setBids(d.bids ?? []))
      .finally(() => setLoading(false))
  }, [])

  if (!user && !loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="text-5xl mb-4">🔒</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Login Required</h1>
        <p className="text-gray-500 mb-6">You need to be logged in to view your bids.</p>
        <Link href="/login?next=/my-bids" className="btn-primary">Login to View Bids</Link>
      </div>
    )
  }

  const winning = bids.filter(b => b.is_winning)
  const outbid  = bids.filter(b => !b.is_winning)

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-brand-navy mb-2">{t('mybids.title')}</h1>
      {user && (
        <p className="text-gray-500 mb-6">
          {t('item.bidding_as')} <strong>{user.anon_handle}</strong> · {user.shop_name}
        </p>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="card h-20 animate-pulse bg-gray-100" />)}
        </div>
      ) : bids.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-3">📋</div>
          <p className="text-lg">No bids yet.</p>
          <Link href="/" className="btn-primary mt-4 inline-block">Browse Catalog</Link>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Winning bids */}
          {winning.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-green-700 mb-3 flex items-center gap-2">
                🏆 {t('mybids.leading')} ({winning.length})
              </h2>
              <div className="space-y-3">
                {winning.map(bid => <BidRow key={bid.id} bid={bid} />)}
              </div>
            </section>
          )}

          {/* Outbid */}
          {outbid.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-gray-500 mb-3 flex items-center gap-2">
                📉 {t('mybids.outbid')} ({outbid.length})
              </h2>
              <div className="space-y-3">
                {outbid.map(bid => <BidRow key={bid.id} bid={bid} />)}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}

function BidRow({ bid }: { bid: MyBid }) {
  const { t } = useLanguage()
  if (!bid.item) return null
  return (
    <Link href={`/items/${bid.item.id}`} className="card p-4 flex items-center justify-between hover:shadow-md transition-shadow">
      <div>
        <div className="font-semibold text-gray-900 line-clamp-1">{bid.item.name}</div>
        <div className="text-xs text-gray-400 mt-0.5">
          {bid.item.category && <span className="mr-2">{t('item.brand')}: {bid.item.category}</span>}
          {new Date(bid.created_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
        </div>
      </div>
      <div className="text-right ml-4">
        <div className={`text-xl font-bold ${bid.is_winning ? 'text-green-600' : 'text-gray-400 line-through'}`}>
          ₹{bid.amount.toLocaleString('en-IN')}
        </div>
        {bid.is_winning ? (
          <div className="badge bg-green-100 text-green-800 text-xs">{t('mybids.leading')}</div>
        ) : (
          <div className="text-xs text-gray-400">
            Top: ₹{bid.item.current_top_bid?.toLocaleString('en-IN')}
          </div>
        )}
      </div>
    </Link>
  )
}
