'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useT } from '@/lib/i18n/client'
import { MapPin, X } from 'lucide-react'
import { MARKET_REGIONS } from '@/lib/market-regions'

/** Retail Shop selector — Region → Country (config-driven, soft navigation). */
export function RetailLocationBar({
  activeMarket, activeCountry,
}: {
  activeMarket: string
  activeCountry: string
}) {
  const t = useT()
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

  const Select = ({ label, value, placeholder, options, onChange, disabled }: {
    label: string; value: string; placeholder: string; options: { id: string; name: string }[]; onChange: (v: string) => void; disabled?: boolean
  }) => (
    <div className="flex flex-col gap-1 min-w-[150px] flex-1 sm:flex-none sm:w-56">
      <label className="text-[10px] font-bold uppercase tracking-wide text-gray-400">{label}</label>
      <select value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500/30 disabled:bg-gray-50 disabled:text-gray-300">
        <option value="">{disabled ? '—' : placeholder}</option>
        {options.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
      </select>
    </div>
  )

  const hasFilter = activeMarket || activeCountry

  return (
    <div className="rounded-2xl border border-purple-100 bg-purple-50/40 p-4 mb-6">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 text-sm font-bold text-purple-800">
          <MapPin className="w-4 h-4" /> {t("Shop locally")}
        </div>
        {hasFilter && (
          <button onClick={() => go({ market: null, country: null })}
            className="inline-flex items-center gap-1 text-xs font-semibold text-purple-600 hover:text-purple-800">
            <X className="w-3.5 h-3.5" /> {t("Clear")}
          </button>
        )}
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <Select label="Region" value={activeMarket} placeholder={t("All regions")}
          options={enabledRegions.map((r) => ({ id: r.id, name: r.name }))}
          onChange={(v) => go({ market: v || null, country: null })} />
        <Select label="Country" value={activeCountry} placeholder={t("All countries")}
          options={countries.map((c) => ({ id: c.iso, name: `${c.flag} ${c.name}` }))}
          onChange={(v) => go({ country: v || null })} disabled={!region} />
      </div>
    </div>
  )
}
