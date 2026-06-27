import Link from 'next/link'
import { getLocale } from '@/lib/i18n/server'
import { localizeUI } from '@/lib/i18n/ui'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/rbac'
import { StatusBadge } from '@/components/dashboard/StatusBadge'
import { EmptyState } from '@/components/dashboard/EmptyState'
import { formatCents } from '@/lib/utils'

export default async function SupplierOrdersPage() {
  
  const tt = await localizeUI(["Orders", "total orders", "Order ID", "Date", "Buyer", "Total", "Status", "View"], getLocale())
  const user = await requireAuth()
  const supabase = createClient()

  const { data: supplier } = await supabase
    .from('suppliers')
    .select('id')
    .eq('owner_id', user.id)
    .single()

  if (!supplier) redirect('/supplier/onboarding')

  const { data: orders } = await supabase
    .from('orders')
    .select('id, created_at, status, total_cents, currency_code, profiles(full_name)')
    .eq('supplier_id', supplier.id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold">{tt("Orders")}</h1>
        <p className="text-muted-foreground text-sm mt-0.5">{orders?.length ?? 0} {tt("total orders")}</p>
      </div>

      {!orders?.length ? (
        <EmptyState title="No orders yet" description="Orders will appear here when buyers purchase your products." />
      ) : (
        <div className="rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 font-medium">{tt("Order ID")}</th>
                <th className="text-left px-4 py-3 font-medium">{tt("Date")}</th>
                <th className="text-left px-4 py-3 font-medium">{tt("Buyer")}</th>
                <th className="text-left px-4 py-3 font-medium">{tt("Total")}</th>
                <th className="text-left px-4 py-3 font-medium">{tt("Status")}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {orders.map((o) => {
                const buyer = o.profiles as any as { full_name: string | null } | null
                return (
                  <tr key={o.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-mono text-xs">{o.id.slice(0, 8)}…</td>
                    <td className="px-4 py-3 text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3">{buyer?.full_name ?? '—'}</td>
                    <td className="px-4 py-3 font-medium">{formatCents(o.total_cents, o.currency_code)}</td>
                    <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/supplier/orders/${o.id}`} className="text-xs text-primary hover:underline">{tt("View")}</Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
