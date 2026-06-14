import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getMasterSellers } from '@/lib/offers-server'
import Image from 'next/image'
import Link from 'next/link'
import {
  MapPin, ChevronDown, Search, Star, Store, Utensils, Cpu, Home, Sparkles,
  Shirt, Car, PawPrint, Layers, Tag, Truck, Shield, Headphones, Wallet, Play,
} from 'lucide-react'

export const revalidate = 60
export const metadata = { title: 'Retail Store Center · TTAI EMA' }

const CAT_META: { key: string; label: string; Icon: any; color: string }[] = [
  { key: 'all',        label: 'All Categories', Icon: Layers,   color: '#7c3aed' },
  { key: 'food',       label: 'Food & Beverage',Icon: Utensils, color: '#f97316' },
  { key: 'technology', label: 'Technology',      Icon: Cpu,      color: '#3b82f6' },
  { key: 'home',       label: 'Home & Living',   Icon: Home,     color: '#22c55e' },
  { key: 'beauty',     label: 'Beauty & Health', Icon: Sparkles, color: '#ec4899' },
  { key: 'fashion',    label: 'Fashion',         Icon: Shirt,    color: '#a855f7' },
  { key: 'automotive', label: 'Automotive',      Icon: Car,      color: '#ef4444' },
  { key: 'pet',        label: 'Pet Supplies',    Icon: PawPrint, color: '#eab308' },
]

async function safe<T>(q: any, fallback: T): Promise<T> {
  try { const { data } = await q; return (data ?? fallback) as T } catch { return fallback }
}
const money = (cents: number, cur = 'EUR') =>
  new Intl.NumberFormat('en-IE', { style: 'currency', currency: cur || 'EUR' }).format((cents ?? 0) / 100)

