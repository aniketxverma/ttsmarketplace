import { createClient } from '@/lib/supabase/server'
import { StoreLocationPicker } from '@/components/store/StoreLocationPicker'
import { MallShops, type MallGroup } from '@/components/store/MallShops'
import Link from 'next/link'
import {
  MapPin, Star, Truck, Shield, Headphones, Wallet, Store, ShoppingBag, Play,
  Layers, Utensils, Cpu, Home, Sparkles, Shirt, Car, PawPrint, Scissors,
} from 'lucide-react'

export const revalidate = 60
export const metadata = { title: 'TTAI Shopping Mall · TTAI EMA' }

// Animated category pins over the 3D mall map.
const HERO_PINS = [
  { label: 'Food & Beverage', root: 'food-beverage',         color: '#f97316', top: '36%', left: '13%' },
  { label: 'Technology',      root: 'electronics-technology', color: '#3b82f6', top: '32%', left: '32%' },
  { label: 'Home & Living',   root: 'cleaning-household',     color: '#22c55e', top: '32%', left: '67%' },
  { label: 'Beauty & Health', root: '',                       color: '#ec4899', top: '36%', left: '87%' },
  { label: 'Fashion',         root: '',                       color: '#a855f7', top: '70%', left: '15%' },
  { label: 'Automotive',      root: 'automotive-transport',   color: '#ef4444', top: '80%', left: '37%' },
  { label: 'Pet Supplies',    root: '',                       color: '#eab308', top: '73%', left: '63%' },
  { label: 'Services',        root: '',                       color: '#14b8a6', top: '75%', left: '87%' },
]

const CAT_STRIP: { key: string; label: string; Icon: any; color: string; root: string }[] = [
  { key: 'food',       label: 'Food & Beverage', Icon: Utensils, color: '#22c55e', root: 'food-beverage' },
  { key: 'technology', label: 'Electronics',     Icon: Cpu,      color: '#3b82f6', root: 'electronics-technology' },
  { key: 'fashion',    label: 'Fashion',         Icon: Shirt,    color: '#a855f7', root: '' },
  { key: 'home',       label: 'Home & Living',   Icon: Home,     color: '#22c55e', root: 'cleaning-household' },
  { key: 'beauty',     label: 'Beauty & Health', Icon: Sparkles, color: '#ec4899', root: '' },
  { key: 'automotive', label: 'Automotive',      Icon: Car,      color: '#ef4444', root: 'automotive-transport' },
  { key: 'services',   label: 'Services',        Icon: Scissors, color: '#14b8a6', root: '' },
  { key: 'all',        label: 'All Categories',  Icon: Layers,   color: '#0B1F4D', root: '' },
]

async function safe<T>(q: any, fallback: T): Promise<T> {
  try { const { data } = await q; return (data ?? fallback) as T } catch { return fallback }
}
const money = (cents: number, cur = 'EUR') =>
  new Intl.NumberFormat('en-IE', { style: 'currency', currency: cur || 'EUR' }).format((cents ?? 0) / 100)
const compact = (n: number) => new Intl.NumberFormat('en', { notation: 'compact' }).format(n)

