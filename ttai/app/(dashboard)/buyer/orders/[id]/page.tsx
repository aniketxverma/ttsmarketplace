import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/rbac'
import { formatCents } from '@/lib/utils'
import { StatusBadge } from '@/components/dashboard/StatusBadge'

export default async function BuyerOrderDetailPage({ params }: { params: { id: string } }) {
  await requireAuth()
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: order } = await supabase
    .from('orders')
    .select('id, status, total_cents, vat_cents, currency_code, marketplace_context, created_at, suppliers(legal_name), order_items(*, products(name, sku))')
    .eq('id', params.id)
    .eq('buyer_id', user!.id)
    .single()

  if (!order) notFound()

  const supplier = order.suppliers as any as { legal_name: string } | null

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Order Details</h1>
          <p className="text-muted-foreground text-sm font-mono">{order.id}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        {[
          ['Supplier', supplier?.legal_name ?? '—'],
          ['Date', new Date(order.created_at).toLocaleDateString()],
          ['Context', order.marketplace_context ?? '—'],
          ['Currency', order.currency_code],
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg border bg-card p-3">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="font-medium mt-0.5">{value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border bg-card p-5">
        <h2 className="font-semibold mb-3">Items</h2>
        <div className="space-y-2">
          {(order.order_items as any[])?.map((item: any) => {
            const product = item.products as { name: string; sku: string } | null
            return (
              <div key={item.id} className="flex items-center justify-between text-sm border-b pb-2 last:border-0">
                <div>
                  <p className="font-medium">{product?.name}</p>
                  <p className="text-xs text-muted-foreground">SKU: {product?.sku} × {item.quantity}</p>
                </div>
                <p>{formatCents(item.line_total_cents, order.currency_code)}</p>
              </div>
            )
          })}
        </div>
        <div className="pt-3 mt-3 border-t space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatCents(order.total_cents - order.vat_cents, order.currency_code)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">VAT</span>
            <span>{formatCents(order.vat_cents, order.currency_code)}</span>
          </div>
          <div className="flex justify-between font-semibold pt-1 border-t">
            <span>Total</span>
            <span>{formatCents(order.total_cents, order.currency_code)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