export default async function StoreCenterPage() {
  const supabase = createClient()

  const cats = await safe<any[]>(supabase.from('categories').select('id, name, slug, parent_id, sort_order').is('parent_id', null).order('sort_order'), [])
  const shops = await safe<any[]>((supabase.from('suppliers') as any)
    .select('id, legal_name, trade_name, logo_url, brand_slug, reliability_tier, tagline, description, country_id, countries(name)')
    .eq('status', 'ACTIVE').in('marketplace_context', ['retail', 'both']).limit(16), [])

  // Store counts per category.
  const prodRows = await safe<any[]>((supabase.from('products') as any)
    .select('supplier_id, category_id').eq('is_published', true).limit(4000), [])
  const supByCat: Record<string, Set<string>> = {}
  for (const r of prodRows) { if (r.category_id) (supByCat[r.category_id] ||= new Set()).add(r.supplier_id) }
  const totalStores = shops.length
  const sidebarCats = cats.slice(0, 8).map((c, i) => ({
    name: c.name, slug: c.slug, count: supByCat[c.id]?.size ?? 0,
    Icon: CAT_META[(i % (CAT_META.length - 1)) + 1].Icon, color: CAT_META[(i % (CAT_META.length - 1)) + 1].color,
  }))

  // ── Real price comparison — a master product sold by multiple stores ──
  let compare: { name: string; rows: { store: string; price: string; best: boolean }[] } | null = null
  try {
    const masterRows = await safe<any[]>((supabase.from('products') as any)
      .select('master_product_id, name').eq('is_published', true).not('master_product_id', 'is', null).limit(3000), [])
    const byMaster: Record<string, { n: number; name: string }> = {}
    for (const r of masterRows) {
      const m = byMaster[r.master_product_id] ||= { n: 0, name: r.name }
      m.n++
    }
    const top = Object.entries(byMaster).filter(([, v]) => v.n >= 2).sort((a, b) => b[1].n - a[1].n)[0]
    if (top) {
      const admin = createAdminClient()
      const sellers = await getMasterSellers(admin, top[0], { retail: true })
      if (sellers.length >= 2) {
        const min = Math.min(...sellers.map((s) => s.productPriceCents))
        compare = {
          name: top[1].name,
          rows: sellers.slice(0, 4).map((s) => ({
            store: s.supplierName, price: money(s.productPriceCents, s.currency),
            best: s.productPriceCents === min,
          })),
        }
      }
    }
  } catch { /* leave compare null */ }

  // ── Real "offers" — featured retail products with a price + store ──
  const offerProds = await safe<any[]>((supabase.from('products') as any)
    .select('name, retail_price_cents, price_cents, currency_code, suppliers!supplier_id(trade_name, legal_name)')
    .eq('is_published', true).in('marketplace_context', ['retail', 'both'])
    .order('created_at', { ascending: false }).limit(4), [])
  const offers = offerProds.map((p) => ({
    name: p.name,
    store: (p.suppliers as any)?.trade_name ?? (p.suppliers as any)?.legal_name ?? 'Store',
    price: money(p.retail_price_cents ?? p.price_cents, p.currency_code),
  }))

  // Map a keyword to a REAL category slug (falls back to /store if none matches).
  const storeHref = (kw: string) => {
    if (!kw) return '/store'
    const c = cats.find((x: any) => (x.name || '').toLowerCase().includes(kw))
    return c?.slug ? `/store?category=${c.slug}` : '/store'
  }

  return (
    <div className="min-h-screen bg-[#f3f4f6] text-gray-800">
      <div className="max-w-[1500px] mx-auto px-4 py-5 grid grid-cols-1 lg:grid-cols-[260px_1fr_300px] gap-5">

        {/* ══ LEFT ════════════════════════════════════════════════════════ */}
        <aside className="space-y-4">
          <div className="rounded-2xl bg-white border border-gray-200 shadow-sm p-4">
            <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-3">Explore Location</p>
            {[
              { label: 'Continent', value: 'Europe' }, { label: 'Country', value: 'Spain' },
              { label: 'Region', value: 'Andalucía' }, { label: 'City', value: 'Granada' },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between gap-2 rounded-xl bg-gray-50 border border-gray-100 px-3 py-2.5 mb-2">
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-wide text-gray-400">{row.label}</p>
                  <p className="text-sm font-bold text-gray-900 truncate">{row.value}</p>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
              </div>
            ))}
            <Link href="/store" className="block text-center mt-1 rounded-xl bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-sm font-bold py-2.5 transition-colors">Change Location</Link>
          </div>

          <div className="rounded-2xl bg-white border border-gray-200 shadow-sm p-4">
            <p className="text-[11px] text-gray-400 mb-1">You are in</p>
            <p className="text-xs text-gray-500">Europe › Spain › Andalucía ›</p>
            <p className="text-lg font-extrabold text-gray-900">Granada</p>
            <p className="flex items-center gap-1.5 text-xs text-[#7c3aed] font-semibold mt-1"><MapPin className="w-3.5 h-3.5" />Retail Store Center</p>
          </div>

          <div className="rounded-2xl bg-white border border-gray-200 shadow-sm p-4">
            <p className="font-extrabold text-gray-900 text-sm">Retail Store Center</p>
            <p className="text-xs text-gray-400 mb-3">Explore local shops in Granada.</p>
            <div className="space-y-0.5">
              <CatRow Icon={Layers} color="#7c3aed" name="All Categories" count={totalStores} href="/store" />
              {sidebarCats.map((c) => (
                <CatRow key={c.slug} Icon={c.Icon} color={c.color} name={c.name} count={c.count} href={`/store?category=${c.slug}`} />
              ))}
            </div>
            <Link href="/store" className="block text-center mt-3 rounded-xl border border-[#7c3aed]/30 text-[#7c3aed] text-xs font-bold py-2.5 hover:bg-[#7c3aed]/5 transition-colors">View All Categories</Link>
          </div>
        </aside>

        {/* ══ CENTER ══════════════════════════════════════════════════════ */}
        <main className="space-y-5 min-w-0">
          <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm bg-white">
            <div className="relative aspect-video max-h-[460px] bg-gradient-to-br from-[#1a1340] via-[#21184f] to-[#0f1629]">
              <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/store-center.png')" }} />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0e1a]/90 via-transparent to-[#0a0e1a]/30" />

              <div className="absolute top-0 left-0 right-0 p-6 sm:p-8">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight drop-shadow-lg">RETAIL STORE CENTER</h1>
                    <p className="text-slate-200 text-sm sm:text-base mt-1 max-w-xl drop-shadow">Discover local stores in Granada. Compare prices, read reviews and find the best offers near you.</p>
                  </div>
                  <button className="hidden sm:inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur border border-white/20 text-white text-xs font-bold px-4 py-2 hover:bg-white/20 transition-colors flex-shrink-0">
                    <Play className="w-3.5 h-3.5" />How It Works
                  </button>
                </div>
              </div>

              {[
                { label: 'Food & Beverage', kw: 'food',    color: '#f97316', top: '36%', left: '13%' },
                { label: 'Technology',      kw: 'tech',    color: '#3b82f6', top: '32%', left: '32%' },
                { label: 'Home & Living',   kw: 'home',    color: '#22c55e', top: '32%', left: '67%' },
                { label: 'Beauty & Health', kw: 'beaut',   color: '#ec4899', top: '36%', left: '87%' },
                { label: 'Fashion',         kw: 'fashion', color: '#a855f7', top: '70%', left: '15%' },
                { label: 'Automotive',      kw: 'auto',    color: '#ef4444', top: '80%', left: '37%' },
                { label: 'Pet Supplies',    kw: 'pet',     color: '#eab308', top: '73%', left: '63%' },
                { label: 'Services',        kw: 'service', color: '#14b8a6', top: '75%', left: '87%' },
              ].map((pin) => (
                <Link key={pin.label} href={storeHref(pin.kw)}
                  className="group absolute -translate-x-1/2 -translate-y-1/2 hidden md:flex items-center gap-1.5 transition-transform duration-200 hover:scale-[1.18] hover:z-20"
                  style={{ top: pin.top, left: pin.left }}>
                  <span className="relative w-6 h-6 rounded-full flex items-center justify-center shadow-lg ring-2 ring-white/50 group-hover:ring-white" style={{ background: pin.color }}>
                    <span className="absolute inset-0 rounded-full animate-ping opacity-30" style={{ background: pin.color }} />
                    <MapPin className="w-3.5 h-3.5 text-white relative" />
                  </span>
                  <span className="text-[11px] font-extrabold text-white bg-black/50 group-hover:bg-black/80 backdrop-blur px-2 py-0.5 rounded-md whitespace-nowrap transition-colors shadow">{pin.label}</span>
                </Link>
              ))}
            </div>

            <div className="flex gap-2 overflow-x-auto p-3 bg-white border-t border-gray-100" style={{ scrollbarWidth: 'none' }}>
              {CAT_META.map((c, i) => (
                <Link key={c.key} href={c.key === 'all' ? '/store' : storeHref(c.key)}
                  className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3.5 py-2 text-xs font-bold transition-all flex-shrink-0 hover:scale-105 ${
                    i === 0 ? 'bg-[#7c3aed] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}>
                  <c.Icon className="w-3.5 h-3.5" style={{ color: i === 0 ? '#fff' : c.color }} />{c.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Top stores */}
          <div className="rounded-2xl bg-white border border-gray-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-extrabold text-gray-900 tracking-tight">TOP RETAIL STORES IN GRANADA</h2>
              <Link href="/store?view=shops" className="text-xs font-bold text-[#7c3aed] hover:underline">View All Stores</Link>
            </div>
            {shops.length === 0 ? (
              <div className="text-center py-12 text-gray-400"><Store className="w-10 h-10 mx-auto mb-3 opacity-30" /><p className="text-sm">No retail stores yet in this area.</p></div>
            ) : (
              <div className="flex gap-4 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
                {shops.map((s) => {
                  const name = s.trade_name ?? s.legal_name ?? 'Store'
                  const gold = s.reliability_tier === 'GOLD'
                  return (
                    <div key={s.id} className="w-[230px] flex-shrink-0 rounded-2xl bg-white border border-gray-200 overflow-hidden hover:shadow-xl hover:-translate-y-1 hover:border-[#7c3aed]/30 transition-all duration-300">
                      <div className="relative h-28 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                        {s.logo_url
                          ? <Image src={s.logo_url} alt={name} width={230} height={112} className="object-cover w-full h-full" />
                          : <span className="text-3xl font-black text-white/80">{name[0]?.toUpperCase()}</span>}
                        <span className="absolute top-2 left-2 text-[10px] font-extrabold text-white bg-black/50 px-2 py-0.5 rounded">{(s.countries as any)?.name ?? 'Local'}</span>
                      </div>
                      <div className="p-3.5">
                        <p className="font-extrabold text-gray-900 text-sm truncate">{name}</p>
                        <p className="text-xs text-gray-400 truncate mb-2">{s.tagline ?? s.description ?? 'Retail store'}</p>
                        <div className="flex items-center justify-between mb-3">
                          <span className="flex items-center gap-1 text-xs font-bold text-amber-500"><Star className="w-3.5 h-3.5 fill-amber-400" />{gold ? 'Gold' : 'Verified'}</span>
                          <span className="text-xs font-bold text-green-600">Open Now</span>
                        </div>
                        <Link href={s.brand_slug ? `/brand/${s.brand_slug}` : `/store?supplier=${s.id}`}
                          className="block text-center rounded-lg bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-xs font-bold py-2 transition-colors">View Store</Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </main>

        {/* ══ RIGHT ═══════════════════════════════════════════════════════ */}
        <aside className="space-y-4">
          <form action="/store" className="rounded-2xl bg-white border border-gray-200 shadow-sm p-4">
            <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-3">Find a Store</p>
            <div className="relative mb-2">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input name="q" placeholder="Search stores, products…" className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#7c3aed]/50" />
            </div>
            <input type="hidden" name="view" value="shops" />
            <button className="w-full rounded-xl bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-sm font-bold py-2.5 transition-colors">Search</button>
          </form>

          <div className="rounded-2xl bg-white border border-gray-200 shadow-sm p-4">
            <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-1.5"><Wallet className="w-3.5 h-3.5" />Compare Prices Near You</p>
            {compare ? (
              <>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-9 h-9 rounded-lg bg-[#7c3aed]/10 flex items-center justify-center"><Tag className="w-4 h-4 text-[#7c3aed]" /></div>
                  <div className="min-w-0"><p className="text-sm font-bold text-gray-900 truncate">{compare.name}</p><p className="text-[11px] text-gray-400">Same product, different stores</p></div>
                </div>
                {compare.rows.map((r) => (
                  <div key={r.store} className="flex items-center justify-between py-2 border-t border-gray-100 text-sm">
                    <span className="text-gray-600 truncate pr-2">{r.store}</span>
                    <span className={`font-bold flex-shrink-0 ${r.best ? 'text-green-600' : 'text-gray-900'}`}>{r.price}{r.best && <span className="ml-1.5 text-[9px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded">BEST</span>}</span>
                  </div>
                ))}
                <Link href="/marketplace" className="block text-center mt-3 text-xs font-bold text-[#7c3aed] hover:underline">View All Comparison</Link>
              </>
            ) : (
              <p className="text-sm text-gray-400 py-4 text-center">Price comparison appears when a product is sold by multiple stores.</p>
            )}
          </div>

          <div className="rounded-2xl bg-white border border-gray-200 shadow-sm p-4">
            <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-3">Featured Products</p>
            {offers.length === 0 ? (
              <p className="text-sm text-gray-400 py-3 text-center">No products yet.</p>
            ) : offers.map((o) => (
              <div key={o.name + o.store} className="flex items-center justify-between gap-2 rounded-xl bg-gray-50 border border-gray-100 p-3 mb-2">
                <div className="min-w-0"><p className="text-sm font-bold text-gray-900 truncate">{o.name}</p><p className="text-[11px] text-gray-400 truncate">{o.store}</p></div>
                <p className="text-sm font-extrabold text-[#7c3aed] flex-shrink-0">{o.price}</p>
              </div>
            ))}
            <Link href="/store" className="block text-center mt-1 rounded-xl border border-gray-200 text-gray-600 text-xs font-bold py-2.5 hover:bg-gray-50 transition-colors">View All</Link>
          </div>
        </aside>
      </div>

      {/* ══ Trust bar ════════════════════════════════════════════════════ */}
      <div className="border-t border-gray-200 bg-white">
        <div className="max-w-[1500px] mx-auto px-4 py-5 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { Icon: MapPin, t: 'Local Stores', s: 'Support your local business' },
            { Icon: Wallet, t: 'Best Prices', s: 'Compare and save more' },
            { Icon: Truck, t: 'Fast Delivery', s: 'Quick delivery near you' },
            { Icon: Shield, t: 'Safe Shopping', s: 'Secure and protected' },
            { Icon: Star, t: 'Real Reviews', s: 'Ratings from real customers' },
            { Icon: Headphones, t: '24/7 Support', s: 'We are here for you' },
          ].map((x) => (
            <div key={x.t} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#7c3aed]/10 flex items-center justify-center flex-shrink-0"><x.Icon className="w-5 h-5 text-[#7c3aed]" /></div>
              <div><p className="text-sm font-bold text-gray-900">{x.t}</p><p className="text-[11px] text-gray-400">{x.s}</p></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function CatRow({ Icon, color, name, count, href }: { Icon: any; color: string; name: string; count: number; href: string }) {
  return (
    <Link href={href} className="flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 hover:bg-gray-50 transition-colors group">
      <span className="flex items-center gap-2.5 min-w-0">
        <Icon className="w-4 h-4 flex-shrink-0" style={{ color }} />
        <span className="text-sm font-semibold text-gray-700 group-hover:text-gray-900 truncate">{name}</span>
      </span>
      <span className="text-[11px] font-bold text-gray-400 flex-shrink-0">{count} Stores</span>
    </Link>
  )
}
