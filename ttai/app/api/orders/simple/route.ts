import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { unitPrice, type PurchaseUnit } from '@/lib/packaging'
import { z } from 'zod'

const schema = z.object({
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().min(1),
    unit: z.enum(['piece', 'box', 'pallet', 'truck']).optional(),
    retail: z.boolean().optional(),
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
  const { data: products } = await (admin
    .from('products') as any)
    .select(`id, name, price_cents, retail_price_cents, currency_code, vat_rate, supplier_id, stock_qty, marketplace_context,
      units_per_carton, cartons_per_pallet, pallets_per_truck,
      price_per_box_cents, price_per_pallet_cents, price_per_truck_cents,
      sell_piece, sell_box, sell_pallet, sell_truck`)
    .in('id', productIds)
    .eq('is_published', true) as { data: any[] | null }

  // Server-authoritative price for a cart line (never trusts the client price).
  const linePrice = (product: any, item: { unit?: string; retail?: boolean }) =>
    unitPrice(product, (item.unit ?? 'piece') as PurchaseUnit, !!item.retail)

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
    const subtotalCents = supplierItems.reduce((sum: number, item: any) => {
      const product = products.find(p => p.id === item.productId)!
      return sum + linePrice(product, item) * item.quantity
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

    const orderItems = supplierItems.map((item: any) => {
      const product = products.find(p => p.id === item.productId)!
      const unitCents = linePrice(product, item)
      return {
        order_id: order.id,
        product_id: item.productId,
        quantity: item.quantity,
        unit_price_cents: unitCents,
        vat_rate: product.vat_rate ?? 10,
        line_total_cents: unitCents * item.quantity,
        purchase_unit: item.unit ?? 'piece',
      }
    })

    await (admin.from('order_items') as any).insert(orderItems)
    orderIds.push(order.id)
  }

  return NextResponse.json({ orderIds, primaryOrderId: orderIds[0] })
}
