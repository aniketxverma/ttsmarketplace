import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/rbac'
import { formatCents } from '@/lib/utils'
import Link from 'next/link'

export default async function BuyerDashboardPage() {
  await requireAuth()
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: orders } = await supabase
    .from('orders')
    .select('id, status, total_cents, currency_code, created_at, marketplace_context')
    .eq('buyer_id', user!.id)
    .order('created_at', { ascending: false })
    .limit(10)

  const totalSpent = orders?.filter((o) => o.status !== 'cancelled').reduce((s, o) => s + o.total_cents, 0) ?? 0

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Orders</h1>
        <Link
          href="/buyer/messages"
          className="flex items-center gap-2 rounded-xl border border-gray-200 text-gray-600 px-4 py-2 text-sm font-semibold hover:border-[#0B1F4D] hover:text-[#0B1F4D] transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          Messages
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Total Orders</p>
          <p className="text-2xl font-bold mt-1">{orders?.length ?? 0}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Total Spent</p>
          <p className="text-2xl font-bold mt-1">{formatCents(totalSpent, 'EUR')}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Active Orders</p>
          <p className="text-2xl font-bold mt-1">{orders?.filter((o) => ['paid', 'processing', 'fulfilled'].includes(o.status)).length ?? 0}</p>
        </div>
      </div>

      {orders?.length ? (
        <div className="rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Order ID</th>
                <th className="text-left px-4 py-3 font-medium">Amount</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-mono text-xs">{o.id.slice(0, 8)}…</td>
                  <td className="px-4 py-3">{formatCents(o.total_cents, o.currency_code)}</td>
                  <td className="px-4 py-3 capitalize">{o.status}</td>
                  <td className="px-4 py-3 text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/buyer/orders/${o.id}`} className="text-xs text-primary hover:underline">View</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-xl border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">No orders yet.</p>
          <Link href="/marketplace" className="mt-3 inline-block text-sm text-primary hover:underline">Browse marketplace</Link>
        </div>
      )}
    </div>
  )
}
