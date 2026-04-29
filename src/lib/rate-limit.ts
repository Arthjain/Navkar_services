/**
 * Simple in-memory rate limiter (fine for single-instance Vercel hobby tier).
 * For production scale: swap to Upstash Redis with @upstash/ratelimit.
 */

interface Entry { count: number; resetAt: number }
const store = new Map<string, Entry>()

export function rateLimit(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now()
  const entry = store.get(key)
  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return true // allowed
  }
  if (entry.count >= maxRequests) return false // blocked
  entry.count++
  return true // allowed
}
