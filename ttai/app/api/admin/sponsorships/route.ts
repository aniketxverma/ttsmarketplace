import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

async function requireAdmin() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  return me?.role === 'admin' ? user : null
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const body = await req.json().catch(() => ({})) as any
  const admin = createAdminClient()

  if (body.action === 'add') {
    if (!body.productId) return NextResponse.json({ error: 'Choose a product' }, { status: 400 })
    const { error } = await (admin.from('sponsored_placements') as any).insert({
      kind: 'product',
      product_id: body.productId,
      category_id: body.categoryId || null,
      weight: Number(body.weight) || 100,
      ends_at: body.endsAt || null,
      is_active: true,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  if (body.action === 'remove') {
    await (admin.from('sponsored_placements') as any).delete().eq('id', body.id)
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
