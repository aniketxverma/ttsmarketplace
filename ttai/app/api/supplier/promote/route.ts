import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Supplier self-promotion: a supplier sponsors its own product so it surfaces
 * first in the marketplace. (Billing for the paid placement is handled separately.)
 */
export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { productId, on } = await req.json().catch(() => ({})) as { productId?: string; on?: boolean }
  if (!productId) return NextResponse.json({ error: 'Missing product' }, { status: 400 })

  const admin = createAdminClient()
  // Verify the product belongs to this supplier.
  const { data: prod } = await (admin.from('products') as any)
    .select('id, suppliers!supplier_id(owner_id)').eq('id', productId).single()
  if (!prod || (prod.suppliers as any)?.owner_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    if (on) {
      // Avoid duplicates.
      const { data: existing } = await (admin.from('sponsored_placements') as any)
        .select('id').eq('kind', 'product').eq('product_id', productId).maybeSingle()
      if (!existing) {
        await (admin.from('sponsored_placements') as any).insert({ kind: 'product', product_id: productId, weight: 100, is_active: true })
      }
    } else {
      await (admin.from('sponsored_placements') as any).delete().eq('kind', 'product').eq('product_id', productId)
    }
  } catch (e) {
    return NextResponse.json({ error: 'Promotions need migration 0040 applied first.' }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
