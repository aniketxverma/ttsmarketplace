import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProductCard } from '@/components/marketplace/ProductCard'
import { ProductGrid } from '@/components/marketplace/ProductGrid'

export const revalidate = 60

/**
 * Family page — lists every variant in a product family.
 * /family?s=<supplier_id>&line=<product_line>   (line family)
 * /family?s=<supplier_id>&c=<category_id>        (category fallback family)
 */
export default async function FamilyPage({
  searchParams,
}: {
  searchParams: { s?: string; line?: string; c?: string; retail?: string }
}) {
  const supplierId = searchParams.s
  if (!supplierId || (!searchParams.line && !searchParams.c)) notFound()

  const supabase = createClient()
  const retail = searchParams.retail === '1'

  let q = (supabase.from('products') as any)
    .select(`
      id, name, slug, price_cents, retail_price_cents, currency_code, min_order_qty, marketplace_context, vat_rate,
      supplier_id, category_id, product_line,
      suppliers!inner(legal_name, trade_name, brand_slug, reliability_tier, status),
      categories(name, slug),
      product_images(url, sort_order)
    `)
    .eq('is_published', true)
    .eq('supplier_id', supplierId)
    .neq('suppliers.status', 'SUSPENDED')

  if (searchParams.line) q = q.eq('product_line', searchParams.line)
  else q = q.eq('category_id', searchParams.c)

  const { data: products } = await q.order('price_cents', { ascending: true }) as { data: any[] | null }

  if (!products || products.length === 0) notFound()

  const first = products[0]
  const supplier = first.suppliers as { legal_name: string; trade_name: string | null; brand_slug: string | null }
  const supplierName = supplier?.trade_name ?? supplier?.legal_name ?? 'Supplier'
  const title = searchParams.line ?? (first.categories?.name as string) ?? 'Products'

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-gray-400 font-medium mb-4 flex-wrap">
        <Link href="/marketplace" className="hover:text-[#0B1F4D]">Marketplace</Link>
        <span>/</span>
        {supplier?.brand_slug
          ? <Link href={`/brand/${supplier.brand_slug}`} className="hover:text-[#0B1F4D]">{supplierName}</Link>
          : <span>{supplierName}</span>}
        <span>/</span>
        <span className="text-[#0B1F4D]">{title}</span>
      </nav>

      <div className="mb-6">
        <p className="text-[#F5A623] text-xs font-bold uppercase tracking-widest mb-1">{supplierName}</p>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F4D]">{title}</h1>
        <p className="text-gray-500 text-sm mt-1">
          {products.length} option{products.length !== 1 ? 's' : ''} in this range — pick the one you need.
        </p>
      </div>

      <ProductGrid>
        {products.map((p) => {
          const sup = p.suppliers as { legal_name: string; trade_name: string | null; reliability_tier: import('@/types/domain').ReliabilityTier }
          const img = (p.product_images as { url: string; sort_order: number }[])?.sort((a, b) => a.sort_order - b.sort_order)[0]?.url
          return (
            <ProductCard
              key={p.id}
              product={p as Parameters<typeof ProductCard>[0]['product']}
              supplier={sup}
              mainImageUrl={img}
              href={`/product/${p.slug ?? p.id}`}
              retail={retail}
            />
          )
        })}
      </ProductGrid>
    </div>
  )
}
