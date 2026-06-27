import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/rbac'
import { getLocale } from '@/lib/i18n/server'
import { localizeUI } from '@/lib/i18n/ui'

export default async function AdminAuditLogPage({
  searchParams,
}: {
  searchParams: { target_type?: string; page?: string }
}) {
  await requireRole('admin')

  const tt = await localizeUI(["Audit Log", "Action", "Target", "Actor", "Date"], getLocale())
  const supabase = createClient()
  const page = parseInt(searchParams.page || '1')
  const pageSize = 50
  const offset = (page - 1) * pageSize

  let query = supabase
    .from('admin_audit_log')
    .select('*, profiles(full_name)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1)

  if (searchParams.target_type) {
    query = query.eq('target_type', searchParams.target_type)
  }

  const { data, count } = await query

  return (
    <div className="space-y-6 max-w-5xl">
      <h1 className="text-2xl font-bold">{tt("Audit Log")}</h1>
      <p className="text-muted-foreground text-sm">{count ?? 0} total entries</p>

      <div className="rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-3 font-medium">{tt("Action")}</th>
              <th className="text-left px-4 py-3 font-medium">{tt("Target")}</th>
              <th className="text-left px-4 py-3 font-medium">{tt("Actor")}</th>
              <th className="text-left px-4 py-3 font-medium">{tt("Date")}</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {data?.map((entry) => {
              const actor = entry.profiles as any as { full_name: string | null } | null
              return (
                <tr key={entry.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{entry.action}</code>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {entry.target_type} {entry.target_id && <span className="font-mono text-xs">{entry.target_id.slice(0, 8)}…</span>}
                  </td>
                  <td className="px-4 py-3">{actor?.full_name ?? '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{new Date(entry.created_at).toLocaleString()}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
