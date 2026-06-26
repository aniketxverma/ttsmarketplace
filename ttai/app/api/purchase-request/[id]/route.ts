import { NextRequest, NextResponse } from 'next/server'
import React from 'react'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmailFireAndForget } from '@/lib/email/send'
import { PurchaseRequestStatusEmail } from '@/lib/email/templates/PurchaseRequestStatusEmail'

/**
 * Update a purchase request.
 *  - Supplier: confirm (stock/qty/price/delivery) or decline.
 *  - Buyer: cancel, or mark paid after confirmation.
 * Ownership is verified before writing.
 */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data: pr } = await admin.from('purchase_requests').select('id, buyer_id, supplier_id, product_name').eq('id', params.id).maybeSingle()
  if (!pr) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: mySup } = await admin.from('suppliers').select('id').eq('owner_id', user.id).maybeSingle()
  const isSupplier = mySup && (mySup as any).id === (pr as any).supplier_id
  const isBuyer = (pr as any).buyer_id === user.id
  if (!isSupplier && !isBuyer) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const b = await req.json().catch(() => ({})) as Record<string, any>
  const patch: Record<string, any> = {}

  if (isSupplier) {
    if (b.action === 'confirm') {
      patch.status = 'confirmed'
      if (b.confirmedQty != null) patch.confirmed_qty = String(b.confirmedQty)
      if (b.price != null && b.price !== '') patch.confirmed_price_cents = Math.round(parseFloat(b.price) * 100)
      if (b.currency) patch.currency_code = b.currency
      if (b.deliveryTime != null) patch.delivery_time = b.deliveryTime
      if (b.note != null) patch.supplier_note = b.note
    } else if (b.action === 'decline') {
      patch.status = 'declined'
      if (b.note != null) patch.supplier_note = b.note
    }
  }
  if (isBuyer) {
    if (b.action === 'cancel') patch.status = 'cancelled'
    else if (b.action === 'pay') patch.status = 'paid'
  }
  if (!Object.keys(patch).length) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })

  const { error } = await (admin.from('purchase_requests') as any).update(patch).eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Notify the buyer when the supplier confirms or declines.
  if (isSupplier && (patch.status === 'confirmed' || patch.status === 'declined')) {
    try {
      const { data: buyerAuth } = await admin.auth.admin.getUserById((pr as any).buyer_id)
      const email = buyerAuth?.user?.email
      if (email) {
        const { data: sup } = await admin.from('suppliers').select('trade_name, legal_name').eq('id', (pr as any).supplier_id).maybeSingle()
        const { data: prof } = await admin.from('profiles').select('full_name').eq('id', (pr as any).buyer_id).maybeSingle()
        const priceText = patch.confirmed_price_cents
          ? new Intl.NumberFormat('en-EU', { style: 'currency', currency: patch.currency_code || 'EUR' }).format(patch.confirmed_price_cents / 100)
          : null
        sendEmailFireAndForget({
          to: email,
          role: 'contact',
          subject: patch.status === 'confirmed'
            ? `Your request was confirmed — ${(pr as any).product_name || 'product'}`
            : `Update on your request — ${(pr as any).product_name || 'product'}`,
          react: React.createElement(PurchaseRequestStatusEmail, {
            buyerName: (prof as any)?.full_name || email.split('@')[0],
            supplierName: (sup as any)?.trade_name || (sup as any)?.legal_name || 'The supplier',
            productName: (pr as any).product_name || 'your product',
            status: patch.status as 'confirmed' | 'declined',
            priceText,
            deliveryTime: patch.delivery_time ?? null,
            note: patch.supplier_note ?? null,
            appUrl: process.env.NEXT_PUBLIC_APP_URL ?? new URL(req.url).origin,
          }),
          idempotencyKey: `pr-${patch.status}-${params.id}`,
        })
      }
    } catch { /* email best-effort */ }
  }

  return NextResponse.json({ ok: true })
}
