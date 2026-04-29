import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { ReliabilityTier } from '@/types/domain'

const TIER_BADGE: Record<ReliabilityTier, { label: string; cls: string }> = {
  GOLD:       { label: 'Gold Verified',  cls: 'bg-yellow-100 text-yellow-800' },
  SILVER:     { label: 'Silver',         cls: 'bg-slate-100 text-slate-700' },
  BRONZE:     { label: 'Bronze',         cls: 'bg-orange-100 text-orange-700' },
  UNVERIFIED: { label: 'Unverified',     cls: 'bg-gray-100 text-gray-600' },
}

export default async function SuppliersPage({
  searchParams,
}: {
  searchParams: { q?: string; country?: string }
}) {
  const supabase = createClient()

  let query = supabase
    .from('suppliers')
    .select('id, legal_name, trade_name, description, reliability_tier, countries(name, iso_code), cities(name)')
    .eq('status', 'ACTIVE')
    .order('reliability_tier', { ascending: true })
    .order('legal_name')

  if (searchParams.q) {
    query = query.or(`legal_name.ilike.%${searchParams.q}%,trade_name.ilike.%${searchParams.q}%,description.ilike.%${searchParams.q}%`)
  }

  const { data: suppliers } = await query.limit(50)

  return (
    <div className="container mx-auto px-4 py-10">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-[#0B1F4D]">Verified Suppliers</h1>
        <p className="text-gray-500 mt-2 text-sm">
          All suppliers are vetted and managed by <span className="font-semibold text-[#F5A623]">TTAI EMA</span>
        </p>
      </div>

      {/* Search */}
      <form method="GET" className="mb-8 max-w-lg mx-auto flex gap-2">
        <input
          name="q"
          defaultValue={searchParams.q}
          placeholder="Search suppliers..."
          className="flex-1 rounded-md border px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B1F4D]"
        />
        <button
          type="submit"
          className="rounded-md bg-[#0B1F4D] text-white px-5 py-2 text-sm font-medium hover:bg-[#162d6e] transition-colors"
        >
          Search
        </button>
      </form>

      {/* Stats bar */}
      <div className="flex items-center justify-between mb-6 text-sm text-gray-500">
        <span>{suppliers?.length ?? 0} active suppliers</span>
        {searchParams.q && (
          <Link href="/suppliers" className="text-[#0B1F4D] hover:underline">
            Clear search
          </Link>
        )}
      </div>

      {/* Grid */}
      {suppliers && suppliers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {suppliers.map((s) => {
            const country = s.countries as unknown as { name: string; iso_code: string } | null
            const city = s.cities as unknown as { name: string } | null
            const displayName = s.trade_name ?? s.legal_name
            const tier = s.reliability_tier as ReliabilityTier
            const badge = TIER_BADGE[tier] ?? TIER_BADGE.UNVERIFIED
            const initials = displayName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()

            return (
              <Link
                key={s.id}
                href={`/suppliers/${s.id}`}
                className="rounded-xl border hover:shadow-lg transition-shadow overflow-hidden group"
              >
                <div className="bg-gray-50 px-5 py-4 border-b flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-[#0B1F4D] text-white flex items-center justify-center text-lg font-bold flex-shrink-0">
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[#0B1F4D] group-hover:text-blue-700 transition-colors truncate">
                      {displayName}
                    </p>
                    {s.trade_name && (
                      <p className="text-xs text-gray-400 truncate">{s.legal_name}</p>
                    )}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${badge.cls}`}>
                    {badge.label}
                  </span>
                </div>

                <div className="p-5 space-y-3">
                  {s.description && (
                    <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{s.description}</p>
                  )}
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {[city?.name, country?.name].filter(Boolean).join(', ') || '—'}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-green-600 font-medium">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Managed by TTAI EMA
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-20 text-gray-400">
          <div className="text-5xl mb-4">🏭</div>
          <p className="text-lg font-medium text-gray-600">
            {searchParams.q ? 'No suppliers match your search' : 'No active suppliers yet'}
          </p>
          <p className="text-sm mt-1">
            {searchParams.q ? 'Try different keywords' : 'Run the demo seed to add suppliers'}
          </p>
        </div>
      )}

      {/* CTA for potential suppliers */}
      <div className="mt-16 rounded-2xl bg-[#0B1F4D] text-white p-8 text-center">
        <h2 className="text-2xl font-bold mb-2">Are you a supplier?</h2>
        <p className="text-blue-200 text-sm mb-6">
          Join TTAI EMA&apos;s verified network and reach buyers around the world.
        </p>
        <Link
          href="/register"
          className="inline-flex items-center gap-2 rounded-md bg-[#F5A623] text-[#0B1F4D] px-8 py-3 text-sm font-bold hover:bg-[#e8962c] transition-colors"
        >
          Apply as Supplier
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  )
}
