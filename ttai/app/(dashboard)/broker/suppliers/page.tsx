import { createClient } from '@/lib/supabase/server'
import { getLocale } from '@/lib/i18n/server'
import { localizeUI } from '@/lib/i18n/ui'
import { requireRole } from '@/lib/auth/rbac'
import { StatusBadge } from '@/components/dashboard/StatusBadge'

export default async function BrokerSuppliersPage() {
  
  const tt = await localizeUI(["My Suppliers", "Suppliers assigned to you by the TTAI admin team", "Supplier", "Status", "Tier", "Assigned"], getLocale())
  await requireRole('broker')
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: broker } = await supabase
    .from('brokers')
    .select('id')
    .eq('user_id', user!.id)
    .single()

  const { data: assignments } = broker
    ? await supabase
        .from('broker_supplier_assignments')
        .select('supplier_id, assigned_at, suppliers(id, legal_name, status, reliability_tier, city_id)')
        .eq('broker_id', broker.id)
    : { data: [] }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">{tt("My Suppliers")}</h1>
        <p className="text-muted-foreground text-sm mt-0.5">{tt("Suppliers assigned to you by the TTAI admin team")}</p>
      </div>

      {assignments?.length ? (
        <div className="rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 font-medium">{tt("Supplier")}</th>
                <th className="text-left px-4 py-3 font-medium">{tt("Status")}</th>
                <th className="text-left px-4 py-3 font-medium">{tt("Tier")}</th>
                <th className="text-left px-4 py-3 font-medium">{tt("Assigned")}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {assignments.map((a) => {
                const s = a.suppliers as any as { id: string; legal_name: string; status: string; reliability_tier: string } | null
                return (
                  <tr key={a.supplier_id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{s?.legal_name ?? '—'}</td>
                    <td className="px-4 py-3">{s && <StatusBadge status={s.status} />}</td>
                    <td className="px-4 py-3 text-muted-foreground capitalize">{s?.reliability_tier ?? '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{new Date(a.assigned_at).toLocaleDateString()}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-xl border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">No suppliers assigned yet. The TTAI team will assign suppliers after your account is approved.</p>
        </div>
      )}
    </div>
  )
}
