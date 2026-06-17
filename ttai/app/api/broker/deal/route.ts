import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Submit a broker deal — used by the optional TTAIEMA invoicing service and the
 * commission history. Mandatory rule: a broker must have registered at least one
 * Supplier reference AND one Buyer reference before they can manage opportunities.
 */
export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data: broker } = await admin.from('brokers').select('id').eq('user_id', user.id).maybeSingle()
  if (!broker) return NextResponse.json({ error: 'No broker profile found.' }, { status: 404 })
  const brokerId = (broker as any).id

  // Mandatory rule: at least one supplier ref + one buyer ref.
  const [{ count: supRefs }, { count: buyRefs }] = await Promise.all([
    (admin.from('broker_referrals') as any).select('id', { count: 'exact', head: true }).eq('broker_id', brokerId).eq('company_type', 'supplier'),
    (admin.from('broker_referrals') as any).select('id', { count: 'exact', head: true }).eq('broker_id', brokerId).eq('company_type', 'buyer'),
  ])
  if (!supRefs || !buyRefs) {
    return NextResponse.json({ error: 'Register at least one Supplier reference and one Buyer reference before managing deals.' }, { status: 403 })
  }

  const b = await req.json().catch(() => ({})) as Record<string, any>
  if (!b.supplierRef?.trim() || !b.buyerRef?.trim() || !b.product?.trim()) {
    return NextResponse.json({ error: 'Supplier reference, buyer reference and product are required.' }, { status: 400 })
  }

  const priceCents = b.price ? Math.round(parseFloat(b.price) * 100) : null
  const commissionPct = b.commissionPct ? Math.max(0, Math.min(100, parseFloat(b.commissionPct))) : null
  const commissionCents = priceCents && commissionPct ? Math.round(priceCents * (commissionPct / 100)) : null

  const row = {
    broker_id: brokerId,
    supplier_ref: b.supplierRef.trim(),
    buyer_ref: b.buyerRef.trim(),
    product: b.product.trim(),
    quantity: b.quantity?.trim() || null,
    price_cents: priceCents,
    currency_code: b.currencyCode || 'EUR',
    commission_pct: commissionPct,
    commission_cents: commissionCents,
    needs_invoicing: !!b.needsInvoicing,
    status: 'open',
    source: 'broker',
    notes: b.notes?.trim() || null,
  }

  const { error } = await (admin.from('broker_deals') as any).insert(row)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
