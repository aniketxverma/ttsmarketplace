import Link from 'next/link'
import { getLocale } from '@/lib/i18n/server'
import { localizeUI } from '@/lib/i18n/ui'
import { REGIONS } from '@/lib/regions-data'
import { ArrowRight, Globe2, MapPin } from 'lucide-react'

export const metadata = {
  title: 'Shop by Region — Global Trade Network · TTAI EMA',
  description: 'Explore verified suppliers and curated product collections by region and country.',
}

export default async function RegionsIndexPage() {
  
  const tt = await localizeUI(["Global Trade Network", "Shop by region", "countries", "Explore"], getLocale())
  return (
    <div className="bg-gradient-to-b from-white to-gray-50 min-h-screen">
      <div className="container mx-auto px-4 max-w-6xl py-12">
        <div className="text-center mb-9">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#F5A623] mb-2">
            <Globe2 className="w-4 h-4" /> {tt("Global Trade Network")}
          </div>
          <h1 className="text-3xl font-extrabold text-[#0B1F4D]">{tt("Shop by region")}</h1>
          <p className="text-gray-500 text-sm mt-2 max-w-xl mx-auto">Pick your market — then choose a country to explore its verified suppliers and curated collections.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {REGIONS.map((r) => (
            <Link key={r.id} href={`/regions/${r.id}`}
              className="group relative h-56 rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={r.image} alt={r.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />
              <span className="absolute top-0 left-0 right-0 h-1.5" style={{ backgroundColor: r.accentColor }} />
              <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                <p className="text-2xl font-extrabold leading-tight">{r.name}</p>
                <p className="text-xs text-white/75 mt-1 line-clamp-1">{r.tagline}</p>
                <div className="flex items-center justify-between mt-3">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-white/75"><MapPin className="w-3 h-3" /> {r.countries.length} {tt("countries")}</span>
                  <span className="inline-flex items-center gap-1 text-xs font-extrabold bg-white/15 backdrop-blur px-3 py-1.5 rounded-full group-hover:bg-white group-hover:text-[#0B1F4D] transition-colors">
                    {tt("Explore")} <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
