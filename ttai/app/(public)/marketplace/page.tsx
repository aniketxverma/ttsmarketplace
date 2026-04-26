import { createClient } from '@/lib/supabase/server'
import { ProductCard } from '@/components/marketplace/ProductCard'
import { ProductGrid } from '@/components/marketplace/ProductGrid'
import { CategoryNav } from '@/components/marketplace/CategoryNav'
import { SearchBar } from '@/components/marketplace/SearchBar'
import { Pagination } from '@/components/marketplace/Pagination'
import { PromotionBanner } from '@/components/marketplace/PromotionBanner'
import type { Category } from '@/types/domain'

const PAGE_SIZE = 24

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: { category?: string; q?: string; page?: string }
}) {
  const supabase = createClient()
  const page = parseInt(searchParams.page || '1')

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
    if (cat) productQuery = productQuery.eq('category_id', cat.id)
  }

  if (searchParams.q) {
    productQuery = productQuery.ilike('name', `%${searchParams.q}%`)
  }

  const from = (page - 1) * PAGE_SIZE
  const { data: products, count } = await productQuery
    .order('created_at', { ascending: false })
    .range(from, from + PAGE_SIZE - 1)

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)
  const promotions = (promotionsRes.data ?? []) as unknown as Parameters<typeof PromotionBanner>[0]['promotions']

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Wholesale Marketplace</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {count ?? 0} products from verified suppliers
        </p>
      </div>

      <div className="mb-6">
        <SearchBar defaultValue={searchParams.q} />
      </div>

      <PromotionBanner promotions={promotions} />

      <div className="flex gap-8">
        <aside className="hidden md:block w-48 flex-shrink-0">
          <CategoryNav categories={categoryTree} />
        </aside>

        <div className="flex-1 min-w-0">
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
                      href={`/marketplace/${p.id}`}
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
