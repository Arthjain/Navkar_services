export interface Item {
  id: string
  name: string
  description: string | null
  category: string | null
  starting_price: number
  min_increment: number
  image_urls: string[]
  current_top_bid: number | null
  current_top_anon: string | null
  status: 'open' | 'closed'
  created_at: string
}

export interface PublicBid {
  id: string
  item_id: string
  amount: number
  created_at: string
  anon_handle: string
}

export interface AdminBid {
  id: string
  item_id: string
  shop_name: string
  phone: string
  amount: number
  anon_handle: string
  created_at: string
  item?: { name: string }
}

export interface AuctionConfig {
  id: number
  auction_end_at: string | null
  is_live: boolean
}

// Bidder info stored in session cookie
export interface SessionUser {
  userId?: string
  shop_name: string
  phone?: string
  email?: string
  anon_handle?: string
  is_admin?: boolean
}

// Admin session (JWT cookie)
export interface AdminSession {
  is_admin: true
}
