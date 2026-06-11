'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { MapPin, X } from 'lucide-react'
import { MARKET_REGIONS } from '@/lib/market-regions'

interface Opt { id: string; name: string }

/**
 * Retail Shop local selector — Region → Country → Province → City → Town → Neighborhood.
 * Region/Country come from the market-regions config; the deeper levels are provided by
 * the server based on the chosen country. Each change navigates (soft) and clears below.
 */
export function RetailLocationBar({
  activeMarket, activeCountry,
  provinces, cities, towns, neighborhoods,
  selected,
}: {
  activeMarket: string
  activeCountry: string
  provinces: Opt[]; cities: Opt[]; towns: Opt[]; neighborhoods: Opt[]
  selected: { province?: string; city?: string; town?: string; neighborhood?: string }
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const go = (changes: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString())
    for (const [k, v] of Object.entries(changes)) {
      if (v) params.set(k, v); else params.delete(k)
    }
    params.delete('page')
    const qs = params.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }

  const enabledRegions = MARKET_REGIONS.filter((r) => r.enabled)
  const region = MARKET_REGIONS.find((r) => r.id === activeMarket && r.enabled) ?? null
  const countries = region?.countries ?? []

  const onRegion  = (v: string) => go({ market: v || null, country: null, province: null, city: null, town: null, neighborhood: null })
  const onCountry = (v: string) => go({ country: v || null, province: null, city: null, town: null, neighborhood: null })
  const onProvince = (v: string) => go({ province: v || null, city: null, town: null, neighborhood: null })
  const onCity     = (v: string) => go({ city: v || null, town: null, neighborhood: null })
  const onTown     = (v: string) => go({ town: v || null, neighborhood: null })
  const onHood     = (v: string) => go({ neighborhood: v || null })

  const Select = ({ label, value, placeholder, options, onChange, disabled }: {
    label: string; value: string; placeholder: string; options: { id: string; name: string }[]; onChange: (v: string) => void; disabled?: boolean
  }) => (
    <div className="flex flex-col gap-1 min-w-[130px] flex-1">
      <label className="text-[10px] font-bold uppercase tracking-wide text-gray-400">{label}</label>
      <select value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500/30 disabled:bg-gray-50 disabled:text-gray-300">
        <option value="">{disabled ? '—' : placeholder}</option>
        {options.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
      </select>
    </div>
  )

  const hasFilter = activeMarket || activeCountry || selected.province || selected.city || selected.town || selected.neighborhood

  return (
    <div className="rounded-2xl border border-purple-100 bg-purple-50/40 p-4 mb-6">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 text-sm font-bold text-purple-800">
          <MapPin className="w-4 h-4" /> Shop locally
        </div>
        {hasFilter && (
          <button onClick={() => go({ market: null, country: null, province: null, city: null, town: null, neighborhood: null })}
            className="inline-flex items-center gap-1 text-xs font-semibold text-purple-600 hover:text-purple-800">
            <X className="w-3.5 h-3.5" /> Clear
          </button>
        )}
      </div>
      <div className="flex flex-wrap items-end gap-2">
        <Select label="Region" value={activeMarket} placeholder="All regions"
          options={enabledRegions.map((r) => ({ id: r.id, name: r.name }))} onChange={onRegion} />
        <Select label="Country" value={activeCountry} placeholder="All countries"
          options={countries.map((c) => ({ id: c.iso, name: `${c.flag} ${c.name}` }))} onChange={onCountry} disabled={!region} />
        <Select label="Province" value={selected.province ?? ''} placeholder="All provinces" options={provinces} onChange={onProvince} disabled={!activeCountry} />
        <Select label="City" value={selected.city ?? ''} placeholder="All cities" options={cities} onChange={onCity} disabled={!selected.province} />
        <Select label="Town" value={selected.town ?? ''} placeholder="All towns" options={towns} onChange={onTown} disabled={!selected.city} />
        <Select label="Neighborhood" value={selected.neighborhood ?? ''} placeholder="All areas" options={neighborhoods} onChange={onHood} disabled={!selected.town} />
      </div>
    </div>
  )
}
