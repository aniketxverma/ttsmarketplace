'use client'

import { useState } from 'react'
import Link from 'next/link'
import { REGIONS } from '@/lib/regions-data'
import { ArrowRight, Globe2, MapPin, ArrowLeft } from 'lucide-react'

export function RegionChooser() {
  const [regionId, setRegionId] = useState<string | null>(null)
  const region = REGIONS.find((r) => r.id === regionId) ?? null

  return (
    <section className="py-16 bg-gradient-to-b from-white to-gray-50">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Heading */}
        <div className="text-center mb-9">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#F5A623] mb-2">
            <Globe2 className="w-4 h-4" /> Global Trade Network
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F4D]">
            {region ? `Choose a country in ${region.name}` : 'Shop by region'}
          </h2>
          <p className="text-gray-500 text-sm mt-2 max-w-xl mx-auto">
            {region ? 'Open a market to see its verified suppliers, products and prices.' : 'Pick your market to discover verified suppliers near you — region first, then country.'}
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-7 text-xs font-bold">
          <button onClick={() => setRegionId(null)} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors ${region ? 'text-gray-400 hover:text-[#0B1F4D]' : 'bg-[#0B1F4D] text-white'}`}>
            <span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center ${region ? 'bg-gray-200 text-gray-500' : 'bg-white/20'}`}>1</span> Region
          </button>
          <span className="w-6 h-px bg-gray-200" />
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full ${region ? 'bg-[#0B1F4D] text-white' : 'text-gray-300'}`}>
            <span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center ${region ? 'bg-white/20' : 'bg-gray-100'}`}>2</span> Country
          </span>
        </div>

        {/* ── STEP 1: regions ── */}
        {!region && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {REGIONS.map((r) => (
              <button key={r.id} onClick={() => setRegionId(r.id)}
                className="group relative h-52 rounded-3xl overflow-hidden text-left shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={r.image} alt={r.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />
                <span className="absolute top-0 left-0 right-0 h-1.5" style={{ backgroundColor: r.accentColor }} />
                <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                  <p className="text-xl font-extrabold leading-tight">{r.name}</p>
                  <p className="text-xs text-white/75 mt-0.5 line-clamp-1">{r.tagline}</p>
                  <div className="flex items-center justify-between mt-2.5">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-white/70"><MapPin className="w-3 h-3" /> {r.countries.length} countries</span>
                    <span className="inline-flex items-center gap-1 text-xs font-bold bg-white/15 backdrop-blur px-2.5 py-1 rounded-full group-hover:bg-white group-hover:text-[#0B1F4D] transition-colors">Choose <ArrowRight className="w-3 h-3" /></span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* ── STEP 2: countries ── */}
        {region && (
          <div>
            <button onClick={() => setRegionId(null)} className="inline-flex items-center gap-1.5 text-sm font-bold text-gray-500 hover:text-[#0B1F4D] mb-4">
              <ArrowLeft className="w-4 h-4" /> All regions
            </button>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {region.countries.map((c) => (
                <Link key={c.id} href={`/marketplace?region=${region.id}:${c.id}`}
                  className="group relative h-44 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.image} alt={c.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                  <span className="absolute top-3 left-3 text-2xl drop-shadow">{c.flag}</span>
                  <div className="absolute inset-x-0 bottom-0 p-3.5 text-white">
                    <p className="font-extrabold leading-tight">{c.name}</p>
                    <p className="text-[10px] text-white/70 line-clamp-2 leading-snug mt-0.5">{c.tagline}</p>
                    <span className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-bold text-white/0 group-hover:text-white transition-colors">Explore <ArrowRight className="w-3 h-3" /></span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="text-center mt-8">
          <Link href="/regions" className="inline-flex items-center gap-1.5 text-sm font-bold text-[#0B1F4D] hover:underline">
            See all regions &amp; countries <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
