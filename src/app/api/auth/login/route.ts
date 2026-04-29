import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { setSessionCookie, setAdminCookie } from '@/lib/auth'

const schema = z.object({
  contact: z.string().min(1, 'Email or Phone is required'),
  shop_name: z.string().min(2, 'Shop name is required').max(200),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { contact, shop_name } = schema.parse(body)

    const rawContact = contact.toLowerCase().trim().replace(/\s/g, '')
    // Strip +91 prefix so users can type with or without it
    const normalizedContact = rawContact.startsWith('+91') ? rawContact.slice(3) : rawContact

    // ── Check Google Sheet whitelist ─────────────────────────────
    const adminPhone = (process.env.ADMIN_PHONE ?? '').replace(/\s/g, '')
    const adminEmail = (process.env.ADMIN_EMAIL ?? '').toLowerCase().trim()
    const normalizedAdminPhone = adminPhone.startsWith('+91') ? adminPhone.slice(3) : adminPhone

    const isAdmin = normalizedContact === normalizedAdminPhone || normalizedContact === adminEmail

    if (!isAdmin) {
      const csvUrl = process.env.GOOGLE_SHEET_CSV_URL
      if (csvUrl) {
        try {
          const res = await fetch(csvUrl, { next: { revalidate: 60 } })
          if (!res.ok) {
            console.error('Failed to fetch Google Sheet CSV:', res.status)
            return NextResponse.json({ error: 'Server error checking whitelist' }, { status: 500 })
          }
          const csvText = await res.text()
          // Collect all cells from all columns, normalize each
          const allowedList = csvText.split('\n').flatMap(line =>
            line.split(',').map(cell => {
              let c = cell.toLowerCase().trim().replace(/\s/g, '').replace(/^["']|["']$/g, '')
              if (c.startsWith('+91')) c = c.slice(3)
              return c
            })
          )

          if (!allowedList.includes(normalizedContact)) {
            return NextResponse.json(
              { error: 'You are not authorized to bid. Contact Navkar Services: +919602368928' },
              { status: 403 }
            )
          }
        } catch (err) {
          console.error('Google Sheet fetch error:', err)
          return NextResponse.json({ error: 'Server error checking whitelist' }, { status: 500 })
        }
      } else {
        console.warn('⚠️ GOOGLE_SHEET_CSV_URL is missing! Allowing all logins in dev mode.')
        if (process.env.NODE_ENV === 'production') {
          return NextResponse.json({ error: 'Whitelist not configured' }, { status: 500 })
        }
      }
    }

    // ── Create session ──────────────────────────────────────────
    const isEmail = contact.includes('@')
    const sessionUser = {
      userId: `user-${normalizedContact}`,
      email: isEmail ? contact.trim() : undefined,
      phone: !isEmail ? contact.trim() : undefined,
      shop_name,
      anon_handle: '',
      is_admin: isAdmin,
    }

    await setSessionCookie(sessionUser)
    if (isAdmin) {
      await setAdminCookie()
    }

    return NextResponse.json({ user: sessionUser })
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 })
    }
    console.error('[login]', err)
    return NextResponse.json({ error: 'Login failed' }, { status: 500 })
  }
}
