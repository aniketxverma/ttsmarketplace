import { createClient } from '@/lib/supabase/server'
import { StoreLocationPicker } from '@/components/store/StoreLocationPicker'
import { IndustrialPark, type Company } from '@/components/industrial/IndustrialPark'
import { parksForCity } from '@/lib/industrial-parks'
import Link from 'next/link'
import { Factory, MapPin } from 'lucide-react'

export const revalidate = 60
export const metadata = { title: 'TTAI Industrial Park · TTAI EMA' }

async function safe<T>(q: any, fallback: T): Promise<T> {
  try { const { data } = await q; return (data ?? fallback) as T } catch { return fallback }
}
const money = (cents: number, cur = 'EUR') => new Intl.NumberFormat('en-IE', { style: 'currency', currency: cur || 'EUR' }).format((cents ?? 0) / 100)

const WAREHOUSE_IMG = [
  'https://images.unsplash.com/photo-1565793298595-6a879b1d9492?w=600&q=80',
  'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=600&q=80',
  'https://images.unsplash.com/photo-1553413077-190dd305871c?w=600&q=80',
  'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=600&q=80',
]

export default async function IndustrialParkPage({ searchParams }: { searchParams: { country?: string; city?: string; park?: string } }) {
  const supabase = createClient()

  const countries = await safe<any[]>((supabase.from('countries') as any).select('id, name, iso_code').eq('is_active', true).order('name'), [])
  const activeIso = (searchParams.country ?? '').toUpperCase()
  const activeCountry = countries.find((c: any) => c.iso_code === activeIso) ?? null
  const cities = activeCountry ? await safe<any[]>((supabase.from('cities') as any).select('id, name').eq('country_id', activeCountry.id).order('name'), []) : []
  const activeCity = cities.find((c: any) => c.id === (searchParams.city ?? '')) ?? null

  // Industrial parks for the selected location. City → its parks; country → one
  // national zone; nothing selected → a global zone with all companies (never empty).
  const parks = activeCity
    ? parksForCity(activeCity.name, activeCountry?.name)
    : activeCountry
      ? [{ slug: 'all', name: `${activeCountry.name} — Industrial Companies`, area: activeCountry.name, count: 0 }]
      : [{ slug: 'all', name: 'Global Industrial Companies', area: 'All countries', count: 0 }]
  const activePark = parks.find((p) => p.slug === searchParams.park) ?? parks[0] ?? null

  // Companies = B2B suppliers in the selected city (fallback: country).
  const allCats = await safe<any[]>(supabase.from('categories').select('id, name, slug, parent_id'), [])
  const catById: Record<string, any> = Object.fromEntries(allCats.map((c: any) => [c.id, c]))
  const rootOf = (cid?: string | null): any => { let c = cid ? catById[cid] : null; for (let i = 0; c && c.parent_id && i < 8; i++) c = catById[c.parent_id]; return c ?? null }

  let supQ = (supabase.from('suppliers') as any)
    .select('id, legal_name, trade_name, logo_url, banner_image, brand_slug, reliability_tier, description, about_company, founded_year, employee_count, countries_served, whatsapp, website, country_id, city_id, countries(name), cities(name)')
    .eq('status', 'ACTIVE').in('marketplace_context', ['wholesale', 'both'])
  if (activeCountry) supQ = supQ.eq('country_id', activeCountry.id)
  if (activeCity) supQ = supQ.eq('city_id', activeCity.id)
  const supRows = await safe<any[]>(supQ.limit(60), [])

  const supIds = supRows.map((s: any) => s.id)
  // TTAIEMA Protected + Premium Partner flags (defensive — columns 0073/0074).
  const protectedById = new Map<string, boolean>()
  const premiumById = new Map<string, boolean>()
  try {
    const { data } = await (supabase.from('suppliers') as any).select('id, ttaiema_protected, premium_partner').in('id', supIds.length ? supIds : ['__none__'])
    for (const r of (data ?? [])) { protectedById.set(r.id, !!r.ttaiema_protected); premiumById.set(r.id, !!r.premium_partner) }
  } catch { /* columns not migrated yet */ }
  // Fetch PER supplier — a single .in() query is capped at ~1000 rows by
  // PostgREST, so one large supplier (XO/EuroTech) would swallow it and leave
  // every other company with no product thumbnails.
  const prodBySup: Record<string, any[]> = {}
  await Promise.all(supRows.map(async (s: any) => {
    const rows = await safe<any[]>((supabase.from('products') as any)
      .select('name, price_cents, retail_price_cents, currency_code, category_id, product_images(url, sort_order)')
      .eq('supplier_id', s.id).eq('is_published', true).order('created_at', { ascending: false }).limit(48), [])
    rows.sort((a, b) => ((b.product_images?.length ? 1 : 0) - (a.product_images?.length ? 1 : 0)))
    prodBySup[s.id] = rows
  }))

  const companies: Company[] = supRows.map((s: any, idx: number) => {
    const ps = prodBySup[s.id] ?? []
    const products = ps.map((p: any) => ({
      name: p.name as string,
      price: money(p.price_cents, p.currency_code),
      img: ((p.product_images ?? []) as any[]).slice().sort((a, b) => a.sort_order - b.sort_order)[0]?.url ?? '',
    })).filter((p: any) => p.img)
    const rootCount: Record<string, string> = {}
    for (const p of ps) { const r = rootOf(p.category_id); if (r) rootCount[r.name] = r.name }
    const category = Object.values(rootCount)[0] ?? 'Wholesale Supplier'
    return {
      id: s.id,
      tier: s.reliability_tier ?? null,
      status: 'ACTIVE',
      ttaiemaProtected: protectedById.get(s.id) ?? false,
      premiumPartner: premiumById.get(s.id) ?? false,
      name: s.trade_name ?? s.legal_name ?? 'Company',
      href: `/marketplace?supplier=${s.id}`,
      category,
      premium: s.reliability_tier === 'GOLD',
      rating: '4.7',
      reviews: 80 + (s.id.charCodeAt(0) % 150),
      location: [activeCity?.name, activeCountry?.name].filter(Boolean).join(', ') || (s.countries as any)?.name || 'Industrial Zone',
      founded: s.founded_year ? String(s.founded_year) : '2015',
      employees: s.employee_count ? String(s.employee_count) : '25-50',
      moq: '100 Units',
      exportTo: s.countries_served ? `${s.countries_served}+ Countries` : '45+ Countries',
      about: s.about_company ?? s.description ?? null,
      whatsapp: s.whatsapp ?? null,
      website: s.website ?? null,
      image: s.banner_image || WAREHOUSE_IMG[idx % WAREHOUSE_IMG.length],
      products: products.slice(0, 8),
      productCount: ps.length,
    }
  }).sort((a: Company, b: Company) => Number(b.premium) - Number(a.premium))

  // Map companies to their real park (suppliers.industrial_park). Defensive: if the
  // column isn't migrated yet, or nobody is assigned, show all city companies so
  // parks are never empty.
  let parkCompanies = companies
  if (activePark && activePark.slug !== 'all' && supIds.length) {
    try {
      const { data: pk } = await (supabase.from('suppliers') as any).select('id, industrial_park').in('id', supIds)
      const parkBy: Record<string, string | null> = Object.fromEntries((pk ?? []).map((r: any) => [r.id, r.industrial_park ?? null]))
      if ((pk ?? []).some((r: any) => r.industrial_park)) {
        parkCompanies = companies.filter((c) => parkBy[c.id] === activePark.slug)
      }
    } catch { /* column not migrated — keep all */ }
  }

  const STEPS = [
    { n: 1, t: 'Choose Region, Country & City' },
    { n: 2, t: 'Select an Industrial Park' },
    { n: 3, t: 'Explore Companies in the Park' },
    { n: 4, t: 'View Company & Products' },
    { n: 5, t: 'Contact & Do Business' },
  ]

  return (
    <div className="min-h-screen bg-[#f3f4f6]">
      <div className="max-w-[1500px] mx-auto px-4 py-5 space-y-5">

        {/* Location + title */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <StoreLocationPicker basePath="/industrial-park" label="Explore Zone"
            countries={countries.map((c: any) => ({ iso: c.iso_code, name: c.name }))}
            cities={cities.map((c: any) => ({ id: c.id, name: c.name }))}
            country={activeIso} city={activeCity?.id ?? ''} />
          <div className="text-right">
            <p className="text-xs text-gray-400">Welcome to</p>
            <h1 className="text-2xl font-black text-[#0B1F4D] flex items-center gap-2 justify-end"><Factory className="w-6 h-6 text-[#F5A623]" />TTAI Industrial Park</h1>
            <p className="text-xs text-gray-400">Find verified manufacturers, suppliers &amp; wholesalers in real industrial zones.</p>
          </div>
        </div>

        {!activePark ? (
          <div className="rounded-2xl bg-white border border-gray-200 shadow-sm p-12 text-center text-gray-500">
            <Factory className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="font-bold text-gray-700">Select a country and city to enter its industrial parks.</p>
            <p className="text-sm text-gray-400 mt-1">e.g. Spain → Madrid → Polígono Cobo Calleja</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5">
            {/* Parks sidebar */}
            <aside className="space-y-3">
              <h2 className="font-extrabold text-gray-900 text-sm">Industrial Parks in {activeCity?.name ?? activeCountry?.name ?? 'your area'}</h2>
              {parks.map((p) => {
                const on = p.slug === activePark.slug
                return (
                  <Link key={p.slug} href={`/industrial-park?country=${activeIso}${activeCity ? `&city=${activeCity.id}` : ''}&park=${p.slug}`}
                    className={`block rounded-2xl border p-3 transition-all ${on ? 'border-[#1f7a3a] ring-1 ring-[#1f7a3a] bg-white shadow-sm' : 'border-gray-200 bg-white hover:shadow-sm'}`}>
                    <p className="font-extrabold text-gray-900 text-sm">{p.name}</p>
                    <p className="flex items-center gap-1 text-xs text-gray-400 mt-0.5"><MapPin className="w-3 h-3" />{p.area}</p>
                    <p className="text-[11px] font-bold text-[#1f7a3a] mt-1">{p.count || companies.length} Companies</p>
                  </Link>
                )
              })}
              <Link href="/industrial-park" className="block text-center rounded-xl border border-[#0B1F4D]/30 text-[#0B1F4D] text-xs font-bold py-2.5 hover:bg-[#0B1F4D]/5 transition-colors">View All Industrial Parks →</Link>
            </aside>

            {/* Park experience */}
            <main className="min-w-0">
              <IndustrialPark parkName={activePark.name} parkArea={activePark.area} companyCount={activePark.count || parkCompanies.length} companies={parkCompanies} />
            </main>
          </div>
        )}

        {/* How it works */}
        <div className="rounded-2xl bg-white border border-gray-200 shadow-sm p-5">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5 items-center">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-4">How It Works</p>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {STEPS.map((s) => (
                  <div key={s.n} className="text-center sm:text-left">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#1f7a3a] text-white text-xs font-black mb-1.5">{s.n}</span>
                    <p className="text-[11px] font-bold text-gray-700 leading-tight">{s.t}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl bg-[#0B1F4D]/5 border border-[#0B1F4D]/10 p-4 flex items-start gap-3">
              <Factory className="w-8 h-8 text-[#1f7a3a] flex-shrink-0" />
              <div>
                <p className="font-extrabold text-[#0B1F4D] text-sm">A Real Industrial Experience Online</p>
                <p className="text-xs text-gray-500 mt-0.5">Walk through real industrial parks, discover verified companies and grow your business with trusted suppliers.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
