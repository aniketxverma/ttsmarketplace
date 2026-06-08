import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { slugify } from '@/lib/utils'

export const maxDuration = 120

// Fields copied when a product is imported from another supplier's catalogue.
const COPY_FIELDS = [
  'name', 'description', 'category_id', 'marketplace_context', 'price_cents', 'retail_price_cents',
  'currency_code', 'min_order_qty', 'vat_rate', 'weight_grams', 'ean', 'brand_name', 'model_name',
  'reference_number', 'country_of_origin', 'lead_time', 'net_content', 'unit_weight_kg', 'unit_dimensions',
  'units_per_carton', 'carton_weight_kg', 'carton_net_weight_kg', 'carton_dimensions',
  'cartons_per_pallet', 'pallet_weight_kg', 'pallet_dimensions', 'pallet_height_cm',
  'pallets_per_truck', 'truck_capacity', 'hs_code',
  'price_per_box_cents', 'price_per_pallet_cents', 'price_per_truck_cents',
  'sell_piece', 'sell_box', 'sell_pallet', 'sell_truck', 'product_line',
]

async function mySupplier(supabase: any, userId: string) {
  const { data } = await supabase.from('suppliers').select('id').eq('owner_id', userId).maybeSingle()
  return data?.id ?? null
}

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({})) as any
  const admin = createAdminClient()
  const myId = await mySupplier(supabase, user.id)
  if (!myId) return NextResponse.json({ error: 'No supplier profile' }, { status: 403 })

  // ── Grant: I let another supplier import my catalogue ──────────────────────
  if (body.action === 'grant') {
    if (!body.targetSupplierId || body.targetSupplierId === myId)
      return NextResponse.json({ error: 'Choose a different supplier' }, { status: 400 })
    const { error } = await (admin.from('supplier_share_grants') as any)
      .upsert({ source_supplier_id: myId, target_supplier_id: body.targetSupplierId, status: 'active' },
        { onConflict: 'source_supplier_id,target_supplier_id' })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  if (body.action === 'revoke') {
    await (admin.from('supplier_share_grants') as any).update({ status: 'revoked' })
      .eq('source_supplier_id', myId).eq('target_supplier_id', body.targetSupplierId)
    return NextResponse.json({ ok: true })
  }

  // ── List a source supplier's catalogue (only if it granted me) ─────────────
  if (body.action === 'list') {
    const ok = await grantedToMe(admin, body.sourceSupplierId, myId)
    if (!ok) return NextResponse.json({ error: 'Not authorised for this supplier' }, { status: 403 })
    const { data } = await (admin.from('products') as any)
      .select('id, name, price_cents, currency_code, brand_name, categories(name), product_images(url, sort_order)')
      .eq('supplier_id', body.sourceSupplierId).eq('is_published', true).limit(1000)
    // Mark which I've already imported (avoid duplicates).
    const { data: mine } = await (admin.from('products') as any)
      .select('imported_from_product_id').eq('supplier_id', myId).not('imported_from_product_id', 'is', null)
    const already = new Set((mine ?? []).map((m: any) => m.imported_from_product_id))
    const rows = (data ?? []).map((p: any) => ({
      id: p.id, name: p.name, price_cents: p.price_cents, currency_code: p.currency_code,
      brand: p.brand_name ?? null, category: p.categories?.name ?? null,
      image: (p.product_images ?? []).sort((a: any, b: any) => a.sort_order - b.sort_order)[0]?.url ?? null,
      imported: already.has(p.id),
    }))
    return NextResponse.json({ products: rows })
  }

  // ── Import selected products from a source into my catalogue ───────────────
  if (body.action === 'import') {
    if (!(await grantedToMe(admin, body.sourceSupplierId, myId)))
      return NextResponse.json({ error: 'Not authorised for this supplier' }, { status: 403 })
    const ids: string[] = Array.isArray(body.productIds) ? body.productIds : []
    if (!ids.length) return NextResponse.json({ error: 'No products selected' }, { status: 400 })

    const { data: src } = await (admin.from('products') as any).select('*').in('id', ids).eq('supplier_id', body.sourceSupplierId)
    // Skip already-imported to avoid duplicates.
    const { data: mine } = await (admin.from('products') as any)
      .select('imported_from_product_id').eq('supplier_id', myId).not('imported_from_product_id', 'is', null)
    const already = new Set((mine ?? []).map((m: any) => m.imported_from_product_id))

    let created = 0
    for (const p of (src ?? []) as any[]) {
      if (already.has(p.id)) continue
      const row: Record<string, any> = { supplier_id: myId, is_published: false }
      for (const f of COPY_FIELDS) if (p[f] !== undefined) row[f] = p[f]
      row.slug = `${slugify(p.name || 'product').slice(0, 56)}-${Math.random().toString(36).slice(2, 6)}`
      // Provenance — preserve the chain.
      Object.assign(row, {
        current_owner_id: myId,
        imported_from_product_id: p.id,
        original_supplier_id: p.original_supplier_id ?? p.supplier_id,
        original_factory_id: p.original_factory_id ?? null,
        source_type: 'Supplier',
        created_by: user.id,
        import_date: new Date().toISOString(),
      })
      let ins = await (admin.from('products') as any).insert(row).select('id').single()
      if (ins.error && /column|does not exist/i.test(ins.error.message)) {
        for (const k of ['current_owner_id', 'imported_from_product_id', 'original_supplier_id', 'original_factory_id', 'source_type', 'created_by', 'import_date', 'brand_name']) delete row[k]
        ins = await (admin.from('products') as any).insert(row).select('id').single()
      }
      if (ins.error || !ins.data) continue
      // Copy images (reuse the same URLs).
      const imgs = (p.product_images ?? []) as any[]
      const { data: srcImgs } = await (admin.from('product_images') as any).select('url, sort_order, image_role').eq('product_id', p.id)
      const toInsert = (srcImgs ?? imgs).map((im: any, i: number) => ({ product_id: ins.data.id, url: im.url, sort_order: im.sort_order ?? i, image_role: im.image_role ?? null }))
      if (toInsert.length) await (admin.from('product_images') as any).insert(toInsert)
      created++
    }
    return NextResponse.json({ ok: true, created })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}

async function grantedToMe(admin: any, sourceId: string, myId: string): Promise<boolean> {
  if (!sourceId) return false
  const { data } = await admin.from('supplier_share_grants').select('id')
    .eq('source_supplier_id', sourceId).eq('target_supplier_id', myId).eq('status', 'active').maybeSingle()
  return !!data
}
