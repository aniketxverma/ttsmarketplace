import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { UserMenu } from './UserMenu'
import { CartIcon } from '@/components/cart/CartIcon'

const NAV = [
  { label: 'Home',        href: '/' },
  { label: 'Marketplace', href: '/marketplace' },
  { label: 'Store',       href: '/store' },
  { label: 'Suppliers',   href: '/suppliers' },
]

export async function Header() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let profile = null
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('full_name, role')
      .eq('id', user.id)
      .single()
    profile = data
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/95 backdrop-blur-md shadow-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">

        {/* ── Logo ────────────────────────────────────────────────────── */}
        <Link href="/" className="flex items-center gap-2.5 group">
          {/* Globe mark */}
          <div className="relative w-9 h-9 rounded-xl bg-[#0B1F4D] flex items-center justify-center shadow-md group-hover:bg-[#162d6e] transition-colors">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {/* Gold dot accent */}
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#F5A623] border-2 border-white" />
          </div>

          {/* Wordmark */}
          <div className="leading-none">
            <div className="flex items-baseline gap-0.5">
              <span className="text-[17px] font-black text-[#0B1F4D] tracking-tight">TTAI</span>
              <span className="text-[17px] font-black text-[#F5A623] tracking-tight">EMA</span>
            </div>
            <p className="text-[8px] font-bold tracking-[0.18em] text-gray-400 uppercase mt-px">Marketplace</p>
          </div>
        </Link>

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
        <div className="flex items-center gap-2.5">
          {/* Language selector */}
          <button className="hidden sm:flex items-center gap-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg px-3 py-1.5 hover:border-gray-300 hover:bg-gray-50 transition-colors">
            <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-semibold text-xs">EN</span>
            <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

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
              Login / Register
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
