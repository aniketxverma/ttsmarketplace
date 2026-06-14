import { createClient } from '@/lib/supabase/server'
import { ProductCard } from '@/components/marketplace/ProductCard'
import { FamilyCard } from '@/components/marketplace/FamilyCard'
import { groupIntoFamilies } from '@/lib/product-family'
import { dedupeProductsByMaster } from '@/lib/offers-server'
import { localizeCategoryNames } from '@/lib/i18n/categories'
import { getLocale } from '@/lib/i18n/server'
import { ProductGrid } from '@/components/marketplace/ProductGrid'
import { CategoryNav } from '@/components/marketplace/CategoryNav'
import { SearchBar } from '@/components/marketplace/SearchBar'
import { Pagination } from '@/components/marketplace/Pagination'
import { RetailLocationBar } from '@/components/store/RetailLocationBar'
import { ShopCard, type ShopCardData } from '@/components/marketplace/ShopCard'
import { getMarketplaceOpen } from '@/lib/marketplace-phase'
import { OpeningSoon } from '@/components/OpeningSoon'
import Link from 'next/link'
import { ShoppingBag, Zap, Shield, Truck, Star, Package, Store } from 'lucide-react'
import type { Category } from '@/types/domain'

const PAGE_SIZE = 24

export const metadata = {
  title: 'Online Store — Shop Direct from Suppliers · TTAI EMA',
  description: 'Browse and buy products directly from verified suppliers. Retail and direct-to-consumer products with guaranteed quality.',
}

