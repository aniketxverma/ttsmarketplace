import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/rbac'
import { StatusBadge } from '@/components/dashboard/StatusBadge'
import { formatCents } from '@/lib/utils'

export default async function AdminDisputesPage() {
  await requireRole('admin')
  const supabase = createClient()

  const { data: orders } = await supabase
    .from('orders')
    .select('id, created_at, total_cents, currency_code, profiles(full_name)')
    .eq('status', 'disputed')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6 max-w-5xl">
      <h1 className="text-2xl font-bold">Disputes</h1>
      <p className="text-muted-foreground text-sm">Full dispute resolution coming in Phase 1</p>

      {orders?.length ? (
        <div className="rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Order</th>
                <th className="text-left px-4 py-3 font-medium">Buyer</th>
                <th className="text-left px-4 py-3 font-medium">Amount</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {orders.map((o) => {
                const buyer = o.profiles as any as { full_name: string | null } | null
                return (
                  <tr key={o.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-mono text-xs">{o.id.slice(0, 8)}…</td>
                    <td className="px-4 py-3">{buyer?.full_name ?? '—'}</td>
                    <td className="px-4 py-3">{formatCents(o.total_cents, o.currency_code)}</td>
                    <td className="px-4 py-3"><StatusBadge status="disputed" /></td>
                    <td className="px-4 py-3 text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No open disputes</p>
      )}
    </div>
  )
}
