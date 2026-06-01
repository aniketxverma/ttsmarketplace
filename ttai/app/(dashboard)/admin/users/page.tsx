import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/rbac'
import { RoleChanger } from './RoleChanger'
import { ApprovalChanger } from './ApprovalChanger'

const ROLES = ['all', 'buyer', 'business_client', 'supplier', 'broker', 'admin']

const ROLE_COLORS: Record<string, string> = {
  admin:           'bg-red-100 text-red-700',
  supplier:        'bg-blue-100 text-blue-700',
  broker:          'bg-purple-100 text-purple-700',
  business_client: 'bg-amber-100 text-amber-700',
  buyer:           'bg-green-100 text-green-700',
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: { role?: string; status?: string }
}) {
  await requireRole('admin')
  const supabase = createClient()

  const selectedRole   = searchParams.role   ?? 'all'
  const selectedStatus = searchParams.status ?? 'all'

  let query = supabase
    .from('profiles')
    .select('id, full_name, role, phone, created_at, approval_status, company_name, country_name, bio')
    .order('approval_status', { ascending: true })   // pending first
    .order('created_at',      { ascending: false })

  if (selectedRole !== 'all') query = query.eq('role', selectedRole)
  if (selectedStatus !== 'all') query = query.eq('approval_status', selectedStatus)

  const { data: users } = await query

  // Count per role
  const counts: Record<string, number> = {}
  for (const r of ['buyer', 'business_client', 'supplier', 'broker', 'admin']) {
    const { count } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role', r)
    counts[r] = count ?? 0
  }
  counts['all'] = Object.values(counts).reduce((a, b) => a + b, 0)

  const { count: pendingTotal } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('approval_status', 'pending')

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Users</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{counts['all']} registered accounts</p>
        </div>
        {(pendingTotal ?? 0) > 0 && (
          <a
            href="/admin/users?status=pending"
            className="flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 px-4 py-2 text-sm font-semibold text-amber-800 hover:bg-amber-100 transition-colors"
          >
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            {pendingTotal} pending approval
          </a>
        )}
      </div>

      {/* ── Filter bar ── */}
      <div className="flex flex-wrap gap-4">
        {/* Role tabs */}
        <div className="flex gap-1.5 flex-wrap">
          {ROLES.map((r) => {
            const isActive = r === selectedRole
            const params = new URLSearchParams()
            if (r !== 'all') params.set('role', r)
            if (selectedStatus !== 'all') params.set('status', selectedStatus)
            return (
              <a
                key={r}
                href={`/admin/users${params.toString() ? `?${params}` : ''}`}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold border transition-colors ${
                  isActive ? 'bg-[#0B1F4D] text-white border-[#0B1F4D]' : 'hover:bg-gray-50 border-gray-200 text-gray-600'
                }`}
              >
                {r === 'business_client' ? 'Business' : r.charAt(0).toUpperCase() + r.slice(1)}
                <span className="ml-1 opacity-60">{counts[r] ?? 0}</span>
              </a>
            )
          })}
        </div>

        {/* Approval status filter */}
        <div className="flex gap-1.5">
          {[
            { v: 'all',      label: 'All status' },
            { v: 'pending',  label: 'Pending' },
            { v: 'approved', label: 'Approved' },
            { v: 'rejected', label: 'Rejected' },
          ].map(({ v, label }) => {
            const isActive = v === selectedStatus
            const params = new URLSearchParams()
            if (selectedRole !== 'all') params.set('role', selectedRole)
            if (v !== 'all') params.set('status', v)
            return (
              <a
                key={v}
                href={`/admin/users${params.toString() ? `?${params}` : ''}`}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold border transition-colors ${
                  isActive
                    ? v === 'pending'  ? 'bg-amber-500  text-white border-amber-500'
                    : v === 'approved' ? 'bg-green-600  text-white border-green-600'
                    : v === 'rejected' ? 'bg-red-500    text-white border-red-500'
                    :                    'bg-[#0B1F4D]  text-white border-[#0B1F4D]'
                    : 'hover:bg-gray-50 border-gray-200 text-gray-600'
                }`}
              >
                {label}
              </a>
            )
          })}
        </div>
      </div>

      {/* ── User cards ── */}
      <div className="space-y-3">
        {users?.map((u) => {
          const status = (u.approval_status ?? 'pending') as 'pending' | 'approved' | 'rejected'
          const isPending = status === 'pending'

          return (
            <div
              key={u.id}
              className={`rounded-2xl border overflow-hidden transition-all ${
                isPending ? 'border-amber-200 bg-amber-50/30' : 'border-gray-100 bg-white'
              }`}
            >
              {/* Top row */}
              <div className="flex flex-wrap items-start gap-3 px-5 py-4">
                {/* Avatar initial */}
                <div className="w-10 h-10 rounded-full bg-[#0B1F4D] flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-extrabold text-sm">
                    {(u.full_name ?? '?')[0].toUpperCase()}
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-bold text-gray-900 text-sm">{u.full_name ?? '—'}</p>
                    {u.company_name && (
                      <span className="text-gray-400 text-xs">· {u.company_name}</span>
                    )}
                    {u.country_name && (
                      <span className="text-gray-400 text-xs">· {u.country_name}</span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-0.5">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${ROLE_COLORS[u.role] ?? 'bg-gray-100 text-gray-600'}`}>
                      {u.role}
                    </span>
                    <span className="text-xs text-gray-400">{u.phone ?? ''}</span>
                    <span className="text-xs text-gray-300">
                      {new Date(u.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  {u.bio && (
                    <p className="text-xs text-gray-500 mt-1.5 leading-relaxed line-clamp-2 max-w-xl">
                      {u.bio}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <ApprovalChanger userId={u.id} currentStatus={status} />
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-gray-400">Role:</span>
                    <RoleChanger userId={u.id} currentRole={u.role} />
                  </div>
                </div>
              </div>

              {/* Pending highlight bar */}
              {isPending && (
                <div className="bg-amber-50 border-t border-amber-100 px-5 py-2 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  <span className="text-xs text-amber-700 font-medium">Waiting for your review — approve or reject to grant/deny access</span>
                </div>
              )}
            </div>
          )
        })}

        {!users?.length && (
          <div className="rounded-2xl border border-dashed border-gray-200 py-12 text-center text-gray-400 text-sm">
            No users found
          </div>
        )}
      </div>
    </div>
  )
}
