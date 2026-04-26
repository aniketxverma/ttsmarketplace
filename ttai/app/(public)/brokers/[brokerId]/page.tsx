import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProductCard } from '@/components/marketplace/ProductCard'
import { ProductGrid } from '@/components/marketplace/ProductGrid'

export default async function BrokerProfilePage({
  params,
}: {
  params: { brokerId: string }
}) {
  const supabase = createClient()

  const { data: broker } = await supabase
    .from('brokers')
    .select('id, legal_name, status')
    .eq('id', params.brokerId)
    .eq('status', 'ACTIVE')
    .single()

  if (!broker) notFound()

  const { data: promotions } = await supabase
    .from('broker_promotions')
    .select(
      `id, custom_pitch, products(
        id, name, slug, price_cents, currency_code, min_order_qty, marketplace_context, vat_rate,
        product_images(url, sort_order),
        suppliers(legal_name, trade_name, reliability_tier)
      )`
    )
    .eq('broker_id', params.brokerId)
    .eq('is_active', true)
    .gt('ends_at', new Date().toISOString())
    .order('promotion_slot')

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="rounded-xl border p-6 mb-8">
        <h1 className="text-2xl font-bold">{broker.legal_name}</h1>
        <p className="text-sm text-muted-foreground mt-1">Verified Broker</p>
      </div>

      <h2 className="text-xl font-semibold mb-4">Featured Products</h2>

      {promotions && promotions.length > 0 ? (
        <div className="space-y-6">
          {promotions.map((promo) => {
            const p = promo.products as unknown as { id: string; name: string; price_cents: number; currency_code: string; min_order_qty: number; marketplace_context: import('@/types/domain').MarketplaceContext; vat_rate: number | null; product_images: { url: string; sort_order: number }[]; suppliers: { legal_name: string; trade_name: string | null; reliability_tier: import('@/types/domain').ReliabilityTier } }
            const mainImg = p.product_images?.sort((a, b) => a.sort_order - b.sort_order)[0]?.url
            return (
              <div key={promo.id} className="space-y-2">
                {promo.custom_pitch && (
                  <p className="text-sm italic text-muted-foreground">&ldquo;{promo.custom_pitch}&rdquo;</p>
                )}
                <ProductCard
                  product={{ ...p, slug: p.id }}
                  supplier={p.suppliers}
                  mainImageUrl={mainImg}
                  href={`/marketplace/${p.id}`}
                />
              </div>
            )
          })}
        </div>
      ) : (
        <p className="text-muted-foreground text-sm">No active promotions.</p>
      )}
    </div>
  )
}
