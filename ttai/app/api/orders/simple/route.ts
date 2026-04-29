import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

const schema = z.object({
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().min(1),
  })).min(1),
  shippingAddress: z.object({
    fullName: z.string().min(1),
    line1: z.string().min(1),
    city: z.string().min(1),
    postalCode: z.string().min(1),
    country: z.string().min(2),
    phone: z.string().optional(),
  }),
})

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Please log in to place an order' }, { status: 401 })

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })

  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })

  const { items, shippingAddress } = parsed.data
  const admin = createAdminClient()

  // Fetch all products in one query
  const productIds = items.map(i => i.productId)
  const { data: products } = await admin
    .from('products')
    .select('id, name, price_cents, currency_code, vat_rate, supplier_id, stock_qty, marketplace_context')
    .in('id', productIds)
    .eq('is_published', true)

  if (!products || products.length !== items.length) {
    return NextResponse.json({ error: 'One or more products not found' }, { status: 404 })
  }

  // Group items by supplier (one order per supplier for simplicity)
  const supplierGroups = new Map<string, typeof items>()
  for (const item of items) {
    const product = products.find(p => p.id === item.productId)!
    const sid = product.supplier_id
    if (!supplierGroups.has(sid)) supplierGroups.set(sid, [])
    supplierGroups.get(sid)!.push(item)
  }

  // Validate all suppliers are active
  const supplierIds = Array.from(supplierGroups.keys())
  const { data: suppliers } = await admin
    .from('suppliers')
    .select('id, legal_name')
    .in('id', supplierIds)
    .eq('status', 'ACTIVE')

  if (!suppliers || suppliers.length !== supplierIds.length) {
    return NextResponse.json({ error: 'One or more suppliers are not available' }, { status: 404 })
  }

  const orderIds: string[] = []

  for (const [supplierId, supplierItems] of Array.from(supplierGroups.entries())) {
    const subtotalCents = supplierItems.reduce((sum: number, item: { productId: string; quantity: number }) => {
      const product = products.find(p => p.id === item.productId)!
      return sum + product.price_cents * item.quantity
    }, 0)

    const vatCents = Math.round(subtotalCents * 0.1) // flat 10% demo VAT
    const totalCents = subtotalCents + vatCents

    const currency = products.find(p => p.supplier_id === supplierId)?.currency_code ?? 'EUR'

    const { data: order, error: orderError } = await admin
      .from('orders')
      .insert({
        buyer_id: user.id,
        supplier_id: supplierId,
        status: 'paid',
        marketplace_context: 'wholesale',
        subtotal_cents: subtotalCents,
        vat_cents: vatCents,
        shipping_cents: 0,
        total_cents: totalCents,
        currency_code: currency,
        shipping_address: shippingAddress,
        idempotency_key: `demo-${user.id}-${supplierId}-${Date.now()}`,
      })
      .select('id')
      .single()

    if (orderError || !order) {
      console.error('Order insert error:', orderError)
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
    }

    const orderItems = supplierItems.map((item: { productId: string; quantity: number }) => {
      const product = products.find(p => p.id === item.productId)!
      return {
        order_id: order.id,
        product_id: item.productId,
        quantity: item.quantity,
        unit_price_cents: product.price_cents,
        vat_rate: product.vat_rate ?? 10,
        line_total_cents: product.price_cents * item.quantity,
      }
    })

    await admin.from('order_items').insert(orderItems)
    orderIds.push(order.id)
  }

  return NextResponse.json({ orderIds, primaryOrderId: orderIds[0] })
}
