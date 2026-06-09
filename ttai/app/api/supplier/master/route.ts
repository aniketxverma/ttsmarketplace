import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { slugify } from '@/lib/utils'
import { findOrCreateMaster } from '@/lib/master'

export const maxDuration = 60

async function mySupplierId(supabase: any, userId: string) {
  const { data } = await supabase.from('suppliers').select('id').eq('owner_id', userId).maybeSingle()
  return data?.id ?? null
}

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => ({})) as any
  const admin = createAdminClient()
  const myId = await mySupplierId(supabase, user.id)
  if (!myId) return NextResponse.json({ error: 'No supplier profile' }, { status: 403 })

  // ── Search the master catalog ──────────────────────────────────────────────
  if (body.action === 'search') {
    const q = String(body.q || '').trim()
    try {
      let query = (admin.from('master_products') as any)
        .select('id, name, brand_name, family, model, ean, image_urls, categories(name)').limit(40)
      if (q) query = query.or(`name.ilike.%${q}%,brand_name.ilike.%${q}%,model.ilike.%${q}%,ean.ilike.%${q}%`)
      const { data } = await query.order('created_at', { ascending: false })
      // Which masters I already list (avoid duplicates).
      const { data: mine } = await (admin.from('products') as any)
        .select('master_product_id').eq('supplier_id', myId).not('master_product_id', 'is', null)
      const have = new Set((mine ?? []).map((m: any) => m.master_product_id))
      const rows = (data ?? []).map((m: any) => ({
        id: m.id, name: m.name, brand: m.brand_name, family: m.family, model: m.model, ean: m.ean,
        category: m.categories?.name ?? null, image: (m.image_urls ?? [])[0] ?? null, mine: have.has(m.id),
      }))
      return NextResponse.json({ products: rows })
    } catch {
      return NextResponse.json({ error: 'Master catalog needs migration 0043 applied.' }, { status: 500 })
    }
  }

  // ── Cascade variant options (Brand → Model → Capacity → Color → Region) ─────
  if (body.action === 'options') {
    try {
      const sel = (body.selection ?? {}) as Record<string, string>
      let query = (admin.from('master_products') as any)
        .select('id, name, brand_name, model, ean, image_urls, specs, capacity, color, region, categories(name)')
        .limit(400)
      if (sel.brand) query = query.eq('brand_name', sel.brand)
      if (sel.model) query = query.eq('model', sel.model)
      // Variant dims live in dedicated columns (0044) with specs as fallback.
      for (const dim of ['capacity', 'color', 'region'] as const) {
        if (sel[dim]) query = query.or(`${dim}.eq.${sel[dim]},specs->>${dim}.eq.${sel[dim]}`)
      }
      const { data } = await query
      const rows = (data ?? []) as any[]
      const val = (m: any, k: string) => (m[k] ?? m.specs?.[k] ?? null)
      const distinct = (k: string) => Array.from(new Set(rows.map((m) => val(m, k)).filter(Boolean))).sort()

      const matches = rows.slice(0, 24).map((m) => ({
        id: m.id, name: m.name, brand: m.brand_name, model: m.model, ean: m.ean,
        capacity: val(m, 'capacity'), color: val(m, 'color'), region: val(m, 'region'),
        category: m.categories?.name ?? null, image: (m.image_urls ?? [])[0] ?? null,
      }))
      return NextResponse.json({
        brands:     sel.brand ? [] : distinct('brand_name'),
        models:     sel.brand && !sel.model ? distinct('model') : [],
        capacities: !sel.capacity ? distinct('capacity') : [],
        colors:     !sel.color ? distinct('color') : [],
        regions:    !sel.region ? distinct('region') : [],
        count: rows.length, matches,
      })
    } catch {
      return NextResponse.json({ error: 'Master catalog needs migrations 0043 + 0044 applied.' }, { status: 500 })
    }
  }

  // ── Import a master into my catalogue (I add price/stock/sku/condition) ─────
  if (body.action === 'import') {
    const { data: m } = await (admin.from('master_products') as any).select('*').eq('id', body.masterId).single()
    if (!m) return NextResponse.json({ error: 'Master product not found' }, { status: 404 })
    const out = await importMaster(admin, m, myId, user.id, body)
    if (out.error) return NextResponse.json({ error: out.error }, { status: 500 })
    return NextResponse.json({ ok: true, productId: out.productId })
  }

  // ── Copy an existing supplier's product (find-or-create its master, import) ──
  if (body.action === 'copyProduct') {
    const { data: src } = await (admin.from('products') as any).select('*').eq('id', body.productId).single()
    if (!src) return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    // Resolve (or create) the master behind the source product.
    let masterId: string | null = src.master_product_id ?? null
    if (!masterId) masterId = await findOrCreateMaster(admin, src, user.id)
    let m: any = masterId ? (await (admin.from('master_products') as any).select('*').eq('id', masterId).single()).data : null
    // Fall back to copying straight from the source product if no master could be built.
    if (!m) {
      const { data: imgs } = await (admin.from('product_images') as any).select('url, sort_order').eq('product_id', src.id)
      m = {
        id: null, category_id: src.category_id, name: src.name, brand_name: src.brand_name,
        description: src.description, family: src.product_line, model: src.model_name, ean: src.ean,
        specs: src.specs ?? {}, image_urls: (imgs ?? []).sort((a: any, b: any) => a.sort_order - b.sort_order).map((i: any) => i.url),
      }
    }
    const out = await importMaster(admin, m, myId, user.id, body)
    if (out.error) return NextResponse.json({ error: out.error }, { status: 500 })
    return NextResponse.json({ ok: true, productId: out.productId })
  }

  // ── Link an existing product to the master DB (find-or-create) ──────────────
  if (body.action === 'link') {
    const { data: p } = await (admin.from('products') as any).select('*').eq('id', body.productId).single()
    if (!p || p.supplier_id !== myId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const masterId = await findOrCreateMaster(admin, p, user.id)
    if (masterId) await (admin.from('products') as any).update({ master_product_id: masterId }).eq('id', p.id)
    return NextResponse.json({ ok: true, masterId })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}

/** Create a draft product for `myId` from a master (or master-shaped object),
 *  copying all shared fields + images and applying the supplier's commercial inputs. */
async function importMaster(
  admin: any,
  m: any,
  myId: string,
  userId: string,
  body: any,
): Promise<{ productId?: string; error?: string }> {
  const name = m.name
  // Fold IMEI (optional, per-unit) into specs; everything else is a column.
  const specs = { ...(m.specs ?? {}) }
  if (body.imei) specs.imei = String(body.imei).trim()

  const base: Record<string, any> = {
    supplier_id: myId, current_owner_id: myId,
    category_id: m.category_id, name, brand_name: m.brand_name, description: m.description,
    product_line: m.family, model_name: m.model, ean: m.ean, specs,
    slug: `${slugify(name).slice(0, 56)}-${Math.random().toString(36).slice(2, 6)}`,
    marketplace_context: 'wholesale', currency_code: 'EUR',
    price_cents: body.price && body.price > 0 ? Math.round(body.price * 100) : 0,
    stock_qty: parseInt(body.stock) || 0, sku: body.sku || null,
    min_order_qty: 1, sell_piece: true, is_published: false,
  }
  // Optional columns (may not be migrated everywhere) — retried stripped on error.
  const optional: Record<string, any> = {
    master_product_id: m.id ?? null,
    condition: body.condition || null,
    warehouse_location: body.warehouse || null,
    warranty: body.warranty || null,
    source_type: 'Supplier', created_by: userId, import_date: new Date().toISOString(),
  }
  let ins = await (admin.from('products') as any).insert({ ...base, ...optional }).select('id').single()
  if (ins.error && /column|does not exist|condition|warehouse|warranty|master_product|source_type|created_by|import_date/i.test(ins.error.message)) {
    ins = await (admin.from('products') as any).insert(base).select('id').single()
  }
  if (ins.error || !ins.data) return { error: ins.error?.message || 'Insert failed' }

  const urls: string[] = m.image_urls ?? []
  if (urls.length) {
    await (admin.from('product_images') as any).insert(urls.map((url, i) => ({ product_id: ins.data.id, url, sort_order: i })))
  }
  return { productId: ins.data.id }
}
