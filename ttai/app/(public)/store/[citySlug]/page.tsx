import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ProductCard } from '@/components/marketplace/ProductCard'
import { ProductGrid } from '@/components/marketplace/ProductGrid'
import { SearchBar } from '@/components/marketplace/SearchBar'
import { Pagination } from '@/components/marketplace/Pagination'
import type { ReliabilityTier } from '@/types/domain'

const PAGE_SIZE = 24

export default async function CityStorePage({
  params,
  searchParams,
}: {
  params: { citySlug: string }
  searchParams: { q?: string; page?: string }
}) {
  const supabase = createClient()
  const page = parseInt(searchParams.page || '1')

  const { data: city } = await supabase
    .from('cities')
    .select('id, name, slug, retail_active')
    .eq('slug', params.citySlug)
    .single()

  if (!city || !city.retail_active) notFound()

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
    .eq('city_id', city.id)
    .in('marketplace_context', ['retail', 'both'])

  if (searchParams.q) {
    productQuery = productQuery.ilike('name', `%${searchParams.q}%`)
  }

  const from = (page - 1) * PAGE_SIZE
  const { data: products, count } = await productQuery
    .order('created_at', { ascending: false })
    .range(from, from + PAGE_SIZE - 1)

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Link href="/store" className="hover:text-foreground">All Cities</Link>
            <span>/</span>
          </div>
          <h1 className="text-2xl font-bold">Shopping in {city.name}</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{count ?? 0} local products</p>
        </div>
        <Link href="/store" className="text-sm text-primary hover:underline">
          Switch city
        </Link>
      </div>

      <div className="mb-6">
        <SearchBar defaultValue={searchParams.q} />
      </div>

      {products && products.length > 0 ? (
        <>
          <ProductGrid>
            {products.map((p) => {
              const supplier = p.suppliers as unknown as { legal_name: string; trade_name: string | null; reliability_tier: ReliabilityTier }
              const images = p.product_images as { url: string; sort_order: number }[]
              const mainImg = images?.sort((a, b) => a.sort_order - b.sort_order)[0]?.url
              return (
                <ProductCard
                  key={p.id}
                  product={p as Parameters<typeof ProductCard>[0]['product']}
                  supplier={supplier}
                  mainImageUrl={mainImg}
                  href={`/store/${city.slug}/${p.id}`}
                />
              )
            })}
          </ProductGrid>
          <Pagination page={page} totalPages={totalPages} />
        </>
      ) : (
        <div className="text-center py-20 text-muted-foreground">
          <p className="text-lg">No products in {city.name} yet</p>
          <p className="text-sm mt-1">Check back soon or browse the wholesale marketplace</p>
          <Link href="/marketplace" className="text-primary hover:underline text-sm mt-3 inline-block">
            Browse wholesale →
          </Link>
        </div>
      )}
    </div>
  )
}
