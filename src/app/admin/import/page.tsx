'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'

interface ParsedRow {
  name: string
  description?: string
  category?: string
  starting_price: number
  min_increment: number
  image_urls: string[]
  error?: string
}

export default function ImportPage() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [rows, setRows]       = useState<ParsedRow[]>([])
  const [importing, setImp]   = useState(false)
  const [result, setResult]   = useState<string>('')
  const [fileName, setFile]   = useState('')

  async function parseFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setFile(file.name)
    setRows([])
    setResult('')

    // Dynamic import so xlsx isn't in the initial bundle
    const XLSX = await import('xlsx')
    const buf = await file.arrayBuffer()
    const wb = XLSX.read(buf, { type: 'array' })
    const ws = wb.Sheets[wb.SheetNames[0]]
    const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' })

    const parsed: ParsedRow[] = raw.map((r, i) => {
      // case-insensitive column lookup
      const get = (key: string) => {
        const k = Object.keys(r).find(k => k.toLowerCase().replace(/[\s_]/g, '') === key.toLowerCase().replace(/[\s_]/g, ''))
        return k ? String(r[k] ?? '').trim() : ''
      }

      const name           = get('name')
      const description    = get('description')
      const category       = get('category')
      const startingStr    = get('startingprice') || get('price')
      const incrementStr   = get('minincrement') || get('increment')
      const imageStr       = get('imageurl') || get('imageurls') || get('images')

      const starting_price = parseFloat(startingStr)
      const min_increment  = parseFloat(incrementStr) || 100
      const image_urls     = imageStr ? imageStr.split(',').map((u: string) => u.trim()).filter(Boolean) : []

      const error = !name
        ? 'Missing name'
        : !category
          ? 'Missing brand/company'
          : isNaN(starting_price)
            ? 'Invalid starting_price'
            : undefined

      return { name, description, category, starting_price, min_increment, image_urls, error, _row: i + 2 } as ParsedRow & { _row: number }
    })

    setRows(parsed)
  }

  async function runImport() {
    const valid = rows.filter(r => !r.error)
    if (!valid.length) return
    setImp(true)
    setResult('')

    let success = 0, fail = 0
    for (const row of valid) {
      const res = await fetch('/api/admin/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(row),
      })
      if (res.ok) success++; else fail++
    }

    setResult(`✅ ${success} items imported${fail ? `, ❌ ${fail} failed` : ''}.`)
    setImp(false)
    if (success) setRows([])
  }

  const valid   = rows.filter(r => !r.error)
  const invalid = rows.filter(r => r.error)

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin" className="text-gray-400 hover:text-brand-navy">← Admin</Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-2xl font-bold text-brand-navy">Import Products from CSV or Excel</h1>
      </div>

      {/* Template info */}
      <div className="card p-5 mb-6 bg-blue-50 border-blue-200">
        <h2 className="font-semibold text-blue-800 mb-2">Expected columns</h2>
        <div className="text-sm text-blue-700 font-mono grid grid-cols-2 sm:grid-cols-3 gap-1">
          {['name = product *', 'category = company / brand *', 'starting_price *', 'description', 'min_increment', 'image_url'].map(col => (
            <span key={col} className="bg-white rounded px-2 py-1 border border-blue-200">{col}</span>
          ))}
        </div>
        <p className="text-xs text-blue-600 mt-2">
          * required. <code className="px-1 py-0.5 bg-white rounded border border-blue-200">name</code> is the product name and <code className="px-1 py-0.5 bg-white rounded border border-blue-200">category</code> is the company/brand name. image_url can be comma-separated for multiple images.
        </p>
      </div>

      {/* File upload */}
      <div
        onClick={() => fileRef.current?.click()}
        className="border-2 border-dashed border-gray-300 rounded-xl p-10 text-center cursor-pointer hover:border-brand-gold transition-colors mb-6"
      >
        <div className="text-4xl mb-2">📊</div>
        <p className="text-gray-600 font-medium">{fileName || 'Click to upload .csv or .xlsx file'}</p>
        <p className="text-sm text-gray-400 mt-1">Supports .xlsx, .xls, .csv</p>
        <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={parseFile} />
      </div>

      {result && (
        <div className="card p-4 mb-4 bg-green-50 text-green-800 font-medium">{result}</div>
      )}

      {rows.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              <span className="text-green-700 font-medium">{valid.length} valid</span>
              {invalid.length > 0 && <span className="text-red-600 font-medium ml-3">{invalid.length} errors</span>}
            </p>
            {valid.length > 0 && (
              <button onClick={runImport} disabled={importing} className="btn-primary">
                {importing ? 'Importing…' : `Import ${valid.length} items`}
              </button>
            )}
          </div>

          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 uppercase text-xs tracking-wide">
                <tr>
                  <th className="text-left px-4 py-3">Product</th>
                  <th className="text-left px-4 py-3">Brand</th>
                  <th className="text-right px-4 py-3">Start ₹</th>
                  <th className="text-right px-4 py-3">Incr. ₹</th>
                  <th className="text-left px-4 py-3">Images</th>
                  <th className="text-left px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((row, i) => (
                  <tr key={i} className={row.error ? 'bg-red-50' : ''}>
                    <td className="px-4 py-3 font-medium">{row.name || <span className="text-red-400 italic">missing</span>}</td>
                    <td className="px-4 py-3 text-gray-500">{row.category || '—'}</td>
                    <td className="px-4 py-3 text-right">{isNaN(row.starting_price) ? <span className="text-red-400">?</span> : `₹${row.starting_price.toLocaleString('en-IN')}`}</td>
                    <td className="px-4 py-3 text-right">₹{row.min_increment}</td>
                    <td className="px-4 py-3 text-gray-400">{row.image_urls.length} url(s)</td>
                    <td className="px-4 py-3">
                      {row.error
                        ? <span className="badge bg-red-100 text-red-700">❌ {row.error}</span>
                        : <span className="badge bg-green-100 text-green-700">✓ OK</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
