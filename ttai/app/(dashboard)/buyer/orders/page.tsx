import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/rbac'
import { formatCents } from '@/lib/utils'
import { StatusBadge } from '@/components/dashboard/StatusBadge'
import Link from 'next/link'

export default async function BuyerOrdersPage() {
  const user = await requireAuth()
  const supabase = createClient()

  const { data: orders } = await supabase
    .from('orders')
    .select('id, status, total_cents, currency_code, marketplace_context, created_at, suppliers(legal_name)')
    .eq('buyer_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6 max-w-4xl">
      <h1 className="text-2xl font-bold">My Orders</h1>

      {orders && orders.length > 0 ? (
        <div className="rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Order ID</th>
                <th className="text-left px-4 py-3 font-medium">Supplier</th>
                <th className="text-left px-4 py-3 font-medium">Amount</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {orders.map((o) => {
                const supplier = o.suppliers as unknown as { legal_name: string } | null
                return (
                  <tr key={o.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-mono text-xs">{o.id.slice(0, 8)}…</td>
                    <td className="px-4 py-3">{supplier?.legal_name ?? '—'}</td>
                    <td className="px-4 py-3">{formatCents(o.total_cents, o.currency_code)}</td>
                    <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                    <td className="px-4 py-3 text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/buyer/orders/${o.id}`} className="text-xs text-primary hover:underline">View</Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-xl border bg-card p-12 text-center">
          <p className="text-muted-foreground">No orders yet.</p>
          <Link href="/marketplace" className="mt-3 inline-block text-sm text-primary hover:underline">
            Browse marketplace →
          </Link>
        </div>
      )}
    </div>
  )
}
