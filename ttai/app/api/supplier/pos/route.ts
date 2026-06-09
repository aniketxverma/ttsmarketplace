import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Points of Sale CRUD for the logged-in supplier. Runs server-side with the admin
 * client (after verifying ownership) so RLS quirks never silently drop writes.
 * POST { action: 'save' | 'delete', id?, pos } → { ok, pos? }
 */
export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data: supplier } = await (admin.from('suppliers') as any)
    .select('id').eq('owner_id', user.id).maybeSingle()
  if (!supplier) return NextResponse.json({ error: 'No supplier profile found' }, { status: 403 })

  const body = await req.json().catch(() => null) as { action?: string; id?: string; pos?: any } | null
  if (!body?.action) return NextResponse.json({ error: 'Missing action' }, { status: 400 })

  // Ownership guard for an existing POS.
  async function ownsPos(posId: string) {
    const { data } = await (admin.from('supplier_pos') as any).select('supplier_id').eq('id', posId).maybeSingle()
    return data?.supplier_id === supplier.id
  }

  if (body.action === 'delete') {
    if (!body.id || !(await ownsPos(body.id))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const { error } = await (admin.from('supplier_pos') as any).delete().eq('id', body.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  if (body.action === 'save') {
    const p = body.pos ?? {}
    const name = String(p.name ?? '').trim()
    if (!name) return NextResponse.json({ error: 'POS name is required' }, { status: 400 })

    const TYPES = ['shop','warehouse','distributor','pickup_point','franchise','client_store','agent_office','export_hub']
    const STATUSES = ['active','temporarily_closed','closed']
    const core = {
      name,
      type: TYPES.includes(p.type) ? p.type : 'shop',
      status: STATUSES.includes(p.status) ? p.status : 'active',
      is_public: p.is_public !== false,
    }
    const location = {
      address_line1: p.address_line1 || null,
      address_line2: p.address_line2 || null,
      city: p.city || null,
      region: p.region || null,
      postal_code: p.postal_code || null,
      country: p.country || null,
      latitude: p.latitude !== '' && p.latitude != null ? Number(p.latitude) : null,
      longitude: p.longitude !== '' && p.longitude != null ? Number(p.longitude) : null,
    }
    const details = {
      manager_name: p.manager_name || null,
      phone: p.phone || null,
      whatsapp: p.whatsapp || null,
      email: p.email || null,
      accepts_walk_ins: p.accepts_walk_ins !== false,
      accepts_orders: p.accepts_orders !== false,
      services_offered: Array.isArray(p.services_offered) ? p.services_offered : [],
      notes: p.notes || null,
      opening_hours: p.opening_hours ?? {},
    }

    let posId = body.id ?? null
    if (posId) {
      if (!(await ownsPos(posId))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      const { error } = await (admin.from('supplier_pos') as any).update(core).eq('id', posId)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    } else {
      const { data: countRows } = await (admin.from('supplier_pos') as any).select('id').eq('supplier_id', supplier.id)
      const ins = await (admin.from('supplier_pos') as any)
        .insert({ supplier_id: supplier.id, ...core, sort_order: (countRows ?? []).length })
        .select('id').single()
      if (ins.error || !ins.data) return NextResponse.json({ error: ins.error?.message ?? 'Create failed' }, { status: 500 })
      posId = ins.data.id
    }

    // Upsert the 1:1 location + details rows.
    const upLoc = await (admin.from('pos_locations') as any).upsert({ pos_id: posId, ...location }, { onConflict: 'pos_id' })
    const upDet = await (admin.from('pos_details') as any).upsert({ pos_id: posId, ...details }, { onConflict: 'pos_id' })
    if (upLoc.error) return NextResponse.json({ error: upLoc.error.message }, { status: 500 })
    if (upDet.error) return NextResponse.json({ error: upDet.error.message }, { status: 500 })

    return NextResponse.json({
      ok: true,
      pos: { id: posId, ...core, pos_locations: location, pos_details: details },
    })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
