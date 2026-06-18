import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import Image from 'next/image'
import { SupplierMall } from '@/components/marketplace/SupplierMall'
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
    // Not this viewer's lane — point them at their direct counterpart directory.
    const laneHref = level === 'supplier' ? '/factories'
      : level === 'factory' ? '/suppliers'
      : level === 'distributor' ? '/factories'
      : '/suppliers'
    const laneName = level === 'supplier' ? 'Factories'
      : level === 'factory' ? 'Suppliers'
      : level === 'distributor' ? 'Factories'
      : 'Suppliers'
    return {
      title: `Your membership presents you ${laneName}`,
      body: `Matchmaking is directional — as a ${level === 'factory' ? 'manufacturer' : level}, your direct counterpart isn't ${kind}s. Head to the part of the chain meant for you.`,
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
  const level   = chainLevel(viewer?.role, viewer?.business_type)
  const access  = accessFor(viewer?.role, viewer?.business_type, viewer?.tier)
  const granted = access[cfg.bucket]
  const gate    = directoryGate(kind, level)

  // ── Listings (only when granted) ───────────────────────────────────────
  let suppliers: any[] = []
  if (granted) {
    let query = (supabase.from('suppliers') as any)
      .select(`
        id, owner_id, legal_name, trade_name, description, tagline, logo_url, banner_image,
        reliability_tier, status, brand_slug, is_featured, badges, whatsapp,
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

  // Product previews — real products per supplier so buyers see what each sells
  // before entering, and to populate the storefront drawer.
  const money = (c: number, cur = 'EUR') => { try { return new Intl.NumberFormat('en-EU', { style: 'currency', currency: cur }).format((c ?? 0) / 100) } catch { return `€${((c ?? 0) / 100).toFixed(2)}` } }
  const prodBySup: Record<string, { slug: string; name: string; img: string; price: string }[]> = {}
  const countBySup: Record<string, number> = {}
  // Fetch PER supplier — a single .in() query is capped at ~1000 rows by
  // PostgREST, so a couple of large suppliers (XO, EuroTech) would swallow the
  // whole result and leave every other storefront with blank thumbnails.
  await Promise.all(suppliers.map(async (s) => {
    const [{ count }, { data: rows }] = await Promise.all([
      (supabase.from('products') as any).select('id', { count: 'exact', head: true }).eq('supplier_id', s.id).eq('is_published', true),
      (supabase.from('products') as any)
        .select('id, name, slug, price_cents, currency_code, product_images(url, sort_order)')
        .eq('supplier_id', s.id).eq('is_published', true).order('created_at', { ascending: false }).limit(48),
    ])
    countBySup[s.id] = count ?? 0
    const list: { slug: string; name: string; img: string; price: string }[] = []
    for (const p of (rows ?? []) as any[]) {
      const img = ((p.product_images ?? []) as any[]).slice().sort((a, b) => a.sort_order - b.sort_order)[0]?.url
      if (img) { list.push({ slug: p.slug ?? p.id, name: p.name, img, price: money(p.price_cents, p.currency_code) }); if (list.length >= 8) break }
    }
    prodBySup[s.id] = list
  }))

  // TTAIEMA Protected + Premium Partner flags (defensive — columns 0073/0074).
  const protectedById = new Map<string, boolean>()
  const premiumById = new Map<string, boolean>()
  try {
    const { data } = await (supabase.from('suppliers') as any).select('id, ttaiema_protected, premium_partner').in('id', suppliers.map((s) => s.id))
    for (const r of (data ?? [])) { protectedById.set(r.id, !!r.ttaiema_protected); premiumById.set(r.id, !!r.premium_partner) }
  } catch { /* columns not migrated yet */ }

  // Mall-style supplier objects (storefronts + drawer).
  const mallSuppliers = suppliers.map((s) => ({
    id: s.id, name: s.trade_name ?? s.legal_name, tagline: s.tagline ?? s.description ?? null,
    logo: s.logo_url ?? null, banner: s.banner_image ?? null,
    country: (s.countries as any)?.name ?? null, city: (s.cities as any)?.name ?? null,
    tier: s.reliability_tier ?? null, status: s.status ?? 'ACTIVE',
    protected: protectedById.get(s.id) ?? false, premiumPartner: premiumById.get(s.id) ?? false,
    brandSlug: s.brand_slug ?? null, whatsapp: s.whatsapp ?? null,
    years: s.years_experience ?? null, count: countBySup[s.id] ?? 0, kindLabel: cfg.kindLabel,
    premium: !!s.is_featured, products: prodBySup[s.id] ?? [],
  }))

  // ── Mall-style hero data (image + live stats + animated sector pins) ──
  // Read via service-role: app_settings isn't anon-readable, so the public
  // server client would return null and the hero image would never show.
  const heroRow = await (createAdminClient().from('app_settings') as any).select('value').eq('key', 'suppliers_hero_url').maybeSingle()
  const heroUrl: string | null = heroRow?.data?.value ?? null
  const productsTotal = Object.values(countBySup).reduce((a, b) => a + b, 0)
  const countriesTotal = new Set(suppliers.map((s) => (s.countries as any)?.name).filter(Boolean)).size
  const HERO_STATS = [
    { value: total,          label: cfg.kindLabel + (total === 1 ? '' : 's') },
    { value: productsTotal,  label: 'Products' },
    { value: countriesTotal, label: 'Countries' },
    { value: total,          label: 'Verified' },
  ]
  const HERO_PINS = [
    { label: 'Electronics',  q: 'electronics', color: '#3b82f6', top: '58%', left: '15%' },
    { label: 'Food & Agri',  q: 'food',        color: '#f97316', top: '80%', left: '28%' },
    { label: 'Audio',        q: 'audio',       color: '#a855f7', top: '56%', left: '45%' },
    { label: 'Cleaning',     q: 'cleaning',    color: '#22c55e', top: '82%', left: '60%' },
    { label: 'Automotive',   q: 'oil',         color: '#ef4444', top: '58%', left: '76%' },
    { label: 'Accessories',  q: 'accessories', color: '#14b8a6', top: '80%', left: '88%' },
  ]
  const dirBase = `/${kind === 'supplier' ? 'suppliers' : kind === 'distributor' ? 'distributors' : 'factories'}`

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">

      {/* ── Hero: 3D global-trade map with animated sector pins ───────────── */}
      <div className="container mx-auto max-w-6xl px-4 pt-6">
        <div className="relative rounded-3xl overflow-hidden border border-gray-200 shadow-sm">
          <div className="relative min-h-[300px] sm:min-h-[380px] bg-gradient-to-br from-[#0B1F4D] via-[#13306e] to-[#0a1733]">
            {heroUrl && <div className="absolute inset-0 bg-cover bg-center animate-mall-kenburns" style={{ backgroundImage: `url('${heroUrl}')` }} />}
            <div className="absolute inset-0 bg-gradient-to-b from-[#0a0e1a]/85 via-[#0a0e1a]/25 to-[#0a0e1a]/55" />
            <div className="pointer-events-none absolute -inset-x-1/2 inset-y-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-[shimmer_7s_linear_infinite]" />

            {/* Animated sector pins — click to filter the directory (desktop only) */}
            {HERO_PINS.map((pin, i) => {
              const labelLeft = parseFloat(pin.left) > 55
              return (
                <div key={pin.label} className="absolute z-10 -translate-x-1/2 -translate-y-1/2 hidden md:block" style={{ top: pin.top, left: pin.left }}>
                  <div className="animate-mall-float" style={{ animationDelay: `${(i % 4) * 0.5}s` }}>
                    <Link href={`${dirBase}?q=${pin.q}`}
                      className={`group flex items-center gap-2 rounded-full bg-white/95 backdrop-blur shadow-xl ring-1 ring-black/5 py-1 transition-transform duration-200 hover:scale-110 ${labelLeft ? 'flex-row-reverse pl-3 pr-1' : 'pl-1 pr-3'}`}>
                      <span className="relative w-7 h-7 rounded-full flex items-center justify-center shadow ring-2 ring-white animate-mall-glow flex-shrink-0" style={{ background: pin.color }}>
                        <span className="absolute inset-0 rounded-full animate-ping opacity-40" style={{ background: pin.color }} />
                        <svg className="w-4 h-4 text-white relative" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" /></svg>
                      </span>
                      <span className="text-[11px] font-extrabold text-gray-800 whitespace-nowrap">{pin.label}</span>
                    </Link>
                  </div>
                </div>
              )
            })}

            {/* Title + search (normal flow → never overflows on mobile) */}
            <div className="relative z-20 flex flex-col items-center text-center px-4 pt-8 pb-14 sm:pt-10 sm:pb-20">
              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-xs font-semibold text-white/85 mb-3 backdrop-blur">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                {cfg.eyebrow}
              </div>
              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white leading-tight drop-shadow-lg max-w-3xl">{cfg.title}</h1>
              <p className="text-blue-100/85 text-sm sm:text-base max-w-2xl mt-2 drop-shadow">{cfg.blurb}</p>
              {granted && (
                <form method="GET" className="mt-6 w-full max-w-xl flex flex-col sm:flex-row gap-2">
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
        </div>

        {/* Stats strip (off the image) */}
        <div className="mt-4 rounded-2xl bg-white border border-gray-200 shadow-sm grid grid-cols-2 sm:grid-cols-4 divide-x divide-gray-100">
          {HERO_STATS.map((s) => (
            <div key={s.label} className="px-3 py-4 text-center">
              <p className="text-xl sm:text-2xl font-black text-[#0B1F4D] leading-none">{s.value}+</p>
              <p className="text-[11px] text-gray-400 font-semibold mt-1">{s.label}</p>
            </div>
          ))}
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
            <div className="flex items-center justify-between mb-6">
              <span className="text-sm text-gray-400">{total} {cfg.kindLabel.toLowerCase()}{total !== 1 ? 's' : ''}</span>
              {searchParams.q && (
                <Link href={`/${kind === 'supplier' ? 'suppliers' : kind === 'distributor' ? 'distributors' : 'factories'}`}
                  className="text-sm text-[#0B1F4D] hover:underline font-medium">Clear search</Link>
              )}
            </div>
            <SupplierMall suppliers={mallSuppliers} />
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
