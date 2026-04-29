import { cookies } from 'next/headers'
import { SignJWT, jwtVerify } from 'jose'
import type { SessionUser } from '@/types'
import { getSessionSecret } from '@/lib/session-secret'

const secret = new TextEncoder().encode(
  getSessionSecret()
)

// ── Bidder session ─────────────────────────────────────────────

export async function setSessionCookie(user: SessionUser) {
  const token = await new SignJWT({ ...user })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(secret)

  const cookieStore = await cookies()
  cookieStore.set('session', token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge:   60 * 60 * 24 * 30, // 30 days
    path:     '/',
  })
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('session')?.value
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, secret)
    return payload as unknown as SessionUser
  } catch {
    return null
  }
}

export async function clearSessionCookie() {
  const cookieStore = await cookies()
  cookieStore.delete('session')
}

export async function requireSession(): Promise<SessionUser> {
  const session = await getSession()
  if (!session) throw new Error('UNAUTHORIZED')
  return session
}

// ── Admin session ─────────────────────────────────────────────

export async function setAdminCookie() {
  const token = await new SignJWT({ is_admin: true })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret)

  const cookieStore = await cookies()
  cookieStore.set('admin_session', token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge:   60 * 60 * 24 * 7,
    path:     '/',
  })
}

export async function getAdminSession(): Promise<boolean> {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_session')?.value
  if (!token) return false
  try {
    const { payload } = await jwtVerify(token, secret)
    return payload.is_admin === true
  } catch {
    return false
  }
}

export async function clearAdminCookie() {
  const cookieStore = await cookies()
  cookieStore.delete('admin_session')
}

export async function requireAdmin(): Promise<void> {
  const ok = await getAdminSession()
  if (!ok) throw new Error('FORBIDDEN')
}
