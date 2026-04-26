import { requireRole } from '@/lib/auth/rbac'
import { createClient } from '@/lib/supabase/server'
import { formatCents } from '@/lib/utils'

export default async function BrokerPayoutsPage() {
  await requireRole('broker')
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: broker } = await supabase
    .from('brokers')
    .select('id')
    .eq('user_id', user!.id)
    .single()

  const { data: payouts } = broker
    ? await supabase
        .from('payouts')
        .select('id, amount_cents, currency_code, status, stripe_transfer_id, created_at')
        .eq('broker_id', broker.id)
        .order('created_at', { ascending: false })
    : { data: [] }

  const totalPaid = payouts?.filter((p) => p.status === 'completed').reduce((s, p) => s + p.amount_cents, 0) ?? 0
  const totalPending = payouts?.filter((p) => p.status === 'pending').reduce((s, p) => s + p.amount_cents, 0) ?? 0

  return (
    <div className="space-y-6 max-w-4xl">
      <h1 className="text-2xl font-bold">Payouts</h1>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Total Paid Out</p>
          <p className="text-xl font-bold text-green-600 mt-1">{formatCents(totalPaid, 'EUR')}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Pending</p>
          <p className="text-xl font-bold text-yellow-600 mt-1">{formatCents(totalPending, 'EUR')}</p>
        </div>
      </div>

      {payouts?.length ? (
        <div className="rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Transfer ID</th>
                <th className="text-left px-4 py-3 font-medium">Amount</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {payouts.map((p) => (
                <tr key={p.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-mono text-xs">{p.stripe_transfer_id ?? '—'}</td>
                  <td className="px-4 py-3">{formatCents(p.amount_cents, p.currency_code)}</td>
                  <td className="px-4 py-3 capitalize">{p.status}</td>
                  <td className="px-4 py-3 text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-xl border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">No payouts yet</p>
        </div>
      )}
    </div>
  )
}
