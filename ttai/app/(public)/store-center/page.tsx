import { createClient } from '@/lib/supabase/server'
import { StoreLocationPicker } from '@/components/store/StoreLocationPicker'
import { MallShops, type MallGroup } from '@/components/store/MallShops'
import Link from 'next/link'
import {
  MapPin, Star, Truck, Shield, Headphones, Wallet, Store, ShoppingBag,
  Layers, Utensils, Cpu, Home, Sparkles, Shirt, Car, PawPrint, Scissors,
} from 'lucide-react'

export const revalidate = 60
export const metadata = { title: 'TTAI Shopping Mall · TTAI EMA' }

const HERO_IMG = 'https://images.unsplash.com/photo-1519567241046-7f570eee3ce6?w=1600&q=80'

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
  const catCount = (root: string) => (root ? (byRoot[root]?.length ?? 0) : totalStores)
  const storeHref = (key: string) => {
    const c = cats.find((x: any) => (x.name || '').toLowerCase().includes(key))
    return c?.slug ? `/store?category=${c.slug}` : '/store'
  }

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

        {/* ── Hero ── */}
        <div className="relative rounded-3xl overflow-hidden min-h-[320px] sm:min-h-[380px] flex">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={HERO_IMG} alt="TTAI Shopping Mall" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a0e1a]/92 via-[#0a0e1a]/55 to-[#0a0e1a]/10" />
          <div className="relative p-7 sm:p-10 flex flex-col justify-center max-w-2xl">
            <p className="text-white/80 text-sm sm:text-base">Welcome to</p>
            <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-none drop-shadow">TTAI SHOPPING MALL</h1>
            <p className="text-white/70 text-sm sm:text-base mt-2">Your Local Shopping Center. All in One Place.</p>
            <div className="flex flex-wrap gap-x-8 gap-y-3 mt-7">
              {stats.map((s) => (
                <div key={s.label} className="flex items-center gap-2.5">
                  <s.Icon className="w-6 h-6 text-[#F5A623] flex-shrink-0" strokeWidth={1.75} />
                  <div>
                    <p className="text-xl font-black text-white leading-none">{s.value}{s.label !== 'Average Rating' && '+'}</p>
                    <p className="text-[11px] text-white/65 font-semibold">{s.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Category strip ── */}
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2.5 sm:gap-3">
          {CAT_STRIP.map((c) => (
            <Link key={c.key} href={c.key === 'all' ? '/store' : storeHref(c.key)}
              className="group rounded-2xl bg-white border border-gray-200 shadow-sm p-3.5 text-center hover:shadow-md hover:-translate-y-0.5 transition-all">
              <span className="w-11 h-11 rounded-full flex items-center justify-center mx-auto mb-2 text-white" style={{ background: c.color }}>
                <c.Icon className="w-5 h-5" />
              </span>
              <p className="text-xs font-extrabold text-gray-900 leading-tight">{c.label}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">{catCount(c.root)} Stores</p>
            </Link>
          ))}
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
