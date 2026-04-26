import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/rbac'

export default async function BrokerSettingsPage() {
  await requireRole('broker')
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: broker } = await supabase
    .from('brokers')
    .select('legal_name, tax_id, vat_number, tax_jurisdiction, commission_pct, fixed_fee_cents, broker_share_pct, status, stripe_onboarding_complete')
    .eq('user_id', user!.id)
    .single()

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, phone')
    .eq('id', user!.id)
    .single()

  const rows = broker ? [
    ['Legal Name', broker.legal_name],
    ['Tax ID', broker.tax_id],
    ['VAT Number', broker.vat_number ?? '—'],
    ['Tax Jurisdiction', broker.tax_jurisdiction],
    ['Commission %', `${broker.commission_pct}%`],
    ['Fixed Fee', `${(broker.fixed_fee_cents / 100).toFixed(2)} EUR`],
    ['Broker Share %', `${broker.broker_share_pct}%`],
    ['Account Status', broker.status],
    ['Stripe', broker.stripe_onboarding_complete ? 'Connected' : 'Not connected'],
  ] : []

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Broker Settings</h1>

      <div className="rounded-xl border bg-card p-6 space-y-4">
        <h2 className="font-semibold text-sm">Contact</h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
          {[['Full Name', profile?.full_name ?? '—'], ['Phone', profile?.phone ?? '—']].map(([label, value]) => (
            <div key={label} className="space-y-0.5">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="font-medium">{value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border bg-card p-6 space-y-4">
        <h2 className="font-semibold text-sm">Broker Details</h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
          {rows.map(([label, value]) => (
            <div key={label} className="space-y-0.5">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="font-medium">{value}</p>
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        To update your legal details or commission terms, contact the TTAI admin team.
      </p>
    </div>
  )
}
