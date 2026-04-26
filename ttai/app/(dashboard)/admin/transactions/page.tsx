import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/rbac'
import { formatCents } from '@/lib/utils'

export default async function AdminTransactionsPage() {
  await requireRole('admin')
  const supabase = createClient()

  const { data: ledger } = await supabase
    .from('transaction_ledger')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <div className="space-y-6 max-w-6xl">
      <h1 className="text-2xl font-bold">Transactions</h1>
      <div className="rounded-xl border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-3 font-medium whitespace-nowrap">Order</th>
              <th className="text-left px-4 py-3 font-medium whitespace-nowrap">Gross</th>
              <th className="text-left px-4 py-3 font-medium whitespace-nowrap">TTAI</th>
              <th className="text-left px-4 py-3 font-medium whitespace-nowrap">Broker</th>
              <th className="text-left px-4 py-3 font-medium whitespace-nowrap">Supplier</th>
              <th className="text-left px-4 py-3 font-medium whitespace-nowrap">VAT</th>
              <th className="text-left px-4 py-3 font-medium whitespace-nowrap">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {ledger?.map((t) => (
              <tr key={t.id} className="hover:bg-muted/30">
                <td className="px-4 py-3 font-mono text-xs">{t.order_id.slice(0, 8)}…</td>
                <td className="px-4 py-3">{formatCents(t.gross_cents, t.currency_code)}</td>
                <td className="px-4 py-3 text-blue-600">{formatCents(t.ttai_fixed_cents + t.ttai_commission_cents, t.currency_code)}</td>
                <td className="px-4 py-3 text-purple-600">{formatCents(t.broker_net_cents, t.currency_code)}</td>
                <td className="px-4 py-3 text-green-600">{formatCents(t.supplier_net_cents, t.currency_code)}</td>
                <td className="px-4 py-3 text-orange-600">{formatCents(t.vat_collected_cents, t.currency_code)}</td>
                <td className="px-4 py-3 text-muted-foreground">{new Date(t.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
            {!ledger?.length && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No transactions yet</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
