'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { LocaleSwitcher } from '@/components/LocaleSwitcher'

type NavItem = { label: string; href: string }

export function MobileMenu({ nav, loggedIn, loginLabel }: { nav: NavItem[]; loggedIn: boolean; loginLabel: string }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  // Close when navigating to a new route.
  useEffect(() => { setOpen(false) }, [pathname])

  // Lock body scroll while open.
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <>
      <button
        onClick={() => setOpen(v => !v)}
        aria-label="Menu"
        aria-expanded={open}
        className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        {open ? <X className="w-5 h-5 text-gray-700" /> : <Menu className="w-5 h-5 text-gray-700" />}
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="lg:hidden fixed inset-0 top-16 z-40 bg-black/30" onClick={() => setOpen(false)} />
          {/* Panel */}
          <div className="lg:hidden fixed inset-x-0 top-16 z-50 bg-white border-b border-gray-100 shadow-xl max-h-[calc(100vh-4rem)] overflow-y-auto">
            <nav className="container mx-auto px-4 py-3">
              {nav.map((item) => {
                const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`block px-3 py-3 rounded-xl text-[15px] font-semibold transition-colors ${
                      active ? 'bg-[#0B1F4D]/[0.06] text-[#0B1F4D]' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {item.label}
                  </Link>
                )
              })}

              <div className="flex items-center justify-between gap-3 mt-2 pt-3 border-t border-gray-100">
                <LocaleSwitcher variant="light" />
                {!loggedIn && (
                  <Link
                    href="/login"
                    onClick={() => setOpen(false)}
                    className="rounded-xl bg-[#0B1F4D] text-white px-5 py-2 text-sm font-semibold hover:bg-[#162d6e]"
                  >
                    {loginLabel}
                  </Link>
                )}
              </div>
            </nav>
          </div>
        </>
      )}
    </>
  )
}
