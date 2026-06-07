import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/rbac'
import { ProductForm } from '@/components/supplier/ProductForm'
import { ProductImageManager } from '@/components/supplier/ProductImageManager'
import { getPricingConfig } from '@/lib/pricing-config'

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const user = await requireAuth()
  const supabase = createClient()

  const { data: supplier } = await supabase
    .from('suppliers')
    .select('id, status')
    .eq('owner_id', user.id)
    .single()

  const { data: prof } = await (supabase.from('profiles') as any).select('tier').eq('id', user.id).single()
  const sellerTier = prof?.tier ?? 'free'
  const pricing = await getPricingConfig()

  if (!supplier) redirect('/supplier/onboarding')

  const { data: product } = await (supabase
    .from('products') as any)
    .select('*, product_images(id, url, sort_order, image_role)')
    .eq('id', params.id)
    .eq('supplier_id', supplier.id)
    .single() as { data: any }

  if (!product) notFound()

  const images = (product.product_images ?? []).sort(
    (a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order
  )

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Edit Product</h1>
        <p className="text-muted-foreground text-sm mt-0.5">{product.name}</p>
      </div>

      {/* Images */}
      <div className="rounded-xl border bg-card p-6 space-y-3">
        <h2 className="font-bold text-[#0B1F4D] text-sm pb-2 border-b">Product Images</h2>
        <ProductImageManager
          productId={product.id}
          supplierId={supplier.id}
          initialImages={images}
        />
      </div>

      {/* Product details form */}
      <div className="rounded-xl border bg-card p-6">
        <ProductForm
          supplierId={supplier.id}
          mode="edit"
          productId={product.id}
          sellerTier={sellerTier}
          minMarginPct={pricing.minMarginPct}
          vatPct={pricing.vatPct}
          vatEnabled={pricing.vatEnabled}
          initialData={{
            name:               product.name,
            slug:               product.slug,
            productLine:        (product as any).product_line ?? '',
            isFamilyCover:      (product as any).is_family_cover ?? false,
            categoryId:         product.category_id,
            marketplaceContext: product.marketplace_context as 'wholesale' | 'retail' | 'both',
            cityId:             product.city_id ?? '',
            description:        product.description ?? '',
            sku:                product.sku ?? '',
            priceDisplay:       (product.price_cents / 100).toFixed(2),
            retailPriceDisplay: (product as any).retail_price_cents != null ? ((product as any).retail_price_cents / 100).toFixed(2) : '',
            currencyCode:       product.currency_code,
            minOrderQty:        product.min_order_qty.toString(),
            stockQty:           product.stock_qty.toString(),
            vatRate:            product.vat_rate?.toString() ?? '',
            weightGrams:        product.weight_grams?.toString() ?? '',
            modelName:          (product as any).model_name ?? '',
            referenceNumber:    (product as any).reference_number ?? '',
            ean:                (product as any).ean ?? '',
            countryOfOrigin:    (product as any).country_of_origin ?? '',
            leadTime:           (product as any).lead_time ?? '',
            netContent:         (product as any).net_content ?? '',
            unitWeightKg:       (product as any).unit_weight_kg?.toString() ?? '',
            unitDimensions:     (product as any).unit_dimensions ?? '',
            unitsPerCarton:     (product as any).units_per_carton?.toString() ?? '',
            cartonWeightKg:     (product as any).carton_weight_kg?.toString() ?? '',
            cartonNetWeightKg:  (product as any).carton_net_weight_kg?.toString() ?? '',
            cartonDimensions:   (product as any).carton_dimensions ?? '',
            cartonsPerPallet:   (product as any).cartons_per_pallet?.toString() ?? '',
            palletWeightKg:     (product as any).pallet_weight_kg?.toString() ?? '',
            palletDimensions:   (product as any).pallet_dimensions ?? '',
            palletHeightCm:     (product as any).pallet_height_cm?.toString() ?? '',
            palletsPerTruck:    (product as any).pallets_per_truck?.toString() ?? '',
            truckCapacity:      (product as any).truck_capacity ?? '',
            exwPrice:           (product as any).exw_price_cents != null ? ((product as any).exw_price_cents / 100).toFixed(2) : '',
            hsCode:             (product as any).hs_code ?? '',
            catalogueUrl:       (product as any).catalogue_url ?? '',
            videoUrl:           (product as any).video_url ?? '',
            pricePerBox:        (product as any).price_per_box_cents != null ? ((product as any).price_per_box_cents / 100).toFixed(2) : '',
            pricePerPallet:     (product as any).price_per_pallet_cents != null ? ((product as any).price_per_pallet_cents / 100).toFixed(2) : '',
            pricePerTruck:      (product as any).price_per_truck_cents != null ? ((product as any).price_per_truck_cents / 100).toFixed(2) : '',
            priceNegotiable:    (product as any).price_negotiable ?? false,
            minBoxQty:          (product as any).min_box_qty?.toString() ?? '1',
            minPalletQty:       (product as any).min_pallet_qty?.toString() ?? '1',
            minTruckQty:        (product as any).min_truck_qty?.toString() ?? '1',
            boxDiscountPct:     (product as any).box_discount_pct ? String((product as any).box_discount_pct) : '',
            palletDiscountPct:  (product as any).pallet_discount_pct ? String((product as any).pallet_discount_pct) : '',
            truckDiscountPct:   (product as any).truck_discount_pct ? String((product as any).truck_discount_pct) : '',
            sellPiece:          (product as any).sell_piece ?? true,
            sellBox:            (product as any).sell_box ?? false,
            sellPallet:         (product as any).sell_pallet ?? false,
            sellTruck:          (product as any).sell_truck ?? false,
            isPublished:        product.is_published ?? false,
          }}
        />
      </div>
    </div>
  )
}
