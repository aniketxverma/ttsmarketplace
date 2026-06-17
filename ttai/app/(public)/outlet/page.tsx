import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { getMarketplaceOpen, PRE_OPENING_NOTICE } from '@/lib/marketplace-phase'
import { MARKET_REGIONS } from '@/lib/market-regions'
import { ShopCard, type ShopCardData } from '@/components/marketplace/ShopCard'
import { CONDITIONS, SELLING_UNITS, OUTLET_ROLES, RETAIL_CHAINS, conditionInfo, unitInfo } from '@/lib/outlet'
import {
  FileSpreadsheet, PlayCircle, Truck, Warehouse, MessageCircle, Package, ArrowRight, Lock,
  Building2, Store, Boxes, Handshake, ShoppingCart, Tag, BadgePercent,
} from 'lucide-react'

export const metadata = {
  title: 'Outlet Zone · Clearance, Returns & Liquidation B2B · TTAI EMA',
  description: 'Customer returns, overstock, clearance and liquidation lots from suppliers, retail chains, distributors and brokers — by pallet, truckload and container.',
}

const ROLE_ICON: Record<string, any> = {
  direct_supplier: Building2, retail_chain: Store, distributor: Boxes, broker: Handshake, outlet_shop: ShoppingCart,
}
const LOT_LABEL: Record<string, string> = { pallet: 'Pallet', truckload: 'Truckload', container: 'Container', stock: 'Stock lot', mixed: 'Mixed lot' }

function isoFlag(iso?: string | null) {
  return iso && iso.length === 2 ? iso.toUpperCase().replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0))) : ''
}

type SP = {
  source?: string; category?: string; country?: string; market?: string; view?: string
  cond?: string; unit?: string; stype?: string; brand?: string
}

