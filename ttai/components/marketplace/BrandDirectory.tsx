import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Image from 'next/image'
import {
  accessFor, chainLevel, directoryAccess, entityKind,
  type ChainLevel, type EntityKind, type DirectoryBucket,
} from '@/lib/business-chain'

const RELIABILITY: Record<string, { label: string; cls: string; dot: string }> = {
  GOLD:       { label: 'Gold',     cls: 'bg-amber-50 text-amber-700 border-amber-200',   dot: 'bg-amber-400' },
  SILVER:     { label: 'Verified', cls: 'bg-slate-50  text-slate-600  border-slate-200',  dot: 'bg-slate-400' },
  BRONZE:     { label: 'Bronze',   cls: 'bg-orange-50 text-orange-700 border-orange-200', dot: 'bg-orange-400' },
  UNVERIFIED: { label: 'Listed',   cls: 'bg-gray-50   text-gray-500   border-gray-200',   dot: 'bg-gray-300' },
}

// Per-directory copy + the access bucket it maps to.
const KIND_CONFIG: Record<EntityKind, {
  bucket: DirectoryBucket; eyebrow: string; title: string; blurb: string; kindLabel: string
}> = {
  supplier: {
    bucket: 'suppliers', eyebrow: 'Suppliers network', title: 'Discover Trusted Suppliers',
    blurb: 'Vetted suppliers ready to do wholesale business — the first link in your supply chain.',
    kindLabel: 'Supplier',
  },
  distributor: {
    bucket: 'distributors', eyebrow: 'Distributors network', title: 'Distributors & Wholesalers',
    blurb: 'Established distributors and wholesalers that move products across markets at scale.',
    kindLabel: 'Distributor',
  },
  factory: {
    bucket: 'factories', eyebrow: 'Factories network', title: 'Factories & Manufacturers',
    blurb: 'Source direct from the manufacturers — the top of the supply chain, best margins.',
    kindLabel: 'Factory',
  },
}

/** Contextual upsell shown when the viewer's plan doesn't grant this directory. */
function directoryGate(kind: EntityKind, level: ChainLevel): { title: string; body: string; cta: string; href: string } {
  const bucket = KIND_CONFIG[kind].bucket
  const everUnlockable = directoryAccess(level, 'full')[bucket] // would any paid tier unlock it?

  if (level === 'consumer') {
    return {
      title: 'This is a business membership',
      body: `The ${kind} network is a private B2B matchmaking service. Register your business and choose a plan to be presented the right side of the chain.`,
      cta: 'Register your business', href: '/register',
    }
  }
  if (!everUnlockable) {
    // Not this viewer's lane — point them at their counterpart directory.
    const laneHref = level === 'distributor' ? '/factories' : '/suppliers'
    const laneName = level === 'distributor' ? 'Factories' : 'Suppliers & Distributors'
    return {
      title: `Your membership presents you ${laneName}`,
      body: `Matchmaking is directional — as a ${level === 'factory' ? 'manufacturer' : level}, your counterpart isn't ${kind}s. Head to the part of the chain meant for you.`,
      cta: `Go to ${laneName}`, href: laneHref,
    }
  }
  // It's their lane, but their plan is too low.
  return {
    title: `Unlock the ${KIND_CONFIG[kind].kindLabel} network`,
    body: `Your current plan does not include the ${kind} directory yet. Upgrade your membership to be presented ${kind}s.`,
    cta: 'View plans', href: '/pricing',
  }
}

