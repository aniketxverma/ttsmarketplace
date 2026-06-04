import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/rbac'
import { RoleChanger } from './RoleChanger'
import { ApprovalChanger } from './ApprovalChanger'
import { TierChanger } from './TierChanger'
import Image from 'next/image'

const ROLES = ['all', 'buyer', 'business_client', 'supplier', 'broker', 'admin']

const ROLE_COLORS: Record<string, string> = {
  admin:           'bg-red-100    text-red-700',
  supplier:        'bg-orange-100 text-orange-700',
  broker:          'bg-purple-100 text-purple-700',
  business_client: 'bg-blue-100   text-blue-700',
  buyer:           'bg-green-100  text-green-700',
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

  let query = (supabase.from('profiles') as any)
    .select('id,full_name,role,phone,created_at,approval_status,company_name,business_type,continent,country_name,city,category,annual_turnover,website_url,bio,products_offered,username,avatar_url,tier')
    .order('approval_status', { ascending: true })
    .order('created_at',      { ascending: false })

  if (selectedRole   !== 'all') query = query.eq('role',            selectedRole)
  if (selectedStatus !== 'all') query = query.eq('approval_status', selectedStatus)

  const { data: users } = await query

  // Counts
  const counts: Record<string, number> = {}
  for (const r of ['buyer', 'business_client', 'supplier', 'broker', 'admin']) {
    const { count } = await supabase.from('profiles')
      .select('id', { count: 'exact', head: true }).eq('role', r)
    counts[r] = count ?? 0
  }
  counts['all'] = Object.values(counts).reduce((a, b) => a + b, 0)

  const { count: pendingTotal } = await supabase.from('profiles')
    .select('id', { count: 'exact', head: true }).eq('approval_status', 'pending')

  return (
    <div className="space-y-6 max-w-5xl">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Users</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{counts['all']} registered accounts</p>
        </div>
        {(pendingTotal ?? 0) > 0 && (
          <a
            href="/admin/users?status=pending"
            className="flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200
              px-4 py-2 text-sm font-semibold text-amber-800 hover:bg-amber-100 transition-colors"
          >
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            {pendingTotal} pending review
          </a>
        )}
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-wrap gap-4">
        {/* Role */}
        <div className="flex gap-1.5 flex-wrap">
          {ROLES.map((r) => {
            const isActive = r === selectedRole
            const p = new URLSearchParams()
            if (r !== 'all') p.set('role', r)
            if (selectedStatus !== 'all') p.set('status', selectedStatus)
            return (
              <a key={r} href={`/admin/users${p.toString() ? `?${p}` : ''}`}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold border transition-colors ${
                  isActive ? 'bg-[#0B1F4D] text-white border-[#0B1F4D]' : 'hover:bg-gray-50 border-gray-200 text-gray-600'
                }`}>
                {r === 'business_client' ? 'Business' : r.charAt(0).toUpperCase() + r.slice(1)}
                <span className="ml-1 opacity-60">{counts[r] ?? 0}</span>
              </a>
            )
          })}
        </div>

        {/* Approval status */}
        <div className="flex gap-1.5">
          {[
            { v: 'all',      label: 'All',      cls: 'bg-[#0B1F4D] text-white border-[#0B1F4D]' },
            { v: 'pending',  label: 'Pending',  cls: 'bg-amber-500  text-white border-amber-500'  },
            { v: 'approved', label: 'Approved', cls: 'bg-green-600  text-white border-green-600'  },
            { v: 'rejected', label: 'Rejected', cls: 'bg-red-500    text-white border-red-500'    },
          ].map(({ v, label, cls }) => {
            const isActive = v === selectedStatus
            const p = new URLSearchParams()
            if (selectedRole !== 'all') p.set('role', selectedRole)
            if (v !== 'all') p.set('status', v)
            return (
              <a key={v} href={`/admin/users${p.toString() ? `?${p}` : ''}`}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold border transition-colors ${
                  isActive ? cls : 'hover:bg-gray-50 border-gray-200 text-gray-600'
                }`}>
                {label}
              </a>
            )
          })}
        </div>
      </div>

      {/* ── User cards ── */}
      <div className="space-y-4">
        {users?.map((u: any) => {
          const status    = (u.approval_status ?? 'pending') as 'pending' | 'approved' | 'rejected'
          const isPending = status === 'pending'
          const location  = [u.city, u.country_name, u.continent].filter(Boolean).join(', ')

          return (
            <div key={u.id}
              className={`rounded-2xl border overflow-hidden transition-all ${
                isPending ? 'border-amber-200 shadow-amber-50 shadow-md' : 'border-gray-100 bg-white'
              }`}
            >
              {/* ── Main row ── */}
              <div className="flex flex-wrap gap-4 px-5 py-5 bg-white">

                {/* Avatar */}
                {u.avatar_url ? (
                  <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 shadow-sm border border-gray-100">
                    <Image
                      src={u.avatar_url}
                      alt={u.full_name ?? 'User'}
                      width={48}
                      height={48}
                      className="object-cover w-full h-full"
                    />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0B1F4D] to-[#1a3580]
                    flex items-center justify-center flex-shrink-0 shadow-sm">
                    <span className="text-white font-extrabold text-lg">
                      {(u.full_name ?? '?')[0].toUpperCase()}
                    </span>
                  </div>
                )}

                {/* Info block */}
                <div className="flex-1 min-w-0 space-y-1">
                  {/* Name + username + company */}
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-extrabold text-gray-900">{u.full_name ?? '—'}</p>
                    {u.username && <span className="text-gray-400 text-xs font-mono">@{u.username}</span>}
                    {u.company_name && <span className="text-gray-400 text-sm">· {u.company_name}</span>}
                  </div>

                  {/* Tags row */}
                  <div className="flex flex-wrap gap-1.5">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${ROLE_COLORS[u.role] ?? 'bg-gray-100 text-gray-600'}`}>
                      {u.role}
                    </span>
                    {u.business_type && (
                      <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-500">
                        {u.business_type}
                      </span>
                    )}
                    {u.category && (
                      <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-600">
                        {u.category}
                      </span>
                    )}
                  </div>

                  {/* Location + phone + date */}
                  <div className="flex flex-wrap gap-3 text-xs text-gray-400">
                    {location && <span>📍 {location}</span>}
                    {u.phone && <span>📞 {u.phone}</span>}
                    {u.website_url && (
                      <a href={u.website_url} target="_blank" rel="noopener noreferrer"
                        className="text-[#0B1F4D] hover:underline">
                        🌐 {u.website_url.replace(/^https?:\/\//, '')}
                      </a>
                    )}
                    <span>Joined {new Date(u.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>

                  {/* Annual turnover (private) */}
                  {u.annual_turnover && (
                    <p className="text-xs text-gray-400 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                      Turnover: <strong className="text-gray-600">{u.annual_turnover}</strong>
                      <span className="text-gray-300">(private)</span>
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
                  {u.role !== 'admin' && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-gray-400">Plan:</span>
                      <TierChanger userId={u.id} currentTier={(u as any).tier ?? 'free'} />
                    </div>
                  )}
                  {status === 'approved' && (
                    <a
                      href={`/profile/${u.username ?? u.id}`}
                      target="_blank"
                      className="text-[11px] text-[#0B1F4D] font-semibold hover:underline flex items-center gap-1"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      View profile
                    </a>
                  )}
                </div>
              </div>

              {/* ── About + products expand ── */}
              {(u.bio || u.products_offered) && (
                <div className="bg-gray-50 border-t border-gray-100 px-5 py-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {u.bio && (
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">About</p>
                      <p className="text-xs text-gray-600 leading-relaxed line-clamp-3">{u.bio}</p>
                    </div>
                  )}
                  {u.products_offered && (
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Products / Services</p>
                      <p className="text-xs text-gray-600 leading-relaxed line-clamp-3">{u.products_offered}</p>
                    </div>
                  )}
                </div>
              )}

            </div>
          )
        })}

        {!users?.length && (
          <div className="rounded-2xl border border-dashed border-gray-200 py-14 text-center text-gray-400 text-sm">
            No users found
          </div>
        )}
      </div>
    </div>
  )
}
