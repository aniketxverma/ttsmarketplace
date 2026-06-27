import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/rbac'
import { getLocale } from '@/lib/i18n/server'
import { localizeUI } from '@/lib/i18n/ui'
import { StatusBadge } from '@/components/dashboard/StatusBadge'

export default async function AdminBrokersPage() {
  await requireRole('admin')

  const tt = await localizeUI(["Brokers", "Broker", "Status", "Stripe", "Commission", "Manage", "No brokers yet"], getLocale())
  const supabase = createClient()

  const { data: brokers } = await supabase
    .from('brokers')
    .select('id, legal_name, status, stripe_onboarding_complete, commission_pct, broker_share_pct, created_at')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6 max-w-5xl">
      <h1 className="text-2xl font-bold">{tt("Brokers")}</h1>

      <div className="rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-3 font-medium">{tt("Broker")}</th>
              <th className="text-left px-4 py-3 font-medium">{tt("Status")}</th>
              <th className="text-left px-4 py-3 font-medium">{tt("Stripe")}</th>
              <th className="text-left px-4 py-3 font-medium">{tt("Commission")}</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {brokers?.map((b) => (
              <tr key={b.id} className="hover:bg-muted/30">
                <td className="px-4 py-3 font-medium">{b.legal_name}</td>
                <td className="px-4 py-3"><StatusBadge status={b.status} /></td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${b.stripe_onboarding_complete ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {b.stripe_onboarding_complete ? 'Connected' : 'Pending'}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{b.commission_pct}% / {b.broker_share_pct}%</td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/admin/brokers/${b.id}`} className="text-xs text-primary hover:underline">{tt("Manage")}</Link>
                </td>
              </tr>
            ))}
            {!brokers?.length && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">{tt("No brokers yet")}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
