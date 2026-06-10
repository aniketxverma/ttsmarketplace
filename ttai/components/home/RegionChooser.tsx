'use client'

import { useState } from 'react'
import Link from 'next/link'
import { REGIONS } from '@/lib/regions-data'
import { ArrowRight, Globe2, MapPin } from 'lucide-react'

export function RegionChooser() {
  const [active, setActive] = useState(REGIONS[0]?.id ?? 'europe')
  const region = REGIONS.find((r) => r.id === active) ?? REGIONS[0]
  if (!region) return null

  return (
    <section className="py-16 bg-gradient-to-b from-white to-gray-50">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#F5A623] mb-2">
            <Globe2 className="w-4 h-4" /> Global Trade Network
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F4D]">Shop by region</h2>
          <p className="text-gray-500 text-sm mt-2 max-w-xl mx-auto">Pick your market to see verified suppliers, products and prices near you.</p>
        </div>

        {/* Region tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
          {REGIONS.map((r) => {
            const on = r.id === active
            return (
              <button key={r.id} onClick={() => setActive(r.id)}
                style={on ? { backgroundColor: r.accentColor } : undefined}
                className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${on ? 'text-white shadow-md scale-105' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                {r.name}
              </button>
            )
          })}
        </div>

        {/* Region banner */}
        <div className="relative rounded-3xl overflow-hidden mb-6 h-40 sm:h-48">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={region.image} alt={region.name} className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
          <div className="relative h-full flex flex-col justify-center px-6 sm:px-10 text-white max-w-lg">
            <p className="text-2xl sm:text-3xl font-extrabold">{region.name}</p>
            <p className="text-sm text-white/80 mt-1">{region.tagline}</p>
            <span className="inline-flex items-center gap-1 text-xs font-bold mt-2 text-white/70"><MapPin className="w-3.5 h-3.5" /> {region.countries.length} countries</span>
          </div>
        </div>

        {/* Country grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {region.countries.map((c) => (
            <Link key={c.id} href={`/marketplace?region=${region.id}:${c.id}`}
              className="group relative rounded-2xl border border-gray-100 bg-white p-4 text-center hover:shadow-lg hover:-translate-y-0.5 transition-all overflow-hidden">
              <span className="absolute inset-x-0 top-0 h-1 opacity-0 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: region.accentColor }} />
              <div className="text-4xl mb-2 leading-none">{c.flag}</div>
              <p className="font-extrabold text-[#0B1F4D] text-sm">{c.name}</p>
              <p className="text-[10px] text-gray-400 line-clamp-2 mt-0.5 leading-snug">{c.tagline}</p>
              <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-[#0B1F4D] opacity-0 group-hover:opacity-100 transition-opacity">
                Explore <ArrowRight className="w-3 h-3" />
              </span>
            </Link>
          ))}
        </div>

        <div className="text-center mt-7">
          <Link href="/regions" className="inline-flex items-center gap-1.5 text-sm font-bold text-[#0B1F4D] hover:underline">
            See all regions <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
