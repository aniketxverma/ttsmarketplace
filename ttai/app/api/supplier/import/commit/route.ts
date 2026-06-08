import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { slugify } from '@/lib/utils'

export const maxDuration = 120

interface ImportRow {
  name: string
  price: number | null
  ean: string | null
  color: string | null
  units_per_carton: number | null
  carton_dimensions: string | null
  weight_grams: number | null
  description: string | null
  images: string[]
}

const ALLOWED_CURRENCIES = ['EUR', 'USD', 'GBP', 'CNY', 'AED', 'SAR', 'MAD']

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null) as
    | { products: ImportRow[]; categoryId: string; currency?: string; marketplaceContext?: string }
    | null
  if (!body?.products?.length) return NextResponse.json({ error: 'No products to import' }, { status: 400 })
  if (!body.categoryId) return NextResponse.json({ error: 'Please choose a category for the batch' }, { status: 400 })

  const admin = createAdminClient()
  const { data: supplier } = await (admin.from('suppliers') as any)
    .select('id').eq('owner_id', user.id).maybeSingle()
  if (!supplier) return NextResponse.json({ error: 'No supplier profile found for this account' }, { status: 403 })

  const currencyCode = ALLOWED_CURRENCIES.includes(body.currency ?? '') ? body.currency! : 'EUR'
  const context = ['wholesale', 'retail', 'both'].includes(body.marketplaceContext ?? '') ? body.marketplaceContext! : 'wholesale'

  let created = 0
  const failed: string[] = []

  for (const p of body.products) {
    const name = (p.name || '').trim()
    if (!name) continue
    const priceCents = p.price && p.price > 0 ? Math.round(p.price * 100) : 0
    const desc = [p.color ? `Color: ${p.color}` : '', p.description ?? ''].filter(Boolean).join('\n').trim() || null
    const slug = `${slugify(name).slice(0, 60)}-${Math.random().toString(36).slice(2, 6)}`

    const { data: prod, error } = await (admin.from('products') as any)
      .insert({
        supplier_id: supplier.id,
        category_id: body.categoryId,
        marketplace_context: context,
        name,
        slug,
        description: desc,
        ean: p.ean,
        units_per_carton: p.units_per_carton,
        carton_dimensions: p.carton_dimensions,
        weight_grams: p.weight_grams,
        price_cents: priceCents,
        currency_code: currencyCode,
        min_order_qty: 1,
        stock_qty: 0,
        sell_piece: true,
        is_published: false, // imported as drafts — supplier reviews & publishes
      })
      .select('id').single()

    if (error || !prod) { failed.push(name); continue }

    if (p.images?.length) {
      await (admin.from('product_images') as any).insert(
        p.images.map((url, i) => ({ product_id: prod.id, url, sort_order: i })),
      )
    }
    created++
  }

  return NextResponse.json({ created, failed })
}
