import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/rbac'
import { ProductForm } from '@/components/supplier/ProductForm'

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const user = await requireAuth()
  const supabase = createClient()

  const { data: supplier } = await supabase
    .from('suppliers')
    .select('id, status')
    .eq('owner_id', user.id)
    .single()

  if (!supplier) redirect('/supplier/onboarding')

  const { data: product } = await supabase
    .from('products')
    .select('*')
    .eq('id', params.id)
    .eq('supplier_id', supplier.id)
    .single()

  if (!product) notFound()

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Edit Product</h1>
        <p className="text-muted-foreground text-sm mt-0.5">{product.name}</p>
      </div>
      <div className="rounded-xl border bg-card p-6">
        <ProductForm
          supplierId={supplier.id}
          mode="edit"
          productId={product.id}
          initialData={{
            name:               product.name,
            slug:               product.slug,
            categoryId:         product.category_id,
            marketplaceContext: product.marketplace_context as 'wholesale' | 'retail' | 'both',
            cityId:             product.city_id ?? '',
            description:        product.description ?? '',
            sku:                product.sku ?? '',
            priceCents:         product.price_cents.toString(),
            currencyCode:       product.currency_code,
            minOrderQty:        product.min_order_qty.toString(),
            stockQty:           product.stock_qty.toString(),
            vatRate:            product.vat_rate?.toString() ?? '',
            weightGrams:        product.weight_grams?.toString() ?? '',
          }}
        />
      </div>
    </div>
  )
}
