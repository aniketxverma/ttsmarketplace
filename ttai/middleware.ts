import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { COUNTRY_TO_LOCALE, DEFAULT_LOCALE, SUPPORTED_LOCALES, parseAcceptLanguage } from './lib/i18n/locales'
import type { Locale } from './lib/i18n/locales'

const PROTECTED = ['/supplier', '/broker', '/buyer', '/admin']

function detectLocale(request: NextRequest): Locale {
  // 1. Already have a cookie? Respect user's manual choice
  const cookie = request.cookies.get('TTAI_LOCALE')?.value
  if (cookie && SUPPORTED_LOCALES.includes(cookie as Locale)) return cookie as Locale

  // 2. Vercel / Cloudflare geo header (fastest — set by CDN)
  const country =
    request.headers.get('x-vercel-ip-country') ??
    request.headers.get('cf-ipcountry') ??
    ''
  if (country && COUNTRY_TO_LOCALE[country.toUpperCase()]) {
    return COUNTRY_TO_LOCALE[country.toUpperCase()]
  }

  // 3. Accept-Language header fallback
  const acceptLang = request.headers.get('accept-language')
  const fromHeader = parseAcceptLanguage(acceptLang)
  if (fromHeader) return fromHeader

  return DEFAULT_LOCALE
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  // --- Locale detection ---
  const locale = detectLocale(request)
  const existing = request.cookies.get('TTAI_LOCALE')?.value
  // Only write the cookie if it's missing or stale (don't overwrite manual choice)
  if (!existing || !SUPPORTED_LOCALES.includes(existing as Locale)) {
    response.cookies.set('TTAI_LOCALE', locale, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365, // 1 year
      sameSite: 'lax',
    })
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
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

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname

  if (!user && PROTECTED.some((p) => path.startsWith(p))) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', path)
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
