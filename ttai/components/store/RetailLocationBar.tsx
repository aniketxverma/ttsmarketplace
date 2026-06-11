'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { MapPin, X } from 'lucide-react'

interface Opt { id: string; name: string }

/**
 * Retail Shop local selector — Country → Province → City → Town → Neighborhood.
 * Each level's options are provided by the server based on the current selection.
 * Changing a level navigates (soft, no reload) and clears the deeper levels.
 */
export function RetailLocationBar({
  countryName,
  provinces, cities, towns, neighborhoods,
  selected,
}: {
  countryName: string
  provinces: Opt[]; cities: Opt[]; towns: Opt[]; neighborhoods: Opt[]
  selected: { province?: string; city?: string; town?: string; neighborhood?: string }
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const go = (changes: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString())
    for (const [k, v] of Object.entries(changes)) {
      if (v) params.set(k, v)
      else params.delete(k)
    }
    params.delete('page')
    const qs = params.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }

  // Selecting a level resets everything below it.
  const onProvince = (v: string) => go({ province: v || null, city: null, town: null, neighborhood: null })
  const onCity     = (v: string) => go({ city: v || null, town: null, neighborhood: null })
  const onTown     = (v: string) => go({ town: v || null, neighborhood: null })
  const onHood     = (v: string) => go({ neighborhood: v || null })

  const Select = ({ label, value, options, onChange, disabled }: {
    label: string; value?: string; options: Opt[]; onChange: (v: string) => void; disabled?: boolean
  }) => (
    <div className="flex flex-col gap-1 min-w-[140px] flex-1">
      <label className="text-[10px] font-bold uppercase tracking-wide text-gray-400">{label}</label>
      <select
        value={value ?? ''} disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500/30 disabled:bg-gray-50 disabled:text-gray-300">
        <option value="">{disabled ? '—' : `All ${label.toLowerCase()}s`}</option>
        {options.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
      </select>
    </div>
  )

  const hasFilter = selected.province || selected.city || selected.town || selected.neighborhood

  return (
    <div className="rounded-2xl border border-purple-100 bg-purple-50/40 p-4 mb-6">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 text-sm font-bold text-purple-800">
          <MapPin className="w-4 h-4" /> Shop locally in {countryName}
        </div>
        {hasFilter && (
          <button onClick={() => go({ province: null, city: null, town: null, neighborhood: null })}
            className="inline-flex items-center gap-1 text-xs font-semibold text-purple-600 hover:text-purple-800">
            <X className="w-3.5 h-3.5" /> Clear
          </button>
        )}
      </div>
      <div className="flex flex-wrap items-end gap-2">
        <Select label="Province" value={selected.province} options={provinces} onChange={onProvince} />
        <Select label="City" value={selected.city} options={cities} onChange={onCity} disabled={!selected.province} />
        <Select label="Town" value={selected.town} options={towns} onChange={onTown} disabled={!selected.city} />
        <Select label="Neighborhood" value={selected.neighborhood} options={neighborhoods} onChange={onHood} disabled={!selected.town} />
      </div>
    </div>
  )
}
