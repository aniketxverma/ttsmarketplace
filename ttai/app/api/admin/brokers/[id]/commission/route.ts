import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/rbac'
import { updateCommissionSchema } from '@/lib/validation/schemas'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const profile = await requireRole('admin')
  const supabase = createClient()

  const body = await request.json()
  const parsed = updateCommissionSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })

  const totalDeductions = parsed.data.commissionPct + parsed.data.brokerSharePct
  if (totalDeductions > 50) {
    return NextResponse.json({ error: 'Total deductions cannot exceed 50%' }, { status: 422 })
  }

  const { data, error } = await supabase
    .from('brokers')
    .update({
      commission_pct:   parsed.data.commissionPct,
      fixed_fee_cents:  parsed.data.fixedFeeCents,
      broker_share_pct: parsed.data.brokerSharePct,
    })
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  await supabase.from('admin_audit_log').insert({
    actor_id: profile.id, action: 'BROKER_COMMISSION_UPDATED',
    target_type: 'broker', target_id: params.id,
    payload: parsed.data,
  })

  return NextResponse.json({ broker: data })
}
