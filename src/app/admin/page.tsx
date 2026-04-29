'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import type { SessionUser, AuctionConfig } from '@/types'

import { useLanguage } from '@/lib/i18n'

type Tab = 'items' | 'bids' | 'winners' | 'settings'

interface AdminItem {
  id: string; name: string; category: string | null; starting_price: number
  min_increment: number; current_top_bid: number | null; status: string; created_at: string
}
interface AdminBid {
  id: string; amount: number; shop_name: string; phone?: string; email?: string; anon_handle: string; created_at: string
  item: { name: string } | null
}
interface Winner {
  id: string; name: string; category: string | null; status: string; current_top_bid: number | null
  winner: { shop_name: string; phone?: string; email?: string; anon_handle: string } | null
}

export default function AdminPage() {
  const [user, setUser]         = useState<SessionUser | null>(null)
  const [tab, setTab]           = useState<Tab>('items')
  const [items, setItems]       = useState<AdminItem[]>([])
  const [bids, setBids]         = useState<AdminBid[]>([])
  const [winners, setWinners]   = useState<Winner[]>([])
  const [config, setConfig]     = useState<AuctionConfig | null>(null)
  const [loading, setLoading]   = useState(true)
  const [bidItem, setBidItem]   = useState<string>('all')
  const [msg, setMsg]           = useState('')
  const { t } = useLanguage()

  // New item form
  const [form, setForm] = useState({
    name: '', description: '', category: '', starting_price: '', min_increment: '100', image_urls: ''
  })

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => setUser(d.user))
    loadItems()
    fetch('/api/admin/auction').then(r => r.json()).then(d => setConfig(d.config))
  }, [])

  useEffect(() => {
    if (tab === 'bids') loadBids()
    if (tab === 'winners') loadWinners()
  }, [tab, bidItem]) // eslint-disable-line react-hooks/exhaustive-deps

  async function loadItems() {
    setLoading(true)
    const r = await fetch('/api/admin/items')
    const d = await r.json()
    setItems(d.items ?? [])
    setLoading(false)
  }

  async function loadBids() {
    const url = bidItem === 'all' ? '/api/admin/bids' : `/api/admin/bids?item_id=${bidItem}`
    const r = await fetch(url)
    const d = await r.json()
    setBids(d.bids ?? [])
  }

  async function loadWinners() {
    const r = await fetch('/api/admin/winners')
    const d = await r.json()
    setWinners(d.winners ?? [])
  }

  async function addItem(e: React.FormEvent) {
    e.preventDefault()
    const urls = form.image_urls.split(',').map(u => u.trim()).filter(Boolean)
    const res = await fetch('/api/admin/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        description: form.description || undefined,
        category: form.category || undefined,
        starting_price: parseFloat(form.starting_price),
        min_increment: parseFloat(form.min_increment) || 100,
        image_urls: urls,
      }),
    })
    if (res.ok) {
      setForm({ name: '', description: '', category: '', starting_price: '', min_increment: '100', image_urls: '' })
      loadItems()
      setMsg('✅ Item added')
      setTimeout(() => setMsg(''), 3000)
    }
  }

  async function deleteItem(id: string, name: string) {
    if (!confirm(`Delete "${name}"?`)) return
    const res = await fetch(`/api/admin/items/${id}`, { method: 'DELETE' })
    const d = await res.json()
    if (res.ok) { loadItems(); setMsg('✅ Deleted') }
    else setMsg(`❌ ${d.error}`)
    setTimeout(() => setMsg(''), 4000)
  }

  async function updateAuction(updates: Partial<{ is_live: boolean; auction_end_at: string | null }>) {
    const res = await fetch('/api/admin/auction', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates),
    })
    const d = await res.json()
    if (res.ok) setConfig(d.config)
    setMsg(res.ok ? '✅ Updated' : `❌ ${d.error}`)
    setTimeout(() => setMsg(''), 3000)
  }

  async function closeAuction() {
    if (!confirm('Close auction? All open items will be marked closed. This cannot be undone.')) return
    const res = await fetch('/api/admin/auction', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'close' }),
    })
    const d = await res.json()
    setMsg(res.ok ? '✅ Auction closed' : `❌ ${d.error}`)
    setTimeout(() => setMsg(''), 4000)
  }

  function exportWinnersCSV() {
    const rows = [['Item', 'Category', 'Winning Bid (₹)', 'Winner Handle', 'Contact (Email/Phone)', 'Shop']]
    winners.filter(w => w.winner).forEach(w => {
      const contact = [w.winner!.email, w.winner!.phone].filter(Boolean).join(' / ')
      rows.push([w.name, w.category ?? '', String(w.current_top_bid ?? ''), w.winner!.anon_handle, contact, w.winner!.shop_name])
    })
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'auction-winners.csv'; a.click()
  }

  if (!user) return <div className="p-8 text-center">Loading…</div>
  if (!user.is_admin) return (
    <div className="p-8 text-center">
      <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
      <p className="mt-2 text-gray-500">Admin only area.</p>
      <Link href="/" className="btn-primary mt-4 inline-block">Go home</Link>
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-brand-navy">{t('admin.dashboard') || 'Admin Dashboard'}</h1>
        <Link href="/admin/import" className="btn-secondary text-sm">📥 Import Excel</Link>
      </div>

      {msg && <div className="mb-4 rounded-lg px-4 py-3 bg-blue-50 text-blue-800 text-sm font-medium">{msg}</div>}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 mb-6">
        {(['items', 'bids', 'winners', 'settings'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2.5 text-sm font-medium capitalize transition-colors ${tab === t ? 'border-b-2 border-brand-gold text-brand-navy' : 'text-gray-500 hover:text-gray-700'}`}>
            {t === 'items' ? `Items (${items.length})` : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* ── ITEMS TAB ──────────────────────────────────────────────── */}
      {tab === 'items' && (
        <div className="space-y-6">
          {/* Add item form */}
          <div className="card p-6">
            <h2 className="font-semibold text-lg mb-4">Add Item</h2>
            <form onSubmit={addItem} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input className="input" required value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} placeholder="Samsung Galaxy S24" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <input className="input" value={form.category} onChange={e => setForm(f => ({...f, category: e.target.value}))} placeholder="Mobile" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Starting Price (₹) *</label>
                <input className="input" type="number" required min="1" value={form.starting_price} onChange={e => setForm(f => ({...f, starting_price: e.target.value}))} placeholder="5000" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Min Increment (₹)</label>
                <input className="input" type="number" min="1" value={form.min_increment} onChange={e => setForm(f => ({...f, min_increment: e.target.value}))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Image URLs (comma-separated)</label>
                <input className="input" value={form.image_urls} onChange={e => setForm(f => ({...f, image_urls: e.target.value}))} placeholder="https://..." />
              </div>
              <div className="sm:col-span-2 lg:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea className="input" rows={2} value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} placeholder="Condition, specs, etc." />
              </div>
              <div className="sm:col-span-2 lg:col-span-3">
                <button type="submit" className="btn-primary">Add Item</button>
              </div>
            </form>
          </div>

          {/* Items table */}
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 uppercase text-xs tracking-wide">
                <tr>
                  <th className="text-left px-4 py-3">Name</th>
                  <th className="text-left px-4 py-3">Cat.</th>
                  <th className="text-right px-4 py-3">Start ₹</th>
                  <th className="text-right px-4 py-3">Top Bid ₹</th>
                  <th className="text-center px-4 py-3">Status</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Loading…</td></tr>
                ) : items.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium max-w-xs truncate">
                      <Link href={`/items/${item.id}`} className="hover:text-brand-gold">{item.name}</Link>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{item.category ?? '—'}</td>
                    <td className="px-4 py-3 text-right">₹{item.starting_price.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 text-right font-semibold text-brand-gold">
                      {item.current_top_bid ? `₹${item.current_top_bid.toLocaleString('en-IN')}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`badge ${item.status === 'open' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => deleteItem(item.id, item.name)} className="text-red-400 hover:text-red-600 text-xs">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── BIDS TAB ───────────────────────────────────────────────── */}
      {tab === 'bids' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700">Filter by item:</label>
            <select className="input max-w-xs" value={bidItem} onChange={e => setBidItem(e.target.value)}>
              <option value="all">All items</option>
              {items.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
            <span className="text-sm text-gray-400">{bids.length} bids</span>
          </div>
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 uppercase text-xs tracking-wide">
                <tr>
                  <th className="text-left px-4 py-3">Item</th>
                  <th className="text-left px-4 py-3">Bidder</th>
                  <th className="text-left px-4 py-3">Contact (Email / Phone)</th>
                  <th className="text-left px-4 py-3">Shop</th>
                  <th className="text-right px-4 py-3">Amount</th>
                  <th className="text-right px-4 py-3">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {bids.map(bid => (
                  <tr key={bid.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 max-w-[180px] truncate font-medium">{bid.item?.name ?? '—'}</td>
                    <td className="px-4 py-3">
                      <div className="text-xs text-gray-500 font-medium">{bid.anon_handle}</div>
                    </td>
                    <td className="px-4 py-3 font-mono text-sm">
                      {bid.email && <div>{bid.email}</div>}
                      {bid.phone && <div>{bid.phone}</div>}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{bid.shop_name}</td>
                    <td className="px-4 py-3 text-right font-bold text-brand-gold">₹{bid.amount.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 text-right text-gray-400 text-xs whitespace-nowrap">
                      {new Date(bid.created_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                  </tr>
                ))}
                {bids.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No bids yet</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── WINNERS TAB ────────────────────────────────────────────── */}
      {tab === 'winners' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">{winners.filter(w => w.winner).length} items with bids</p>
            <button onClick={exportWinnersCSV} className="btn-secondary text-sm">⬇ Export CSV</button>
          </div>
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 uppercase text-xs tracking-wide">
                <tr>
                  <th className="text-left px-4 py-3">Item</th>
                  <th className="text-left px-4 py-3">Winner (Anon Handle)</th>
                  <th className="text-left px-4 py-3">Contact (Email / Phone)</th>
                  <th className="text-left px-4 py-3">Shop</th>
                  <th className="text-right px-4 py-3">Winning Bid</th>
                  <th className="text-center px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {winners.map(w => (
                  <tr key={w.id}>
                    <td className="px-4 py-3 font-medium">{w.name}</td>
                    <td className="px-4 py-3">{w.winner?.anon_handle ?? '—'}</td>
                    <td className="px-4 py-3 font-mono">
                      {w.winner?.email && <div>{w.winner.email}</div>}
                      {w.winner?.phone && <div>{w.winner.phone}</div>}
                      {!w.winner?.email && !w.winner?.phone && '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{w.winner?.shop_name ?? '—'}</td>
                    <td className="px-4 py-3 text-right font-bold text-brand-gold">
                      {w.current_top_bid ? `₹${w.current_top_bid.toLocaleString('en-IN')}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`badge ${w.status === 'open' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>{w.status}</span>
                    </td>
                  </tr>
                ))}
                {winners.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No bids placed yet</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── SETTINGS TAB ───────────────────────────────────────────── */}
      {tab === 'settings' && config && (
        <div className="max-w-lg space-y-6">
          <div className="card p-6 space-y-4">
            <h2 className="font-semibold text-lg">Auction Control</h2>
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-700">Status:</span>
              <span className={`badge ${config.is_live ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                {config.is_live ? '🟢 Live' : '⏳ Not live'}
              </span>
              <button
                onClick={() => updateAuction({ is_live: !config.is_live })}
                className={config.is_live ? 'btn-secondary text-sm' : 'btn-primary text-sm'}>
                {config.is_live ? 'Pause Auction' : 'Go Live'}
              </button>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Auction End Date/Time</label>
              <div className="flex gap-2">
                <input
                  type="datetime-local"
                  className="input"
                  defaultValue={config.auction_end_at ? new Date(config.auction_end_at).toISOString().slice(0, 16) : ''}
                  id="end-time"
                />
                <button
                  onClick={() => {
                    const v = (document.getElementById('end-time') as HTMLInputElement).value
                    updateAuction({ auction_end_at: v ? new Date(v).toISOString() : null })
                  }}
                  className="btn-primary whitespace-nowrap">
                  Set Time
                </button>
              </div>
              {config.auction_end_at && (
                <p className="text-xs text-gray-500 mt-1">Current: {new Date(config.auction_end_at).toLocaleString('en-IN')}</p>
              )}
            </div>
          </div>
          <div className="card p-6 border-red-200">
            <h2 className="font-semibold text-lg text-red-700 mb-2">Danger Zone</h2>
            <p className="text-sm text-gray-500 mb-4">Closes all items and marks auction as over. Cannot be undone.</p>
            <button onClick={closeAuction} className="bg-red-600 hover:bg-red-700 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors">
              Close Auction (Final)
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
