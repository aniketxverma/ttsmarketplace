import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { UserMenu } from './UserMenu'

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
    <header className="sticky top-0 z-50 w-full border-b bg-white shadow-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-[#0B1F4D] flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="leading-tight">
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-[#0B1F4D] tracking-tight">TTAI</span>
              <span className="text-lg font-bold text-[#F5A623] tracking-tight">EMA</span>
            </div>
            <p className="text-[9px] font-semibold tracking-widest text-gray-500 uppercase -mt-0.5">Marketplace</p>
          </div>
        </Link>

        {/* Nav */}
        <nav className="hidden lg:flex items-center gap-6 text-sm">
          {[
            { label: 'Home', href: '/' },
            { label: 'Marketplace', href: '/marketplace' },
            { label: 'Store', href: '/store' },
            { label: 'Suppliers', href: '/suppliers' },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="font-medium text-gray-600 hover:text-[#0B1F4D] transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Right */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 text-sm text-gray-600 border rounded-md px-2.5 py-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium">EN</span>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>

          {user && profile ? (
            <UserMenu
              fullName={profile.full_name}
              email={user.email ?? ''}
              role={profile.role as import('@/types/domain').UserRole}
            />
          ) : (
            <Link
              href="/login"
              className="rounded-md bg-[#0B1F4D] text-white px-5 py-2 text-sm font-medium hover:bg-[#162d6e] transition-colors"
            >
              Login / Register
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