export default async function StorePage({
  searchParams,
}: {
  searchParams: { category?: string; q?: string; page?: string; supplier?: string
    market?: string; country?: string; view?: string }
}) {
  const supabase = createClient()

  // Pre-Opening: the public retail store opens on launch day (admins preview; a
  // direct supplier link still works so shops can be shared/previewed).
  if (!searchParams.supplier && !(await getMarketplaceOpen())) {
    const { data: { user } } = await supabase.auth.getUser()
    let role: string | null = null
    if (user) { const { data } = await (supabase.from('profiles') as any).select('role').eq('id', user.id).single(); role = data?.role ?? null }
    if (role !== 'admin') return <OpeningSoon />
  }

  const page = parseInt(searchParams.page ?? '1')
  const activeView: 'products' | 'shops' = searchParams.view === 'shops' ? 'shops' : 'products'

  // ── Retail location filter (Phases 6, 9) — Region → Country ──
  const activeMarket = searchParams.market ?? ''
  const activeCountryIso = (searchParams.country ?? '').toUpperCase()

  // Filter to sellers in the chosen country (products inherit the seller's country).
  let localSupplierIds: string[] | null = null
  if (!searchParams.supplier && activeCountryIso) {
    const { data: c } = await (supabase.from('countries') as any).select('id').eq('iso_code', activeCountryIso).maybeSingle()
    const countryId = c?.id ?? '00000000-0000-0000-0000-000000000000'
    let rows: { id: string }[] = []
    try {
      const { data } = await (supabase.from('suppliers') as any).select('id').eq('country_id', countryId).neq('status', 'SUSPENDED')
      rows = (data ?? []) as any[]
    } catch { /* ignore */ }
    localSupplierIds = Array.from(new Set(rows.map((r) => r.id)))
    if (localSupplierIds.length === 0) localSupplierIds = ['00000000-0000-0000-0000-000000000000']
  }

  const categoriesRes = await supabase.from('categories').select('*').order('sort_order')
  const allCats = await localizeCategoryNames(categoriesRes.data ?? [], await getLocale())

  // Build category tree (same as marketplace)
  const roots = allCats.filter((c) => c.parent_id === null) as Category[]
  const childMap: Record<string, Category[]> = {}
  allCats.forEach((c) => {
    if (c.parent_id) {
      if (!childMap[c.parent_id]) childMap[c.parent_id] = []
      childMap[c.parent_id].push(c as Category)
    }
  })
  const categoryTree = roots.map((r) => ({ ...r, children: childMap[r.id] ?? [] }))

  // Products. When scoped to a single supplier (their own online shop), show ALL their
  // published products — the "online shop" sells the same catalogue by piece, so we don't
  // restrict by marketplace_context. Global browse keeps the retail/both filter.
  let productQuery = (supabase
    .from('products') as any)
    .select(
      `id, name, slug, price_cents, retail_price_cents, currency_code, min_order_qty, marketplace_context, vat_rate,
      supplier_id, category_id, product_line,
      suppliers!supplier_id!inner(legal_name, trade_name, reliability_tier, status),
      categories(name, slug),
      product_images(url, sort_order)`
    )
    .eq('is_published', true)

  if (searchParams.supplier) {
    productQuery = productQuery
      .eq('supplier_id', searchParams.supplier)
      .neq('suppliers.status', 'SUSPENDED')
  } else {
    productQuery = productQuery
      .eq('suppliers.status', 'ACTIVE')
      .in('marketplace_context', ['retail', 'both'])
      .neq('retail_available', false) // exclude products a seller turned off for retail
  }

  // Local retail filter — restrict to sellers in the chosen area.
  if (localSupplierIds) productQuery = productQuery.in('supplier_id', localSupplierIds)

  if (searchParams.category) {
    const cat = allCats.find((c) => c.slug === searchParams.category)
    if (cat) productQuery = productQuery.eq('category_id', cat.id)
  }

  if (searchParams.q) {
    productQuery = productQuery.ilike('name', `%${searchParams.q}%`)
  }

  const { data: allProducts } = await productQuery
    .order('created_at', { ascending: false })
    .limit(500)

  // One product, many suppliers — collapse offers sharing a master into one card.
  const deduped = await dedupeProductsByMaster(supabase, (allProducts ?? []) as any[])
  const families = groupIntoFamilies(deduped as any[])

  // Category-wise ordering — group products by category (root then subcategory).
  const catById: Record<string, any> = Object.fromEntries((allCats as any[]).map((c) => [c.id, c]))
  const ordKey = (cid: string) => {
    const c = catById[cid]; if (!c) return 9_000_000
    const root = c.parent_id ? catById[c.parent_id] : c
    return (root?.sort_order ?? 8000) * 1000 + (c.parent_id ? (c.sort_order ?? 0) : 0)
  }
  families.sort((a, b) =>
    ordKey((a.representative as any)?.category_id) - ordKey((b.representative as any)?.category_id) ||
    String((a.representative as any)?.name).localeCompare(String((b.representative as any)?.name)))

  const count = (allProducts ?? []).length
  const totalPages = Math.ceil(families.length / PAGE_SIZE)
  const from = (page - 1) * PAGE_SIZE
  const pageFamilies = families.slice(from, from + PAGE_SIZE)

  // ── Retail SHOPS view — verified sellers whose shop type is retail or both ──
  let shops: ShopCardData[] = []
  if (activeView === 'shops') {
    const safe = async (q: any) => { try { const { data } = await q; return (data ?? []) as any[] } catch { return [] } }
    let supQ = (supabase.from('suppliers') as any)
      .select('id, legal_name, trade_name, logo_url, brand_slug, reliability_tier, tagline, description, business_type, country_id, countries(name)')
      .eq('status', 'ACTIVE').in('marketplace_context', ['retail', 'both'])
    if (localSupplierIds) supQ = supQ.in('id', localSupplierIds)
    let list = await safe(supQ.limit(200))
    // fall back without business_type if that column isn't migrated
    if (list.length === 0) list = await safe((supabase.from('suppliers') as any)
      .select('id, legal_name, trade_name, logo_url, brand_slug, reliability_tier, tagline, description, country_id, countries(name)')
      .eq('status', 'ACTIVE').in('marketplace_context', ['retail', 'both']).limit(200))
    if (searchParams.category) {
      const cat = allCats.find((c) => c.slug === searchParams.category)
      if (cat) {
        const catIds = [cat.id, ...allCats.filter((c) => c.parent_id === cat.id).map((c) => c.id)]
        const pr = await safe((supabase.from('products') as any).select('supplier_id').eq('is_published', true).in('category_id', catIds))
        const allowed = new Set(pr.map((r: any) => r.supplier_id))
        list = list.filter((s: any) => allowed.has(s.id))
      }
    }
    shops = list.map((s: any) => ({
      id: s.id, legal_name: s.legal_name, trade_name: s.trade_name, logo_url: s.logo_url,
      brand_slug: s.brand_slug, reliability_tier: s.reliability_tier,
      tagline: s.tagline ?? s.description ?? null,
      country_name: (s.countries as any)?.name ?? null,
      business_type: s.business_type ?? 'retail',
    }))
  }

  const mkViewHref = (view: 'products' | 'shops') => {
    const p = new URLSearchParams()
    if (searchParams.category) p.set('category', searchParams.category)
    if (searchParams.q) p.set('q', searchParams.q)
    if (activeMarket) p.set('market', activeMarket)
    if (activeCountryIso) p.set('country', activeCountryIso)
    if (view === 'shops') p.set('view', 'shops')
    const qs = p.toString()
    return qs ? `/store?${qs}` : '/store'
  }

  return (
    <div className="min-h-screen bg-background">

      {/* ── Branded hero ─────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-purple-700 via-purple-800 to-violet-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.06]"
          style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-12 sm:py-16 relative">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white/80 text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full mb-3">
                <Zap className="w-3 h-3 text-[#F5A623]" />Direct from Suppliers
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight mb-1">
                TTAI Retail Store
              </h1>
              <p className="text-white/60 text-sm">
                {count ?? 0} products · shop direct from verified suppliers
              </p>
            </div>
            <Link href="/marketplace"
              className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-white/20 transition-colors self-start sm:self-auto">
              <ShoppingBag className="w-4 h-4" />Wholesale Marketplace →
            </Link>
          </div>

          {/* Trust chips */}
          <div className="flex flex-wrap gap-4 mt-6">
            {[
              { Icon: Shield, text: 'Verified Suppliers' },
              { Icon: Truck,  text: 'Fast Shipping'      },
              { Icon: Star,   text: 'Quality Guaranteed' },
            ].map(({ Icon, text }) => (
              <div key={text} className="flex items-center gap-1.5 text-xs text-white/60 font-semibold">
                <Icon className="w-3.5 h-3.5" />{text}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Product listing — identical structure to marketplace ──────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8">

        {/* Search bar */}
        <div className="mb-6">
          <SearchBar defaultValue={searchParams.q} />
        </div>

        {/* Local commerce selector — Region → Country */}
        {!searchParams.supplier && (
          <RetailLocationBar activeMarket={activeMarket} activeCountry={activeCountryIso} />
        )}

        {/* Products | Shops toggle */}
        {!searchParams.supplier && (
          <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 w-max mb-6">
            {([{ id: 'products', label: 'Products', Icon: Package }, { id: 'shops', label: 'Shops', Icon: Store }] as const).map(({ id, label, Icon }) => (
              <Link key={id} href={mkViewHref(id)}
                className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold transition-colors ${activeView === id ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-500 hover:text-purple-700'}`}>
                <Icon className="w-4 h-4" /> {label}
              </Link>
            ))}
          </div>
        )}

        {activeView === 'shops' ? (
          shops.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {shops.map((s) => <ShopCard key={s.id} shop={s} />)}
            </div>
          ) : (
            <div className="text-center py-20 text-muted-foreground">
              <Store className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p className="text-lg font-semibold">No shops found</p>
              <p className="text-sm mt-1">Try a different category or area</p>
            </div>
          )
        ) : (
        <div className="flex gap-8">
          {/* Category sidebar */}
          <aside className="hidden md:block w-48 flex-shrink-0">
            <CategoryNav categories={categoryTree} />
          </aside>

          {/* Product grid */}
          <div className="flex-1 min-w-0">
            {pageFamilies.length > 0 ? (
              <>
                <p className="text-sm text-muted-foreground mb-4">
                  {count} product{count !== 1 ? 's' : ''}
                  {searchParams.q && <> for &quot;<strong>{searchParams.q}</strong>&quot;</>}
                  {searchParams.category && (() => {
                    const cat = allCats.find(c => c.slug === searchParams.category)
                    return cat ? <> in <strong>{cat.name}</strong></> : null
                  })()}
                </p>
                <ProductGrid>
                  {pageFamilies.map((fam) => {
                    if (fam.members.length > 1) {
                      return <FamilyCard key={fam.key} family={fam} retail />
                    }
                    const p = fam.representative as any
                    const supplier = p.suppliers as {
                      legal_name: string; trade_name: string | null; reliability_tier: import('@/types/domain').ReliabilityTier
                    }
                    const images = p.product_images as { url: string; sort_order: number }[]
                    const mainImg = images?.sort((a, b) => a.sort_order - b.sort_order)[0]?.url
                    const href = `/product/${p.slug ?? p.id}`
                    return (
                      <ProductCard
                        key={p.id}
                        product={p as Parameters<typeof ProductCard>[0]['product']}
                        supplier={supplier}
                        mainImageUrl={mainImg}
                        href={href}
                        retail
                        offerCount={p._offerCount ?? 0}
                      />
                    )
                  })}
                </ProductGrid>
                <Pagination page={page} totalPages={totalPages} />
              </>
            ) : (
              <div className="text-center py-20 text-muted-foreground">
                <ShoppingBag className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p className="text-lg font-semibold">No products found</p>
                <p className="text-sm mt-1">Try adjusting your filters or search query</p>
                {(searchParams.q || searchParams.category) && (
                  <Link href="/store" className="mt-4 inline-block text-sm font-bold text-purple-600 hover:underline">
                    Clear filters
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
        )}
      </div>
    </div>
  )
}
