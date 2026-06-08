import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { UserMenu } from './UserMenu'
import { CartIcon } from '@/components/cart/CartIcon'
import { LocaleSwitcher } from '@/components/LocaleSwitcher'
import { Logo } from '@/components/Logo'
import { useServerTranslations } from '@/lib/i18n/server'

export async function Header() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { t } = await useServerTranslations()

  let profile = null
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('full_name, role')
      .eq('id', user.id)
      .single()
    profile = data
  }

  const NAV = [
    { label: 'Home',                    href: '/' },
    { label: t('nav.marketplace'),      href: '/marketplace' },
    { label: 'Regions',                 href: '/regions/europe' },
    { label: 'Store',                   href: '/store' },
    { label: t('nav.suppliers'),        href: '/suppliers' },
    { label: 'Pricing',                 href: '/pricing' },
    { label: 'Channels',                href: '/channels' },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/95 backdrop-blur-md shadow-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">

        {/* ── Logo ────────────────────────────────────────────────────── */}
        <Logo size="md" />

        {/* ── Nav ─────────────────────────────────────────────────────── */}
        <nav className="hidden lg:flex items-center gap-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="relative px-3.5 py-2 text-sm font-medium text-gray-600 hover:text-[#0B1F4D] rounded-lg hover:bg-gray-50 transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* ── Right ───────────────────────────────────────────────────── */}
        <div className="flex items-center gap-2">
          {/* Language switcher — client component with flag dropdown */}
          <div className="hidden sm:block">
            <LocaleSwitcherLight />
          </div>

          {/* Cart */}
          <CartIcon />

          {/* Auth */}
          {user && profile ? (
            <UserMenu
              fullName={profile.full_name}
              email={user.email ?? ''}
              role={profile.role as import('@/types/domain').UserRole}
            />
          ) : (
            <Link
              href="/login"
              className="rounded-xl bg-[#0B1F4D] text-white px-5 py-2 text-sm font-semibold hover:bg-[#162d6e] hover:shadow-md transition-all duration-200"
            >
              {t('common.login')}
            </Link>
          )}

          {/* Mobile menu button */}
          <button className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  )
}

// Light-theme wrapper — renders LocaleSwitcher adapted for the white header
function LocaleSwitcherLight() {
  return <LocaleSwitcher variant="light" />
}
