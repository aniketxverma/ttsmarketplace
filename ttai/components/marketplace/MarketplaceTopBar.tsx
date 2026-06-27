'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useT } from '@/lib/i18n/client'
import { Package, Store, LayoutGrid } from 'lucide-react'
import { MARKET_REGIONS, getRegion } from '@/lib/market-regions'

type Place = { name: string; slug: string }

export function MarketplaceTopBar({
  activeView,
  activeCountry,
  activeMarket,
  categoryLabel,
  provinces = [],
  cities = [],
  activeProvince = '',
  activeCity = '',
}: {
  activeView: 'products' | 'shops' | 'catalogues'
  activeCountry: string
  activeMarket: string
  categoryLabel: string | null
  provinces?: Place[]
  cities?: Place[]
  activeProvince?: string
  activeCity?: string
}) {
  const t = useT()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const region = getRegion(activeMarket)
  const countries = [{ iso: '', name: 'All Countries', flag: '🌍' }, ...region.countries]

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

  const bannerTitle = categoryLabel
    ? `${categoryLabel.toUpperCase()} IN ${region.name.toUpperCase()}`
    : `${region.name.toUpperCase()} MARKET`

  return (
    <div className="mb-6">
      {/* ── Products | Shops tabs ── */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 w-max mb-5">
        {([
          { id: 'products',   label: 'All Products', Icon: Package },
          { id: 'catalogues', label: 'Catalogues',  Icon: LayoutGrid },
          { id: 'shops',      label: 'Shops',        Icon: Store },
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

      {/* ── Market banner: region switcher + country flags ── */}
      <div className="rounded-2xl border border-gray-100 bg-gradient-to-r from-[#0B1F4D] to-[#1a3a7a] overflow-hidden">
        <div className="px-5 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#F5A623]">{region.name} {t("Market")}</p>
            <h2 className="text-lg sm:text-xl font-extrabold text-white leading-tight">{bannerTitle}</h2>
          </div>
          {/* Region switcher — enabled regions are clickable; others show "soon" */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {MARKET_REGIONS.map((r) => {
              const active = region.id === r.id
              if (!r.enabled) return (
                <span key={r.id} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold text-white/35 cursor-not-allowed">
                  {r.name}<span className="text-[9px] uppercase tracking-wide bg-white/10 px-1 py-0.5 rounded">{t("soon")}</span>
                </span>
              )
              return (
                <button key={r.id} onClick={() => navigate({ market: r.id === 'europe' ? null : r.id, country: null })}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${active ? 'bg-[#F5A623] text-[#0B1F4D]' : 'text-white/80 hover:bg-white/10'}`}>
                  {r.name}
                </button>
              )
            })}
          </div>
        </div>
        {/* Level 2 — countries of the selected continent */}
        <div className="bg-white/[0.06] border-t border-white/10 px-3 sm:px-4 py-2.5 flex items-center gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {countries.map((c) => {
            const active = (activeCountry || '') === c.iso
            return (
              <button key={c.iso || 'all'} onClick={() => navigate({ country: c.iso || null, province: null, city: null })}
                className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
                  active ? 'bg-white text-[#0B1F4D] shadow-sm' : 'text-white/80 hover:bg-white/10'}`}>
                <span className="text-base leading-none">{c.flag}</span> {c.name}
              </button>
            )
          })}
        </div>

        {/* Level 3 — provinces of the selected country */}
        {provinces.length > 0 && (
          <div className="bg-white/[0.04] border-t border-white/10 px-3 sm:px-4 py-2 flex items-center gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            <span className="flex-shrink-0 text-[10px] font-bold uppercase tracking-wider text-white/40 mr-1">{t("Province")}</span>
            <button onClick={() => navigate({ province: null, city: null })}
              className={`flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${!activeProvince ? 'bg-white text-[#0B1F4D]' : 'text-white/70 hover:bg-white/10'}`}>
              {t("All")}
            </button>
            {provinces.map((p) => {
              const active = activeProvince === p.slug
              return (
                <button key={p.slug} onClick={() => navigate({ province: p.slug, city: null })}
                  className={`flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${active ? 'bg-[#F5A623] text-[#0B1F4D]' : 'text-white/70 hover:bg-white/10'}`}>
                  {p.name}
                </button>
              )
            })}
          </div>
        )}

        {/* Level 4 — cities / districts of the selected province */}
        {cities.length > 0 && (
          <div className="bg-white/[0.02] border-t border-white/10 px-3 sm:px-4 py-2 flex items-center gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            <span className="flex-shrink-0 text-[10px] font-bold uppercase tracking-wider text-white/40 mr-1">{t("Area")}</span>
            <button onClick={() => navigate({ city: null })}
              className={`flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${!activeCity ? 'bg-white text-[#0B1F4D]' : 'text-white/70 hover:bg-white/10'}`}>
              {t("All")}
            </button>
            {cities.map((c) => {
              const active = activeCity === c.slug
              return (
                <button key={c.slug} onClick={() => navigate({ city: c.slug })}
                  className={`flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${active ? 'bg-white text-[#0B1F4D] shadow-sm' : 'text-white/70 hover:bg-white/10'}`}>
                  {c.name}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
