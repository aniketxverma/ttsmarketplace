import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireRole } from '@/lib/auth/rbac'
import { DEPARTMENTS, STATUSES, MANAGERS, departmentInfo, statusInfo, type Department } from '@/lib/control-center'

export const dynamic = 'force-dynamic'

type SP = { department?: string; status?: string; assigned?: string }

export default async function ControlCenterPage({ searchParams }: { searchParams: SP }) {
  await requireRole('admin')
  const adminDb = createAdminClient()

  const fDept = searchParams.department
  const fStatus = searchParams.status
  const fAssigned = searchParams.assigned

  let q = (adminDb.from('tickets') as any)
    .select('id, ticket_no, client_name, company_name, email, phone, country_name, department, assigned_to, status, subject, source_platform, created_at')
    .order('created_at', { ascending: false })
    .limit(300)
  if (fDept) q = q.eq('department', fDept)
  if (fStatus) q = q.eq('status', fStatus)
  if (fAssigned) q = q.eq('assigned_to', fAssigned)

  const { data: tickets } = await q
  const rows: any[] = tickets ?? []

  // KPIs (across all tickets, ignoring active filters)
  const { data: allOpen } = await (adminDb.from('tickets') as any)
    .select('department, status').neq('status', 'closed').limit(2000)
  const open: any[] = allOpen ?? []
  const countBy = (dep: Department) => open.filter((t) => t.department === dep).length
  const unassigned = open.filter((t) => !t.assigned_to).length

  const kpis = [
    { label: 'Open tickets', value: open.length, color: 'text-[#0B1F4D]', dept: '' as string },
    ...DEPARTMENTS.map((d) => ({ label: `${d.label.replace('TTAI ', '')} · ${d.manager}`, value: countBy(d.key), color: 'text-blue-600', dept: d.key as string })),
  ]

  function withParam(key: keyof SP, val: string) {
    const sp = new URLSearchParams(searchParams as Record<string, string>)
    if (val) sp.set(key, val); else sp.delete(key)
    const s = sp.toString()
    return `/admin/control-center${s ? `?${s}` : ''}`
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold">Control Center</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Every client request across Marketplace, Logistics & Consulting — one inbox.</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <Link key={k.label} href={k.dept ? withParam('department', k.dept) : '/admin/control-center'}
            className="rounded-xl border bg-card p-5 hover:shadow-md transition-shadow">
            <p className={`text-3xl font-bold ${k.color}`}>{k.value}</p>
            <p className="text-sm text-muted-foreground mt-1">{k.label}</p>
          </Link>
        ))}
      </div>
      {unassigned > 0 && (
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2">
          ⚠ {unassigned} open ticket{unassigned !== 1 ? 's' : ''} unassigned — assign a manager below.
        </p>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <FilterGroup label="Dept" current={fDept} base="department"
          options={DEPARTMENTS.map((d) => ({ v: d.key, l: d.label.replace('TTAI ', '') }))} searchParams={searchParams} />
        <FilterGroup label="Status" current={fStatus} base="status"
          options={STATUSES.map((s) => ({ v: s.key, l: s.label }))} searchParams={searchParams} />
        <FilterGroup label="Manager" current={fAssigned} base="assigned"
          options={MANAGERS.map((m) => ({ v: m, l: m }))} searchParams={searchParams} />
      </div>

      {/* List */}
      <div className="rounded-xl border bg-card overflow-hidden">
        {rows.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-muted-foreground">
            No tickets yet. Client requests from the website forms will appear here.
          </div>
        ) : (
          <div className="divide-y">
            {rows.map((t) => {
              const dep = departmentInfo(t.department)
              const st = statusInfo(t.status)
              return (
                <Link key={t.id} href={`/admin/control-center/${t.id}`}
                  className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3.5 hover:bg-muted/40 transition-colors">
                  <span className="font-mono text-xs text-gray-400 w-12">#{t.ticket_no ?? '—'}</span>
                  <div className="flex-1 min-w-[180px]">
                    <p className="font-semibold text-gray-900 text-sm">{t.subject || t.company_name || t.client_name || t.email || 'Request'}</p>
                    <p className="text-xs text-gray-400">
                      {[t.client_name, t.company_name, t.country_name].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  <span className="inline-flex items-center rounded-full bg-gray-100 text-gray-600 text-[11px] font-semibold px-2 py-0.5">{dep.label.replace('TTAI ', '')}</span>
                  <span className="text-xs text-gray-500 w-12">{t.assigned_to || '—'}</span>
                  <span className={`inline-flex items-center rounded-full text-[11px] font-bold px-2 py-0.5 ${st.color}`}>{st.label}</span>
                  <span className="text-xs text-gray-400 w-24 text-right">
                    {new Date(t.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </span>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function FilterGroup({ label, current, base, options, searchParams }: {
  label: string; current?: string; base: keyof SP; options: { v: string; l: string }[]; searchParams: SP
}) {
  function href(val: string) {
    const sp = new URLSearchParams(searchParams as Record<string, string>)
    if (val && val !== current) sp.set(base, val); else sp.delete(base)
    const s = sp.toString()
    return `/admin/control-center${s ? `?${s}` : ''}`
  }
  return (
    <div className="flex items-center gap-1">
      <span className="text-xs font-bold text-gray-400 mr-0.5">{label}:</span>
      {options.map((o) => (
        <Link key={o.v} href={href(o.v)}
          className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${current === o.v ? 'bg-[#0B1F4D] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          {o.l}
        </Link>
      ))}
    </div>
  )
}
