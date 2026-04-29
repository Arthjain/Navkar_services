'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { SessionUser } from '@/types'
import { useLanguage } from '@/lib/i18n'

export default function Navbar() {
  const [user, setUser] = useState<SessionUser | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { t, toggleLang } = useLanguage()

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => setUser(d.user))
      .finally(() => setLoading(false))
  }, [])

  async function logout() {
    await fetch('/api/auth/me', { method: 'DELETE' })
    setUser(null)
    router.push('/')
    router.refresh()
  }

  return (
    <nav className="bg-brand-navy text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <button onClick={toggleLang} className="btn-secondary text-xs px-2 py-1 bg-white/10 hover:bg-white/20 border-none text-white">
              {t('nav.switch_lang')}
            </button>
            <Link href="/" className="flex items-center gap-2">
              <span className="text-brand-gold font-bold text-xl">⚡ Navkar Auction</span>
            </Link>
          </div>

          <div className="flex items-center gap-6 text-sm">
            <Link href="/" className="hover:text-brand-gold transition-colors">{t('nav.catalog')}</Link>
            {user && (
              <Link href="/my-bids" className="hover:text-brand-gold transition-colors">{t('nav.my_bids')}</Link>
            )}
            {user?.is_admin && (
              <Link href="/admin" className="hover:text-brand-gold transition-colors font-semibold">{t('nav.admin')}</Link>
            )}
            {!loading && (
              user ? (
                <div className="flex items-center gap-3">
                  <span className="text-gray-300 hidden sm:block">
                    {user.anon_handle} · {user.shop_name}
                  </span>
                  <button onClick={logout} className="text-red-400 hover:text-red-300 transition-colors">
                    {t('nav.logout')}
                  </button>
                </div>
              ) : (
                <Link href="/login" className="btn-primary text-sm py-1.5 px-4">{t('nav.login')}</Link>
              )
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
