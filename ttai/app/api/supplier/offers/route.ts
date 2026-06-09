import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

/** Create / delete a supplier "Send Offer" broadcast. Server-side with ownership checks. */
function token() {
  return Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 6)
}

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data: supplier } = await (admin.from('suppliers') as any)
    .select('id, trade_name, legal_name').eq('owner_id', user.id).maybeSingle()
  if (!supplier) return NextResponse.json({ error: 'No supplier profile' }, { status: 403 })

  const body = await req.json().catch(() => null) as any
  if (!body?.action) return NextResponse.json({ error: 'Missing action' }, { status: 400 })

  if (body.action === 'create') {
    const title = String(body.title ?? '').trim()
    if (!title) return NextResponse.json({ error: 'Offer title is required' }, { status: 400 })
    const AUD = ['all', 'customer', 'sales_point', 'distributor', 'master_distributor', 'retail', 'b2b', 'end_user']
    const row = {
      supplier_id: supplier.id, token: token(), title,
      message: body.message || null,
      discount_pct: body.discount_pct != null && body.discount_pct !== '' ? Number(body.discount_pct) : null,
      product_ids: Array.isArray(body.product_ids) ? body.product_ids.slice(0, 50) : [],
      audience: AUD.includes(body.audience) ? body.audience : 'all',
    }
    const ins = await (admin.from('supplier_offers') as any).insert(row).select('*').single()
    if (ins.error) return NextResponse.json({ error: ins.error.message }, { status: 500 })
    const base = process.env.NEXT_PUBLIC_APP_URL ?? ''
    return NextResponse.json({ ok: true, offer: ins.data, link: `${base}/o/${ins.data.token}` })
  }

  if (body.action === 'delete') {
    const { data: off } = await (admin.from('supplier_offers') as any).select('supplier_id').eq('id', body.id).maybeSingle()
    if (!off || off.supplier_id !== supplier.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    await (admin.from('supplier_offers') as any).delete().eq('id', body.id)
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
