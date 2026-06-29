import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { slugify } from '@/lib/utils'

export const maxDuration = 120

/**
 * Accept a sales-network invitation. Ensures the accepter has a supplier (creates a
 * minimal one + an online store if needed), links them to the inviter's network, and
 * optionally imports the inviter's published catalogue into the new store.
 */
export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Please sign in to accept' }, { status: 401 })

  const body = await req.json().catch(() => null) as { token?: string; importCatalog?: boolean } | null
  if (!body?.token) return NextResponse.json({ error: 'Missing token' }, { status: 400 })

  const admin = createAdminClient()
  const { data: invite } = await (admin.from('sales_network') as any)
    .select('*').eq('token', body.token).maybeSingle()
  if (!invite) return NextResponse.json({ error: 'Invitation not found' }, { status: 404 })
  if (invite.status === 'revoked') return NextResponse.json({ error: 'This invitation was withdrawn' }, { status: 410 })
  if (invite.status === 'accepted') return NextResponse.json({ ok: true, alreadyAccepted: true })

  // ── Ensure the accepter has a supplier (their store) ────────────────────
  let { data: supplier } = await (admin.from('suppliers') as any)
    .select('id').eq('owner_id', user.id).maybeSingle()

  if (!supplier) {
    const base: Record<string, any> = {
      owner_id: user.id,
      legal_name: invite.company_name,
      trade_name: invite.company_name,
      tax_id: 'PENDING-' + Math.random().toString(36).slice(2, 8).toUpperCase(),
      status: 'ACTIVE',                 // gets a working store immediately
      marketplace_context: 'retail',    // online shop by default (B2B is a paid upgrade)
      reliability_tier: 'UNVERIFIED',
      phone: invite.whatsapp || null,
      whatsapp: invite.whatsapp || null,
      business_email: invite.email || null,
    }
    const ins = await (admin.from('suppliers') as any).insert(base).select('id').single()
    if (ins.error || !ins.data) return NextResponse.json({ error: ins.error?.message ?? 'Could not create your store' }, { status: 500 })
    supplier = ins.data
    // Promote their profile so they see the supplier dashboard.
    await (admin.from('profiles') as any).update({ role: 'supplier' }).eq('id', user.id)
  }

  // ── Optionally import the inviter's published catalogue ──────────────────
  let imported = 0
  if (body.importCatalog) {
    try {
      const { data: src } = await (admin.from('products') as any)
        .select('id, name, brand_name, description, specs, category_id, product_line, model_name, ean, master_product_id, price_cents, retail_price_cents, vat_rate, currency_code, product_images(url, sort_order)')
        .eq('supplier_id', invite.inviter_supplier_id)
        .eq('is_published', true)
        .limit(300)

      for (const p of (src ?? []) as any[]) {
        const row: Record<string, any> = {
          supplier_id: supplier.id, master_product_id: p.master_product_id ?? null,
          category_id: p.category_id, name: p.name, brand_name: p.brand_name ?? null,
          description: p.description ?? null, specs: p.specs ?? {},
          product_line: p.product_line ?? null, model_name: p.model_name ?? null, ean: p.ean ?? null,
          price_cents: p.price_cents ?? 0, retail_price_cents: p.retail_price_cents ?? null,
          currency_code: p.currency_code ?? 'EUR', vat_rate: p.vat_rate ?? null,
          marketplace_context: 'retail', min_order_qty: 1, stock_qty: 0,
          sell_piece: true, is_published: true,
          slug: `${slugify(p.name).slice(0, 50)}-${Math.random().toString(36).slice(2, 6)}`,
          // Auto-dropship: this listing is fulfilled by the mother brand at its price.
          dropship_supplier_id: invite.inviter_supplier_id,
          dropship_cost_cents: p.price_cents ?? 0,
        }
        // Defensive: strip optional cols if a column isn't migrated.
        let ins = await (admin.from('products') as any).insert(row).select('id').single()
        if (ins.error && /column|does not exist/i.test(ins.error.message)) {
          delete row.master_product_id; delete row.specs; delete row.brand_name
          delete row.dropship_supplier_id; delete row.dropship_cost_cents
          ins = await (admin.from('products') as any).insert(row).select('id').single()
        }
        if (ins.error || !ins.data) continue
        const imgs = (p.product_images ?? []) as any[]
        if (imgs.length) {
          await (admin.from('product_images') as any).insert(
            imgs.sort((a, b) => a.sort_order - b.sort_order).slice(0, 6).map((im, i) => ({ product_id: ins.data.id, url: im.url, sort_order: i })),
          )
        }
        imported++
      }
    } catch { /* import best-effort */ }
  }

  // ── Mark the invitation accepted + linked ───────────────────────────────
  await (admin.from('sales_network') as any).update({
    member_supplier_id: supplier.id,
    member_user_id: user.id,
    status: 'accepted',
    accepted_at: new Date().toISOString(),
    imported_catalog: imported > 0,
  }).eq('id', invite.id)

  // Reflect the new partner on the inviter's Distribution Network map automatically
  // (links/verifies a matching country node, or adds a new official one).
  try {
    const { linkMemberToNetwork } = await import('@/lib/distribution-network')
    await linkMemberToNetwork(admin, invite.inviter_supplier_id, {
      supplierId: supplier.id,
      company: invite.company_name,
      countryName: invite.country,
      level: invite.level,
    })
  } catch { /* never block accept */ }

  return NextResponse.json({ ok: true, imported })
}
