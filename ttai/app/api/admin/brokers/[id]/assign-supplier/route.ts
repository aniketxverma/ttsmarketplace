import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/rbac'

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  await requireRole('admin')
  const supabase = createClient()

  const { data, error } = await supabase
    .from('broker_supplier_assignments')
    .select('supplier_id, assigned_at, suppliers(id, legal_name, status)')
    .eq('broker_id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ assignments: data })
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const profile = await requireRole('admin')
  const supabase = createClient()
  const { supplier_id } = await request.json()

  if (!supplier_id) return NextResponse.json({ error: 'supplier_id required' }, { status: 400 })

  const { error } = await supabase.from('broker_supplier_assignments').insert({
    broker_id: params.id, supplier_id,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  await supabase.from('admin_audit_log').insert({
    actor_id: profile.id, action: 'BROKER_SUPPLIER_ASSIGNED',
    target_type: 'broker', target_id: params.id,
    payload: { supplier_id },
  })

  return NextResponse.json({ success: true }, { status: 201 })
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const profile = await requireRole('admin')
  const supabase = createClient()
  const { supplier_id } = await request.json()

  if (!supplier_id) return NextResponse.json({ error: 'supplier_id required' }, { status: 400 })

  const { error } = await supabase
    .from('broker_supplier_assignments')
    .delete()
    .eq('broker_id', params.id)
    .eq('supplier_id', supplier_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  await supabase.from('admin_audit_log').insert({
    actor_id: profile.id, action: 'BROKER_SUPPLIER_REMOVED',
    target_type: 'broker', target_id: params.id,
    payload: { supplier_id },
  })

  return NextResponse.json({ success: true })
}
