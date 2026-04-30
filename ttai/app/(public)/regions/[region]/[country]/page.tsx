import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { getCountry, REGIONS } from '@/lib/regions-data'

export function generateStaticParams() {
  return REGIONS.flatMap((r) =>
    r.countries.map((c) => ({ region: r.id, country: c.id }))
  )
}

export async function generateMetadata({ params }: { params: { region: string; country: string } }) {
  const result = getCountry(params.region, params.country)
  if (!result) return {}
  return { title: `${result.country.name} Collections · TTAI EMA` }
}

export default function CountryPage({ params }: { params: { region: string; country: string } }) {
  const result = getCountry(params.region, params.country)
  if (!result) notFound()

  const { region, country } = result

  return (
    <div className="min-h-screen bg-white">

      {/* ── Hero banner ─────────────────────────────────────────────── */}
      <div className="relative h-[45vh] min-h-[280px] max-h-[480px] overflow-hidden">
        <Image
          src={country.image}
          alt={country.name}
          fill
          className="object-cover"
          sizes="100vw"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B1F4D]/85 via-[#0B1F4D]/35 to-transparent" />

        {/* Breadcrumb */}
        <div className="absolute top-6 left-0 right-0 px-4 sm:px-8">
          <div className="container mx-auto">
            <nav className="flex items-center gap-2 text-xs text-white/70 font-medium flex-wrap">
              <Link href="/" className="hover:text-white transition-colors">Home</Link>
              <span>/</span>
              <Link href={`/regions/${region.id}`} className="hover:text-white transition-colors">{region.name}</Link>
              <span>/</span>
              <span className="text-white">{country.name}</span>
            </nav>
          </div>
        </div>

        {/* Title */}
        <div className="absolute bottom-0 left-0 right-0 px-4 sm:px-8 pb-8">
          <div className="container mx-auto">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-4xl">{country.flag}</span>
              <p className="text-[#F5A623] text-xs font-bold uppercase tracking-widest">{region.name}</p>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight">{country.name}</h1>
            <p className="text-white/70 text-sm mt-2 max-w-lg">{country.tagline}</p>
          </div>
        </div>
      </div>

      {/* ── Category grid ────────────────────────────────────────────── */}
      <div className="container mx-auto px-4 sm:px-8 py-14">
        <div className="mb-10">
          <p className="text-[#F5A623] text-xs font-bold uppercase tracking-widest mb-2">Curated Collections</p>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#0B1F4D]">
            What to Explore in {country.name}
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            Inspiration-first — tap a collection to discover products
          </p>
        </div>

        {/* First two: large hero cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
          {country.categories.slice(0, 2).map((cat, i) => (
            <Link
              key={cat.id}
              href={cat.marketplaceUrl}
              className="group relative rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 bg-gray-100"
            >
              <div className="relative h-64 sm:h-72">
                <Image
                  src={cat.image}
                  alt={cat.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 640px) 100vw, 50vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
                <h3 className="text-white font-extrabold text-lg sm:text-xl">{cat.name}</h3>
                <p className="text-white/70 text-xs mt-1 leading-snug max-w-xs">{cat.tagline}</p>
                <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-[#F5A623] bg-black/20 backdrop-blur-sm rounded-full px-3 py-1.5 border border-white/10">
                  Browse collection
                  <svg className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Remaining: smaller cards in row of 2-4 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {country.categories.slice(2).map((cat) => (
            <Link
              key={cat.id}
              href={cat.marketplaceUrl}
              className="group relative rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 bg-gray-100"
            >
              <div className="relative h-40 sm:h-48">
                <Image
                  src={cat.image}
                  alt={cat.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 640px) 50vw, 25vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
                <h3 className="text-white font-bold text-sm leading-tight">{cat.name}</h3>
                <div className="mt-1.5 flex items-center gap-1 text-[10px] font-bold text-[#F5A623]">
                  Explore
                  <svg className="w-2.5 h-2.5 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* View all marketplace CTA */}
        <div className="mt-10 text-center">
          <Link
            href="/marketplace"
            className="inline-flex items-center gap-2.5 rounded-xl border-2 border-[#0B1F4D] text-[#0B1F4D] px-8 py-3.5 text-sm font-bold hover:bg-[#0B1F4D] hover:text-white transition-all duration-200"
          >
            Browse All Products
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </div>

      {/* ── Other countries in this region ───────────────────────────── */}
      <div className="border-t bg-gray-50 py-12">
        <div className="container mx-auto px-4 sm:px-8">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">More in {region.name}</h3>
          <div className="flex flex-wrap gap-3">
            {region.countries.filter((c) => c.id !== country.id).map((c) => (
              <Link
                key={c.id}
                href={`/regions/${region.id}/${c.id}`}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:border-[#0B1F4D] hover:text-[#0B1F4D] transition-colors"
              >
                <span>{c.flag}</span>
                {c.name}
              </Link>
            ))}
            <Link
              href={`/regions/${region.id}`}
              className="inline-flex items-center gap-2 rounded-xl border border-dashed border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-400 hover:border-[#0B1F4D] hover:text-[#0B1F4D] transition-colors"
            >
              All of {region.name}
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
