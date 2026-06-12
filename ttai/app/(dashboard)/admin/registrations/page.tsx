import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/rbac'

type Reg = {
  id: string
  full_name: string | null
  company_name: string | null
  email: string | null
  phone: string | null
  country_name: string | null
  city: string | null
  account_type: string | null
  business_type: string | null
  message: string | null
  source_platform: string
  created_at: string
}

export default async function AdminRegistrationsPage() {
  await requireRole('admin')
  const supabase = createClient()

  let regs: Reg[] = []
  let notMigrated = false
  const { data, error } = await (supabase.from('registration_requests') as any)
    .select('*').order('created_at', { ascending: false }).limit(500)
  if (error) notMigrated = true
  else regs = (data ?? []) as Reg[]

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold">Registrations</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Every registration request from TTAI EMA &amp; TTAIMA — {regs.length} total.
        </p>
      </div>

      {notMigrated ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Run migration <code>0058_registration_requests.sql</code> to start collecting registrations here.
        </div>
      ) : regs.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground text-sm">No registrations yet.</div>
      ) : (
        <div className="rounded-xl border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 font-medium">When</th>
                <th className="text-left px-4 py-3 font-medium">Source</th>
                <th className="text-left px-4 py-3 font-medium">Type</th>
                <th className="text-left px-4 py-3 font-medium">Name / Company</th>
                <th className="text-left px-4 py-3 font-medium">Contact</th>
                <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Location</th>
                <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {regs.map((r) => (
                <tr key={r.id} className="hover:bg-muted/30 align-top">
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{new Date(r.created_at).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex text-[11px] font-bold px-2 py-0.5 rounded-full ${r.source_platform === 'TTAIMA' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-700'}`}>
                      {r.source_platform}
                    </span>
                  </td>
                  <td className="px-4 py-3">{r.account_type ?? '—'}{r.business_type && <div className="text-xs text-muted-foreground">{r.business_type}</div>}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{r.full_name ?? '—'}</div>
                    {r.company_name && <div className="text-xs text-muted-foreground">{r.company_name}</div>}
                  </td>
                  <td className="px-4 py-3">
                    {r.email && <a href={`mailto:${r.email}`} className="text-primary hover:underline block">{r.email}</a>}
                    {r.phone && <a href={`tel:${r.phone}`} className="text-xs text-muted-foreground hover:underline">{r.phone}</a>}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">{[r.city, r.country_name].filter(Boolean).join(', ') || '—'}</td>
                  <td className="px-4 py-3 hidden lg:table-cell max-w-xs"><span className="line-clamp-2 text-muted-foreground">{r.message ?? ''}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
