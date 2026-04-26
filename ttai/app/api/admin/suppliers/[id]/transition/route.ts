import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireRole } from '@/lib/auth/rbac'
import { transitionSupplierSchema } from '@/lib/validation/schemas'
import { sendEmailFireAndForget } from '@/lib/email/send'
import { SupplierVerificationStatusEmail } from '@/lib/email/templates/SupplierVerificationStatusEmail'
import React from 'react'

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  PENDING:      ['UNDER_REVIEW'],
  UNDER_REVIEW: ['ACTIVE', 'PENDING', 'SUSPENDED'],
  ACTIVE:       ['SUSPENDED'],
  SUSPENDED:    ['ACTIVE', 'PENDING'],
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const profile = await requireRole('admin')
  const supabase = createClient()

  const body = await request.json()
  const parsed = transitionSupplierSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })

  const { data: supplier } = await supabase
    .from('suppliers')
    .select('id, status, legal_name, owner_id')
    .eq('id', params.id)
    .single()

  if (!supplier) return NextResponse.json({ error: 'Supplier not found' }, { status: 404 })

  const allowed = ALLOWED_TRANSITIONS[supplier.status] ?? []
  if (!allowed.includes(parsed.data.targetStatus)) {
    return NextResponse.json(
      { error: `Transition from ${supplier.status} to ${parsed.data.targetStatus} is not allowed` },
      { status: 422 }
    )
  }

  const updateData: Record<string, unknown> = { status: parsed.data.targetStatus }
  if (parsed.data.targetStatus === 'ACTIVE') {
    updateData.verified_at = new Date().toISOString()
  }

  const { error: updateError } = await supabase
    .from('suppliers')
    .update(updateData)
    .eq('id', params.id)

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

  await supabase.from('supplier_state_audit').insert({
    supplier_id: params.id,
    from_status: supplier.status,
    to_status:   parsed.data.targetStatus,
    reason:      parsed.data.reason,
    actor_id:    profile.id,
  })

  await supabase.from('admin_audit_log').insert({
    actor_id:    profile.id,
    action:      'SUPPLIER_TRANSITION',
    target_type: 'supplier',
    target_id:   params.id,
    payload:     { from: supplier.status, to: parsed.data.targetStatus, reason: parsed.data.reason },
  })

  const admin = createAdminClient()
  const { data: supplierAuth } = await admin.auth.admin.getUserById(supplier.owner_id)
  if (supplierAuth?.user?.email) {
    sendEmailFireAndForget({
      to: supplierAuth.user.email,
      subject: `Your supplier account status: ${parsed.data.targetStatus.toLowerCase()}`,
      react: React.createElement(SupplierVerificationStatusEmail, {
        legalName: supplier.legal_name,
        newStatus: parsed.data.targetStatus.toLowerCase(),
        reason: parsed.data.reason,
        appUrl: process.env.NEXT_PUBLIC_APP_URL!,
      }),
      idempotencyKey: `supplier-status-${params.id}-${parsed.data.targetStatus}`,
    })
  }

  return NextResponse.json({ supplierId: params.id, from: supplier.status, to: parsed.data.targetStatus })
}
