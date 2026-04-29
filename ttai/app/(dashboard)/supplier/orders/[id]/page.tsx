'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { MessageButton } from '@/components/messages/MessageButton'

function fmt(cents: number, currency: string) {
  return new Intl.NumberFormat('en-EU', { style: 'currency', currency }).format(cents / 100)
}

const STATUS_STYLES: Record<string, string> = {
  pending:   'bg-yellow-100 text-yellow-800 border-yellow-200',
  paid:      'bg-blue-100 text-blue-800 border-blue-200',
  fulfilled: 'bg-green-100 text-green-800 border-green-200',
  cancelled: 'bg-gray-100 text-gray-600 border-gray-200',
}

export default function SupplierOrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [order, setOrder] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(true)
  const [fulfilling, setFulfilling] = useState(false)
  const [fulfilled, setFulfilled] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('orders')
      .select('*, order_items(*, products(name, currency_code)), profiles(full_name, email:id)')
      .eq('id', id)
      .single()
      .then(({ data }) => { setOrder(data); setLoading(false) })
  }, [id])

  async function handleFulfill() {
    setFulfilling(true)
    const res = await fetch(`/api/orders/${id}/fulfill`, { method: 'POST' })
    if (res.ok) {
      setFulfilled(true)
      setOrder((prev) => prev ? { ...prev, status: 'fulfilled' } : prev)
    }
    setFulfilling(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <svg className="animate-spin w-6 h-6 text-[#0B1F4D]" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Order not found</p>
        <button onClick={() => router.back()} className="mt-4 text-sm text-[#0B1F4D] hover:underline">← Back</button>
      </div>
    )
  }

  const currency = order.currency_code as string
  const items = (order.order_items as {
    id: string; quantity: number; unit_price_cents: number; line_total_cents: number;
    products: { name: string; currency_code: string }
  }[]) ?? []
  const buyer = order.profiles as { full_name: string | null } | null
  const address = order.shipping_address as {
    fullName?: string; line1?: string; city?: string; postalCode?: string; country?: string; phone?: string
  } | null
  const status = order.status as string
  const statusStyle = STATUS_STYLES[status] ?? STATUS_STYLES.pending
  const orderDate = new Date(order.created_at as string).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
  const shortId = (order.id as string).split('-')[0].toUpperCase()

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-gray-500 hover:text-[#0B1F4D] mb-2 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Orders
          </button>
          <h1 className="text-2xl font-extrabold text-[#0B1F4D]">Order #{shortId}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{orderDate}</p>
        </div>
        <span className={`px-4 py-2 rounded-full text-sm font-bold border ${statusStyle}`}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      </div>

      {fulfilled && (
        <div className="rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800 font-medium flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
          Order marked as fulfilled successfully.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

        {/* Order Items */}
        <div className="sm:col-span-2 rounded-2xl border border-gray-100 bg-white overflow-hidden">
          <div className="px-5 py-4 border-b bg-gray-50">
            <h2 className="font-bold text-[#0B1F4D]">Order Items</h2>
          </div>
          <div className="divide-y">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-[#0B1F4D]/5 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-[#0B1F4D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{item.products?.name}</p>
                    <p className="text-xs text-gray-400">
                      {item.quantity} × {fmt(item.unit_price_cents, item.products?.currency_code ?? currency)}
                    </p>
                  </div>
                </div>
                <p className="font-bold text-[#0B1F4D] text-sm flex-shrink-0">
                  {fmt(item.line_total_cents, item.products?.currency_code ?? currency)}
                </p>
              </div>
            ))}
          </div>
          <div className="px-5 py-4 border-t bg-gray-50 space-y-2">
            <div className="flex justify-between text-sm text-gray-500">
              <span>Subtotal</span>
              <span>{fmt(order.subtotal_cents as number ?? order.total_cents as number, currency)}</span>
            </div>
            {(order.vat_cents as number) > 0 && (
              <div className="flex justify-between text-sm text-gray-500">
                <span>VAT</span>
                <span>{fmt(order.vat_cents as number, currency)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-[#0B1F4D] pt-2 border-t">
              <span>Total</span>
              <span>{fmt(order.total_cents as number, currency)}</span>
            </div>
          </div>
        </div>

        {/* Buyer Info */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-[#0B1F4D]">Buyer</h2>
            {typeof order.buyer_id === 'string' && (
              <MessageButton
                buyerId={order.buyer_id}
                orderId={order.id as string}
                subject={`Order ${(order.id as string).split('-')[0].toUpperCase()}`}
                redirectBase="/supplier/messages"
                className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-[#0B1F4D] transition-colors"
              >
                Message Buyer
              </MessageButton>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#0B1F4D] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {buyer?.full_name?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div>
              <p className="font-semibold text-sm text-gray-900">{buyer?.full_name ?? 'Unknown buyer'}</p>
            </div>
          </div>
        </div>

        {/* Shipping Address */}
        {address && (
          <div className="rounded-2xl border border-gray-100 bg-white p-5 space-y-3">
            <h2 className="font-bold text-[#0B1F4D]">Ship To</h2>
            <div className="text-sm space-y-1">
              <p className="font-semibold text-gray-900">{address.fullName}</p>
              <p className="text-gray-500">{address.line1}</p>
              <p className="text-gray-500">{address.city}, {address.postalCode}</p>
              <p className="text-gray-500">{address.country}</p>
              {address.phone && <p className="text-gray-500">{address.phone}</p>}
            </div>
          </div>
        )}
      </div>

      {/* Fulfill action */}
      {status === 'paid' && !fulfilled && (
        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5 flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="font-bold text-blue-900 text-sm">Ready to fulfill?</p>
            <p className="text-xs text-blue-700 mt-0.5">Mark this order as fulfilled once items have been shipped.</p>
          </div>
          <button
            onClick={handleFulfill}
            disabled={fulfilling}
            className="flex items-center gap-2 rounded-xl bg-[#0B1F4D] text-white px-5 py-2.5 text-sm font-bold hover:bg-[#162d6e] transition-colors disabled:opacity-50"
          >
            {fulfilling ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Updating...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                Mark as Fulfilled
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}
