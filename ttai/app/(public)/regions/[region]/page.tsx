import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { getRegion, REGIONS } from '@/lib/regions-data'
import { OpenCountryCard, LockedCountryCard } from './CountryCards'

export function generateStaticParams() {
  return REGIONS.map((r) => ({ region: r.id }))
}

export async function generateMetadata({ params }: { params: { region: string } }) {
  const region = getRegion(params.region)
  if (!region) return {}
  return { title: `${region.name} — Shop by Region · TTAI EMA` }
}

export default function RegionPage({ params }: { params: { region: string } }) {
  const region = getRegion(params.region)
  if (!region) notFound()

  return (
    <div className="min-h-screen bg-white">

      {/* ── Hero banner ─────────────────────────────────────────────── */}
      <div className="relative h-[42vh] min-h-[260px] max-h-[440px] overflow-hidden">
        <Image
          src={region.image}
          alt={region.name}
          fill
          className="object-cover"
          sizes="100vw"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B1F4D]/80 via-[#0B1F4D]/30 to-transparent" />

        {/* Breadcrumb */}
        <div className="absolute top-6 left-0 right-0 px-4 sm:px-8">
          <div className="container mx-auto">
            <nav className="flex items-center gap-2 text-xs text-white/70 font-medium">
              <Link href="/" className="hover:text-white transition-colors">Home</Link>
              <span>/</span>
              <Link href="/#shop-by-region" className="hover:text-white transition-colors">Regions</Link>
              <span>/</span>
              <span className="text-white">{region.name}</span>
            </nav>
          </div>
        </div>

        {/* Title */}
        <div className="absolute bottom-0 left-0 right-0 px-4 sm:px-8 pb-8">
          <div className="container mx-auto">
            <p className="text-[#F5A623] text-xs font-bold uppercase tracking-widest mb-1">Shop by Region</p>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight">{region.name}</h1>
            <p className="text-white/70 text-sm mt-2 max-w-lg">{region.tagline}</p>
          </div>
        </div>
      </div>

      {/* ── Country grid ────────────────────────────────────────────── */}
      <div className="container mx-auto px-4 sm:px-8 py-14">
        <div className="mb-10">
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#0B1F4D]">
            Choose a Country
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            Select a country to explore curated product collections
          </p>
        </div>

        {/* ── Gating notice (regions that have a free demo country) ── */}
        {region.freeCountryId && (
          <div className="mb-8 flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3.5">
            <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="text-sm font-bold text-amber-800">Spain is open — explore for free!</p>
              <p className="text-xs text-amber-700 mt-0.5">
                Other countries are gated.{' '}
                <Link href="/login" className="underline font-semibold hover:text-amber-900">
                  Create a free account
                </Link>{' '}
                to unlock all regions and suppliers.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {region.countries.map((country, i) =>
            country.id === region.freeCountryId ? (
              <OpenCountryCard
                key={country.id}
                country={country}
                regionId={region.id}
                index={i}
              />
            ) : (
              <LockedCountryCard
                key={country.id}
                country={country}
                regionId={region.id}
                index={i}
              />
            )
          )}
        </div>
      </div>

      {/* ── Other regions ───────────────────────────────────────────── */}
      <div className="border-t bg-gray-50 py-12">
        <div className="container mx-auto px-4 sm:px-8">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">Explore Other Regions</h3>
          <div className="flex flex-wrap gap-3">
            {REGIONS.filter((r) => r.id !== region.id).map((r) => (
              <Link
                key={r.id}
                href={`/regions/${r.id}`}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:border-[#0B1F4D] hover:text-[#0B1F4D] transition-colors"
              >
                {r.name}
                <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
