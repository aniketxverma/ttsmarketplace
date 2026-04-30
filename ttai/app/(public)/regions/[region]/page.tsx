import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { getRegion, REGIONS } from '@/lib/regions-data'

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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {region.countries.map((country, i) => (
            <Link
              key={country.id}
              href={`/regions/${region.id}/${country.id}`}
              className="group relative rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 bg-gray-100"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              {/* Image */}
              <div className="relative h-52 sm:h-60">
                <Image
                  src={country.image}
                  alt={country.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              </div>

              {/* Overlay content */}
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <div className="flex items-end justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-2xl leading-none">{country.flag}</span>
                      <h3 className="text-white font-extrabold text-lg leading-tight">{country.name}</h3>
                    </div>
                    <p className="text-white/70 text-xs leading-snug max-w-[220px]">{country.tagline}</p>
                    <div className="mt-2.5 flex items-center gap-1 text-xs font-bold text-[#F5A623]">
                      <span>{country.categories.length} collections</span>
                      <svg className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </div>
                  </div>

                  {/* Arrow button */}
                  <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center group-hover:bg-[#F5A623] group-hover:border-[#F5A623] transition-all flex-shrink-0">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </Link>
          ))}
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
