import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { getMarketplaceOpen, PRE_OPENING_NOTICE } from '@/lib/marketplace-phase'
import { MARKET_REGIONS } from '@/lib/market-regions'
import { ShopCard, type ShopCardData } from '@/components/marketplace/ShopCard'
import { FileSpreadsheet, PlayCircle, Truck, Warehouse, MessageCircle, Package, ArrowRight, Lock } from 'lucide-react'

export const metadata = {
  title: 'Outlet & Return Goods Hub · TTAI EMA',
  description: 'Amazon returns, Lidl returns, MediaMarkt returns, overstock and liquidation lots — pallets, truckloads and containers.',
}

const LOT_LABEL: Record<string, string> = {
  pallet: 'Pallet', truckload: 'Truckload', container: 'Container', stock: 'Stock lot', mixed: 'Mixed lot',
}

function isoFlag(iso?: string | null) {
  return iso && iso.length === 2 ? iso.toUpperCase().replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0))) : ''
}

export default async function OutletPage({ searchParams }: { searchParams: { source?: string; category?: string; country?: string; market?: string; view?: string } }) {
  const supabase = createClient()
  const marketplaceOpen = await getMarketplaceOpen()
  const activeView: 'products' | 'shops' = searchParams.view === 'shops' ? 'shops' : 'products'

  // Outlet lots (defensive — is_outlet column from migration 0060). Fetch once,
  // then build the filter chips + filter in memory (region / category / country / source).
  let all: any[] = []
  try {
    const { data } = await (supabase.from('products') as any)
      .select(`id, name, slug, price_cents, currency_code, min_order_qty, outlet_source, lot_type,
        categories(name, slug),
        suppliers!supplier_id!inner(id, trade_name, legal_name, brand_slug, logo_url, reliability_tier, tagline, status, countries(name, iso_code)),
        product_images(url, sort_order)`)
      .eq('is_outlet', true).eq('is_published', true).eq('suppliers.status', 'ACTIVE')
      .order('created_at', { ascending: false }).limit(200)
    all = (data ?? []) as any[]
  } catch { all = [] }

  const catOf = (p: any) => p.categories as { name: string; slug: string } | null
  const countryOf = (p: any) => (p.suppliers as any)?.countries as { name: string; iso_code: string } | null

  // Region (zone) filter via the market-regions config.
  const region = MARKET_REGIONS.find((r) => r.id === searchParams.market && r.enabled) ?? null
  const regionIsos = region ? new Set(region.countries.map((c) => c.iso)) : null

  const sources = Array.from(new Set(all.map((p) => p.outlet_source).filter(Boolean))) as string[]
  const categories = Array.from(new Map(all.map((p) => catOf(p)).filter(Boolean).map((c) => [c!.slug, c!])).values())
  const countries = Array.from(new Map(all.map((p) => countryOf(p)).filter(Boolean).map((c) => [c!.iso_code, c!])).values())
  const regions = MARKET_REGIONS.filter((r) => r.enabled)

  const products = all.filter((p) =>
    (!searchParams.source || p.outlet_source === searchParams.source) &&
    (!searchParams.category || catOf(p)?.slug === searchParams.category) &&
    (!searchParams.country || countryOf(p)?.iso_code === searchParams.country) &&
    (!regionIsos || (countryOf(p) ? regionIsos.has(countryOf(p)!.iso_code) : false))
  )

  // Shops view — unique outlet sellers from the filtered lots.
  const shopMap = new Map<string, ShopCardData & { lots: number; cats: Set<string> }>()
  for (const p of products) {
    const s = p.suppliers as any
    if (!s?.id) continue
    let e = shopMap.get(s.id)
    if (!e) {
      e = {
        id: s.id, legal_name: s.legal_name, trade_name: s.trade_name, logo_url: s.logo_url,
        brand_slug: s.brand_slug, reliability_tier: s.reliability_tier, tagline: s.tagline ?? null,
        country_name: countryOf(p)?.name ?? null, business_type: 'Outlet seller',
        lots: 0, cats: new Set<string>(),
      }
      shopMap.set(s.id, e)
    }
    e.lots++
    if (catOf(p)?.name) e.cats.add(catOf(p)!.name)
  }
  const shops: ShopCardData[] = Array.from(shopMap.values())
    .map((e) => ({ ...e, product_count: e.lots, categories: Array.from(e.cats) }))
    .sort((a, b) => (b.product_count ?? 0) - (a.product_count ?? 0))

  // Build a href preserving the other active filters.
  const chipHref = (patch: Record<string, string | undefined>) => {
    const params = new URLSearchParams()
    const merged = { source: searchParams.source, category: searchParams.category, country: searchParams.country, market: searchParams.market, view: searchParams.view, ...patch }
    for (const [k, v] of Object.entries(merged)) if (v) params.set(k, v)
    const qs = params.toString()
    return qs ? `/outlet?${qs}` : '/outlet'
  }

  return (
    <div className="min-h-screen bg-[#F4F6FB]">
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#1a1207] via-[#2a1c0c] to-[#3a2410] text-white">
        <Warehouse className="absolute -bottom-10 right-6 w-72 h-72 text-white/[0.05]" strokeWidth={1} />
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-12 relative">
          <div className="flex items-center gap-2.5 mb-2">
            <span className="rounded-md bg-red-600 text-white text-[10px] font-extrabold uppercase tracking-wide px-2 py-0.5">Outlet Hub</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold">Outlet &amp; Return Goods Hub</h1>
          <p className="text-orange-200/80 mt-2 max-w-2xl">Amazon Returns • Lidl Returns • MediaMarkt Returns • Overstock • Liquidations — sold by pallet, truckload and container with Excel stock lists & video.</p>
          <div className="flex flex-wrap gap-x-5 gap-y-2 mt-5">
            {[
              { Icon: FileSpreadsheet, label: 'Excel Stock Lists', c: 'text-green-400' },
              { Icon: PlayCircle, label: 'Video Offers', c: 'text-red-400' },
              { Icon: Truck, label: 'Pallets & Truckloads', c: 'text-amber-400' },
              { Icon: Warehouse, label: 'Global Warehouses', c: 'text-blue-400' },
              { Icon: MessageCircle, label: 'WhatsApp Contact', c: 'text-emerald-400' },
            ].map(({ Icon, label, c }) => (
              <span key={label} className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/85"><Icon className={`w-4 h-4 ${c}`} /> {label}</span>
            ))}
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
          {([{ id: 'products', label: 'Lots', Icon: Package }, { id: 'shops', label: 'Shops', Icon: Warehouse }] as const).map(({ id, label, Icon }) => (
            <Link key={id} href={chipHref({ view: id === 'products' ? undefined : id })}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold transition-colors ${activeView === id ? 'bg-white text-[#0B1F4D] shadow-sm' : 'text-gray-500 hover:text-[#0B1F4D]'}`}>
              <Icon className="w-4 h-4" /> {label}
            </Link>
          ))}
        </div>

        {/* Filters: Region · Category · Country · Source */}
        <div className="space-y-2.5 mb-6">
          {regions.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wide flex-shrink-0 mr-1">Region</span>
              <Link href={chipHref({ market: undefined, country: undefined })} className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold ${!searchParams.market ? 'bg-[#0B1F4D] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>All</Link>
              {regions.map((r) => (
                <Link key={r.id} href={chipHref({ market: r.id, country: undefined })} className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold ${searchParams.market === r.id ? 'bg-[#0B1F4D] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>{r.name}</Link>
              ))}
            </div>
          )}
          {categories.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wide flex-shrink-0 mr-1">Category</span>
              <Link href={chipHref({ category: undefined })} className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold ${!searchParams.category ? 'bg-[#0B1F4D] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>All</Link>
              {categories.map((c) => (
                <Link key={c.slug} href={chipHref({ category: c.slug })} className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold ${searchParams.category === c.slug ? 'bg-[#0B1F4D] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>{c.name}</Link>
              ))}
            </div>
          )}
          {countries.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wide flex-shrink-0 mr-1">Country</span>
              <Link href={chipHref({ country: undefined })} className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold ${!searchParams.country ? 'bg-[#0B1F4D] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>All</Link>
              {countries.map((c) => (
                <Link key={c.iso_code} href={chipHref({ country: c.iso_code })} className={`flex-shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold ${searchParams.country === c.iso_code ? 'bg-[#0B1F4D] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>{isoFlag(c.iso_code)} {c.name}</Link>
              ))}
            </div>
          )}
          {sources.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wide flex-shrink-0 mr-1">Source</span>
              <Link href={chipHref({ source: undefined })} className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold ${!searchParams.source ? 'bg-[#0B1F4D] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>All</Link>
              {sources.map((s) => (
                <Link key={s} href={chipHref({ source: s })} className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold ${searchParams.source === s ? 'bg-[#0B1F4D] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>{s}</Link>
              ))}
            </div>
          )}
        </div>

        {activeView === 'shops' ? (
          shops.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {shops.map((s) => <ShopCard key={s.id} shop={s} />)}
            </div>
          ) : (
            <div className="text-center py-24 bg-white rounded-2xl border border-gray-100">
              <Warehouse className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 font-semibold text-lg">No outlet shops found</p>
              <p className="text-gray-400 text-sm mt-1">Try a different region or filter.</p>
            </div>
          )
        ) : products.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-2xl border border-gray-100">
            <Warehouse className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600 font-semibold text-lg">No outlet lots listed yet</p>
            <p className="text-gray-400 text-sm mt-1">Suppliers can list outlet & return goods from their product dashboard.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {products.map((p) => {
              const sup = p.suppliers as any
              const img = (p.product_images as { url: string; sort_order: number }[])?.sort((a, b) => a.sort_order - b.sort_order)[0]?.url
              const country = sup?.countries as { name: string; iso_code: string } | null
              return (
                <Link key={p.id} href={`/product/${p.slug ?? p.id}?shop=b2b`}
                  className="group bg-white rounded-2xl border border-gray-200 overflow-hidden flex flex-col hover:shadow-lg hover:border-orange-300 transition-all">
                  <div className="relative aspect-[4/3] bg-[#F7F7F5]">
                    {img ? <Image src={img} alt={p.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="280px" />
                      : <div className="w-full h-full flex items-center justify-center"><Package className="w-10 h-10 text-gray-200" /></div>}
                    {p.lot_type && <span className="absolute top-2 left-2 rounded-full bg-red-600 text-white text-[10px] font-extrabold px-2 py-0.5">{LOT_LABEL[p.lot_type] ?? p.lot_type}</span>}
                  </div>
                  <div className="p-3 flex flex-col flex-1">
                    {p.outlet_source && <p className="text-[11px] font-bold text-orange-600 uppercase tracking-wide truncate">{p.outlet_source}</p>}
                    <h3 className="text-[13.5px] font-bold text-gray-800 leading-snug line-clamp-2">{p.name}</h3>
                    <div className="mt-1.5 flex items-center gap-2 text-[11px] text-gray-400">
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
      </div>
    </div>
  )
}