export default async function OutletZonePage({ searchParams }: { searchParams: SP }) {
  const supabase = createClient()
  const marketplaceOpen = await getMarketplaceOpen()
  const activeView: 'products' | 'shops' = searchParams.view === 'shops' ? 'shops' : 'products'

  // Defensive fetch: try the rich select (condition / selling_unit / outlet_role
  // from migration 0069); fall back to the base columns if not yet applied.
  const RICH = `id, name, slug, price_cents, currency_code, min_order_qty, brand_name, outlet_source, lot_type, condition, selling_unit,
    categories(name, slug),
    suppliers!supplier_id!inner(id, trade_name, legal_name, brand_slug, logo_url, reliability_tier, tagline, status, outlet_role, countries(name, iso_code)),
    product_images(url, sort_order)`
  const BASE = `id, name, slug, price_cents, currency_code, min_order_qty, brand_name, outlet_source, lot_type,
    categories(name, slug),
    suppliers!supplier_id!inner(id, trade_name, legal_name, brand_slug, logo_url, reliability_tier, tagline, status, countries(name, iso_code)),
    product_images(url, sort_order)`
  const run = (sel: string) => (supabase.from('products') as any)
    .select(sel).eq('is_outlet', true).eq('is_published', true).eq('suppliers.status', 'ACTIVE')
    .order('created_at', { ascending: false }).limit(300)
  let all: any[] = []
  try { const { data, error } = await run(RICH); if (error) throw error; all = (data ?? []) as any[] }
  catch { try { const { data } = await run(BASE); all = (data ?? []) as any[] } catch { all = [] } }

  const catOf = (p: any) => p.categories as { name: string; slug: string } | null
  const countryOf = (p: any) => (p.suppliers as any)?.countries as { name: string; iso_code: string } | null
  const roleOf = (p: any) => (p.suppliers as any)?.outlet_role as string | null

  const region = MARKET_REGIONS.find((r) => r.id === searchParams.market && r.enabled) ?? null
  const regionIsos = region ? new Set(region.countries.map((c) => c.iso)) : null

  // Dynamic facets from the data.
  const sources = Array.from(new Set(all.map((p) => p.outlet_source).filter(Boolean))) as string[]
  const categories = Array.from(new Map(all.map((p) => catOf(p)).filter(Boolean).map((c) => [c!.slug, c!])).values())
  const countries = Array.from(new Map(all.map((p) => countryOf(p)).filter(Boolean).map((c) => [c!.iso_code, c!])).values())
  const brands = Array.from(new Set(all.map((p) => p.brand_name).filter(Boolean))).slice(0, 24) as string[]
  const regions = MARKET_REGIONS.filter((r) => r.enabled)

  const products = all.filter((p) =>
    (!searchParams.source || p.outlet_source === searchParams.source) &&
    (!searchParams.category || catOf(p)?.slug === searchParams.category) &&
    (!searchParams.country || countryOf(p)?.iso_code === searchParams.country) &&
    (!searchParams.cond || p.condition === searchParams.cond) &&
    (!searchParams.unit || (p.selling_unit === searchParams.unit || p.lot_type === searchParams.unit)) &&
    (!searchParams.stype || roleOf(p) === searchParams.stype) &&
    (!searchParams.brand || p.brand_name === searchParams.brand) &&
    (!regionIsos || (countryOf(p) ? regionIsos.has(countryOf(p)!.iso_code) : false))
  )

  // Shops view — unique outlet sellers.
  const shopMap = new Map<string, ShopCardData & { lots: number; cats: Set<string> }>()
  for (const p of products) {
    const s = p.suppliers as any
    if (!s?.id) continue
    let e = shopMap.get(s.id)
    if (!e) {
      e = { id: s.id, legal_name: s.legal_name, trade_name: s.trade_name, logo_url: s.logo_url, brand_slug: s.brand_slug,
        reliability_tier: s.reliability_tier, tagline: s.tagline ?? null, country_name: countryOf(p)?.name ?? null,
        business_type: 'Outlet seller', lots: 0, cats: new Set<string>() }
      shopMap.set(s.id, e)
    }
    e.lots++; if (catOf(p)?.name) e.cats.add(catOf(p)!.name)
  }
  const shops: ShopCardData[] = Array.from(shopMap.values())
    .map((e) => ({ ...e, product_count: e.lots, categories: Array.from(e.cats) }))
    .sort((a, b) => (b.product_count ?? 0) - (a.product_count ?? 0))

  const chipHref = (patch: Partial<SP>) => {
    const params = new URLSearchParams()
    const merged: SP = { ...searchParams, ...patch }
    for (const [k, v] of Object.entries(merged)) if (v) params.set(k, v)
    const qs = params.toString()
    return qs ? `/outlet?${qs}` : '/outlet'
  }

  const Chip = ({ active, href, children }: { active: boolean; href: string; children: React.ReactNode }) => (
    <Link href={href} className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap ${active ? 'bg-[#0B1F4D] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>{children}</Link>
  )
  const FilterRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="flex items-center gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
      <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wide flex-shrink-0 mr-1 w-16">{label}</span>
      {children}
    </div>
  )

  return (
    <div className="min-h-screen bg-[#F4F6FB] overflow-x-hidden">
      {/* ── Hero ── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#3a0d0d] via-[#1a1207] to-[#0a0e1a] text-white">
        <Warehouse className="absolute -bottom-10 right-6 w-72 h-72 text-white/[0.05]" strokeWidth={1} />
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-12 sm:py-16 relative">
          <div className="flex items-center gap-2.5 mb-3">
            <span className="inline-flex items-center gap-1 rounded-md bg-red-600 text-white text-[10px] font-extrabold uppercase tracking-wide px-2 py-0.5"><BadgePercent className="w-3 h-3" /> Outlet Zone</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black leading-tight">Clearance, Returns &amp; Liquidation — one B2B zone.</h1>
          <p className="text-orange-100/80 mt-3 max-w-2xl text-sm sm:text-base">Customer returns, overstock, clearance and end-of-line stock from suppliers, retail chains, distributors and brokers — traded by unit, pallet, container and full truckload across Europe, the Middle East and Africa.</p>
          <div className="flex flex-wrap gap-x-5 gap-y-2 mt-5">
            {[
              { Icon: FileSpreadsheet, label: 'Excel Stock Lists', c: 'text-green-400' },
              { Icon: PlayCircle, label: 'Video & Pallet Photos', c: 'text-red-400' },
              { Icon: Truck, label: 'Pallets & Truckloads', c: 'text-amber-400' },
              { Icon: Warehouse, label: 'Containers', c: 'text-blue-400' },
              { Icon: MessageCircle, label: 'Direct Contact', c: 'text-emerald-400' },
            ].map(({ Icon, label, c }) => (
              <span key={label} className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/85"><Icon className={`w-4 h-4 ${c}`} /> {label}</span>
            ))}
          </div>
          <div className="flex flex-wrap gap-3 mt-7">
            <Link href="/register" className="inline-flex items-center gap-2 rounded-xl bg-[#F5A623] text-[#0B1F4D] px-6 py-3 text-sm font-extrabold hover:bg-[#fbb93a] transition-colors">List an outlet offer <ArrowRight className="w-4 h-4" /></Link>
            <Link href="/outlet/board" className="inline-flex items-center gap-2 rounded-xl bg-white/10 border border-white/20 px-6 py-3 text-sm font-bold hover:bg-white/20 transition-colors">Trade Board — buy &amp; sell requests</Link>
          </div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-6 text-[11px] text-white/55">
            <span className="font-bold text-white/70">Sources include:</span>
            {RETAIL_CHAINS.map((c) => <span key={c} className="rounded bg-white/10 px-2 py-0.5">{c}</span>)}
          </div>
        </div>
      </div>

      {/* Pre-opening notice */}
      {!marketplaceOpen && (
        <div className="bg-amber-50 border-b border-amber-200">
          <div className="max-w-6xl mx-auto px-4 sm:px-8 py-2.5 flex items-start gap-2.5 text-amber-800">
            <Lock className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <p className="text-[12.5px] leading-snug"><span className="font-bold">Independent shops — Verification pending opening day.</span> {PRE_OPENING_NOTICE}</p>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8">
        {/* Products | Shops toggle */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 w-max mb-5">
          {([{ id: 'products', label: 'Lots', Icon: Package }, { id: 'shops', label: 'Sellers', Icon: Warehouse }] as const).map(({ id, label, Icon }) => (
            <Link key={id} href={chipHref({ view: id === 'products' ? undefined : id })}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold transition-colors ${activeView === id ? 'bg-white text-[#0B1F4D] shadow-sm' : 'text-gray-500 hover:text-[#0B1F4D]'}`}>
              <Icon className="w-4 h-4" /> {label}
            </Link>
          ))}
        </div>

        {/* Filters */}
        <div className="space-y-2.5 mb-6">
          <FilterRow label="Condition">
            <Chip active={!searchParams.cond} href={chipHref({ cond: undefined })}>All</Chip>
            {CONDITIONS.map((c) => <Chip key={c.key} active={searchParams.cond === c.key} href={chipHref({ cond: c.key })}>{c.label}</Chip>)}
          </FilterRow>
          <FilterRow label="Unit">
            <Chip active={!searchParams.unit} href={chipHref({ unit: undefined })}>All</Chip>
            {SELLING_UNITS.map((u) => <Chip key={u.key} active={searchParams.unit === u.key} href={chipHref({ unit: u.key })}>{u.icon} {u.label}</Chip>)}
          </FilterRow>
          <FilterRow label="Seller">
            <Chip active={!searchParams.stype} href={chipHref({ stype: undefined })}>All</Chip>
            {OUTLET_ROLES.map((r) => <Chip key={r.key} active={searchParams.stype === r.key} href={chipHref({ stype: r.key })}>{r.label}</Chip>)}
          </FilterRow>
          {regions.length > 0 && (
            <FilterRow label="Region">
              <Chip active={!searchParams.market} href={chipHref({ market: undefined, country: undefined })}>All</Chip>
              {regions.map((r) => <Chip key={r.id} active={searchParams.market === r.id} href={chipHref({ market: r.id, country: undefined })}>{r.name}</Chip>)}
            </FilterRow>
          )}
          {categories.length > 0 && (
            <FilterRow label="Category">
              <Chip active={!searchParams.category} href={chipHref({ category: undefined })}>All</Chip>
              {categories.map((c) => <Chip key={c.slug} active={searchParams.category === c.slug} href={chipHref({ category: c.slug })}>{c.name}</Chip>)}
            </FilterRow>
          )}
          {brands.length > 0 && (
            <FilterRow label="Brand">
              <Chip active={!searchParams.brand} href={chipHref({ brand: undefined })}>All</Chip>
              {brands.map((b) => <Chip key={b} active={searchParams.brand === b} href={chipHref({ brand: b })}>{b}</Chip>)}
            </FilterRow>
          )}
          {countries.length > 0 && (
            <FilterRow label="Country">
              <Chip active={!searchParams.country} href={chipHref({ country: undefined })}>All</Chip>
              {countries.map((c) => <Chip key={c.iso_code} active={searchParams.country === c.iso_code} href={chipHref({ country: c.iso_code })}>{isoFlag(c.iso_code)} {c.name}</Chip>)}
            </FilterRow>
          )}
          {sources.length > 0 && (
            <FilterRow label="Source">
              <Chip active={!searchParams.source} href={chipHref({ source: undefined })}>All</Chip>
              {sources.map((s) => <Chip key={s} active={searchParams.source === s} href={chipHref({ source: s })}>{s}</Chip>)}
            </FilterRow>
          )}
        </div>

        {/* Results */}
        {activeView === 'shops' ? (
          shops.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{shops.map((s) => <ShopCard key={s.id} shop={s} />)}</div>
          ) : <EmptyZone />
        ) : products.length === 0 ? (
          <EmptyZone />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {products.map((p) => {
              const sup = p.suppliers as any
              const img = (p.product_images as { url: string; sort_order: number }[])?.sort((a, b) => a.sort_order - b.sort_order)[0]?.url
              const country = sup?.countries as { name: string; iso_code: string } | null
              const cond = conditionInfo(p.condition)
              const unit = unitInfo(p.selling_unit)
              return (
                <Link key={p.id} href={`/product/${p.slug ?? p.id}?shop=b2b`}
                  className="group bg-white rounded-2xl border border-gray-200 overflow-hidden flex flex-col hover:shadow-lg hover:border-orange-300 transition-all">
                  <div className="relative aspect-[4/3] bg-[#F7F7F5]">
                    {img ? <Image src={img} alt={p.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="280px" />
                      : <div className="w-full h-full flex items-center justify-center"><Package className="w-10 h-10 text-gray-200" /></div>}
                    <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
                      {cond && <span className={`rounded-full text-[10px] font-extrabold px-2 py-0.5 ${cond.color}`}>{cond.short}</span>}
                      {(unit || p.lot_type) && <span className="rounded-full bg-red-600 text-white text-[10px] font-extrabold px-2 py-0.5">{unit?.label ?? LOT_LABEL[p.lot_type] ?? p.lot_type}</span>}
                    </div>
                  </div>
                  <div className="p-3 flex flex-col flex-1">
                    {p.outlet_source && <p className="text-[11px] font-bold text-orange-600 uppercase tracking-wide truncate">{p.outlet_source}</p>}
                    <h3 className="text-[13.5px] font-bold text-gray-800 leading-snug line-clamp-2">{p.name}</h3>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-gray-400">
                      {p.brand_name && <span className="inline-flex items-center gap-0.5"><Tag className="w-3 h-3" />{p.brand_name}</span>}
                      {country && <span>{isoFlag(country.iso_code)} {country.name}</span>}
                    </div>
                    <div className="mt-auto pt-2.5 flex items-center justify-between">
                      <span className="text-[13px] font-extrabold text-[#0B1F4D]">
                        {p.price_cents > 0 ? new Intl.NumberFormat('en-EU', { style: 'currency', currency: p.currency_code }).format(p.price_cents / 100) : <span className="text-gray-400 italic text-[11px]">Ask price</span>}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 group-hover:gap-1.5 transition-all">View lot <ArrowRight className="w-3 h-3" /></span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        {/* ── Who trades in the Outlet Zone ── */}
        <section className="mt-12">
          <h2 className="text-xl font-extrabold text-[#0B1F4D]">Who trades in the Outlet Zone</h2>
          <p className="text-gray-500 text-sm mt-1">One professional B2B marketplace connecting every link of the clearance chain.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-5">
            {OUTLET_ROLES.map((r) => {
              const Icon = ROLE_ICON[r.key] ?? Building2
              return (
                <Link key={r.key} href="/register" className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5 hover:shadow-md hover:-translate-y-0.5 transition-all">
                  <span className="w-11 h-11 rounded-xl bg-[#0B1F4D]/5 flex items-center justify-center text-[#0B1F4D] mb-3"><Icon className="w-5 h-5" /></span>
                  <p className="font-extrabold text-gray-900">{r.label}</p>
                  <p className="text-sm text-gray-500 mt-1 leading-relaxed">{r.blurb}</p>
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-red-600 mt-3">Register <ArrowRight className="w-3 h-3" /></span>
                </Link>
              )
            })}
          </div>
        </section>

        {/* ── Conditions explainer ── */}
        <section className="mt-12 rounded-2xl bg-white border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-extrabold text-[#0B1F4D]">Every offer carries a clear condition</h2>
          <p className="text-gray-500 text-sm mt-1">Buy with confidence — each lot states its grade up front.</p>
          <div className="flex flex-wrap gap-2 mt-4">
            {CONDITIONS.map((c) => (
              <Link key={c.key} href={chipHref({ cond: c.key, view: undefined })} className={`rounded-full text-xs font-bold px-3 py-1.5 ${c.color} hover:opacity-80 transition-opacity`}>{c.label}</Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

function EmptyZone() {
  return (
    <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
      <Warehouse className="w-12 h-12 text-gray-300 mx-auto mb-3" />
      <p className="text-gray-700 font-bold text-lg">The Outlet Zone is open for listings</p>
      <p className="text-gray-400 text-sm mt-1 max-w-md mx-auto">Suppliers, chains, distributors and brokers can list clearance, returns and liquidation lots — by pallet, container or full truckload.</p>
      <div className="flex flex-wrap justify-center gap-3 mt-5">
        <Link href="/register" className="inline-flex items-center gap-2 rounded-xl bg-[#0B1F4D] text-white px-6 py-3 text-sm font-bold hover:bg-[#162d6e] transition-colors">List an outlet offer <ArrowRight className="w-4 h-4" /></Link>
        <Link href="/contact?dept=marketplace" className="inline-flex items-center gap-2 rounded-xl border border-gray-200 text-gray-700 px-6 py-3 text-sm font-bold hover:bg-gray-50 transition-colors">Talk to our team</Link>
      </div>
    </div>
  )
}
