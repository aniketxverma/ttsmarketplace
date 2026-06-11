'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Package, Store } from 'lucide-react'

/** Europe rollout — the country banner. Future regions reuse the same component. */
const EUROPE_COUNTRIES = [
  { iso: '',   name: 'All Countries', flag: '🌍' },
  { iso: 'ES', name: 'Spain',          flag: '🇪🇸' },
  { iso: 'DE', name: 'Germany',        flag: '🇩🇪' },
  { iso: 'FR', name: 'France',         flag: '🇫🇷' },
  { iso: 'IT', name: 'Italy',          flag: '🇮🇹' },
  { iso: 'BE', name: 'Belgium',        flag: '🇧🇪' },
  { iso: 'NL', name: 'Netherlands',    flag: '🇳🇱' },
  { iso: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
]

export function MarketplaceTopBar({
  activeView,
  activeCountry,
  categoryLabel,
}: {
  activeView: 'products' | 'shops'
  activeCountry: string
  categoryLabel: string | null
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Soft client-side navigation — updates the query, re-renders content, never reloads.
  const navigate = (changes: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString())
    for (const [k, v] of Object.entries(changes)) {
      if (v) params.set(k, v)
      else params.delete(k)
    }
    params.delete('page') // any filter change returns to page 1
    const qs = params.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }

  const bannerTitle = categoryLabel ? `${categoryLabel.toUpperCase()} IN EUROPE` : 'EUROPE MARKET'

  return (
    <div className="mb-6">
      {/* ── Products | Shops tabs ── */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 w-max mb-5">
        {([
          { id: 'products', label: 'Products', Icon: Package },
          { id: 'shops',    label: 'Shops',    Icon: Store },
        ] as const).map(({ id, label, Icon }) => {
          const active = activeView === id
          return (
            <button key={id} onClick={() => navigate({ view: id === 'products' ? null : id })}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold transition-colors ${
                active ? 'bg-white text-[#0B1F4D] shadow-sm' : 'text-gray-500 hover:text-[#0B1F4D]'}`}>
              <Icon className="w-4 h-4" /> {label}
            </button>
          )
        })}
      </div>

      {/* ── Europe market banner + country flags ── */}
      <div className="rounded-2xl border border-gray-100 bg-gradient-to-r from-[#0B1F4D] to-[#1a3a7a] overflow-hidden">
        <div className="px-5 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#F5A623]">Europe Market</p>
            <h2 className="text-lg sm:text-xl font-extrabold text-white leading-tight">{bannerTitle}</h2>
          </div>
          <span className="text-[11px] text-blue-200/80 font-medium">More regions coming soon</span>
        </div>
        <div className="bg-white/[0.06] border-t border-white/10 px-3 sm:px-4 py-2.5 flex items-center gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {EUROPE_COUNTRIES.map((c) => {
            const active = (activeCountry || '') === c.iso
            return (
              <button key={c.iso || 'all'} onClick={() => navigate({ country: c.iso || null })}
                className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
                  active ? 'bg-white text-[#0B1F4D] shadow-sm' : 'text-white/80 hover:bg-white/10'}`}>
                <span className="text-base leading-none">{c.flag}</span> {c.name}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
