import { requireRole } from '@/lib/auth/rbac'
import { createClient } from '@/lib/supabase/server'
import { formatCents } from '@/lib/utils'

export default async function BrokerInvoicesPage() {
  await requireRole('broker')
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: broker } = await supabase
    .from('brokers')
    .select('id')
    .eq('user_id', user!.id)
    .single()

  const { data: invoices } = broker
    ? await supabase
        .from('invoices')
        .select('id, invoice_number, status, amount_cents, currency_code, issued_at')
        .eq('broker_id', broker.id)
        .order('issued_at', { ascending: false })
    : { data: [] }

  return (
    <div className="space-y-6 max-w-4xl">
      <h1 className="text-2xl font-bold">Invoices</h1>

      {invoices?.length ? (
        <div className="rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Invoice #</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Amount</th>
                <th className="text-left px-4 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-mono text-xs">{inv.invoice_number}</td>
                  <td className="px-4 py-3 capitalize">{inv.status}</td>
                  <td className="px-4 py-3">{formatCents(inv.amount_cents, inv.currency_code)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{new Date(inv.issued_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-xl border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">No invoices yet</p>
        </div>
      )}
    </div>
  )
}
