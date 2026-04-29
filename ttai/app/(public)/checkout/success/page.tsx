import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'

function fmt(cents: number, currency: string) {
  return new Intl.NumberFormat('en-EU', { style: 'currency', currency }).format(cents / 100)
}

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: { id?: string }
}) {
  const orderId = searchParams.id
  if (!orderId) notFound()

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  const { data: order } = await supabase
    .from('orders')
    .select(`
      id, status, total_cents, currency_code, created_at, shipping_address,
      suppliers(legal_name, trade_name),
      order_items(
        quantity, unit_price_cents, line_total_cents,
        products(name)
      )
    `)
    .eq('id', orderId)
    .eq('buyer_id', user.id)
    .single()

  if (!order) notFound()

  const supplier = order.suppliers as any as { legal_name: string; trade_name: string | null }
  const items = order.order_items as any as Array<{
    quantity: number
    unit_price_cents: number
    line_total_cents: number
    products: { name: string }
  }>
  const address = order.shipping_address as any as {
    fullName: string; line1: string; city: string; postalCode: string; country: string; phone?: string
  }

  const supplierName = supplier?.trade_name ?? supplier?.legal_name ?? 'Supplier'
  const orderDate = new Date(order.created_at).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
  const shortId = orderId.split('-')[0].toUpperCase()

  return (
    <div className="bg-gray-50 min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-2xl">

        {/* Success header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-extrabold text-[#0B1F4D]">Order Confirmed!</h1>
          <p className="text-gray-500 mt-2 text-sm">
            Thank you for your order. You'll receive a confirmation email shortly.
          </p>
        </div>

        {/* Order card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

          {/* Order meta */}
          <div className="p-6 border-b bg-gradient-to-r from-[#0B1F4D] to-[#162d6e] text-white">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="text-xs text-blue-200 uppercase tracking-widest font-semibold">Order ID</p>
                <p className="font-mono font-bold text-lg mt-0.5">#{shortId}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-blue-200 uppercase tracking-widest font-semibold">Date</p>
                <p className="font-medium text-sm mt-0.5">{orderDate}</p>
              </div>
              <div>
                <p className="text-xs text-blue-200 uppercase tracking-widest font-semibold">Status</p>
                <span className="inline-flex items-center gap-1.5 mt-0.5 px-2.5 py-1 rounded-full bg-green-400/20 text-green-300 text-xs font-bold border border-green-400/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                  Confirmed
                </span>
              </div>
              <div className="text-right">
                <p className="text-xs text-blue-200 uppercase tracking-widest font-semibold">Total</p>
                <p className="font-extrabold text-xl mt-0.5 text-[#F5A623]">{fmt(order.total_cents, order.currency_code)}</p>
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="p-6 border-b">
            <h2 className="font-bold text-[#0B1F4D] text-sm mb-4 uppercase tracking-wide">Order Items</h2>
            <div className="space-y-3">
              {items.map((item, i) => (
                <div key={i} className="flex items-center justify-between gap-4 py-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{item.products?.name}</p>
                      <p className="text-xs text-gray-400">
                        {item.quantity} × {fmt(item.unit_price_cents, order.currency_code)}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-[#0B1F4D] flex-shrink-0">
                    {fmt(item.line_total_cents, order.currency_code)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Supplier + Shipping */}
          <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
            <div className="p-6">
              <h2 className="font-bold text-[#0B1F4D] text-sm mb-3 uppercase tracking-wide">Supplier</h2>
              <p className="text-sm font-medium text-gray-900">{supplierName}</p>
              <p className="text-xs text-gray-400 mt-1">Invoice will be sent within 24 hours</p>
            </div>
            {address && (
              <div className="p-6">
                <h2 className="font-bold text-[#0B1F4D] text-sm mb-3 uppercase tracking-wide">Ship To</h2>
                <p className="text-sm font-medium text-gray-900">{address.fullName}</p>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  {address.line1}<br />
                  {address.city}, {address.postalCode}<br />
                  {address.country}
                  {address.phone && <><br />{address.phone}</>}
                </p>
              </div>
            )}
          </div>

          {/* Payment info */}
          <div className="p-6 border-t bg-blue-50">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#0B1F4D] flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-[#0B1F4D] text-sm">Payment Instructions</p>
                <p className="text-xs text-blue-700 mt-1 leading-relaxed">
                  An invoice will be sent to your registered email within 24 hours.
                  Please complete payment via bank transfer using the reference number on the invoice.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <Link
            href="/buyer/orders"
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#0B1F4D] text-white px-6 py-3.5 text-sm font-bold hover:bg-[#162d6e] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            View My Orders
          </Link>
          <Link
            href="/marketplace"
            className="flex-1 flex items-center justify-center gap-2 rounded-xl border-2 border-[#0B1F4D] text-[#0B1F4D] px-6 py-3.5 text-sm font-bold hover:bg-[#0B1F4D] hover:text-white transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Continue Shopping
          </Link>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Questions? Contact us at <span className="text-[#0B1F4D] font-medium">support@ttaima.com</span>
        </p>

      </div>
    </div>
  )
}
