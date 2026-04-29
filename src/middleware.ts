import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { getSessionSecret } from '@/lib/session-secret'

const secret = new TextEncoder().encode(
  getSessionSecret()
)

// Paths that require a valid session
const AUTH_PATHS  = ['/my-bids']
// Paths that require admin role
const ADMIN_PATHS = ['/admin']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  const needsAuth  = AUTH_PATHS.some(p  => pathname.startsWith(p))
  const needsAdmin = ADMIN_PATHS.some(p => pathname.startsWith(p))

  if (!needsAuth && !needsAdmin) return NextResponse.next()

  const token = req.cookies.get('session')?.value

  if (!token) {
    const login = new URL('/login', req.url)
    login.searchParams.set('next', pathname)
    return NextResponse.redirect(login)
  }

  try {
    const { payload } = await jwtVerify(token, secret)

    if (needsAdmin && !payload.is_admin) {
      return NextResponse.redirect(new URL('/', req.url))
    }

    return NextResponse.next()
  } catch {
    // Invalid / expired token
    const login = new URL('/login', req.url)
    login.searchParams.set('next', pathname)
    return NextResponse.redirect(login)
  }
}

export const config = {
  matcher: ['/admin/:path*', '/my-bids/:path*'],
}
