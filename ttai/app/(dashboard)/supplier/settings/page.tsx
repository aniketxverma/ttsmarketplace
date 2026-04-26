import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth/rbac'
import { StatusBadge } from '@/components/dashboard/StatusBadge'

export default async function SupplierSettingsPage() {
  const user = await requireAuth()
  const supabase = createClient()

  const [profileRes, supplierRes] = await Promise.all([
    supabase.from('profiles').select('full_name, phone, preferred_language').eq('id', user.id).single(),
    supabase.from('suppliers').select('id, legal_name, trade_name, status').eq('owner_id', user.id).single(),
  ])

  if (!supplierRes.data) redirect('/supplier/onboarding')

  const { data: audits } = await supabase
    .from('supplier_state_audit')
    .select('id, from_status, to_status, reason, created_at')
    .eq('supplier_id', supplierRes.data.id)
    .order('created_at', { ascending: false })
    .limit(10)

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      <div className="rounded-xl border bg-card p-5 space-y-3">
        <h2 className="font-semibold">Profile</h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-muted-foreground text-xs">Name</p>
            <p className="font-medium">{profileRes.data?.full_name ?? '—'}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Email</p>
            <p className="font-medium">{user.email}</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-5 space-y-3">
        <h2 className="font-semibold">Supplier Info</h2>
        <div className="flex items-center gap-3">
          <div>
            <p className="font-medium">{supplierRes.data.legal_name}</p>
            {supplierRes.data.trade_name && <p className="text-xs text-muted-foreground">{supplierRes.data.trade_name}</p>}
          </div>
          <StatusBadge status={supplierRes.data.status} />
        </div>
      </div>

      {audits && audits.length > 0 && (
        <div className="rounded-xl border bg-card p-5 space-y-3">
          <h2 className="font-semibold">Verification History</h2>
          <div className="space-y-2">
            {audits.map((a) => (
              <div key={a.id} className="flex items-start justify-between text-sm border-b pb-2 last:border-0 last:pb-0">
                <div>
                  <p>
                    {a.from_status ? <><StatusBadge status={a.from_status} /> → </> : null}
                    <StatusBadge status={a.to_status} />
                  </p>
                  {a.reason && <p className="text-xs text-muted-foreground mt-0.5">{a.reason}</p>}
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap ml-3">
                  {new Date(a.created_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
