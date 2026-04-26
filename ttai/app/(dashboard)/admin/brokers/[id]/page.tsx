import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/rbac'
import { StatusBadge } from '@/components/dashboard/StatusBadge'

export default async function AdminBrokerDetailPage({ params }: { params: { id: string } }) {
  await requireRole('admin')
  const supabase = createClient()

  const { data: broker } = await supabase
    .from('brokers')
    .select('*, profiles(full_name, phone)')
    .eq('id', params.id)
    .single()

  if (!broker) notFound()

  const { data: assignments } = await supabase
    .from('broker_supplier_assignments')
    .select('supplier_id, assigned_at, suppliers(legal_name, status)')
    .eq('broker_id', params.id)

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{broker.legal_name}</h1>
          <p className="text-muted-foreground text-sm">Broker</p>
        </div>
        <StatusBadge status={broker.status} />
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        {[
          ['Tax ID', broker.tax_id],
          ['VAT Number', broker.vat_number ?? '—'],
          ['Commission %', `${broker.commission_pct}%`],
          ['Fixed Fee', `${broker.fixed_fee_cents} cents`],
          ['Broker Share %', `${broker.broker_share_pct}%`],
          ['Stripe', broker.stripe_onboarding_complete ? 'Connected' : 'Not connected'],
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg border bg-card p-3">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="font-medium mt-0.5">{value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border bg-card p-5">
        <h2 className="font-semibold mb-3">Assigned Suppliers ({assignments?.length ?? 0})</h2>
        <div className="space-y-2">
          {assignments?.map((a) => {
            const supplier = a.suppliers as { legal_name: string; status: string } | null
            return (
              <div key={a.supplier_id} className="flex items-center justify-between text-sm border-b pb-2 last:border-0">
                <p className="font-medium">{supplier?.legal_name}</p>
                <div className="flex items-center gap-2">
                  {supplier && <StatusBadge status={supplier.status} />}
                  <span className="text-xs text-muted-foreground">{new Date(a.assigned_at).toLocaleDateString()}</span>
                </div>
              </div>
            )
          })}
          {!assignments?.length && <p className="text-sm text-muted-foreground">No suppliers assigned</p>}
        </div>
      </div>
    </div>
  )
}
