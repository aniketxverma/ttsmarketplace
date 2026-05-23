import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Image from 'next/image'

export const revalidate = 60

const TIER_CONFIG: Record<string, { label: string; cls: string; dot: string }> = {
  GOLD:       { label: 'Gold Supplier',     cls: 'bg-amber-50 text-amber-700 border-amber-200',   dot: 'bg-amber-400' },
  SILVER:     { label: 'Verified Supplier', cls: 'bg-slate-50  text-slate-600  border-slate-200',  dot: 'bg-slate-400' },
  BRONZE:     { label: 'Bronze Supplier',   cls: 'bg-orange-50 text-orange-700 border-orange-200', dot: 'bg-orange-400' },
  UNVERIFIED: { label: 'Supplier',          cls: 'bg-gray-50   text-gray-500   border-gray-200',   dot: 'bg-gray-300' },
}

export default async function SuppliersPage({
  searchParams,
}: {
  searchParams: { q?: string; tier?: string }
}) {
  const supabase = createClient()

  let query = (supabase.from('suppliers') as any)
    .select(`
      id, legal_name, trade_name, description, tagline, logo_url, banner_image,
      reliability_tier, brand_slug, is_featured, badges,
      founded_year, years_experience, employee_count, countries_served,
      countries(name, iso_code), cities(name)
    `)
    .eq('status', 'ACTIVE')
    .order('is_featured', { ascending: false })
    .order('reliability_tier', { ascending: true })
    .order('legal_name')

  if (searchParams.q) {
    query = query.or(
      `legal_name.ilike.%${searchParams.q}%,trade_name.ilike.%${searchParams.q}%,description.ilike.%${searchParams.q}%,tagline.ilike.%${searchParams.q}%`
    )
  }
  if (searchParams.tier) {
    query = query.eq('reliability_tier', searchParams.tier.toUpperCase())
  }

  const { data: suppliers } = await query.limit(60) as { data: any[] }

  const total = suppliers?.length ?? 0
  const featured = suppliers?.filter((s: any) => s.is_featured).length ?? 0

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-[#0B1F4D] to-[#1a3a7a] text-white py-16 px-4">
        <div className="container mx-auto max-w-5xl text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-xs font-semibold text-white/80 mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
            {total} Active Verified Suppliers
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 leading-tight">
            Discover Trusted Suppliers
          </h1>
          <p className="text-blue-200 text-lg max-w-2xl mx-auto">
            Every supplier on TTAI EMA is vetted, verified, and managed. Browse premium brands ready to do wholesale business.
          </p>

          {/* Search bar */}
          <form method="GET" className="mt-8 max-w-xl mx-auto flex gap-2">
            <div className="relative flex-1">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                name="q"
                defaultValue={searchParams.q}
                placeholder="Search by name, product, category…"
                className="w-full rounded-xl border-0 bg-white text-gray-900 pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#F5A623] shadow-lg"
              />
            </div>
            <button type="submit"
              className="rounded-xl bg-[#F5A623] text-[#0B1F4D] px-5 py-3 text-sm font-bold hover:bg-[#fbb93a] transition-colors shadow-lg whitespace-nowrap">
              Search
            </button>
          </form>
        </div>
      </div>

      {/* ── Filters + results ─────────────────────────────────────────────── */}
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-wrap items-center gap-3 mb-6">
          {/* Tier filter chips */}
          {[
            { value: '',       label: 'All Tiers' },
            { value: 'gold',   label: '🥇 Gold' },
            { value: 'silver', label: '🥈 Silver' },
            { value: 'bronze', label: '🥉 Bronze' },
          ].map((f) => (
            <Link key={f.value}
              href={f.value ? `/suppliers?tier=${f.value}${searchParams.q ? `&q=${searchParams.q}` : ''}` : `/suppliers${searchParams.q ? `?q=${searchParams.q}` : ''}`}
              className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
                (searchParams.tier ?? '') === f.value
                  ? 'bg-[#0B1F4D] text-white border-[#0B1F4D]'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-[#0B1F4D]'
              }`}>
              {f.label}
            </Link>
          ))}
          <span className="ml-auto text-sm text-gray-400">{total} supplier{total !== 1 ? 's' : ''}</span>
          {(searchParams.q || searchParams.tier) && (
            <Link href="/suppliers" className="text-sm text-[#0B1F4D] hover:underline font-medium">
              Clear filters
            </Link>
          )}
        </div>

        {/* ── Supplier grid ────────────────────────────────────────────────── */}
        {total > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {(suppliers ?? []).map((s: any) => {
              const country = s.countries as { name: string; iso_code: string } | null
              const city    = s.cities   as { name: string } | null
              const tier    = TIER_CONFIG[s.reliability_tier] ?? TIER_CONFIG.UNVERIFIED
              const name    = s.trade_name ?? s.legal_name
              const href    = s.brand_slug ? `/brand/${s.brand_slug}` : `/suppliers/${s.id}`
              const initials = name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()

              return (
                <Link key={s.id} href={href}
                  className="group bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200">

                  {/* Banner */}
                  <div className="relative h-28 bg-gradient-to-br from-[#0B1F4D] to-[#1a3a7a] overflow-hidden">
                    {s.banner_image && (
                      <Image src={s.banner_image} alt="" fill className="object-cover opacity-50 group-hover:opacity-60 transition-opacity" sizes="400px" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    {s.is_featured && (
                      <div className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-[#F5A623] text-[#0B1F4D] px-2 py-1 rounded-full text-[10px] font-extrabold">
                        <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        Featured
                      </div>
                    )}
                    {/* Logo */}
                    <div className="absolute -bottom-5 left-4">
                      <div className="w-12 h-12 rounded-xl border-2 border-white shadow-md overflow-hidden bg-[#0B1F4D] flex items-center justify-center">
                        {s.logo_url ? (
                          <Image src={s.logo_url} alt={name} width={48} height={48} className="object-cover w-full h-full" />
                        ) : (
                          <span className="text-white font-extrabold text-sm">{initials}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="pt-8 px-4 pb-4">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <h2 className="font-extrabold text-[#0B1F4D] text-base leading-tight group-hover:text-[#162d6e] transition-colors line-clamp-1">{name}</h2>
                      <span className={`flex-shrink-0 flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${tier.cls}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${tier.dot}`} />
                        {tier.label}
                      </span>
                    </div>

                    {(s.tagline || s.description) && (
                      <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed mb-3">
                        {s.tagline ?? s.description}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-400">
                      {(city || country) && (
                        <span className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {[city?.name, country?.name].filter(Boolean).join(', ')}
                        </span>
                      )}
                      {s.years_experience && (
                        <span className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {s.years_experience} yrs
                        </span>
                      )}
                      {s.countries_served > 0 && (
                        <span className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {s.countries_served} countries
                        </span>
                      )}
                    </div>

                    {/* Badges */}
                    {s.badges?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {(s.badges as string[]).slice(0, 3).map((b) => (
                          <span key={b} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#0B1F4D]/5 text-[#0B1F4D]">{b}</span>
                        ))}
                      </div>
                    )}

                    {/* CTA */}
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#0B1F4D] group-hover:underline flex items-center gap-1">
                        View Brand Profile
                        <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                        </svg>
                      </span>
                      <span className="flex items-center gap-1.5 text-[10px] text-green-600 font-semibold bg-green-50 px-2 py-0.5 rounded-full">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l3-3z" clipRule="evenodd" />
                        </svg>
                        Verified
                      </span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-24">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <p className="text-gray-500 font-semibold text-lg">
              {searchParams.q ? 'No suppliers match your search' : 'No active suppliers yet'}
            </p>
            <p className="text-gray-400 text-sm mt-1">
              {searchParams.q ? 'Try different keywords' : 'Suppliers will appear here once verified'}
            </p>
            {(searchParams.q || searchParams.tier) && (
              <Link href="/suppliers" className="mt-4 inline-block text-sm font-semibold text-[#0B1F4D] hover:underline">
                Clear search →
              </Link>
            )}
          </div>
        )}
      </div>

      {/* ── Join CTA ──────────────────────────────────────────────────────── */}
      <div className="container mx-auto max-w-6xl px-4 pb-16">
        <div className="rounded-3xl bg-gradient-to-r from-[#0B1F4D] to-[#1a3a7a] text-white p-8 sm:p-12 text-center">
          <p className="text-blue-300 text-sm font-semibold uppercase tracking-widest mb-3">For Suppliers</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold mb-3">Ready to reach global buyers?</h2>
          <p className="text-blue-200 mb-8 max-w-lg mx-auto">
            Join TTAI EMA&apos;s verified supplier network and get your brand in front of thousands of serious buyers worldwide.
          </p>
          <Link href="/register"
            className="inline-flex items-center gap-2 rounded-xl bg-[#F5A623] text-[#0B1F4D] px-8 py-3.5 text-sm font-extrabold hover:bg-[#fbb93a] transition-colors shadow-lg">
            Apply as Supplier
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  )
}
