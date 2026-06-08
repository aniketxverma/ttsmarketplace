import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { slugify } from '@/lib/utils'

export const maxDuration = 120

interface ImportRow {
  name: string
  brand: string | null
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
    | { products: ImportRow[]; categoryId: string; currency?: string; marketplaceContext?: string; catalogueName?: string }
    | null
  if (!body?.products?.length) return NextResponse.json({ error: 'No products to import' }, { status: 400 })
  if (!body.categoryId) return NextResponse.json({ error: 'Please choose a category for the batch' }, { status: 400 })

  const admin = createAdminClient()
  const { data: supplier } = await (admin.from('suppliers') as any)
    .select('id').eq('owner_id', user.id).maybeSingle()
  if (!supplier) return NextResponse.json({ error: 'No supplier profile found for this account' }, { status: 403 })

  const currencyCode = ALLOWED_CURRENCIES.includes(body.currency ?? '') ? body.currency! : 'EUR'
  const context = ['wholesale', 'retail', 'both'].includes(body.marketplaceContext ?? '') ? body.marketplaceContext! : 'wholesale'

  // Phase 2 — resolve brand names → brand_id (dedupe by slug). Phase 3 — catalogue.
  const brandIdByName = new Map<string, string>()
  for (const p of body.products) {
    const bn = (p.brand || '').trim()
    if (!bn || brandIdByName.has(bn.toLowerCase())) continue
    const bslug = slugify(bn).slice(0, 60) || bn.toLowerCase()
    const kind = /\boem\b/i.test(bn) ? 'oem' : /private|white\s*label/i.test(bn) ? 'private_label' : 'brand'
    try {
      let { data: br } = await (admin.from('brands') as any).select('id').eq('slug', bslug).maybeSingle()
      if (!br) { const ins = await (admin.from('brands') as any).insert({ name: bn, slug: bslug, kind }).select('id').single(); br = ins.data }
      if (br?.id) brandIdByName.set(bn.toLowerCase(), br.id)
    } catch { /* brands table not migrated — skip linking */ }
  }
  let catalogueId: string | null = null
  try {
    const cat = await (admin.from('catalogues') as any)
      .insert({ owner_supplier_id: supplier.id, name: (body.catalogueName || 'Excel import').slice(0, 120), source_type: 'Supplier', product_count: body.products.length, created_by: user.id })
      .select('id').single()
    catalogueId = cat.data?.id ?? null
  } catch { /* catalogues table not migrated — skip */ }

  let created = 0
  const failed: string[] = []

  for (const p of body.products) {
    const name = (p.name || '').trim()
    if (!name) continue
    const priceCents = p.price && p.price > 0 ? Math.round(p.price * 100) : 0
    const desc = [p.color ? `Color: ${p.color}` : '', p.description ?? ''].filter(Boolean).join('\n').trim() || null
    const slug = `${slugify(name).slice(0, 60)}-${Math.random().toString(36).slice(2, 6)}`

    const base: Record<string, any> = {
      supplier_id: supplier.id,
      category_id: body.categoryId,
      marketplace_context: context,
      name, slug,
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
    }
    // Provenance + brand + catalogue (optional columns — retried without them if not migrated).
    const provenance = {
      brand_name: p.brand || null,
      brand_id: p.brand ? (brandIdByName.get(p.brand.trim().toLowerCase()) ?? null) : null,
      catalogue_id: catalogueId,
      source_type: 'Supplier',
      original_supplier_id: supplier.id, current_owner_id: supplier.id,
      created_by: user.id, import_date: new Date().toISOString(),
    }
    let ins = await (admin.from('products') as any).insert({ ...base, ...provenance }).select('id').single()
    if (ins.error && /column|does not exist|brand|source_type|owner|created_by|import_date|catalogue/i.test(ins.error.message)) {
      ins = await (admin.from('products') as any).insert(base).select('id').single()
    }
    const prod = ins.data
    if (ins.error || !prod) { failed.push(name); continue }

    if (p.images?.length) {
      await (admin.from('product_images') as any).insert(
        p.images.map((url, i) => ({ product_id: prod.id, url, sort_order: i })),
      )
    }
    created++
  }

  return NextResponse.json({ created, failed })
}
