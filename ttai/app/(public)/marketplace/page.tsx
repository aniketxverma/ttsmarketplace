import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ProductCard } from '@/components/marketplace/ProductCard'
import { ProductGrid } from '@/components/marketplace/ProductGrid'
import { CategoryNav } from '@/components/marketplace/CategoryNav'
import { SearchBar } from '@/components/marketplace/SearchBar'
import { Pagination } from '@/components/marketplace/Pagination'
import { PromotionBanner } from '@/components/marketplace/PromotionBanner'
import { SupplierMiniCard, type MiniSupplier } from '@/components/marketplace/SupplierMiniCard'
import { ShoppingChannels } from '@/components/marketplace/ShoppingChannels'
import { REGIONS } from '@/lib/regions-data'
import type { Category } from '@/types/domain'

const PAGE_SIZE = 24

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: { category?: string; q?: string; page?: string; region?: string }
}) {
  const supabase = createClient()
  const page = parseInt(searchParams.page || '1')
  const activeRegion = searchParams.region ?? null

  const [categoriesRes, promotionsRes] = await Promise.all([
    supabase.from('categories').select('*').order('sort_order'),
    supabase
      .from('broker_promotions')
      .select('id, custom_pitch, products(id, name, product_images(url, sort_order)), brokers(legal_name)')
      .eq('is_active', true)
      .gt('ends_at', new Date().toISOString())
      .order('promotion_slot', { ascending: true })
      .limit(3),
  ])

  const allCats = categoriesRes.data ?? []
  const roots = allCats.filter((c) => c.parent_id === null) as Category[]
  const childMap: Record<string, Category[]> = {}
  allCats.forEach((c) => {
    if (c.parent_id) {
      if (!childMap[c.parent_id]) childMap[c.parent_id] = []
      childMap[c.parent_id].push(c as Category)
    }
  })
  const categoryTree = roots.map((r) => ({ ...r, children: childMap[r.id] ?? [] }))

  let productQuery = supabase
    .from('products')
    .select(
      `id, name, slug, price_cents, currency_code, min_order_qty, marketplace_context, vat_rate,
      suppliers!inner(legal_name, trade_name, reliability_tier, status),
      product_images(url, sort_order)`,
      { count: 'exact' }
    )
    .eq('is_published', true)
    .eq('suppliers.status', 'ACTIVE')
    .in('marketplace_context', ['wholesale', 'both'])

  if (searchParams.category) {
    const cat = allCats.find((c) => c.slug === searchParams.category)
    if (cat) {
      // Include the category itself + its subcategories so a main industry shows all its products
      const childIds = allCats.filter((c) => c.parent_id === cat.id).map((c) => c.id)
      productQuery = productQuery.in('category_id', [cat.id, ...childIds])
    } else {
      // Unknown category slug (e.g. taxonomy migration not yet run) → show no products
      // rather than silently showing everything.
      productQuery = productQuery.eq('category_id', '00000000-0000-0000-0000-000000000000')
    }
  }

  if (searchParams.q) {
    productQuery = productQuery.ilike('name', `%${searchParams.q}%`)
  }

  // Region filter — products from suppliers who serve the chosen region (automatic placement).
  // A country key like "europe:spain" must ALSO match suppliers who serve the whole region
  // ("europe") — serving all of Europe means serving Spain too.
  if (activeRegion) {
    const parentRegion = activeRegion.includes(':') ? activeRegion.split(':')[0] : null
    const ors = [`region_key.eq.${activeRegion}`, `region_key.like.${activeRegion}:%`]
    if (parentRegion) ors.push(`region_key.eq.${parentRegion}`)
    const { data: srRows } = await (supabase.from('supplier_regions') as any)
      .select('supplier_id')
      .or(ors.join(','))
    const ids = Array.from(new Set((srRows ?? []).map((r: any) => r.supplier_id)))
    productQuery = productQuery.in('supplier_id', ids.length ? ids : ['00000000-0000-0000-0000-000000000000'])
  }

  const from = (page - 1) * PAGE_SIZE
  const { data: products, count } = await productQuery
    .order('created_at', { ascending: false })
    .range(from, from + PAGE_SIZE - 1)

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)
  const promotions = (promotionsRes.data ?? []) as unknown as Parameters<typeof PromotionBanner>[0]['promotions']

  // ── Suppliers active in the selected category (so buyers see profiles, not just products) ──
  const activeCat = searchParams.category ? allCats.find((c) => c.slug === searchParams.category) : null
  let categorySuppliers: MiniSupplier[] = []
  if (activeCat) {
    // Include the category itself + any child categories
    const catIds = [activeCat.id, ...allCats.filter((c) => c.parent_id === activeCat.id).map((c) => c.id)]
    const { data: supRows } = await supabase
      .from('products')
      .select('supplier_id, suppliers!inner(id, legal_name, trade_name, logo_url, reliability_tier, brand_slug, tagline, status)')
      .eq('is_published', true)
      .eq('suppliers.status', 'ACTIVE')
      .in('category_id', catIds)

    // Dedupe by supplier + count their products in this category
    const map = new Map<string, MiniSupplier & { product_count: number }>()
    for (const row of (supRows ?? []) as any[]) {
      const s = row.suppliers
      if (!s) continue
      const existing = map.get(s.id)
      if (existing) { existing.product_count += 1 }
      else { map.set(s.id, { ...s, product_count: 1 }) }
    }
    categorySuppliers = Array.from(map.values())
      .sort((a, b) => (b.product_count ?? 0) - (a.product_count ?? 0))
      .slice(0, 9)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Wholesale Marketplace</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {count ?? 0} products from verified suppliers
        </p>
      </div>

      <div className="mb-4">
        <SearchBar defaultValue={searchParams.q} />
      </div>

      {/* ── Region filter — pick a region after choosing your category ── */}
      <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        <span className="text-xs font-bold text-gray-400 uppercase tracking-wide flex-shrink-0 mr-1 flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          Region:
        </span>
        {[{ id: '', name: 'All Regions' }, ...REGIONS.map((r) => ({ id: r.id, name: r.name }))].map((r) => {
          const params = new URLSearchParams()
          if (searchParams.category) params.set('category', searchParams.category)
          if (searchParams.q) params.set('q', searchParams.q)
          if (r.id) params.set('region', r.id)
          const href = `/marketplace${params.toString() ? `?${params.toString()}` : ''}`
          // A country key (europe:spain) keeps its parent region pill (europe) highlighted,
          // so an arriving buyer sees the region is already chosen — no need to pick again.
          const isActive = (activeRegion ?? '') === r.id || (activeRegion ?? '').split(':')[0] === r.id
          return (
            <Link key={r.id || 'all'} href={href}
              className={`px-3.5 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-colors flex-shrink-0 ${
                isActive ? 'bg-[#0B1F4D] text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}>
              {r.name}
            </Link>
          )
        })}
      </div>

      <PromotionBanner promotions={promotions} />

      <div className="flex gap-8">
        <aside className="hidden md:block w-48 flex-shrink-0">
          <CategoryNav categories={categoryTree} />
        </aside>

        <div className="flex-1 min-w-0">
          {/* Three ways to shop this collection */}
          {activeCat && (
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-3">
                <h2 className="text-sm font-extrabold text-[#0B1F4D] uppercase tracking-wide">
                  Shop {activeCat.name} via
                </h2>
                <span className="h-px flex-1 bg-gray-100" />
              </div>
              <ShoppingChannels categorySlug={activeCat.slug} compact />
            </div>
          )}

          {/* Suppliers active in this category — surfaces profiles, not just products */}
          {activeCat && categorySuppliers.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-extrabold text-[#0B1F4D] uppercase tracking-wide">
                  Suppliers in {activeCat.name}
                </h2>
                <Link href="/suppliers" className="text-xs font-bold text-[#0B1F4D] hover:underline">
                  View all →
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {categorySuppliers.map((s) => (
                  <SupplierMiniCard key={s.id} supplier={s} />
                ))}
              </div>
              <div className="mt-6 mb-2 flex items-center gap-3">
                <span className="h-px flex-1 bg-gray-100" />
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Products</span>
                <span className="h-px flex-1 bg-gray-100" />
              </div>
            </div>
          )}

          {products && products.length > 0 ? (
            <>
              <ProductGrid>
                {products.map((p) => {
                  const supplier = p.suppliers as unknown as { legal_name: string; trade_name: string | null; reliability_tier: import('@/types/domain').ReliabilityTier }
                  const images = p.product_images as { url: string; sort_order: number }[]
                  const mainImg = images?.sort((a, b) => a.sort_order - b.sort_order)[0]?.url
                  return (
                    <ProductCard
                      key={p.id}
                      product={p as Parameters<typeof ProductCard>[0]['product']}
                      supplier={supplier}
                      mainImageUrl={mainImg}
                      href={`/product/${p.slug ?? p.id}`}
                    />
                  )
                })}
              </ProductGrid>
              <Pagination page={page} totalPages={totalPages} />
            </>
          ) : (
            <div className="text-center py-20 text-muted-foreground">
              <p className="text-lg">No products found</p>
              <p className="text-sm mt-1">Try adjusting your filters or search query</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
