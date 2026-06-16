import Link from 'next/link'
import { Heart } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { UserMenu } from './UserMenu'
import { CartIcon } from '@/components/cart/CartIcon'
import { LocaleSwitcher } from '@/components/LocaleSwitcher'
import { Logo } from '@/components/Logo'
import { MobileMenu } from './MobileMenu'
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
    { label: 'Shopping Mall',           href: '/store-center' },
    { label: 'Industrial Park',         href: '/industrial-park' },
    { label: t('nav.suppliers'),        href: '/suppliers' },
    { label: 'Pricing',                 href: '/pricing' },
    { label: 'WhatsApp Hub',            href: '/whatsapp-hub' },
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

          {/* Saved */}
          <Link href="/saved" aria-label="Saved" className="hidden sm:flex w-9 h-9 rounded-xl items-center justify-center text-gray-500 hover:text-rose-500 hover:bg-rose-50 transition-colors">
            <Heart className="w-5 h-5" />
          </Link>

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

          {/* Mobile menu (client) */}
          <MobileMenu nav={NAV} loggedIn={!!(user && profile)} loginLabel={t('common.login')} />
        </div>
      </div>
    </header>
  )
}

// Light-theme wrapper — renders LocaleSwitcher adapted for the white header
function LocaleSwitcherLight() {
  return <LocaleSwitcher variant="light" />
}
