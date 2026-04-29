'use client'

import { useState, useEffect } from 'react'
import { useLanguage } from '@/lib/i18n'

interface Props { endAt: string | null; isLive: boolean }

export default function CountdownTimer({ endAt, isLive }: Props) {
  const [timeLeft, setTimeLeft] = useState('')
  const [expired, setExpired] = useState(false)
  const { t } = useLanguage()

  useEffect(() => {
    if (!endAt || !isLive) return
    const tick = () => {
      const diff = new Date(endAt).getTime() - Date.now()
      if (diff <= 0) { setExpired(true); setTimeLeft(''); return }
      const d = Math.floor(diff / 86400000)
      const h = Math.floor((diff % 86400000) / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setTimeLeft(`${d > 0 ? `${d}d ` : ''}${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [endAt, isLive])

  if (!isLive) return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 text-yellow-800 text-sm font-medium">
      ⏳ {t('timer.not_live', undefined) || 'Auction not yet live — stay tuned'}
    </div>
  )
  if (expired) return (
    <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-800 text-sm font-medium">
      🔔 {t('timer.ended', undefined) || 'Auction has ended'}
    </div>
  )
  if (!endAt) return (
    <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-green-800 text-sm font-medium">
      🟢 {t('timer.live_no_end', undefined) || 'Auction is live — no end time set'}
    </div>
  )
  return (
    <div className="bg-brand-navy text-white rounded-lg px-5 py-3 flex items-center gap-3">
      <span className="text-sm font-medium text-gray-300">{t('timer.closes_in', undefined) || 'Closes in'}</span>
      <span className="font-mono text-brand-gold text-xl font-bold">{timeLeft}</span>
    </div>
  )
}
