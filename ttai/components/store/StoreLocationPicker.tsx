'use client'

import { useRouter } from 'next/navigation'
import { ChevronDown } from 'lucide-react'

type Country = { iso: string; name: string }

/** Real, working location card — picking a country reloads the page filtered to it. */
export function StoreLocationPicker({ countries, country }: { countries: Country[]; country: string }) {
  const router = useRouter()

  const Row = ({ label, value }: { label: string; value: string }) => (
    <div className="flex items-center justify-between gap-2 rounded-xl bg-gray-50 border border-gray-100 px-3 py-2.5 mb-2">
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wide text-gray-400">{label}</p>
        <p className="text-sm font-bold text-gray-900 truncate">{value}</p>
      </div>
      <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
    </div>
  )

  return (
    <div className="rounded-2xl bg-white border border-gray-200 shadow-sm p-4">
      <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-3">Explore Location</p>

      <Row label="Continent" value="Europe" />

      {/* Country — real working dropdown */}
      <div className="relative rounded-xl bg-gray-50 border border-gray-100 px-3 py-2.5 mb-2">
        <p className="text-[10px] uppercase tracking-wide text-gray-400">Country</p>
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-bold text-gray-900 truncate">
            {countries.find((c) => c.iso === country)?.name ?? 'All countries'}
          </p>
          <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
        </div>
        <select
          value={country}
          onChange={(e) => router.push(e.target.value ? `/store-center?country=${e.target.value}` : '/store-center')}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          aria-label="Select country"
        >
          <option value="">All countries</option>
          {countries.map((c) => <option key={c.iso} value={c.iso}>{c.name}</option>)}
        </select>
      </div>

      <Row label="Region" value="All regions" />
      <Row label="City" value="All cities" />

      <button
        onClick={() => router.push('/store-center')}
        className="w-full mt-1 rounded-xl bg-[#0B1F4D] hover:bg-[#162d6e] text-white text-sm font-bold py-2.5 transition-colors"
      >
        Reset Location
      </button>
    </div>
  )
}
