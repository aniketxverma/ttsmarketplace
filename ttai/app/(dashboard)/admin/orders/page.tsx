import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/rbac'
import { formatCents } from '@/lib/utils'
import { StatusBadge } from '@/components/dashboard/StatusBadge'

const STATUSES = ['all', 'pending', 'paid', 'fulfilled', 'delivered', 'cancelled', 'refunded', 'disputed']

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: { status?: string }
}) {
  await requireRole('admin')
  const supabase = createClient()

  const status = searchParams.status ?? 'all'

  let query = supabase
    .from('orders')
    .select('id, status, total_cents, currency_code, created_at, marketplace_context, profiles(full_name), suppliers(trade_name, legal_name)')
    .order('created_at', { ascending: false })
    .limit(100)

  if (status !== 'all') {
    query = query.eq('status', status)
  }

  const { data: orders } = await query

  // Counts per status
  const counts: Record<string, number> = { all: 0 }
  for (const s of STATUSES.slice(1)) {
    const { count } = await supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', s)
    counts[s] = count ?? 0
    counts['all'] += count ?? 0
  }

  const STATUS_COLORS: Record<string, string> = {
    pending:   'bg-yellow-100 text-yellow-700',
    paid:      'bg-blue-100 text-blue-700',
    fulfilled: 'bg-indigo-100 text-indigo-700',
    delivered: 'bg-green-100 text-green-700',
    cancelled: 'bg-gray-100 text-gray-500',
    refunded:  'bg-orange-100 text-orange-700',
    disputed:  'bg-red-100 text-red-700',
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold">Orders</h1>
        <p className="text-muted-foreground text-sm mt-0.5">{counts.all} orders total</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {STATUSES.map((s) => {
          const isActive = s === status
          return (
            <a
              key={s}
              href={s === 'all' ? '/admin/orders' : `/admin/orders?status=${s}`}
              className={`rounded-full px-4 py-1.5 text-sm font-medium border transition-colors ${
                isActive ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-accent'
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
              <span className="ml-1.5 opacity-70">{counts[s] ?? 0}</span>
            </a>
          )
        })}
      </div>

      <div className="rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Order ID</th>
              <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Buyer</th>
              <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Supplier</th>
              <th className="text-left px-4 py-3 font-medium">Total</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Context</th>
              <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {orders?.map((o) => {
              const buyer    = o.profiles  as any as { full_name: string | null } | null
              const supplier = o.suppliers as any as { trade_name: string | null; legal_name: string } | null
              return (
                <tr key={o.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{o.id.slice(0, 8)}…</td>
                  <td className="px-4 py-3 hidden sm:table-cell">{buyer?.full_name ?? '—'}</td>
                  <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
                    {supplier?.trade_name ?? supplier?.legal_name ?? '—'}
                  </td>
                  <td className="px-4 py-3 font-semibold">{formatCents(o.total_cents, o.currency_code)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${STATUS_COLORS[o.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {o.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-xs text-muted-foreground capitalize">{o.marketplace_context}</span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground">
                    {new Date(o.created_at).toLocaleDateString()}
                  </td>
                </tr>
              )
            })}
            {!orders?.length && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No orders found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