export async function BrandDirectory({
  kind, searchParams,
}: {
  kind: EntityKind
  searchParams: { q?: string; tier?: string }
}) {
  const cfg = KIND_CONFIG[kind]
  const supabase = createClient()

  // ── Viewer + matchmaking gate ──────────────────────────────────────────
  const { data: { user } } = await supabase.auth.getUser()
  let viewer: any = null
  if (user) {
    const { data } = await (supabase.from('profiles') as any)
      .select('role, business_type, tier').eq('id', user.id).single()
    viewer = data
  }
  const level    = chainLevel(viewer?.role, viewer?.business_type)
  const access   = accessFor(viewer?.role, viewer?.business_type, viewer?.tier)
  const granted  = access[cfg.bucket]
  const watching = granted && !!access.watch?.[cfg.bucket] // browse-only preview
  const gate     = directoryGate(kind, level)

  // ── Listings (only when granted) ───────────────────────────────────────
  let suppliers: any[] = []
  if (granted) {
    let query = (supabase.from('suppliers') as any)
      .select(`
        id, owner_id, legal_name, trade_name, description, tagline, logo_url, banner_image,
        reliability_tier, brand_slug, is_featured, badges,
        years_experience, countries_served, countries(name, iso_code), cities(name)
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
    const { data } = await query.limit(60) as { data: any[] }
    const rows = data ?? []

    // Classify by owner business_type → keep only this kind (rows with no
    // business type stay visible in every directory while data is seeded).
    const ownerIds = Array.from(new Set(rows.map((r) => r.owner_id).filter(Boolean)))
    const ownerType: Record<string, { role: string; business_type: string | null }> = {}
    if (ownerIds.length) {
      const { data: owners } = await (supabase.from('profiles') as any)
        .select('id, role, business_type').in('id', ownerIds)
      for (const o of (owners ?? []) as any[]) ownerType[o.id] = { role: o.role, business_type: o.business_type }
    }
    suppliers = rows.filter((r) => {
      const o = ownerType[r.owner_id]
      if (!o || !o.business_type) return true // unclassified → show everywhere
      return entityKind(o.role, o.business_type) === kind
    })
  }

  const total = suppliers.length

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-[#0B1F4D] to-[#1a3a7a] text-white py-16 px-4">
        <div className="container mx-auto max-w-5xl text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-xs font-semibold text-white/80 mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
            {cfg.eyebrow}
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 leading-tight">{cfg.title}</h1>
          <p className="text-blue-200 text-lg max-w-2xl mx-auto">{cfg.blurb}</p>

          {granted && (
            <form method="GET" className="mt-8 max-w-xl mx-auto flex gap-2">
              <div className="relative flex-1">
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input name="q" defaultValue={searchParams.q} placeholder="Search by name, product, category…"
                  className="w-full rounded-xl border-0 bg-white text-gray-900 pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#F5A623] shadow-lg" />
              </div>
              <button type="submit"
                className="rounded-xl bg-[#F5A623] text-[#0B1F4D] px-5 py-3 text-sm font-bold hover:bg-[#fbb93a] transition-colors shadow-lg whitespace-nowrap">
                Search
              </button>
            </form>
          )}
        </div>
      </div>

      <div className="container mx-auto max-w-6xl px-4 py-8">

        {/* ── Sibling network tabs ────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-2 mb-7">
          {([
            { k: 'supplier' as EntityKind,    href: '/suppliers',    label: 'Suppliers' },
            { k: 'distributor' as EntityKind, href: '/distributors', label: 'Distributors' },
            { k: 'factory' as EntityKind,     href: '/factories',    label: 'Factories' },
          ]).map((tab) => {
            const isActive = tab.k === kind
            const open = access[KIND_CONFIG[tab.k].bucket]
            return (
              <Link key={tab.k} href={tab.href}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold border transition-all ${
                  isActive ? 'bg-[#0B1F4D] text-white border-[#0B1F4D]'
                           : 'bg-white text-gray-600 border-gray-200 hover:border-[#0B1F4D]'
                }`}>
                {tab.label}
                {!open && (
                  <svg className="w-3 h-3 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                )}
              </Link>
            )
          })}
        </div>

        {/* ── Gate ────────────────────────────────────────────────────────── */}
        {!granted ? (
          <div className="max-w-xl mx-auto text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-[#0B1F4D]/5 flex items-center justify-center mx-auto mb-5">
              <svg className="w-8 h-8 text-[#0B1F4D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-2xl font-extrabold text-[#0B1F4D] mb-2">{gate.title}</h2>
            <p className="text-gray-500 leading-relaxed mb-7">{gate.body}</p>
            <Link href={gate.href}
              className="inline-flex items-center gap-2 rounded-xl bg-[#0B1F4D] text-white px-7 py-3.5 text-sm font-bold hover:bg-[#162d6e] transition-colors">
              {gate.cta}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            <div className="mt-8 grid grid-cols-3 gap-2 text-left max-w-md mx-auto">
              {[
                { t: 'Standard', d: 'Suppliers' },
                { t: 'Pro', d: '+ Distributors' },
                { t: 'Full pack', d: '+ Factories' },
              ].map((p) => (
                <div key={p.t} className="rounded-xl border border-gray-100 bg-white px-3 py-2.5">
                  <p className="text-[11px] font-extrabold text-[#0B1F4D]">{p.t}</p>
                  <p className="text-[11px] text-gray-400">{p.d}</p>
                </div>
              ))}
            </div>
          </div>
        ) : total > 0 ? (
          <>
            {watching && (
              <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <p className="text-sm text-amber-800">
                  <strong>Watcher mode.</strong> You can browse {cfg.kindLabel.toLowerCase()} profiles. Upgrade to unlock contact &amp; sourcing opportunities from {cfg.kindLabel.toLowerCase()}s.
                </p>
                <Link href="/pricing" className="flex-shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-[#0B1F4D] text-white px-4 py-2 text-xs font-bold hover:bg-[#162d6e] transition-colors">
                  Upgrade plan
                </Link>
              </div>
            )}
            <div className="flex items-center justify-between mb-6">
              <span className="text-sm text-gray-400">{total} {cfg.kindLabel.toLowerCase()}{total !== 1 ? 's' : ''}</span>
              {searchParams.q && (
                <Link href={`/${kind === 'supplier' ? 'suppliers' : kind === 'distributor' ? 'distributors' : 'factories'}`}
                  className="text-sm text-[#0B1F4D] hover:underline font-medium">Clear search</Link>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {suppliers.map((s) => {
                const country = s.countries as { name: string; iso_code: string } | null
                const city    = s.cities   as { name: string } | null
                const rel     = RELIABILITY[s.reliability_tier] ?? RELIABILITY.UNVERIFIED
                const name    = s.trade_name ?? s.legal_name
                const href    = `/brand/${s.brand_slug ?? s.id}`
                const initials = name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()

                return (
                  <Link key={s.id} href={href}
                    className="group bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200">
                    <div className="relative h-28 bg-gradient-to-br from-[#0B1F4D] to-[#1a3a7a] overflow-hidden">
                      {s.banner_image && (
                        <Image src={s.banner_image} alt="" fill className="object-cover opacity-50 group-hover:opacity-60 transition-opacity" sizes="400px" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                      <div className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-white/90 text-[#0B1F4D] px-2 py-1 rounded-full text-[10px] font-extrabold">
                        {cfg.kindLabel}
                      </div>
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
                    <div className="pt-8 px-4 pb-4">
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <h2 className="font-extrabold text-[#0B1F4D] text-base leading-tight group-hover:text-[#162d6e] transition-colors line-clamp-1">{name}</h2>
                        <span className={`flex-shrink-0 flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${rel.cls}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${rel.dot}`} />
                          {rel.label}
                        </span>
                      </div>
                      {(s.tagline || s.description) && (
                        <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed mb-3">{s.tagline ?? s.description}</p>
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
                      </div>
                      <div className="mt-4 flex items-center justify-between">
                        <span className="text-xs font-semibold text-[#0B1F4D] group-hover:underline flex items-center gap-1">
                          View profile
                          <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                          </svg>
                        </span>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </>
        ) : (
          <div className="text-center py-24">
            <p className="text-gray-500 font-semibold text-lg">
              {searchParams.q ? `No ${cfg.kindLabel.toLowerCase()}s match your search` : `No ${cfg.kindLabel.toLowerCase()}s listed yet`}
            </p>
            <p className="text-gray-400 text-sm mt-1">
              {searchParams.q ? 'Try different keywords' : 'They will appear here once verified'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
