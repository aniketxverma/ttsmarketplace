import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createCheckoutSession } from '@/lib/stripe/checkout'
import { determineVatTreatment, getVatRate, calculateVat } from '@/lib/vat/conditions'
import { calculateFeeSplit } from '@/lib/fees/engine'
import { checkoutSessionSchema } from '@/lib/validation/schemas'

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = checkoutSessionSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })

  const { product_id, quantity, buyer_vat_number, idempotency_key } = parsed.data
  const admin = createAdminClient()

  const { data: product } = await admin
    .from('products')
    .select('id, name, price_cents, currency_code, vat_rate, supplier_id, marketplace_context')
    .eq('id', product_id)
    .eq('is_published', true)
    .single()

  if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 })

  const { data: supplier } = await admin
    .from('suppliers')
    .select('id, legal_name, country_id, broker_id, countries(iso_code)')
    .eq('id', product.supplier_id)
    .eq('status', 'ACTIVE')
    .single()

  if (!supplier) return NextResponse.json({ error: 'Supplier unavailable' }, { status: 404 })

  const { data: buyerProfile } = await admin
    .from('profiles')
    .select('country_id, countries(iso_code, vat_rate)')
    .eq('id', user.id)
    .single()

  const buyerCountryIso = (buyerProfile?.countries as any)?.iso_code ?? 'ES'
  const buyerVatRate = (buyerProfile?.countries as any)?.vat_rate ?? 21
  const supplierCountryIso = (supplier.countries as any)?.iso_code ?? 'ES'

  const vatTreatment = determineVatTreatment({
    supplierCountry: supplierCountryIso,
    buyerCountry: buyerCountryIso,
    buyerVatNumber: buyer_vat_number ?? null,
    marketplaceContext: product.marketplace_context === 'wholesale' ? 'b2b' : 'b2c',
  })

  const unitCents = product.price_cents
  const subtotalCents = unitCents * quantity
  const vatRate = buyerVatRate
  const vatCents = calculateVat(subtotalCents, vatRate, vatTreatment)
  const totalCents = subtotalCents + vatCents

  let brokerStripeAccountId: string | null = null
  let brokerSharePct = 0
  let ttaiCommissionPct = 5
  let ttaiFixedCents = 0

  if ((supplier as any).broker_id) {
    const { data: broker } = await admin
      .from('brokers')
      .select('stripe_account_id, broker_share_pct, commission_pct, fixed_fee_cents')
      .eq('id', (supplier as any).broker_id)
      .eq('stripe_onboarding_complete', true)
      .single()

    if (broker) {
      brokerStripeAccountId = broker.stripe_account_id
      brokerSharePct = broker.broker_share_pct
      ttaiCommissionPct = broker.commission_pct
      ttaiFixedCents = broker.fixed_fee_cents
    }
  }

  const feeSplit = calculateFeeSplit({
    grossCents: totalCents,
    ttaiCommissionPct,
    ttaiFixedCents,
    brokerSharePct,
    vatCents,
  })

  const { data: existingOrder } = await admin
    .from('orders')
    .select('id, stripe_checkout_session_id')
    .eq('idempotency_key', idempotency_key)
    .eq('buyer_id', user.id)
    .single()

  if (existingOrder?.stripe_checkout_session_id) {
    return NextResponse.json({ session_id: existingOrder.stripe_checkout_session_id })
  }

  const { data: order } = await admin
    .from('orders')
    .insert({
      buyer_id: user.id,
      supplier_id: supplier.id,
      broker_id: (supplier as any).broker_id ?? null,
      status: 'pending',
      marketplace_context: product.marketplace_context,
      subtotal_cents: subtotalCents,
      vat_cents: vatCents,
      shipping_cents: 0,
      total_cents: totalCents,
      currency_code: product.currency_code,
      buyer_country_id: buyerProfile?.country_id ?? null,
      idempotency_key,
    })
    .select('id')
    .single()

  if (!order) return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })

  await admin.from('order_items').insert({
    order_id: order.id,
    product_id: product.id,
    quantity,
    unit_price_cents: unitCents,
    vat_rate: vatRate,
    line_total_cents: subtotalCents,
  })

  const session = await createCheckoutSession({
    orderId: order.id,
    lineItems: [{
      price_data: {
        currency: product.currency_code.toLowerCase(),
        product_data: { name: product.name },
        unit_amount: unitCents,
      },
      quantity,
    }],
    successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/buyer/orders/${order.id}?success=1`,
    cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/marketplace/${product_id}`,
    brokerStripeAccountId,
    transferAmountCents: feeSplit.supplierNetCents + feeSplit.brokerNetCents,
  })

  await admin.from('orders').update({ stripe_checkout_session_id: session.id }).eq('id', order.id)

  return NextResponse.json({ session_id: session.id, checkout_url: session.url })
}
