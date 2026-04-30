'use client'

import { useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { REGIONS } from '@/lib/regions-data'

interface Props {
  supplierId: string
  initialKeys: string[]
}

const REGION_FLAGS: Record<string, string> = {
  'middle-east': '🌍',
  'europe':      '🇪🇺',
  'asia':        '🌏',
  'africa':      '🌍',
  'americas':    '🌎',
}

export function RegionManager({ supplierId, initialKeys }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set(initialKeys))
  const [isPending, startTransition] = useTransition()
  const [status, setStatus] = useState<'idle' | 'saved' | 'error'>('idle')

  function isRegionChecked(regionId: string) {
    return selected.has(regionId)
  }

  function isCountryChecked(regionId: string, countryId: string) {
    return selected.has(`${regionId}:${countryId}`)
  }

  function toggleRegion(regionId: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(regionId)) {
        next.delete(regionId)
      } else {
        next.add(regionId)
      }
      return next
    })
    setStatus('idle')
  }

  function toggleCountry(regionId: string, countryId: string) {
    const key = `${regionId}:${countryId}`
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
    setStatus('idle')
  }

  function toggleAllCountries(regionId: string, countryIds: string[]) {
    const allKeys = countryIds.map((c) => `${regionId}:${c}`)
    const allSelected = allKeys.every((k) => selected.has(k))
    setSelected((prev) => {
      const next = new Set(prev)
      if (allSelected) {
        allKeys.forEach((k) => next.delete(k))
      } else {
        allKeys.forEach((k) => next.add(k))
      }
      return next
    })
    setStatus('idle')
  }

  function handleSave() {
    startTransition(async () => {
      try {
        const supabase = createClient()
        await (supabase.from('supplier_regions' as any) as any)
          .delete()
          .eq('supplier_id', supplierId)

        const rows = Array.from(selected).map((key) => ({
          supplier_id: supplierId,
          region_key: key,
        }))

        if (rows.length > 0) {
          const { error } = await (supabase.from('supplier_regions' as any) as any).insert(rows)
          if (error) throw error
        }

        setStatus('saved')
      } catch {
        setStatus('error')
      }
    })
  }

  const totalSelected = selected.size

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="flex items-center justify-between rounded-xl bg-[#0B1F4D]/5 px-5 py-3.5">
        <p className="text-sm font-semibold text-[#0B1F4D]">
          {totalSelected === 0
            ? 'No regions selected — your products won\'t appear on region pages'
            : `${totalSelected} market${totalSelected !== 1 ? 's' : ''} selected`}
        </p>
        <button
          onClick={handleSave}
          disabled={isPending}
          className="flex items-center gap-2 rounded-xl bg-[#F5A623] text-[#0B1F4D] px-5 py-2 text-sm font-bold hover:bg-[#fbb93a] disabled:opacity-60 transition-colors"
        >
          {isPending ? (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          ) : null}
          Save Changes
        </button>
      </div>

      {status === 'saved' && (
        <div className="rounded-xl bg-green-50 border border-green-200 px-5 py-3 text-sm font-medium text-green-700">
          Regions saved — your products will appear on the selected marketplace pages.
        </div>
      )}
      {status === 'error' && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-5 py-3 text-sm font-medium text-red-700">
          Something went wrong. Please try again.
        </div>
      )}

      {/* Region cards */}
      {REGIONS.map((region) => {
        const regionSelected = isRegionChecked(region.id)
        const countryKeys = region.countries.map((c) => c.id)
        const selectedCountryCount = countryKeys.filter((c) => isCountryChecked(region.id, c)).length

        return (
          <div key={region.id} className="rounded-2xl border border-gray-100 bg-white overflow-hidden">
            {/* Region header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
              <div className="flex items-center gap-3">
                <span className="text-xl">{REGION_FLAGS[region.id] ?? '🌐'}</span>
                <div>
                  <p className="font-bold text-[#0B1F4D] text-sm">{region.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{region.tagline}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {selectedCountryCount > 0 && (
                  <span className="text-xs font-bold text-[#F5A623] bg-[#F5A623]/10 rounded-full px-2.5 py-1">
                    {selectedCountryCount} countr{selectedCountryCount !== 1 ? 'ies' : 'y'}
                  </span>
                )}
                {/* Whole-region toggle */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={regionSelected}
                    onChange={() => toggleRegion(region.id)}
                    className="w-4 h-4 rounded border-gray-300 accent-[#0B1F4D]"
                  />
                  <span className="text-xs font-semibold text-gray-600">Entire region</span>
                </label>
                {/* Select all countries */}
                <button
                  onClick={() => toggleAllCountries(region.id, countryKeys)}
                  className="text-xs text-[#0B1F4D] font-semibold hover:underline"
                >
                  {selectedCountryCount === countryKeys.length ? 'Deselect all' : 'Select all'}
                </button>
              </div>
            </div>

            {/* Country grid */}
            <div className="px-5 py-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
              {region.countries.map((country) => {
                const checked = isCountryChecked(region.id, country.id)
                return (
                  <label
                    key={country.id}
                    className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 cursor-pointer transition-colors ${
                      checked
                        ? 'border-[#0B1F4D] bg-[#0B1F4D]/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleCountry(region.id, country.id)}
                      className="w-3.5 h-3.5 rounded border-gray-300 accent-[#0B1F4D] flex-shrink-0"
                    />
                    <span className="text-base leading-none">{country.flag}</span>
                    <span className="text-xs font-semibold text-gray-700 leading-tight">{country.name}</span>
                  </label>
                )
              })}
            </div>
          </div>
        )
      })}

      {/* Bottom save */}
      <div className="flex justify-end pt-2">
        <button
          onClick={handleSave}
          disabled={isPending}
          className="flex items-center gap-2 rounded-xl bg-[#0B1F4D] text-white px-8 py-3 text-sm font-bold hover:bg-[#162d6e] disabled:opacity-60 transition-colors"
        >
          {isPending ? 'Saving…' : 'Save Regions'}
        </button>
      </div>
    </div>
  )
}
