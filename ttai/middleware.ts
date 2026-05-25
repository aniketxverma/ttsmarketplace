import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { COUNTRY_TO_LOCALE, DEFAULT_LOCALE, SUPPORTED_LOCALES, parseAcceptLanguage } from './lib/i18n/locales'
import type { Locale } from './lib/i18n/locales'

const PROTECTED = ['/supplier', '/broker', '/buyer', '/admin']

/** Pages that are always accessible regardless of approval status */
const APPROVAL_EXEMPT = [
  '/pending-approval',
  '/login',
  '/register',
  '/reset-password',
  '/auth-error',
  '/auth',
  '/_next',
  '/favicon',
]

function detectLocale(request: NextRequest): Locale {
  const cookie = request.cookies.get('TTAI_LOCALE')?.value
  if (cookie && SUPPORTED_LOCALES.includes(cookie as Locale)) return cookie as Locale

  const country =
    request.headers.get('x-vercel-ip-country') ??
    request.headers.get('cf-ipcountry') ??
    ''
  if (country && COUNTRY_TO_LOCALE[country.toUpperCase()]) {
    return COUNTRY_TO_LOCALE[country.toUpperCase()]
  }

  const fromHeader = parseAcceptLanguage(request.headers.get('accept-language'))
  if (fromHeader) return fromHeader

  return DEFAULT_LOCALE
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  // ── Locale detection ─────────────────────────────────────────────────────
  const locale = detectLocale(request)
  const existing = request.cookies.get('TTAI_LOCALE')?.value
  if (!existing || !SUPPORTED_LOCALES.includes(existing as Locale)) {
    response.cookies.set('TTAI_LOCALE', locale, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
    })
  }

  // ── Supabase client ──────────────────────────────────────────────────────
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(toSet: { name: string; value: string; options: CookieOptions }[]) {
          toSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          toSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname

  // ── Auth gate (dashboard routes) ────────────────────────────────────────
  if (!user && PROTECTED.some((p) => path.startsWith(p))) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', path)
    return NextResponse.redirect(url)
  }

  // ── Approval gate ────────────────────────────────────────────────────────
  // Only check logged-in users who are not already on an exempt page
  if (user && !APPROVAL_EXEMPT.some((p) => path.startsWith(p))) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('approval_status')
      .eq('id', user.id)
      .single()

    const status = profile?.approval_status ?? 'pending'

    if (status === 'pending') {
      const url = request.nextUrl.clone()
      url.pathname = '/pending-approval'
      url.search = ''
      return NextResponse.redirect(url)
    }

    if (status === 'rejected') {
      const url = request.nextUrl.clone()
      url.pathname = '/account-rejected'
      url.search = ''
      return NextResponse.redirect(url)
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