export default async function ShoppingMallPage({ searchParams }: { searchParams: { country?: string; city?: string } }) {
  const supabase = createClient()

  // ── Location (Country → City) ──
  const countries = await safe<any[]>((supabase.from('countries') as any).select('id, name, iso_code').eq('is_active', true).order('name'), [])
  const activeIso = (searchParams.country ?? '').toUpperCase()
  const activeCountry = countries.find((c: any) => c.iso_code === activeIso) ?? null
  const cities = activeCountry
    ? await safe<any[]>((supabase.from('cities') as any).select('id, name').eq('country_id', activeCountry.id).order('name'), [])
    : []
  const activeCity = cities.find((c: any) => c.id === (searchParams.city ?? '')) ?? null

  const cats = await safe<any[]>(supabase.from('categories').select('id, name, slug, parent_id, sort_order').is('parent_id', null).order('sort_order'), [])
  const allCatsFull = await safe<any[]>(supabase.from('categories').select('id, name, slug, parent_id'), [])
  const catById: Record<string, any> = Object.fromEntries(allCatsFull.map((c: any) => [c.id, c]))
  const rootOf = (cid?: string | null): any => { let c = cid ? catById[cid] : null; for (let i = 0; c && c.parent_id && i < 8; i++) c = catById[c.parent_id]; return c ?? null }

  // ── Retail shops in this location ──
  let supQ = (supabase.from('suppliers') as any)
    .select('id, legal_name, trade_name, logo_url, banner_image, brand_slug, reliability_tier, tagline, description, country_id, city_id, whatsapp, working_hours, min_order_value_cents, countries(name)')
    .eq('status', 'ACTIVE').in('marketplace_context', ['retail', 'both'])
  if (activeCountry) supQ = supQ.eq('country_id', activeCountry.id)
  if (activeCity)    supQ = supQ.eq('city_id', activeCity.id)
  const allShops = await safe<any[]>(supQ.limit(500), [])
  const shops = allShops.slice(0, 24)
  const totalStores = allShops.length
  const locLabel = activeCity?.name ?? activeCountry?.name ?? 'All Locations'

  // Products per shop.
  const shopIds = shops.map((s: any) => s.id)
  const shopProdRows = await safe<any[]>((supabase.from('products') as any)
    .select('supplier_id, name, price_cents, retail_price_cents, currency_code, category_id, product_images(url, sort_order)')
    .in('supplier_id', shopIds.length ? shopIds : ['__none__']).eq('is_published', true).limit(800), [])
  const prodBySup: Record<string, any[]> = {}
  for (const p of shopProdRows) (prodBySup[p.supplier_id] ||= []).push(p)

  // Several storefront photos per category so each shop looks distinct until the
  // supplier uploads their own (saved to banner_image in the dashboard).
  const STORE_IMG: Record<string, string[]> = {
    'food-beverage': [
      'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=600&q=80',
      'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&q=80',
      'https://images.unsplash.com/photo-1534723452862-4c874018d66d?w=600&q=80',
      'https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=600&q=80',
    ],
    'electronics-technology': [
      'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&q=80',
      'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=600&q=80',
    ],
    'automotive-transport': ['https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=600&q=80'],
    'cleaning-household': ['https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80'],
    default: ['https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=600&q=80'],
  }
  const pickImg = (root: string, id: string) => {
    const arr = STORE_IMG[root] ?? STORE_IMG.default
    return arr[(id.charCodeAt(0) + id.charCodeAt(id.length - 1)) % arr.length]
  }
  const ROOT_ACCENT: Record<string, string> = {
    'food-beverage': '#ea580c', 'electronics-technology': '#2563eb',
    'automotive-transport': '#52525b', 'cleaning-household': '#16a34a',
  }

  const stores = shops.map((s: any) => {
    const ps = prodBySup[s.id] ?? []
    const products = ps.map((p: any) => ({
      name: p.name as string,
      price: money(p.retail_price_cents ?? p.price_cents, p.currency_code),
      img: ((p.product_images ?? []) as any[]).slice().sort((a, b) => a.sort_order - b.sort_order)[0]?.url ?? '',
    })).filter((p: any) => p.img)
    const rootCount: Record<string, number> = {}
    for (const p of ps) { const r = rootOf(p.category_id); if (r) rootCount[r.slug] = (rootCount[r.slug] ?? 0) + 1 }
    const topRoot = Object.entries(rootCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'food-beverage'
    return {
      id: s.id,
      name: s.trade_name ?? s.legal_name ?? 'Store',
      href: `/brand/${s.brand_slug ?? s.id}`,
      premium: s.reliability_tier === 'GOLD',
      rating: '4.8',
      reviews: 110 + (s.id.charCodeAt(0) % 130),
      location: [activeCity?.name, activeCountry?.name].filter(Boolean).join(', ') || (s.countries as any)?.name || 'Local',
      about: s.description ?? s.tagline ?? null,
      whatsapp: s.whatsapp ?? null,
      image: s.banner_image || pickImg(topRoot, s.id),
      hours: s.working_hours || 'Open 24 Hours',
      minOrder: s.min_order_value_cents ? money(s.min_order_value_cents) : '€15.00',
      products: products.slice(0, 8),
      productCount: ps.length,
      _root: topRoot,
    }
  })

  const byRoot: Record<string, typeof stores> = {}
  for (const st of stores) (byRoot[st._root] ||= []).push(st)
  const groups: MallGroup[] = cats
    .filter((c: any) => byRoot[c.slug]?.length)
    .map((c: any) => ({
      category: c.name,
      accent: ROOT_ACCENT[c.slug] ?? '#0B1F4D',
      stores: byRoot[c.slug].slice().sort((a, b) => Number(b.premium) - Number(a.premium)),
    }))

  const productsCount = await safe<number>((async () => { const { count } = await (supabase.from('products') as any).select('id', { count: 'exact', head: true }).eq('is_published', true); return { data: count } })(), 0)
  const suppliersCount = await safe<number>((async () => { const { count } = await (supabase.from('suppliers') as any).select('id', { count: 'exact', head: true }).eq('status', 'ACTIVE'); return { data: count } })(), 0)

  const stats = [
    { Icon: Store, value: `${compact(totalStores)}`, label: 'Stores' },
    { Icon: ShoppingBag, value: `${compact(productsCount)}`, label: 'Products' },
    { Icon: Layers, value: `${compact(suppliersCount)}`, label: 'Suppliers' },
    { Icon: Star, value: '4.8', label: 'Average Rating' },
  ]
  // Today's Deals — a few featured products across stores (premium first).
  const deals = stores
    .slice().sort((a, b) => Number(b.premium) - Number(a.premium))
    .flatMap((s) => s.products.slice(0, 2).map((p) => ({ ...p, store: s.name, href: s.href, premium: s.premium })))
    .filter((d) => d.img)
    .slice(0, 14)

  // Only treat a tile's root as real if that category actually exists — otherwise
  // it must NOT fall back to "all stores" (that opened the wrong shops).
  const rootSlugs = new Set<string>(cats.map((c: any) => c.slug))
  const catRoot = (root: string) => (root && rootSlugs.has(root) ? root : null)
  const catCount = (c: { key: string; root: string }) =>
    c.key === 'all' ? totalStores : (catRoot(c.root) ? (byRoot[catRoot(c.root)!]?.length ?? 0) : 0)
  const catLink = (c: { key: string; root: string }) =>
    c.key === 'all' ? '/store' : (catRoot(c.root) ? `/store?category=${catRoot(c.root)}` : null)

  return (
    <div className="min-h-screen bg-[#f3f4f6]">
      <div className="max-w-[1500px] mx-auto px-4 py-5 space-y-5">

        {/* ── Location bar ── */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <StoreLocationPicker
            countries={countries.map((c: any) => ({ iso: c.iso_code, name: c.name }))}
            cities={cities.map((c: any) => ({ id: c.id, name: c.name }))}
            country={activeIso} city={activeCity?.id ?? ''}
          />
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-gray-500"><MapPin className="w-4 h-4" /> Change Location</span>
        </div>

        {/* ── Hero: 3D mall map with animated category pins ── */}
        <div className="relative rounded-3xl overflow-hidden border border-gray-200 shadow-sm">
          <div className="relative aspect-[16/8] sm:aspect-[16/6] min-h-[340px] bg-gradient-to-br from-[#1a1340] via-[#21184f] to-[#0f1629]">
            <div className="absolute inset-0 bg-cover bg-center animate-mall-kenburns" style={{ backgroundImage: "url('/store-center.png')" }} />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0e1a]/85 via-transparent to-[#0a0e1a]/30" />
            {/* soft moving light sweep */}
            <div className="pointer-events-none absolute -inset-x-1/2 inset-y-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-[shimmer_7s_linear_infinite]" />

            {/* Welcome + title (no counters on the image). pointer-events-none so the
                title never blocks the category pins underneath it. */}
            <div className="absolute top-0 left-0 right-0 p-6 sm:p-8 pointer-events-none">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-white/80 text-sm">Welcome to</p>
                  <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-none drop-shadow-lg">TTAI SHOPPING MALL</h1>
                  <p className="text-white/70 text-sm mt-1.5 max-w-md drop-shadow">Your Local Shopping Center. All in One Place.</p>
                </div>
                <button className="pointer-events-auto hidden sm:inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur border border-white/20 text-white text-xs font-bold px-4 py-2 hover:bg-white/20 transition-colors flex-shrink-0">
                  <Play className="w-3.5 h-3.5" />How It Works
                </button>
              </div>
            </div>

            {/* Animated category pins — positioning, float and hover are kept on
                separate elements so their transforms don't fight each other. */}
            {HERO_PINS.map((pin, i) => {
              const labelLeft = parseFloat(pin.left) > 55 // right-side pins: label points inward (avoids clipping)
              const href = catRoot(pin.root) ? `/store?category=${catRoot(pin.root)}` : null
              const pinCls = `group flex items-center gap-2 rounded-full bg-white/95 backdrop-blur shadow-xl ring-1 ring-black/5 py-1 transition-transform duration-200 hover:scale-110 ${labelLeft ? 'flex-row-reverse pl-3 pr-1' : 'pl-1 pr-3'}`
              const pinInner = (
                <>
                  <span className="relative w-7 h-7 rounded-full flex items-center justify-center shadow ring-2 ring-white animate-mall-glow flex-shrink-0" style={{ background: pin.color }}>
                    <span className="absolute inset-0 rounded-full animate-ping opacity-40" style={{ background: pin.color }} />
                    <MapPin className="w-4 h-4 text-white relative" fill="currentColor" />
                  </span>
                  <span className="text-[11px] font-extrabold text-gray-800 whitespace-nowrap">{pin.label}</span>
                </>
              )
              return (
                <div key={pin.label} className="absolute z-10 -translate-x-1/2 -translate-y-1/2 hidden md:block" style={{ top: pin.top, left: pin.left }}>
                  <div className="animate-mall-float" style={{ animationDelay: `${(i % 4) * 0.5}s` }}>
                    {href
                      ? <Link href={href} className={pinCls}>{pinInner}</Link>
                      : <span className={`${pinCls} cursor-default`} title="Coming soon">{pinInner}</span>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Stats strip (moved off the image) ── */}
        <div className="rounded-2xl bg-white border border-gray-200 shadow-sm grid grid-cols-2 sm:grid-cols-4 divide-x divide-gray-100">
          {stats.map((s) => (
            <div key={s.label} className="flex items-center gap-3 justify-center px-3 py-4">
              <s.Icon className="w-7 h-7 text-[#F5A623] flex-shrink-0" strokeWidth={1.6} />
              <div>
                <p className="text-xl font-black text-gray-900 leading-none">{s.value}{s.label !== 'Average Rating' && '+'}</p>
                <p className="text-[11px] text-gray-400 font-semibold mt-0.5">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Today's Deals ── */}
        {deals.length > 0 && (
          <div className="rounded-2xl bg-white border border-gray-200 shadow-sm p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base sm:text-lg font-extrabold text-gray-900 flex items-center gap-2">🔥 Today&apos;s Deals</h2>
              <span className="text-[11px] font-bold text-gray-400">Featured by stores in {locLabel}</span>
            </div>
            <div className="overflow-hidden">
              <div className="flex gap-3 w-max animate-marquee py-1" style={{ animationDuration: `${Math.max(22, deals.length * 4)}s` }}>
                {[...deals, ...deals].map((d, i) => (
                  <Link key={i} href={d.href} className="group flex-shrink-0 w-[150px] rounded-xl border border-gray-100 overflow-hidden bg-white hover:shadow-lg hover:-translate-y-1 hover:scale-[1.03] transition-all duration-200">
                    <div className="relative aspect-square bg-white flex items-center justify-center overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={d.img} alt={d.name} loading="lazy" className="w-full h-full object-contain p-2 group-hover:scale-110 transition-transform duration-300" />
                      {d.premium && <span className="absolute top-1.5 left-1.5 rounded bg-[#F5A623] px-1.5 py-0.5 text-[9px] font-extrabold text-[#0B1F4D]">Featured</span>}
                    </div>
                    <div className="p-2.5 border-t border-gray-50">
                      <p className="text-[11px] font-medium text-gray-600 line-clamp-2 leading-tight h-[28px]">{d.name}</p>
                      <p className="text-sm font-extrabold text-[#0B1F4D] mt-1">{d.price}</p>
                      <p className="text-[10px] text-gray-400 truncate">{d.store}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Category strip ── */}
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2.5 sm:gap-3">
          {CAT_STRIP.map((c) => {
            const href = catLink(c)
            const count = catCount(c)
            const inner = (
              <>
                <span className="w-11 h-11 rounded-full flex items-center justify-center mx-auto mb-2 text-white" style={{ background: c.color }}>
                  <c.Icon className="w-5 h-5" />
                </span>
                <p className="text-xs font-extrabold text-gray-900 leading-tight">{c.label}</p>
                <p className="text-[11px] text-gray-400 mt-0.5">{href ? `${count} Store${count !== 1 ? 's' : ''}` : 'Coming soon'}</p>
              </>
            )
            return href ? (
              <Link key={c.key} href={href}
                className="group rounded-2xl bg-white border border-gray-200 shadow-sm p-3.5 text-center hover:shadow-md hover:-translate-y-0.5 transition-all">
                {inner}
              </Link>
            ) : (
              <div key={c.key} title="No stores in this category yet"
                className="rounded-2xl bg-white border border-gray-200 shadow-sm p-3.5 text-center opacity-55 cursor-default select-none">
                {inner}
              </div>
            )
          })}
        </div>

        {/* ── The mall — storefront rows by category ── */}
        <MallShops groups={groups} />

        {/* ── Trust bar ── */}
        <div className="rounded-2xl bg-white border border-gray-200 shadow-sm grid grid-cols-2 md:grid-cols-4 gap-4 p-5">
          {[
            { Icon: Truck, t: 'Fast Delivery', s: 'Quick delivery to your door' },
            { Icon: Shield, t: 'Secure Payments', s: '100% secure transactions' },
            { Icon: Wallet, t: 'Best Prices', s: 'Compare and save more' },
            { Icon: Headphones, t: '24/7 Support', s: "We're here to help you" },
          ].map((x) => (
            <div key={x.t} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#0B1F4D]/10 flex items-center justify-center flex-shrink-0"><x.Icon className="w-5 h-5 text-[#0B1F4D]" /></div>
              <div><p className="text-sm font-bold text-gray-900">{x.t}</p><p className="text-[11px] text-gray-400">{x.s}</p></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
