'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Sidebar } from './Sidebar'
import type { UserRole } from '@/types/domain'

interface Props {
  role: UserRole
  children: React.ReactNode
}

const PAGE_LABELS: Record<string, string> = {
  '':          'Dashboard',
  'products':  'Products',
  'orders':    'Orders',
  'messages':  'Messages',
  'documents': 'Documents',
  'settings':  'Settings',
  'suppliers': 'Suppliers',
  'promotions':'Promotions',
  'invoices':  'Invoices',
  'payouts':   'Payouts',
  'onboarding':'Onboarding',
}

export function DashboardShell({ role, children }: Props) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => { setOpen(false) }, [pathname])

  // Derive a human label from the path  e.g. /supplier/orders/123 → "Orders"
  const segments = pathname.split('/').filter(Boolean)
  const section = segments[1] ?? ''
  const pageLabel = PAGE_LABELS[section] ?? (section.charAt(0).toUpperCase() + section.slice(1))

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden">

      {/* ── Desktop sidebar (hidden on mobile) ─────────────────────── */}
      <div className="hidden lg:flex flex-shrink-0">
        <Sidebar role={role} />
      </div>

      {/* ── Mobile drawer ──────────────────────────────────────────── */}
      <div
        className={`lg:hidden fixed inset-0 z-50 transition-all duration-300 ${open ? 'pointer-events-auto' : 'pointer-events-none'}`}
      >
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-black/50 backdrop-blur-[2px] transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setOpen(false)}
        />

        {/* Drawer panel */}
        <div
          className={`absolute top-0 left-0 h-full w-[280px] bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-out ${open ? 'translate-x-0' : '-translate-x-full'}`}
        >
          {/* Drawer top bar */}
          <div className="flex items-center justify-between px-5 h-16 border-b flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#0B1F4D] flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="absolute -mt-0.5 -mr-0.5 w-2 h-2 rounded-full bg-[#F5A623] border-2 border-white" />
              </div>
              <div className="leading-none">
                <div className="flex items-baseline gap-0.5">
                  <span className="text-[15px] font-black text-[#0B1F4D]">TTAI</span>
                  <span className="text-[15px] font-black text-[#F5A623]">EMA</span>
                </div>
                <p className="text-[8px] font-bold tracking-[0.15em] text-gray-400 uppercase mt-px">Marketplace</p>
              </div>
            </div>

            <button
              onClick={() => setOpen(false)}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors text-gray-500"
              aria-label="Close menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Nav items */}
          <div className="flex-1 overflow-y-auto">
            <Sidebar role={role} className="w-full min-h-0 border-r-0 bg-transparent" />
          </div>
        </div>
      </div>

      {/* ── Content area ───────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">

        {/* Mobile sub-bar (hamburger + page title) */}
        <div className="lg:hidden flex items-center gap-3 px-3 h-11 border-b bg-white/95 backdrop-blur-md sticky top-16 z-20 flex-shrink-0">
          <button
            onClick={() => setOpen(true)}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-600 hover:bg-gray-100 active:bg-gray-200 transition-colors flex-shrink-0"
            aria-label="Open menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="h-4 w-px bg-gray-200 flex-shrink-0" />
          <span className="text-sm font-semibold text-gray-700 truncate">{pageLabel}</span>
        </div>

        {/* Page content */}
        <main className="flex-1 min-h-0 overflow-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
