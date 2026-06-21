import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { COUNTRY_TO_LOCALE, DEFAULT_LOCALE, SUPPORTED_LOCALES, parseAcceptLanguage } from './lib/i18n/locales'
import type { Locale } from './lib/i18n/locales'

const PROTECTED = ['/supplier', '/broker', '/buyer', '/admin', '/account']

/** Pages that are always accessible regardless of approval status */
const APPROVAL_EXEMPT = [
  '/pending-approval',
  '/account-rejected',
  '/login',
  '/register',
  '/reset-password',
  '/auth-error',
  '/auth',
  '/_next',
  '/favicon',
]

/** Dashboard routes a PENDING (unapproved) user is still allowed to use */
const PENDING_ALLOWED = ['/buyer', '/supplier', '/broker', '/admin', '/account']

/** Commerce / browse routes that require an APPROVED account when logged in */
const COMMERCE = ['/marketplace', '/product', '/store', '/suppliers', '/distributors', '/factories', '/brand', '/regions', '/projects', '/cart', '/checkout']

/** Where each role lands after login / while pending */
const ROLE_DASH: Record<string, string> = {
  buyer:           '/buyer',
  business_client: '/buyer',
  supplier:        '/supplier',
  broker:          '/broker',
  admin:           '/admin',
}

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

  // ── Auth callback recovery ───────────────────────────────────────────────
  // Supabase email links redirect to the Site URL root (`/?code=…` or
  // `/?token_hash=…&type=…`). Our exchange handler lives at /auth/callback, so
  // forward those params there instead of dropping the user on the homepage
  // un-authenticated. (Skip if already on /auth.)
  if (
    request.nextUrl.pathname === '/' &&
    (request.nextUrl.searchParams.has('code') || request.nextUrl.searchParams.has('token_hash'))
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/callback'
    return NextResponse.redirect(url)
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

  // ── Business-only gate (private ecosystem) ───────────────────────────────
  // End customers (anonymous) only see the consumer Online Shop. The B2B
  // marketplace, supplier directory and wholesale browse require a business
  // account. Carry category/region through so they land on the retail equivalent.
  // /b2b (Trade Hub) is TTAI EMA's public catalogue — anyone can view it.
  const B2B_ONLY = ['/suppliers', '/distributors', '/factories', '/marketplace']
  if (!user && B2B_ONLY.some((p) => path.startsWith(p))) {
    const url = request.nextUrl.clone()
    url.pathname = '/store'
    return NextResponse.redirect(url)
  }

  // ── Approval gate ────────────────────────────────────────────────────────
  // New flow: a newly-registered user can reach their DASHBOARD immediately
  // (so admins receive their details for review). Marketplace / commerce stays
  // locked until an admin approves the account.
  if (user && !APPROVAL_EXEMPT.some((p) => path.startsWith(p))) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('approval_status, role')
      .eq('id', user.id)
      .single()

    const status = profile?.approval_status ?? 'pending'
    const role   = profile?.role ?? 'buyer'
    const dash   = ROLE_DASH[role] ?? '/buyer'

    // Admins are never gated
    if (role !== 'admin') {
      if (status === 'rejected') {
        const url = request.nextUrl.clone()
        url.pathname = '/account-rejected'
        url.search = ''
        return NextResponse.redirect(url)
      }

      if (status === 'pending') {
        // Pending users keep dashboard access but cannot enter commerce routes.
        const inCommerce = COMMERCE.some((p) => path.startsWith(p))
        const inDashboard = PENDING_ALLOWED.some((p) => path.startsWith(p))
        if (inCommerce || (!inDashboard && PROTECTED.some((p) => path.startsWith(p)))) {
          const url = request.nextUrl.clone()
          url.pathname = dash
          url.search = ''
          return NextResponse.redirect(url)
        }
        // dashboard / account / home / other public info pages → allowed
      }
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
