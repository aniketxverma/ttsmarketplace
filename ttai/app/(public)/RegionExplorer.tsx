'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Globe, ChevronDown, ArrowRight, MapPin } from 'lucide-react'
import { REGIONS } from '@/lib/regions-data'

export function RegionExplorer() {
  const [open, setOpen] = useState<string | null>(null)

  return (
    <section className="py-20 sm:py-24 px-4 bg-white">
      <div className="container mx-auto max-w-6xl">

        <div className="text-center mb-10">
          <p className="text-[#F5A623] font-semibold text-sm uppercase tracking-widest mb-2">Source globally</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0B1F4D]">Browse by region</h2>
          <p className="text-gray-400 mt-3 max-w-xl mx-auto">
            Discover verified companies and products by region and country — from the Middle East to Europe and beyond.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

          {/* All regions */}
          <Link href="/marketplace"
            className="group flex items-center gap-4 bg-gradient-to-br from-[#0B1F4D] to-[#1a3a7a] rounded-2xl p-4 sm:p-5 text-white shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
            <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center flex-shrink-0">
              <Globe className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-extrabold text-base leading-tight">All Regions</h3>
              <p className="text-xs text-white/60 mt-0.5">Browse every market</p>
            </div>
            <ArrowRight className="w-5 h-5 text-white/70 group-hover:translate-x-1 transition-transform" />
          </Link>

          {/* Region accordions */}
          {REGIONS.map((region) => {
            const isOpen = open === region.id
            const accent = region.accentColor || '#0B1F4D'
            return (
              <div key={region.id}
                className={`bg-white rounded-2xl border transition-all duration-300 ${isOpen ? 'border-[#0B1F4D]/20 shadow-xl sm:col-span-2 lg:col-span-3' : 'border-gray-100 shadow-sm hover:shadow-md'}`}>
                <button onClick={() => setOpen(isOpen ? null : region.id)}
                  className="w-full flex items-center gap-4 p-4 sm:p-5 text-left">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm"
                    style={{ background: `linear-gradient(135deg, ${accent}, ${accent}cc)` }}>
                    <MapPin className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-extrabold text-[#0B1F4D] text-base leading-tight">{region.name}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">{region.countries.length} countr{region.countries.length === 1 ? 'y' : 'ies'}</p>
                  </div>
                  <ChevronDown className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Countries */}
                <div className={`grid transition-all duration-300 ease-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                  <div className="overflow-hidden">
                    <div className="px-5 pb-5 pt-1">
                      <div className="flex flex-wrap gap-2">
                        {region.countries.map((c) => (
                          <Link key={c.id} href={`/regions/${region.id}/${c.id}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-[#0B1F4D] transition-colors">
                            <span>{c.flag}</span>{c.name}
                          </Link>
                        ))}
                        <Link href={`/regions/${region.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-extrabold text-white"
                          style={{ background: accent }}>
                          View region <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
