import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createProductSchema } from '@/lib/validation/schemas'

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: supplier } = await supabase.from('suppliers').select('id').eq('owner_id', user.id).single()
  if (!supplier) return NextResponse.json({ error: 'Supplier not found' }, { status: 404 })

  const { data } = await supabase
    .from('products')
    .select('*, categories(name, slug), product_images(url, sort_order)')
    .eq('supplier_id', supplier.id)
    .order('created_at', { ascending: false })

  return NextResponse.json({ products: data ?? [] })
}

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: supplier } = await supabase.from('suppliers').select('id, status').eq('owner_id', user.id).single()
  if (!supplier) return NextResponse.json({ error: 'Supplier not found' }, { status: 404 })
  if (supplier.status !== 'ACTIVE') return NextResponse.json({ error: 'Supplier must be ACTIVE to create products' }, { status: 403 })

  const body = await request.json()
  const parsed = createProductSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })

  const { data: existing } = await supabase
    .from('products')
    .select('id')
    .eq('supplier_id', supplier.id)
    .eq('slug', parsed.data.slug)
    .single()

  if (existing) return NextResponse.json({ error: 'Slug already in use for this supplier' }, { status: 409 })

  const { data, error } = await supabase
    .from('products')
    .insert({
      supplier_id:         supplier.id,
      category_id:         parsed.data.categoryId,
      marketplace_context: parsed.data.marketplaceContext,
      city_id:             parsed.data.cityId,
      name:                parsed.data.name,
      slug:                parsed.data.slug,
      description:         parsed.data.description,
      sku:                 parsed.data.sku,
      price_cents:         parsed.data.priceCents,
      currency_code:       parsed.data.currencyCode,
      min_order_qty:       parsed.data.minOrderQty,
      stock_qty:           parsed.data.stockQty,
      vat_rate:            parsed.data.vatRate,
      weight_grams:        parsed.data.weightGrams,
      is_published:        false,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ product: data }, { status: 201 })
}
