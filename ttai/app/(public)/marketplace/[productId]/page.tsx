import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import type { ReliabilityTier } from '@/types/domain'
import { CheckoutButton } from './CheckoutButton'

const TIER_LABELS: Record<ReliabilityTier, string> = {
  UNVERIFIED: 'Unverified',
  BRONZE: 'Bronze',
  SILVER: 'Silver',
  GOLD: 'Gold Verified',
}

export default async function ProductDetailPage({
  params,
}: {
  params: { productId: string }
}) {
  const supabase = createClient()

  const { data: product, error } = await supabase
    .from('products')
    .select(
      `*,
      suppliers(id, legal_name, trade_name, reliability_tier, status, description, country_id),
      categories(id, name, slug, parent_id),
      product_images(url, sort_order)`
    )
    .eq('id', params.productId)
    .single()

  if (error || !product) notFound()

  const supplier = product.suppliers as { id: string; legal_name: string; trade_name: string | null; reliability_tier: ReliabilityTier; status: string; description: string | null }
  const images = (product.product_images as { url: string; sort_order: number }[]).sort(
    (a, b) => a.sort_order - b.sort_order
  )

  const displayPrice = product.price_cents
  const displayName = supplier.trade_name ?? supplier.legal_name

  return (
    <div className="container mx-auto px-4 py-8">
      <nav className="text-sm text-muted-foreground mb-6">
        <Link href="/marketplace" className="hover:text-foreground">Marketplace</Link>
        <span className="mx-2">/</span>
        <span>{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Images */}
        <div className="space-y-3">
          <div className="aspect-square rounded-xl overflow-hidden bg-muted relative">
            {images[0] ? (
              <Image
                src={images[0].url}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/40">
                <svg className="w-20 h-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {images.slice(1).map((img, i) => (
                <div key={i} className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0 relative">
                  <Image src={img.url} alt={`${product.name} ${i + 2}`} fill className="object-cover" sizes="64px" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-6">
          <div>
            <p className="text-sm text-muted-foreground">{displayName}</p>
            <h1 className="text-2xl font-bold mt-1">{product.name}</h1>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold">
              {new Intl.NumberFormat('en-EU', { style: 'currency', currency: product.currency_code }).format(displayPrice / 100)}
            </span>
            <span className="text-sm text-muted-foreground">ex. VAT</span>
          </div>

          <div className="flex gap-3">
            <div className="rounded-lg bg-muted px-3 py-2 text-sm">
              <p className="text-muted-foreground text-xs">Min Order</p>
              <p className="font-semibold">{product.min_order_qty} units</p>
            </div>
            <div className="rounded-lg bg-muted px-3 py-2 text-sm">
              <p className="text-muted-foreground text-xs">In Stock</p>
              <p className="font-semibold">{product.stock_qty > 0 ? `${product.stock_qty} units` : 'Out of stock'}</p>
            </div>
          </div>

          {product.description && (
            <p className="text-sm text-muted-foreground leading-relaxed">{product.description}</p>
          )}

          <CheckoutButton
            productId={params.productId}
            disabled={product.stock_qty === 0}
          />

          {/* Supplier card */}
          <div className="rounded-xl border p-4 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Supplier</p>
            <Link href={`/suppliers/${supplier.id}`} className="flex items-center justify-between group">
              <div>
                <p className="font-medium group-hover:text-primary transition-colors">{displayName}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {TIER_LABELS[supplier.reliability_tier]} ·{' '}
                  <span className={supplier.reliability_tier === 'GOLD' ? 'text-yellow-600' : ''}>
                    {supplier.reliability_tier}
                  </span>
                </p>
              </div>
              <svg className="w-4 h-4 text-muted-foreground group-hover:text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
