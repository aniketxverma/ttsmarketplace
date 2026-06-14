'use client'

import { useRouter } from 'next/navigation'
import { ChevronDown } from 'lucide-react'

type Country = { iso: string; name: string }
type City = { id: string; name: string }

/** Real, working location card. Country → City cascade; selecting reloads the
 * page filtered to that location. No hardcoded places. */
export function StoreLocationPicker({ countries, cities, country, city }: {
  countries: Country[]; cities: City[]; country: string; city: string
}) {
  const router = useRouter()

  const go = (c: string, ci: string) => {
    const p = new URLSearchParams()
    if (c) p.set('country', c)
    if (ci) p.set('city', ci)
    const qs = p.toString()
    router.push(qs ? `/store-center?${qs}` : '/store-center')
  }

  const Field = ({ label, display, value, options, disabled, onChange }: {
    label: string; display: string; value: string; disabled?: boolean
    options: { v: string; label: string }[]; onChange: (v: string) => void
  }) => (
    <div className={`relative rounded-xl bg-gray-50 border border-gray-100 px-3 py-2.5 mb-2 ${disabled ? 'opacity-50' : ''}`}>
      <p className="text-[10px] uppercase tracking-wide text-gray-400">{label}</p>
      <div className="flex items-center justify-between gap-2">
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
    <div className="rounded-2xl bg-white border border-gray-200 shadow-sm p-4">
      <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-3">Explore Location</p>

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
          className="w-full mt-1 rounded-xl bg-[#0B1F4D] hover:bg-[#162d6e] text-white text-sm font-bold py-2.5 transition-colors">
          Reset Location
        </button>
      )}
    </div>
  )
}
