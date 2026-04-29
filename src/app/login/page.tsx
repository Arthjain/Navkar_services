'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useLanguage } from '@/lib/i18n'

function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const nextUrl = params.get('next') ?? '/'

  const [contact, setContact]   = useState('')
  const [shopName, setShopName] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const { t } = useLanguage()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact, shop_name: shopName }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error); return }

      router.push(nextUrl)
      router.refresh()
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="card p-8">
          <div className="text-center mb-8">
            <div className="text-4xl mb-2">⚡</div>
            <h1 className="text-2xl font-bold text-brand-navy">{t('login.title')}</h1>
            <p className="text-gray-500 mt-1 text-sm">{t('login.subtitle')}</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('login.contact')}
              </label>
              <input
                type="text"
                value={contact}
                onChange={e => setContact(e.target.value)}
                placeholder="example@mail.com or 9876543210"
                className="input"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('login.shop')}
              </label>
              <input
                type="text"
                value={shopName}
                onChange={e => setShopName(e.target.value)}
                placeholder="e.g. Sharma Electronics"
                className="input"
                required
              />
            </div>

            {error && <p className="text-red-600 text-sm font-medium bg-red-50 p-3 rounded-lg border border-red-100">{error}</p>}

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? t('login.logging_in') : t('login.btn')}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          {t('login.privacy')}
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
