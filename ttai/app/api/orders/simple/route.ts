import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { unitPrice, minUnitsFor, type PurchaseUnit } from '@/lib/packaging'
import { determineTax, invoiceTreatment } from '@/lib/tax'
import { getTaxConfig } from '@/lib/pricing-config'
import { stripe } from '@/lib/stripe/client'
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
  vatNumber: z.string().optional(),
  paymentMethod: z.enum(['bank_transfer', 'card', 'cod']).optional(),
})

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Please log in to place an order' }, { status: 401 })

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })

  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })

  const { items, shippingAddress, vatNumber } = parsed.data
  const paymentMethod = parsed.data.paymentMethod ?? 'bank_transfer'
  const admin = createAdminClient()

  // Buyer profile (read defensively — vat_number column may not be migrated yet).
  const { data: buyer } = await (admin.from('profiles') as any).select('*').eq('id', user.id).single()
  const isBusiness = !!(buyer?.business_type) || ['supplier', 'broker', 'business_client'].includes(buyer?.role)
  const buyerVat = (vatNumber || buyer?.vat_number || '').trim() || null
  const buyerCountry = (shippingAddress.country || buyer?.tax_country || '').toUpperCase()
  const taxConfig = await getTaxConfig()

  // Fetch all products in one query (retry without optional discount cols if not migrated)
  const productIds = items.map(i => i.productId)
  const prodSelect = (withDisc: boolean) => `id, name, price_cents, retail_price_cents, currency_code, vat_rate, supplier_id, stock_qty, marketplace_context,
      min_order_qty, min_box_qty, min_pallet_qty, min_truck_qty,
      units_per_carton, cartons_per_pallet, pallets_per_truck,
      price_per_box_cents, price_per_pallet_cents, price_per_truck_cents,
      ${withDisc ? 'box_discount_pct, pallet_discount_pct, truck_discount_pct,' : ''}
      sell_piece, sell_box, sell_pallet, sell_truck,
      categories(slug)`
  let prodRes = await (admin.from('products') as any).select(prodSelect(true)).in('id', productIds).eq('is_published', true)
  if (prodRes.error && /column|does not exist|discount_pct/i.test(prodRes.error.message)) {
    prodRes = await (admin.from('products') as any).select(prodSelect(false)).in('id', productIds).eq('is_published', true)
  }
  const products = prodRes.data as any[] | null

  // Server-authoritative price for a cart line (never trusts the client price).
  const linePrice = (product: any, item: { unit?: string; retail?: boolean }) =>
    unitPrice(product, (item.unit ?? 'piece') as PurchaseUnit, !!item.retail)

  if (!products || products.length !== items.length) {
    return NextResponse.json({ error: 'One or more products not found' }, { status: 404 })
  }

  // Dropship source per product (which mother brand fulfills it, and at what cost).
  // Defensive — the columns may not be migrated yet.
  const dropMap = new Map<string, { mother: string; cost: number }>()
  try {
    const { data } = await (admin.from('products') as any)
      .select('id, dropship_supplier_id, dropship_cost_cents').in('id', productIds)
    for (const r of (data ?? []) as any[]) if (r.dropship_supplier_id) dropMap.set(r.id, { mother: r.dropship_supplier_id, cost: r.dropship_cost_cents ?? 0 })
  } catch { /* not migrated */ }

  // Enforce the per-tier minimum order quantity (piece / box / pallet / truck).
  for (const item of items) {
    const product = products.find(p => p.id === item.productId)!
    const unit = (item.unit ?? 'piece') as PurchaseUnit
    const min = minUnitsFor(product, unit)
    if (item.quantity < min) {
      return NextResponse.json(
        { error: `"${product.name}" has a minimum order of ${min} ${unit}${min > 1 ? 's' : ''}.` },
        { status: 400 },
      )
    }
  }

  // Group items by supplier (one order per supplier for simplicity)
  const supplierGroups = new Map<string, typeof items>()
  for (const item of items) {
    const product = products.find(p => p.id === item.productId)!
    const sid = product.supplier_id
    if (!supplierGroups.has(sid)) supplierGroups.set(sid, [])
    supplierGroups.get(sid)!.push(item)
  }

  // Validate all suppliers are active (and grab their country for tax determination)
  const supplierIds = Array.from(supplierGroups.keys())
  const { data: suppliers } = await (admin
    .from('suppliers') as any)
    .select('*, countries(iso_code)')
    .in('id', supplierIds)
    .eq('status', 'ACTIVE')

  if (!suppliers || suppliers.length !== supplierIds.length) {
    return NextResponse.json({ error: 'One or more suppliers are not available' }, { status: 404 })
  }
  const supplierById = new Map<string, any>((suppliers as any[]).map((s) => [s.id, s]))

  const orderIds: string[] = []
  const stripeLineItems: any[] = []
  let cartTotalVat = 0
  let cartCurrency = 'EUR'

  for (const [supplierId, supplierItems] of Array.from(supplierGroups.entries())) {
    const subtotalCents = supplierItems.reduce((sum: number, item: any) => {
      const product = products.find(p => p.id === item.productId)!
      return sum + linePrice(product, item) * item.quantity
    }, 0)

    const supplier = supplierById.get(supplierId)

    // ── Minimum order value: the buyer can mix products to reach it ──
    const minVal = supplier?.min_order_value_cents ?? 0
    if (minVal > 0 && subtotalCents < minVal) {
      const cur = products.find(p => p.supplier_id === supplierId)?.currency_code ?? 'EUR'
      const f = (c: number) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: cur }).format(c / 100)
      const who = supplier?.trade_name ?? supplier?.legal_name ?? 'This supplier'
      return NextResponse.json(
        { error: `${who} requires a minimum order of ${f(minVal)}. Your order is ${f(subtotalCents)} — add ${f(minVal - subtotalCents)} more from this supplier.` },
        { status: 400 },
      )
    }

    // ── Tax determination (B2C / B2B · country · VAT number · EU reverse charge) ──
    const sellerCountry = supplier?.countries?.iso_code ?? 'ES'
    const reverseChargeCategory = supplierItems.some((it: any) => {
      const slug = products.find(p => p.id === it.productId)?.categories?.slug?.toLowerCase()
      return slug && taxConfig.reverseChargeCategories.includes(slug)
    })
    const tax = determineTax({
      sellerCountry, buyerCountry, buyerVatNumber: buyerVat, isBusiness,
      reverseChargeCategory,
      config: { vatEnabled: taxConfig.vatEnabled, defaultRatePct: taxConfig.defaultRatePct, euReverseCharge: taxConfig.euReverseCharge },
    })
    const vatCents = tax.treatment === 'standard' ? Math.round(subtotalCents * tax.ratePct / 100) : 0
    const totalCents = subtotalCents + vatCents

    const currency = products.find(p => p.supplier_id === supplierId)?.currency_code ?? 'EUR'

    // Orders start 'pending'. Card → marked 'paid' by the Stripe webhook; bank
    // transfer / COD stay 'pending' until the supplier confirms receipt.
    const orderRow: Record<string, any> = {
      buyer_id: user.id,
      supplier_id: supplierId,
      status: 'pending',
      marketplace_context: 'wholesale',
      subtotal_cents: subtotalCents,
      vat_cents: vatCents,
      shipping_cents: 0,
      total_cents: totalCents,
      currency_code: currency,
      shipping_address: shippingAddress,
      payment_method: paymentMethod,
      idempotency_key: `ord-${user.id}-${supplierId}-${Date.now()}`,
    }
    let orderRes = await (admin.from('orders') as any).insert(orderRow).select('id').single()
    if (orderRes.error && /payment_method|column|does not exist/i.test(orderRes.error.message)) {
      const { payment_method, ...noPm } = orderRow
      orderRes = await (admin.from('orders') as any).insert(noPm).select('id').single()
    }
    const order = orderRes.data
    const orderError = orderRes.error

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
        vat_rate: tax.ratePct,
        line_total_cents: unitCents * item.quantity,
        purchase_unit: item.unit ?? 'piece',
      }
    })

    await (admin.from('order_items') as any).insert(orderItems)

    // Collect Stripe line items (used only when paying by card).
    for (const item of supplierItems as any[]) {
      const product = products.find(p => p.id === item.productId)!
      stripeLineItems.push({
        price_data: { currency: currency.toLowerCase(), product_data: { name: product.name }, unit_amount: linePrice(product, item) },
        quantity: item.quantity,
      })
    }
    cartTotalVat += vatCents
    cartCurrency = currency

    // ── Automatic invoice ───────────────────────────────────────────────────
    const invoiceNumber = `INV-${new Date().getFullYear()}-${Date.now().toString(36)}-${String(supplierId).slice(0, 4)}`.toUpperCase()
    await (admin.from('invoices') as any).insert({
      order_id: order.id,
      supplier_id: supplierId,
      invoice_number: invoiceNumber,
      amount_cents: totalCents,
      currency_code: currency,
      buyer_country: buyerCountry.slice(0, 2),
      buyer_vat_number: buyerVat,
      vat_treatment: invoiceTreatment(tax.treatment),
      conditions_payload: {
        subtotal_cents: subtotalCents, vat_cents: vatCents, vat_rate: tax.ratePct,
        treatment: tax.treatment, reason: tax.reason,
        buyer_name: shippingAddress.fullName, buyer_company: buyer?.company_name ?? null,
        seller: supplier?.trade_name ?? supplier?.legal_name ?? null, seller_country: sellerCountry,
      },
      issued_at: new Date().toISOString(),
    }).then((r: any) => { if (r?.error) console.error('Invoice insert error:', r.error.message) })

    orderIds.push(order.id)

    // ── Auto-dropship: forward dropshipped items to the mother brand to ship the
    //    end customer directly. The sales point pays the mother the cost; the margin
    //    (sales-point price − cost) stays with the sales point. Non-fatal.
    try {
      const motherGroups = new Map<string, typeof supplierItems>()
      for (const it of supplierItems as any[]) {
        const d = dropMap.get(it.productId)
        if (!d || d.mother === supplierId) continue
        if (!motherGroups.has(d.mother)) motherGroups.set(d.mother, [] as any)
        motherGroups.get(d.mother)!.push(it)
      }
      for (const [motherId, mItems] of Array.from(motherGroups.entries())) {
        const mSubtotal = (mItems as any[]).reduce((s, it) => s + (dropMap.get(it.productId)?.cost ?? 0) * it.quantity, 0)
        const supplyRow: Record<string, any> = {
          buyer_id: supplier?.owner_id, supplier_id: motherId, status: 'pending',
          marketplace_context: 'wholesale', subtotal_cents: mSubtotal, vat_cents: 0, shipping_cents: 0,
          total_cents: mSubtotal, currency_code: currency, shipping_address: shippingAddress,
          payment_method: 'dropship', source_order_id: order.id,
          idempotency_key: `drop-${order.id}-${motherId}`,
        }
        if (!supplyRow.buyer_id) continue
        let sup = await (admin.from('orders') as any).insert(supplyRow).select('id').single()
        if (sup.error && /column|does not exist|payment_method|source_order/i.test(sup.error.message)) {
          const { payment_method, source_order_id, ...rest } = supplyRow
          sup = await (admin.from('orders') as any).insert(rest).select('id').single()
        }
        if (sup.data) {
          await (admin.from('order_items') as any).insert((mItems as any[]).map((it) => {
            const cost = dropMap.get(it.productId)?.cost ?? 0
            return { order_id: sup.data.id, product_id: it.productId, quantity: it.quantity, unit_price_cents: cost, vat_rate: 0, line_total_cents: cost * it.quantity, purchase_unit: it.unit ?? 'piece' }
          }))
        }
      }
    } catch (e) { console.error('dropship forward failed:', (e as Error).message) }
  }

  // ── Card: create a Stripe Checkout Session for the whole cart ───────────
  if (paymentMethod === 'card') {
    if (cartTotalVat > 0) {
      stripeLineItems.push({
        price_data: { currency: cartCurrency.toLowerCase(), product_data: { name: 'VAT' }, unit_amount: cartTotalVat },
        quantity: 1,
      })
    }
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
    try {
      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        line_items: stripeLineItems,
        success_url: `${appUrl}/checkout/success?id=${orderIds[0]}`,
        cancel_url: `${appUrl}/checkout`,
        metadata: { order_ids: orderIds.join(','), order_id: orderIds[0] },
        payment_method_types: ['card'],
        billing_address_collection: 'required',
        allow_promotion_codes: true,
      })
      return NextResponse.json({ orderIds, primaryOrderId: orderIds[0], checkoutUrl: session.url })
    } catch (e: any) {
      return NextResponse.json({ error: `Card payment is not available right now (${e?.message ?? 'Stripe error'}). Try bank transfer.` }, { status: 500 })
    }
  }

  return NextResponse.json({ orderIds, primaryOrderId: orderIds[0], paymentMethod })
}
