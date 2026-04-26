import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/rbac'

export default async function BrokerDashboardPage() {
  const user = await requireAuth()
  const supabase = createClient()

  const { data: broker } = await supabase
    .from('brokers')
    .select('id, legal_name, status, stripe_onboarding_complete, commission_pct, broker_share_pct')
    .eq('user_id', user.id)
    .single()

  if (!broker) redirect('/broker/register')

  const { count: suppliersCount } = await supabase
    .from('broker_supplier_assignments')
    .select('broker_id', { count: 'exact', head: true })
    .eq('broker_id', broker.id)

  const { count: activePromos } = await supabase
    .from('broker_promotions')
    .select('id', { count: 'exact', head: true })
    .eq('broker_id', broker.id)
    .eq('is_active', true)
    .gt('ends_at', new Date().toISOString())

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">{broker.legal_name}</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Broker Dashboard</p>
      </div>

      {!broker.stripe_onboarding_complete && (
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 flex items-center justify-between">
          <p className="text-sm text-yellow-800 font-medium">
            Complete your Stripe onboarding to start earning commission
          </p>
          <Link href="/broker/onboarding" className="rounded-md bg-yellow-700 text-white px-4 py-2 text-xs font-medium hover:bg-yellow-800">
            Complete Onboarding
          </Link>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Stripe Status',     value: broker.stripe_onboarding_complete ? 'Connected' : 'Pending', href: '/broker/onboarding' },
          { label: 'Assigned Suppliers', value: suppliersCount ?? 0, href: '/broker/suppliers' },
          { label: 'Active Promotions',  value: activePromos ?? 0, href: '/broker/promotions' },
          { label: 'Commission Rate',    value: `${broker.commission_pct}%`, href: '/broker/settings' },
        ].map((kpi) => (
          <Link key={kpi.label} href={kpi.href} className="rounded-xl border bg-card p-5 hover:shadow-md transition-shadow">
            <p className="text-2xl font-bold">{kpi.value}</p>
            <p className="text-sm text-muted-foreground mt-1">{kpi.label}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
