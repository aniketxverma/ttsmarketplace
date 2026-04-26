import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'

export default async function RetailProductPage({
  params,
}: {
  params: { citySlug: string; productId: string }
}) {
  const supabase = createClient()

  const { data: city } = await supabase
    .from('cities')
    .select('id, name, slug, retail_active')
    .eq('slug', params.citySlug)
    .single()

  if (!city || !city.retail_active) notFound()

  const { data: product } = await supabase
    .from('products')
    .select(
      `*,
      suppliers(id, legal_name, trade_name, reliability_tier, status),
      categories(name, slug),
      product_images(url, sort_order)`
    )
    .eq('id', params.productId)
    .eq('city_id', city.id)
    .single()

  if (!product) notFound()

  const supplier = product.suppliers as { id: string; legal_name: string; trade_name: string | null }
  const images = (product.product_images as { url: string; sort_order: number }[]).sort(
    (a, b) => a.sort_order - b.sort_order
  )

  const vatRate = product.vat_rate ?? 21
  const priceInclVat = product.price_cents + Math.round(product.price_cents * vatRate / 100)

  return (
    <div className="container mx-auto px-4 py-8">
      <nav className="text-sm text-muted-foreground mb-6">
        <Link href="/store" className="hover:text-foreground">Store</Link>
        <span className="mx-2">/</span>
        <Link href={`/store/${city.slug}`} className="hover:text-foreground">{city.name}</Link>
        <span className="mx-2">/</span>
        <span>{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="aspect-square rounded-xl overflow-hidden bg-muted relative">
          {images[0] ? (
            <Image src={images[0].url} alt={product.name} fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/40">
              <svg className="w-20 h-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div>
            <p className="text-sm text-muted-foreground">{supplier.trade_name ?? supplier.legal_name}</p>
            <h1 className="text-2xl font-bold mt-1">{product.name}</h1>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold">
              {new Intl.NumberFormat('en-EU', { style: 'currency', currency: product.currency_code }).format(priceInclVat / 100)}
            </span>
            <span className="text-sm text-muted-foreground">inc. {vatRate}% VAT</span>
          </div>

          {product.description && (
            <p className="text-sm text-muted-foreground leading-relaxed">{product.description}</p>
          )}

          <div className="rounded-lg bg-muted px-3 py-2 text-sm inline-flex">
            <span className={product.stock_qty > 0 ? 'text-green-700 font-medium' : 'text-red-600 font-medium'}>
              {product.stock_qty > 0 ? `${product.stock_qty} in stock` : 'Out of stock'}
            </span>
          </div>

          <button
            disabled
            className="w-full rounded-md bg-primary text-primary-foreground px-6 py-3 font-medium disabled:opacity-60"
          >
            Add to Cart (Coming Soon)
          </button>
        </div>
      </div>
    </div>
  )
}
