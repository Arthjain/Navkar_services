import Link from 'next/link'
import Image from 'next/image'
import type { Item } from '@/types'
import { useLanguage } from '@/lib/i18n'

interface Props { item: Item & { top_bidder?: { anon_handle: string } | null } }

export default function ItemCard({ item }: Props) {
  const topBid = item.current_top_bid
  const minNext = (topBid ?? item.starting_price) + item.min_increment
  const handle  = item.current_top_anon
  const { t } = useLanguage()

  return (
    <Link href={`/items/${item.id}`} className="card hover:shadow-md transition-shadow block group">
      {/* Image */}
      <div className="relative h-48 bg-gray-100">
        {item.image_urls?.[0] ? (
          <Image
            src={item.image_urls[0]}
            alt={item.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-5xl text-gray-300">📦</div>
        )}
        {item.status === 'closed' && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white font-bold text-lg">{t('card.closed')}</span>
          </div>
        )}
        {item.category && (
          <span className="absolute top-2 left-2 badge bg-brand-navy/80 text-white">
            {t('card.brand')}: {item.category}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="text-xs uppercase tracking-[0.2em] text-gray-400 font-semibold mb-1">{t('card.product')}</div>
        <h3 className="font-semibold text-gray-900 line-clamp-2 mb-3 leading-snug">{item.name}</h3>

        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500">{t('card.starting_price')}</span>
            <span className="font-medium">₹{item.starting_price.toLocaleString('en-IN')}</span>
          </div>

          {topBid ? (
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">{t('card.top_bid')}</span>
              <div className="text-right">
                <span className="font-bold text-brand-gold text-lg">
                  ₹{topBid.toLocaleString('en-IN')}
                </span>
                {handle && (
                  <div className="text-xs text-gray-400">{handle}</div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-500 italic">{t('card.no_bids')}</div>
          )}

          <div className="text-xs text-gray-400 pt-1">
            {t('card.min_next', { amount: minNext.toLocaleString('en-IN') })}
          </div>
        </div>
      </div>
    </Link>
  )
}
