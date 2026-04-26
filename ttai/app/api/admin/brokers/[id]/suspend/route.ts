import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/rbac'

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const profile = await requireRole('admin')
  const supabase = createClient()

  const { error } = await supabase.from('brokers').update({ status: 'SUSPENDED' }).eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  await supabase.from('admin_audit_log').insert({
    actor_id: profile.id, action: 'BROKER_SUSPENDED', target_type: 'broker', target_id: params.id,
  })

  return NextResponse.json({ success: true })
}
