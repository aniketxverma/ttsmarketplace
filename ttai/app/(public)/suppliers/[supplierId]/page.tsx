import { notFound } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { ProductCard } from '@/components/marketplace/ProductCard'
import { ProductGrid } from '@/components/marketplace/ProductGrid'
import type { ReliabilityTier } from '@/types/domain'

const TIER_DESCRIPTIONS: Record<ReliabilityTier, string> = {
  UNVERIFIED: 'This supplier has not yet been fully verified.',
  BRONZE:     'Basic verification completed.',
  SILVER:     'Verified supplier with documented track record.',
  GOLD:       'Highest verification level. Audited and trusted.',
}

export default async function SupplierProfilePage({
  params,
}: {
  params: { supplierId: string }
}) {
  const supabase = createClient()

  const { data: supplier } = await supabase
    .from('suppliers')
    .select('id, legal_name, trade_name, description, logo_url, reliability_tier, status, country_id')
    .eq('id', params.supplierId)
    .eq('status', 'ACTIVE')
    .single()

  if (!supplier) notFound()

  const { data: products } = await supabase
    .from('products')
    .select('id, name, slug, price_cents, currency_code, min_order_qty, marketplace_context, vat_rate, product_images(url, sort_order)')
    .eq('supplier_id', params.supplierId)
    .eq('is_published', true)
    .order('created_at', { ascending: false })

  const tier = supplier.reliability_tier as ReliabilityTier
  const displayName = supplier.trade_name ?? supplier.legal_name

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="rounded-xl border p-6 mb-8">
        <div className="flex items-start gap-4">
          {supplier.logo_url ? (
            <div className="relative w-16 h-16 rounded-lg overflow-hidden">
              <Image src={supplier.logo_url} alt={displayName} fill className="object-cover" sizes="64px" />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center text-2xl font-bold text-muted-foreground">
              {displayName[0]}
            </div>
          )}
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{displayName}</h1>
            {supplier.trade_name && <p className="text-sm text-muted-foreground">{supplier.legal_name}</p>}
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs rounded-full border px-2 py-0.5 font-medium">{tier}</span>
              <span className="text-xs text-muted-foreground">{TIER_DESCRIPTIONS[tier]}</span>
            </div>
          </div>
        </div>
        {supplier.description && (
          <p className="mt-4 text-sm text-muted-foreground leading-relaxed">{supplier.description}</p>
        )}
      </div>

      <h2 className="text-xl font-semibold mb-4">Products ({products?.length ?? 0})</h2>

      {products && products.length > 0 ? (
        <ProductGrid>
          {products.map((p) => {
            const images = p.product_images as { url: string; sort_order: number }[]
            const mainImg = images?.sort((a, b) => a.sort_order - b.sort_order)[0]?.url
            return (
              <ProductCard
                key={p.id}
                product={p as Parameters<typeof ProductCard>[0]['product']}
                supplier={{ legal_name: supplier.legal_name, trade_name: supplier.trade_name, reliability_tier: tier }}
                mainImageUrl={mainImg}
                href={`/marketplace/${p.id}`}
              />
            )
          })}
        </ProductGrid>
      ) : (
        <p className="text-muted-foreground text-sm">No products published yet.</p>
      )}
    </div>
  )
}
