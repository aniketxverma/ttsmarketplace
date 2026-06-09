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

  // ── Import a master into my catalogue (I add price/stock/sku/condition) ─────
  if (body.action === 'import') {
    const { data: m } = await (admin.from('master_products') as any).select('*').eq('id', body.masterId).single()
    if (!m) return NextResponse.json({ error: 'Master product not found' }, { status: 404 })

    const name = m.name
    const row: Record<string, any> = {
      supplier_id: myId, current_owner_id: myId, master_product_id: m.id,
      category_id: m.category_id, name, brand_name: m.brand_name, description: m.description,
      product_line: m.family, model_name: m.model, ean: m.ean, specs: m.specs ?? {},
      slug: `${slugify(name).slice(0, 56)}-${Math.random().toString(36).slice(2, 6)}`,
      marketplace_context: 'wholesale', currency_code: 'EUR',
      price_cents: body.price && body.price > 0 ? Math.round(body.price * 100) : 0,
      stock_qty: parseInt(body.stock) || 0, sku: body.sku || null,
      condition: body.condition || null, warehouse_location: body.warehouse || null,
      min_order_qty: 1, sell_piece: true, is_published: false,
      source_type: 'Supplier', created_by: user.id, import_date: new Date().toISOString(),
    }
    let ins = await (admin.from('products') as any).insert(row).select('id').single()
    if (ins.error) return NextResponse.json({ error: ins.error.message }, { status: 500 })
    // Copy images from the master.
    const urls: string[] = m.image_urls ?? []
    if (urls.length) {
      await (admin.from('product_images') as any).insert(urls.map((url, i) => ({ product_id: ins.data.id, url, sort_order: i })))
    }
    return NextResponse.json({ ok: true, productId: ins.data.id })
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
