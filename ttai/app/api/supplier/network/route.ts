import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Sales Network — inviter (supplier) side. Create / list / revoke invitations.
 * Runs server-side with the admin client after verifying the caller owns the supplier.
 */
function token() {
  return Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10)
}

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data: supplier } = await (admin.from('suppliers') as any)
    .select('id, trade_name, legal_name').eq('owner_id', user.id).maybeSingle()
  if (!supplier) return NextResponse.json({ error: 'No supplier profile found' }, { status: 403 })

  const body = await req.json().catch(() => null) as any
  if (!body?.action) return NextResponse.json({ error: 'Missing action' }, { status: 400 })

  // ── Create an invitation ──────────────────────────────────────────────
  if (body.action === 'invite') {
    const company = String(body.company_name ?? '').trim()
    if (!company) return NextResponse.json({ error: 'Company name is required' }, { status: 400 })
    const LEVELS = ['customer', 'sales_point', 'distributor', 'master_distributor']
    const row = {
      inviter_supplier_id: supplier.id,
      company_name: company,
      contact_person: body.contact_person || null,
      email: body.email || null,
      whatsapp: body.whatsapp || null,
      country: body.country || null,
      city: body.city || null,
      address: body.address || null,
      level: LEVELS.includes(body.level) ? body.level : 'sales_point',
      status: 'pending',
      token: token(),
    }
    const ins = await (admin.from('sales_network') as any).insert(row).select('*').single()
    if (ins.error) return NextResponse.json({ error: ins.error.message }, { status: 500 })

    const base = process.env.NEXT_PUBLIC_APP_URL ?? ''
    const link = `${base}/join/${ins.data.token}`
    const inviterName = supplier.trade_name ?? supplier.legal_name ?? 'A supplier'
    return NextResponse.json({ ok: true, invite: ins.data, link, inviterName })
  }

  // ── Revoke / delete an invitation ─────────────────────────────────────
  if (body.action === 'revoke') {
    const { data: inv } = await (admin.from('sales_network') as any)
      .select('inviter_supplier_id').eq('id', body.id).maybeSingle()
    if (!inv || inv.inviter_supplier_id !== supplier.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    await (admin.from('sales_network') as any).delete().eq('id', body.id)
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
