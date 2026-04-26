'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { StatusBadge } from '@/components/dashboard/StatusBadge'
import { formatCents } from '@/lib/utils'

export default function SupplierOrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [order, setOrder] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(true)
  const [fulfilling, setFulfilling] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('orders')
      .select('*, order_items(*, products(name)), profiles(full_name)')
      .eq('id', id)
      .single()
      .then(({ data }) => { setOrder(data); setLoading(false) })
  }, [id])

  async function handleFulfill() {
    setFulfilling(true)
    const res = await fetch(`/api/orders/${id}/fulfill`, { method: 'POST' })
    if (res.ok) {
      setOrder((prev) => prev ? { ...prev, status: 'fulfilled' } : prev)
    }
    setFulfilling(false)
  }

  if (loading) return <div className="text-muted-foreground text-sm">Loading...</div>
  if (!order) return <div className="text-muted-foreground text-sm">Order not found</div>

  const items = (order.order_items as { id: string; quantity: number; unit_price_cents: number; line_total_cents: number; currency_code?: string; products: { name: string } }[]) ?? []
  const buyer = order.profiles as { full_name: string | null } | null

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Order</h1>
          <p className="font-mono text-sm text-muted-foreground mt-0.5">{id}</p>
        </div>
        <StatusBadge status={order.status as string} />
      </div>

      <div className="rounded-xl border bg-card p-5 space-y-3">
        <h2 className="font-semibold">Items</h2>
        <div className="divide-y">
          {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between py-2 text-sm">
              <div>
                <p className="font-medium">{item.products?.name}</p>
                <p className="text-muted-foreground text-xs">Qty: {item.quantity} × {formatCents(item.unit_price_cents, 'EUR')}</p>
              </div>
              <p className="font-semibold">{formatCents(item.line_total_cents, 'EUR')}</p>
            </div>
          ))}
        </div>
        <div className="flex justify-between text-sm font-semibold pt-2 border-t">
          <span>Total</span>
          <span>{formatCents(order.total_cents as number, order.currency_code as string)}</span>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-5 space-y-2">
        <h2 className="font-semibold">Buyer</h2>
        <p className="text-sm">{buyer?.full_name ?? 'Unknown buyer'}</p>
      </div>

      {order.status === 'paid' && (
        <button
          onClick={handleFulfill}
          disabled={fulfilling}
          className="rounded-md bg-primary text-primary-foreground px-5 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
        >
          {fulfilling ? 'Updating...' : 'Mark as Fulfilled'}
        </button>
      )}
    </div>
  )
}
