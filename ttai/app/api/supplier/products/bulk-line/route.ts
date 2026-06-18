import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Bulk-assign a product line (family) to several of the caller's products.
 * Runs with the admin client after verifying the caller owns a supplier shop;
 * the update is hard-scoped to that supplier's own products, so foreign ids
 * passed in the body can never be touched.
 *
 * POST { productIds: string[], line: string | null }
 *   line = a family name ("iPhone") to group them, or null/"" to clear it.
 */
export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: sup } = await supabase.from('suppliers').select('id').eq('owner_id', user.id).maybeSingle()
  if (!sup) return NextResponse.json({ error: 'No supplier profile' }, { status: 403 })

  const body = (await req.json().catch(() => ({}))) as { productIds?: string[]; line?: string | null }
  const ids = Array.isArray(body.productIds) ? body.productIds.filter((x) => typeof x === 'string') : []
  if (ids.length === 0) return NextResponse.json({ error: 'No products selected' }, { status: 400 })
  const line = (body.line ?? '').toString().trim().slice(0, 80) || null

  const admin = createAdminClient()
  const { data, error } = await (admin.from('products') as any)
    .update({ product_line: line })
    .eq('supplier_id', sup.id) // only ever the caller's own products
    .in('id', ids)
    .select('id')
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ updated: (data ?? []).length, line })
}
