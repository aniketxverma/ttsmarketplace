'use client'

import { useState } from 'react'
import { useT } from '@/lib/i18n/client'
import { SlidersHorizontal, ChevronDown } from 'lucide-react'

/**
 * Outlet filter panel. On mobile it collapses behind a "Filters" toggle to save
 * vertical space; on desktop (lg+) it's always open as a sticky sidebar.
 */
export function FilterPanel({ activeCount = 0, children }: { activeCount?: number; children: React.ReactNode }) {
  const t = useT()
  const [open, setOpen] = useState(false)
  return (
    <aside className="lg:sticky lg:top-20 rounded-2xl bg-white border border-gray-200 overflow-hidden">
      {/* Mobile toggle */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="lg:hidden w-full flex items-center justify-between px-4 py-3 active:bg-gray-50"
      >
        <span className="flex items-center gap-2 font-extrabold text-sm text-[#0B1F4D]">
          <SlidersHorizontal className="w-4 h-4" /> {t("Filters")}
          {activeCount > 0 && (
            <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1 rounded-full bg-[#0B1F4D] text-white text-[10px] font-bold">{activeCount}</span>
          )}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {/* Body: collapsed on mobile unless open, always visible on desktop */}
      <div className={`${open ? 'block' : 'hidden'} lg:block px-4 pb-4 lg:pt-4`}>
        <p className="hidden lg:block font-extrabold text-sm text-[#0B1F4D] mb-1">{t("Filters")}</p>
        {children}
      </div>
    </aside>
  )
}
