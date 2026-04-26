import { NextRequest, NextResponse } from 'next/server'
import { constructWebhookEvent } from '@/lib/stripe/client'
import { createAdminClient } from '@/lib/supabase/admin'
import { calculateFeeSplit } from '@/lib/fees/engine'
import { transferToConnectAccount } from '@/lib/stripe/connect'
import { sendEmailFireAndForget } from '@/lib/email/send'
import { OrderConfirmationEmail } from '@/lib/email/templates/OrderConfirmationEmail'
import { SupplierOrderEmail } from '@/lib/email/templates/SupplierOrderEmail'
import { formatCents } from '@/lib/utils'
import React from 'react'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature') ?? ''

  let event
  try {
    event = constructWebhookEvent(body, sig)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const admin = createAdminClient()

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as { id: string; metadata?: { order_id?: string }; payment_intent?: string }
    const orderId = session.metadata?.order_id
    if (!orderId) return NextResponse.json({ received: true })

    const { data: order } = await admin
      .from('orders')
      .select('id, total_cents, vat_cents, currency_code, supplier_id, broker_id, buyer_id')
      .eq('id', orderId)
      .single()

    if (!order) return NextResponse.json({ received: true })

    await admin.from('orders').update({
      status: 'paid',
      stripe_payment_intent_id: session.payment_intent,
    }).eq('id', orderId)

    let brokerSharePct = 0, ttaiCommissionPct = 5, ttaiFixedCents = 0
    let brokerStripeAccountId: string | null = null

    if (order.broker_id) {
      const { data: broker } = await admin
        .from('brokers')
        .select('broker_share_pct, commission_pct, fixed_fee_cents, stripe_account_id')
        .eq('id', order.broker_id)
        .single()
      if (broker) {
        brokerSharePct = broker.broker_share_pct
        ttaiCommissionPct = broker.commission_pct
        ttaiFixedCents = broker.fixed_fee_cents
        brokerStripeAccountId = broker.stripe_account_id
      }
    }

    const feeSplit = calculateFeeSplit({
      grossCents: order.total_cents,
      ttaiCommissionPct,
      ttaiFixedCents,
      brokerSharePct,
      vatCents: order.vat_cents,
    })

    await admin.from('transaction_ledger').insert({
      order_id: orderId,
      gross_cents: feeSplit.grossCents,
      ttai_commission_cents: feeSplit.ttaiCommissionCents,
      ttai_fixed_cents: feeSplit.ttaiFixedCents,
      broker_net_cents: feeSplit.brokerNetCents,
      supplier_net_cents: feeSplit.supplierNetCents,
      vat_collected_cents: feeSplit.vatCollectedCents,
      currency_code: order.currency_code,
    })

    if (order.broker_id && brokerStripeAccountId && feeSplit.brokerNetCents > 0) {
      const transfer = await transferToConnectAccount({
        destinationAccountId: brokerStripeAccountId,
        amountCents: feeSplit.brokerNetCents,
        orderId,
      })

      await admin.from('payouts').insert({
        recipient_type: 'broker',
        recipient_id: order.broker_id,
        amount_cents: feeSplit.brokerNetCents,
        currency_code: order.currency_code,
        status: 'completed',
        stripe_transfer_id: transfer.id,
      })
    }

    const [{ data: buyerAuth }, { data: supplierRow }] = await Promise.all([
      admin.auth.admin.getUserById(order.buyer_id),
      admin.from('suppliers').select('legal_name, owner_id').eq('id', order.supplier_id).single(),
    ])

    const { data: buyerProfile } = await admin.from('profiles').select('full_name').eq('id', order.buyer_id).single()
    const totalFormatted = formatCents(order.total_cents, order.currency_code)

    if (buyerAuth?.user?.email) {
      sendEmailFireAndForget({
        to: buyerAuth.user.email,
        subject: `Order confirmed — ${totalFormatted}`,
        react: React.createElement(OrderConfirmationEmail, {
          buyerName: buyerProfile?.full_name ?? 'Buyer',
          orderId,
          totalFormatted,
          vatTreatment: 'standard',
          supplierName: supplierRow?.legal_name ?? '—',
          appUrl: process.env.NEXT_PUBLIC_APP_URL!,
        }),
        idempotencyKey: `order-confirm-${orderId}`,
      })
    }

    if (supplierRow?.owner_id) {
      const { data: supplierAuth } = await admin.auth.admin.getUserById(supplierRow.owner_id)
      if (supplierAuth?.user?.email) {
        sendEmailFireAndForget({
          to: supplierAuth.user.email,
          subject: `New order received — ${totalFormatted}`,
          react: React.createElement(SupplierOrderEmail, {
            supplierName: supplierRow.legal_name,
            orderId,
            totalFormatted,
            appUrl: process.env.NEXT_PUBLIC_APP_URL!,
          }),
          idempotencyKey: `supplier-order-${orderId}`,
        })
      }
    }
  }

  if (event.type === 'account.updated') {
    const account = event.data.object as { id: string; charges_enabled: boolean; payouts_enabled: boolean }
    if (account.charges_enabled && account.payouts_enabled) {
      await admin
        .from('brokers')
        .update({ stripe_onboarding_complete: true })
        .eq('stripe_account_id', account.id)
    }
  }

  return NextResponse.json({ received: true })
}
