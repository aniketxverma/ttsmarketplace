'use client'

import { useRouter } from 'next/navigation'
import { ChevronDown } from 'lucide-react'

type Country = { iso: string; name: string }
type City = { id: string; name: string }

/** Real, working location card. Country → City cascade; selecting reloads the
 * page filtered to that location. No hardcoded places. */
export function StoreLocationPicker({ countries, cities, country, city, basePath = '/store-center', label = 'Explore Location' }: {
  countries: Country[]; cities: City[]; country: string; city: string; basePath?: string; label?: string
}) {
  const router = useRouter()

  const go = (c: string, ci: string) => {
    const p = new URLSearchParams()
    if (c) p.set('country', c)
    if (ci) p.set('city', ci)
    const qs = p.toString()
    router.push(qs ? `${basePath}?${qs}` : basePath)
  }

  const Field = ({ label, display, value, options, disabled, onChange }: {
    label: string; display: string; value: string; disabled?: boolean
    options: { v: string; label: string }[]; onChange: (v: string) => void
  }) => (
    <div className={`relative rounded-xl bg-gray-50 border border-gray-200 px-3 py-2 min-w-[150px] flex-1 sm:flex-none ${disabled ? 'opacity-50' : ''}`}>
      <p className="text-[9px] uppercase tracking-wide text-gray-400 leading-none">{label}</p>
      <div className="flex items-center justify-between gap-2 mt-0.5">
        <p className="text-sm font-bold text-gray-900 truncate">{display}</p>
        <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
      </div>
      {!disabled && (
        <select value={value} onChange={(e) => onChange(e.target.value)} aria-label={label}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer">
          {options.map((o) => <option key={o.v} value={o.v}>{o.label}</option>)}
        </select>
      )}
    </div>
  )

  return (
    <div className="rounded-2xl bg-white border border-gray-200 shadow-sm px-4 py-3 flex flex-wrap items-center gap-2.5">
      <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mr-1 flex-shrink-0">{label}</p>
      <Field
        label="Country"
        display={countries.find((c) => c.iso === country)?.name ?? 'All countries'}
        value={country}
        options={[{ v: '', label: 'All countries' }, ...countries.map((c) => ({ v: c.iso, label: c.name }))]}
        onChange={(v) => go(v, '')}
      />
      <Field
        label="City"
        disabled={!country}
        display={cities.find((c) => c.id === city)?.name ?? (country ? (cities.length ? 'All cities' : 'No cities listed') : 'Select a country first')}
        value={city}
        options={[{ v: '', label: 'All cities' }, ...cities.map((c) => ({ v: c.id, label: c.name }))]}
        onChange={(v) => go(country, v)}
      />
      {(country || city) && (
        <button onClick={() => go('', '')}
          className="rounded-xl bg-[#0B1F4D] hover:bg-[#162d6e] text-white text-xs font-bold px-4 py-2.5 transition-colors flex-shrink-0">
          Reset
        </button>
      )}
    </div>
  )
}
